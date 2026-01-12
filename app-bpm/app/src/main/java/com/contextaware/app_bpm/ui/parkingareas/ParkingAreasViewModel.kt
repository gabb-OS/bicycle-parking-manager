package com.contextaware.app_bpm.ui.parkingareas

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.contextaware.app_bpm.data.model.ParkingArea
import com.contextaware.app_bpm.data.network.RetrofitClient
import kotlinx.coroutines.launch
import org.json.JSONObject

class ParkingAreasViewModel : ViewModel() {

    private val _parkingAreas = MutableLiveData<List<ParkingArea>>()
    val parkingAreas: LiveData<List<ParkingArea>> = _parkingAreas

    private val _statusMessage = MutableLiveData<String>()
    val statusMessage: LiveData<String> = _statusMessage

    fun fetchParkingAreas() {
        viewModelScope.launch {
            try {
                val response = RetrofitClient.parkingApi.getParkingAreas()
                if (response.isSuccessful) {
                    _parkingAreas.value = response.body() ?: emptyList()
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