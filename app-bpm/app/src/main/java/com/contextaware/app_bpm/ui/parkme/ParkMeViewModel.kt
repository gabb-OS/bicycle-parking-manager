package com.contextaware.app_bpm.ui.parkme

import android.app.Application
import android.content.Context
import android.location.Location
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.contextaware.app_bpm.data.model.GeoprivacyType
import com.contextaware.app_bpm.data.model.LeaveResponse
import com.contextaware.app_bpm.data.model.ParkingEvent
import com.contextaware.app_bpm.data.model.ParkResponse
import com.contextaware.app_bpm.data.network.RetrofitClient
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.launch
import org.json.JSONObject
import retrofit2.Response
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import kotlin.math.ceil

class ParkMeViewModel(application: Application) : AndroidViewModel(application) {

    private val _text = MutableLiveData<String>().apply {
        value = "Press the button to park"
    }
    val text: LiveData<String> = _text

    // true = ready to PARK, false = ready to LEAVE
    private val _isParking = MutableLiveData<Boolean>(true)
    val isParking: LiveData<Boolean> = _isParking

    private val _statusMessage = MutableLiveData<String>()
    val statusMessage: LiveData<String> = _statusMessage

    fun toggleParkingStatus() {
        _isParking.value = !(_isParking.value ?: true)
    }

    fun handleAutoEvent(isParkAction: Boolean, location: Location) {
        val currentIsParking = _isParking.value ?: true
        if (currentIsParking == isParkAction) {
             sendParkingEvent(location)
        }
    }

    fun sendParkingEvent(location: Location) {
        val user = FirebaseAuth.getInstance().currentUser
        if (user == null) {
            _statusMessage.value = "User not logged in"
            return
        }

        user.getIdToken(false).addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val token = task.result.token
                if (token != null) {
                    performParkingRequest("Bearer $token", location)
                }
            } else {
                _statusMessage.value = "Failed to retrieve auth token"
            }
        }
    }

    private fun performParkingRequest(authHeader: String, location: Location) {
        val currentIsParking = _isParking.value ?: true

        // Formatter: 2023-10-27T10:00:00
        val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")
        val timestamp = formatter.format(LocalDateTime.now())

        // Get privacy settings from SharedPreferences
        val sharedPref = getApplication<Application>().getSharedPreferences("privacy_prefs", Context.MODE_PRIVATE)
        val isPrivacyEnabled = sharedPref.getBoolean("is_privacy_enabled", false)
        val savedPrivacyType = sharedPref.getString("geoprivacy_type", GeoprivacyType.RANDOM.name)

        val privacyMode = if (isPrivacyEnabled) {
            GeoprivacyType.valueOf(savedPrivacyType ?: GeoprivacyType.RANDOM.name)
        } else {
            GeoprivacyType.NONE
        }

        // Create Request Body
        val requestBody = ParkingEvent(
            longitude = location.longitude,
            latitude = location.latitude,
            timestamp = timestamp,
            privacyMode = privacyMode
        )

        viewModelScope.launch {
            try {
                val response: Response<*> = if (currentIsParking) {
                    RetrofitClient.parkingApi.parkBicycle(authHeader, requestBody)
                } else {
                    RetrofitClient.parkingApi.leaveBicycle(authHeader, requestBody)
                }

                if (response.isSuccessful) {
                    val msg: String
                    val area: String

                    if (currentIsParking) { // Was trying to PARK, got ParkResponse
                        val parkResponse = response.body() as? ParkResponse
                        msg = parkResponse?.message ?: "Parcheggio avviato"
                        area = parkResponse?.parkingArea ?: "Free Parking"
                        _statusMessage.value = "$msg in $area (ID Evento: ${parkResponse?.eventId})"
                    } else { // Was trying to LEAVE, got LeaveResponse
                        val leaveResponse = response.body() as? LeaveResponse
                        msg = leaveResponse?.message ?: "Parcheggio terminato"
                        area = leaveResponse?.parkingArea ?: "Free Parking"
                        val duration = leaveResponse?.durationMinutes?.let {
                            " (Duration: ${ceil(it).toInt()} min)"
                        } ?: ""
                        _statusMessage.value = "$msg in $area$duration"
                    }
                    toggleParkingStatus()
                } else {
                    val errorBody = response.errorBody()?.string()
                    val errorMsg = if (errorBody != null) {
                        try {
                            val jsonObject = JSONObject(errorBody)
                            jsonObject.optString("error", "Errore durante l'operazione")
                        } catch (e: Exception) {
                            "Errore nel parsing della risposta di errore"
                        }
                    } else {
                        "Errore: ${response.code()}"
                    }
                    _statusMessage.value = errorMsg
                }
            } catch (e: Exception) {
                _statusMessage.value = "Errore di Connessione: ${e.message}"
            }
        }
    }
}