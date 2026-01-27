package com.contextaware.app_bpm.data.model

import com.google.gson.annotations.SerializedName

data class ParkingEvent(
    val longitude: Double,
    val latitude: Double,
    val timestamp: String,
    @SerializedName("privacy_mode")
    val privacyMode: GeoprivacyType
)