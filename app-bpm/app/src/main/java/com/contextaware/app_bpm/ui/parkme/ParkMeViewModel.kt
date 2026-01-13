package com.contextaware.app_bpm.ui.parkme

import android.location.Location
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.contextaware.app_bpm.data.model.ParkingEvent
import com.contextaware.app_bpm.data.model.ParkingEventType
import com.contextaware.app_bpm.data.network.RetrofitClient
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

class ParkMeViewModel : ViewModel() {

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
        // If current state is ready to PARK (true) and auto-event is Park (true) -> OK
        // If current state is ready to LEAVE (false) and auto-event is Leave (false) -> OK
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
        val eventType = if (currentIsParking) ParkingEventType.PARK else ParkingEventType.LEAVE

        // Formatter: 2023-10-27T10:00:00.12
        val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")
        val timestamp = formatter.format(LocalDateTime.now())

        // Create Event
        val event = ParkingEvent(
            type = eventType,
            longitude = location.longitude,
            latitude = location.latitude,
            timestamp = timestamp
        )

        viewModelScope.launch {
            try {
                val response = RetrofitClient.parkingApi.sendParkingEvent(authHeader, event)
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null) {
                        _statusMessage.value = "${body.message} in ${body.parkingArea}"
                    } else {
                        _statusMessage.value = "Event recorded successfully"
                    }
                    toggleParkingStatus()
                } else {
                    val errorBody = response.errorBody()?.string()
                    val errorMsg = if (errorBody != null) {
                        try {
                            val jsonObject = JSONObject(errorBody)
                            jsonObject.optString("error", "Error sending event")
                        } catch (e: Exception) {
                            "Error parsing response"
                        }
                    } else {
                        "Error: ${response.code()}"
                    }
                    _statusMessage.value = errorMsg
                }
            } catch (e: Exception) {
                _statusMessage.value = "Connection Error: ${e.message}"
            }
        }
    }
}