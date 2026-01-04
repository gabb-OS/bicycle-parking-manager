package com.contextaware.app_bpm.data.model

import com.google.gson.annotations.SerializedName

data class ParkingEvent(
    @SerializedName("user_id")
    val userId: Int,
    val type: ParkingEventType,
    val longitude: Double,
    val latitude: Double,
    val timestamp: String
)