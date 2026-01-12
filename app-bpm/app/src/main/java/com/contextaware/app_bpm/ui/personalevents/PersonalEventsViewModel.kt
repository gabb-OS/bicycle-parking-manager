package com.contextaware.app_bpm.ui.personalevents

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.contextaware.app_bpm.data.model.PersonalEvent
import com.contextaware.app_bpm.data.network.RetrofitClient
import kotlinx.coroutines.launch
import org.json.JSONObject

class PersonalEventsViewModel : ViewModel() {

    private val _events = MutableLiveData<List<PersonalEvent>>()
    val events: LiveData<List<PersonalEvent>> = _events

    private val _statusMessage = MutableLiveData<String>()
    val statusMessage: LiveData<String> = _statusMessage

    fun fetchUserEvents() {
        //TODO: change Hardcoded user_id = 0
        val userId = 1
        viewModelScope.launch {
            try {
                val response = RetrofitClient.parkingApi.getUserEvents(userId)
                if (response.isSuccessful) {
                    val eventsList = response.body() ?: emptyList()
                    // Sort events by start time descending (newest first)
                    _events.value = eventsList.sortedByDescending { it.startTime }
                    _statusMessage.value = "Success"
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