package com.contextaware.app_bpm.data.model

import com.google.gson.annotations.SerializedName

data class PersonalEvent(
    val id: Int,
    @SerializedName("start_time")
    val startTime: String,
    @SerializedName("end_time")
    val endTime: String?,
    val type: String,
    @SerializedName("location_point")
    val locationPoint: GeoJsonPoint,
    @SerializedName("user_id")
    val userId: Int,
    @SerializedName("parking_area_id")
    val parkingAreaId: Int
)

data class GeoJsonPoint(
    val type: String,
    val coordinates: List<Double>
)