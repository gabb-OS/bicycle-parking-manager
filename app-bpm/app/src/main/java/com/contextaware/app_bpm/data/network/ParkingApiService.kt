package com.contextaware.app_bpm.data.network

import com.contextaware.app_bpm.data.model.ParkingArea
import com.contextaware.app_bpm.data.model.ParkingEvent
import com.contextaware.app_bpm.data.model.PersonalEvent
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface ParkingApiService {
    @GET("areas/")
    suspend fun getParkingAreas(): Response<List<ParkingArea>>

    @GET("events/user/{user_id}")
    suspend fun getUserEvents(@Path("user_id") userId: Int): Response<List<PersonalEvent>>

    @POST("events/parking")
    suspend fun sendParkingEvent(@Body event: ParkingEvent): Response<Void>
}