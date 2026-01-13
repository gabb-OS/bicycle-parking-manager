package com.contextaware.app_bpm.data.network

import com.contextaware.app_bpm.data.model.ParkingArea
import com.contextaware.app_bpm.data.model.ParkingEvent
import com.contextaware.app_bpm.data.model.ParkingResponse
import com.contextaware.app_bpm.data.model.PersonalEvent
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

interface ParkingApiService {
    @GET("areas/")
    suspend fun getParkingAreas(): Response<List<ParkingArea>>

    @GET("events/user/personalevents")
    suspend fun getUserEvents(@Header("Authorization") authHeader: String): Response<List<PersonalEvent>>

    @POST("events/parking")
    suspend fun sendParkingEvent(@Body event: ParkingEvent): Response<ParkingResponse>
}