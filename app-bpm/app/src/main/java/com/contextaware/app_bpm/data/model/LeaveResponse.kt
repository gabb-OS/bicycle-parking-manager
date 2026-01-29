package com.contextaware.app_bpm.data.model

import com.google.gson.annotations.SerializedName

data class LeaveResponse(
    val message: String,
    @SerializedName("parking_area")
    val parkingArea: String,
    @SerializedName("duration_minutes")
    val durationMinutes: Double
)