package com.contextaware.app_bpm.data.model

import com.google.gson.annotations.SerializedName

enum class GeoprivacyType {
    @SerializedName("none")
    NONE,
    @SerializedName("centroid")
    CENTROID,
    @SerializedName("random")
    RANDOM
}