package com.contextaware.app_bpm.ui.personalevents

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.contextaware.app_bpm.data.model.PersonalEvent
import com.contextaware.app_bpm.data.network.RetrofitClient
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.launch
import org.json.JSONObject

class PersonalEventsViewModel : ViewModel() {

    private val _events = MutableLiveData<List<PersonalEvent>>()
    val events: LiveData<List<PersonalEvent>> = _events

    private val _statusMessage = MutableLiveData<String>()
    val statusMessage: LiveData<String> = _statusMessage

    fun fetchUserEvents() {
        val user = FirebaseAuth.getInstance().currentUser
        if (user == null) {
            _statusMessage.value = "User not logged in"
            return
        }

        user.getIdToken(false).addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val token = task.result.token
                if (token != null) {
                    loadEventsFromBackend("Bearer $token")
                }
            } else {
                _statusMessage.value = "Failed to retrieve auth token"
            }
        }
    }

    private fun loadEventsFromBackend(authHeader: String) {
        viewModelScope.launch {
            try {
                val response = RetrofitClient.parkingApi.getUserEvents(authHeader)
                if (response.isSuccessful) {
                    val eventsList = response.body() ?: emptyList()
                    _events.value = eventsList.sortedByDescending { it.startTime }
                    _statusMessage.value = "Success"
                } else {
                    val errorBody = response.errorBody()?.string()
                    val errorMsg = if (errorBody != null) {
                        try {
                            val jsonObject = JSONObject(errorBody)
                            jsonObject.optString("error", "Error loading events")
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