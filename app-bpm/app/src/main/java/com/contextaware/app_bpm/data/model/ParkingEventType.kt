package com.contextaware.app_bpm.data.model

import com.google.gson.annotations.SerializedName

enum class ParkingEventType {
    @SerializedName("park")
    PARK,
    @SerializedName("leave")
    LEAVE
}