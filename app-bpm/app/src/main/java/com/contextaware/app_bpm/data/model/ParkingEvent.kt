package com.contextaware.app_bpm.data.model

import com.google.gson.annotations.SerializedName
import com.contextaware.app_bpm.data.model.GeoprivacyType

open class ParkingEvent(
    @SerializedName("longitude")
    val longitude: Double,
    @SerializedName("latitude")
    val latitude: Double,
    @SerializedName("timestamp")
    val timestamp: String
)

class ParkingEventPark(
    longitude: Double,
    latitude: Double,
    timestamp: String,
    @SerializedName("privacy_mode")
    val privacyMode: GeoprivacyType,
    @SerializedName("randomization_level")
    val randomizationLevel: RandomizationLevel
) : ParkingEvent(longitude, latitude, timestamp)


class ParkingEventLeave(
    longitude: Double,
    latitude: Double,
    timestamp: String,
    @SerializedName("event_id")
    val eventId: Int
) : ParkingEvent(longitude, latitude, timestamp)