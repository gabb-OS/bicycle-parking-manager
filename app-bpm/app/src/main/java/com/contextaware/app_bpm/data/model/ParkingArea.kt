package com.contextaware.app_bpm.data.model

import com.google.gson.annotations.SerializedName

data class ParkingArea(
    val id: Int,
    val name: String,
    @SerializedName("location_area")        // Mapping the JSON key to 'camelCase' style name
    val locationArea: GeoJsonPolygon,
    @SerializedName("max_capacity")
    val maxCapacity: Int,
    @SerializedName("residual_capacity")
    val residualCapacity: Int,
    @SerializedName("occupancy_percentage")
    val occupancyPercentage: Double
)