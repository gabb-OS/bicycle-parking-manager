package com.contextaware.app_bpm.ui.parkme

import android.location.Location
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.contextaware.app_bpm.data.model.ParkingEvent
import com.contextaware.app_bpm.data.model.ParkingEventType
import com.contextaware.app_bpm.data.network.RetrofitClient
import kotlinx.coroutines.launch
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
                    _statusMessage.value = "Event sent successfully: ${eventType.name}"
                    toggleParkingStatus()
                } else {
                    _statusMessage.value = "Error sending event: ${response.code()}"
                }
            } catch (e: Exception) {
                _statusMessage.value = "Connection Error: ${e.message}"
            }
        }
    }
}