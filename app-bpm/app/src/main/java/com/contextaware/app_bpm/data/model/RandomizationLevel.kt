package com.contextaware.app_bpm.data.model

import com.google.gson.annotations.SerializedName

enum class RandomizationLevel {
    @SerializedName("high")
    HIGH,
    @SerializedName("low")
    LOW,
    @SerializedName("none") // Used if randomization is not active
    NONE
}