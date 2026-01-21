package com.contextaware.app_bpm.data.model

import com.google.gson.annotations.SerializedName

data class ParkingEvent(
    val type: ParkingEventType,
    val longitude: Double,
    val latitude: Double,
    val timestamp: String,
    @SerializedName("is_privacy_enabled")
    val isPrivacyEnabled: Boolean
)