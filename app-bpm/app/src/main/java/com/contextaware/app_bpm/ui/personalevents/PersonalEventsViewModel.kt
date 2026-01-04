package com.contextaware.app_bpm.ui.personalevents

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.contextaware.app_bpm.data.model.PersonalEvent
import com.contextaware.app_bpm.data.network.RetrofitClient
import kotlinx.coroutines.launch

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
                val response = RetrofitClient.instance.getUserEvents(userId)
                if (response.isSuccessful) {
                    val eventsList = response.body() ?: emptyList()
                    // Newest events first
                    _events.value = eventsList.sortedByDescending { it.startTime }
                    _statusMessage.value = "Success"
                } else {
                    _statusMessage.value = "Error: ${response.code()}"
                }
            } catch (e: Exception) {
                _statusMessage.value = "Connection Error: ${e.message}"
            }
        }
    }
}