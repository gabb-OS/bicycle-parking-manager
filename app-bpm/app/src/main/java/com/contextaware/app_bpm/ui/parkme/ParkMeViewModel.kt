package com.contextaware.app_bpm.ui.parkme

import android.location.Location
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.contextaware.app_bpm.data.model.ParkingEvent
import com.contextaware.app_bpm.data.model.ParkingEventType
import com.contextaware.app_bpm.data.model.ParkingResponse
import com.contextaware.app_bpm.data.network.RetrofitClient
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

    // New method to handle auto-events
    fun handleAutoEvent(isParkAction: Boolean, location: Location) {
        val currentIsParking = _isParking.value ?: true
        
        // If current state is ready to PARK (true) and auto-event is Park (true) -> OK
        // If current state is ready to LEAVE (false) and auto-event is Leave (false) -> OK
        if (currentIsParking == isParkAction) {
             sendParkingEvent(location)
        }
    }

    fun sendParkingEvent(location: Location) {
        val currentIsParking = _isParking.value ?: true
        val eventType = if (currentIsParking) ParkingEventType.PARK else ParkingEventType.LEAVE

        // Use ISO_LOCAL_DATE_TIME formatter (e.g. 2023-10-27T10:00:00.123)
        val timestamp = DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(LocalDateTime.now())

        // Create Event
        val event = ParkingEvent(
            userId = 1,                     //TODO: Hardcoded user ID
            type = eventType,
            longitude = location.longitude,
            latitude = location.latitude,
            timestamp = timestamp
        )

        viewModelScope.launch {
            try {
                val response = RetrofitClient.instance.sendParkingEvent(event)
                if (response.isSuccessful) {
                    val body: ParkingResponse? = response.body()
                    if (body != null) {
                        _statusMessage.value = "${body.message} in ${body.parkingArea}"
                    } else {
                        _statusMessage.value = "Event recorded"     //Fallback
                    }
                    toggleParkingStatus()
                } else {
                    val errorBody = response.errorBody()?.string()
                    val errorMsg = if (errorBody != null) {
                        try {
                            val jsonObject = JSONObject(errorBody)
                            jsonObject.optString("error", "Unknown error")
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