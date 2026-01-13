package com.contextaware.app_bpm.data.model

data class ParkingEvent(
    val type: ParkingEventType,
    val longitude: Double,
    val latitude: Double,
    val timestamp: String
)