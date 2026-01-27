package com.contextaware.app_bpm.data.model

import com.google.gson.annotations.SerializedName

data class ParkResponse(
    val message: String,
    @SerializedName("parking_area")
    val parkingArea: String,
    @SerializedName("event_id")
    val eventId: Int
)