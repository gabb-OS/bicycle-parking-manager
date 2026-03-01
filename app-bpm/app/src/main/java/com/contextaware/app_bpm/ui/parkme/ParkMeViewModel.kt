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
import com.contextaware.app_bpm.data.model.ParkResponse
import com.contextaware.app_bpm.data.model.ParkingEventLeave
import com.contextaware.app_bpm.data.model.ParkingEventPark
import com.contextaware.app_bpm.data.model.RandomizationLevel
import com.contextaware.app_bpm.data.network.RetrofitClient
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.launch
import org.json.JSONObject
import retrofit2.Response
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

class ParkMeViewModel(application: Application) : AndroidViewModel(application) {

    private val sharedPref = application.getSharedPreferences("parking_state_prefs", Context.MODE_PRIVATE)
    private val _currentParkingEventId = MutableLiveData<Int?>(null)

    private val _text = MutableLiveData<String>().apply {
        value = "Press the button to park"
    }
    val text: LiveData<String> = _text

    // true = ready to PARK, false = ready to LEAVE
    private val _isParking = MutableLiveData<Boolean>()
    val isParking: LiveData<Boolean> = _isParking

    private val _statusMessage = MutableLiveData<String>()
    val statusMessage: LiveData<String> = _statusMessage

    init {
        // Load initial state from SharedPreferences
        _currentParkingEventId.value = sharedPref.getInt("current_park_event_id", -1).takeIf { it != -1 }
        _isParking.value = (_currentParkingEventId.value == null) // If no ID, then ready to PARK
    }

    fun toggleParkingStatus() {
        // This method is primarily for manual button press, but state is driven by _currentParkingEventId
        // The button text will update via `isParking` LiveData
    }

    fun handleAutoEvent(isParkAction: Boolean, location: Location) {
        val currentlyParked = (_currentParkingEventId.value != null)
        
        // If auto-event is PARK and we are NOT currently parked -> OK
        // If auto-event is LEAVE and we ARE currently parked -> OK
        if ((isParkAction && !currentlyParked) || (!isParkAction && currentlyParked)) {
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
                } else {
                    _statusMessage.value = "Failed to retrieve auth token"
                }
            } else {
                _statusMessage.value = "Failed to retrieve auth token"
            }
        }
    }

    private fun performParkingRequest(authHeader: String, location: Location) {
        val currentlyParked = (_currentParkingEventId.value != null)

        // Formatter: 2023-10-27T10:00:00
        val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")
        val timestamp = formatter.format(LocalDateTime.now())

        // Get privacy settings from SharedPreferences
        val privacySharedPref = getApplication<Application>().getSharedPreferences("privacy_prefs", Context.MODE_PRIVATE)
        val isPrivacyEnabled = privacySharedPref.getBoolean("is_privacy_enabled", false)
        val savedPrivacyType = privacySharedPref.getString("geoprivacy_type", GeoprivacyType.RANDOM.name)
        val savedRandomizationLevel = privacySharedPref.getString("randomization_level", RandomizationLevel.HIGH.name)

        val geoprivacyType = if (isPrivacyEnabled) {
            GeoprivacyType.valueOf(savedPrivacyType ?: GeoprivacyType.RANDOM.name)
        } else {
            GeoprivacyType.NONE
        }

        val randomizationLevel = if (geoprivacyType == GeoprivacyType.RANDOM) {
            RandomizationLevel.valueOf(savedRandomizationLevel ?: RandomizationLevel.HIGH.name)
        } else {
            RandomizationLevel.NONE
        }

        viewModelScope.launch {
            try {
                val response: Response<*> = if (!currentlyParked) { // Ready to PARK
                    val parkEvent = ParkingEventPark(
                        longitude = location.longitude,
                        latitude = location.latitude,
                        timestamp = timestamp,
                        privacyMode = geoprivacyType,
                        randomizationLevel = randomizationLevel
                    )
                    RetrofitClient.parkingApi.parkBicycle(authHeader, parkEvent)
                } else { // Ready to LEAVE
                    val eventId = _currentParkingEventId.value
                    if (eventId == null) {
                        _statusMessage.value = "Errore logico: ID evento di parcheggio non trovato per l'uscita."
                        return@launch
                    }
                    val leaveEvent = ParkingEventLeave(
                        longitude = location.longitude,
                        latitude = location.latitude,
                        timestamp = timestamp,
                        eventId = eventId
                    )
                    RetrofitClient.parkingApi.leaveBicycle(authHeader, leaveEvent)
                }

                if (response.isSuccessful) {
                    val msg: String
                    val area: String

                    if (!currentlyParked) { // Was trying to PARK, got ParkResponse
                        val parkResponse = response.body() as? ParkResponse
                        val newEventId = parkResponse?.eventId
                        if (newEventId != null) {
                            with(sharedPref.edit()) {
                                putInt("current_park_event_id", newEventId)
                                apply()
                            }
                            _currentParkingEventId.value = newEventId
                            _isParking.value = false // Now we are parked
                        }
                        msg = parkResponse?.message ?: "Parcheggio avviato"
                        area = parkResponse?.parkingArea ?: "Free Parking"
                        _statusMessage.value = "$msg in $area (ID Evento: ${parkResponse?.eventId})"
                    } else { // Was trying to LEAVE, got LeaveResponse
                        val leaveResponse = response.body() as? LeaveResponse
                        with(sharedPref.edit()) {
                            remove("current_park_event_id")
                            apply()
                        }
                        _currentParkingEventId.value = null
                        _isParking.value = true // Now we are ready to PARK again

                        msg = leaveResponse?.message ?: "Parcheggio terminato"
                        area = leaveResponse?.parkingArea ?: "Free Parking"
                        val duration = leaveResponse?.durationSeconds?.let { totalSeconds ->
                            val minutes = totalSeconds / 60
                            val seconds = totalSeconds % 60
                            " (Durata: %d min %d sec)".format(minutes.toInt(), seconds.toInt())
                        } ?: ""
                        _statusMessage.value = "$msg in $area$duration"
                    }
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