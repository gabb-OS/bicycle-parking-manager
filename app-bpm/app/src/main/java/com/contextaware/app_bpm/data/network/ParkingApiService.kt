package com.contextaware.app_bpm.data.network

import com.contextaware.app_bpm.data.model.LeaveResponse
import com.contextaware.app_bpm.data.model.ParkResponse
import com.contextaware.app_bpm.data.model.ParkingEvent
import com.contextaware.app_bpm.data.model.ParkingArea
import com.contextaware.app_bpm.data.model.PersonalEvent
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.POST

interface ParkingApiService {
    @GET("areas/")
    suspend fun getParkingAreas(): Response<List<ParkingArea>>

    @GET("events/user/personalevents")
    suspend fun getUserEvents(@Header("Authorization") authHeader: String): Response<List<PersonalEvent>>

    @POST("events/park")
    suspend fun parkBicycle(
        @Header("Authorization") authHeader: String,
        @Body requestBody: ParkingEvent
    ): Response<ParkResponse>

    @PATCH("events/leave") // Using PATCH as per backend definition
    suspend fun leaveBicycle(
        @Header("Authorization") authHeader: String,
        @Body requestBody: ParkingEvent
    ): Response<LeaveResponse>
}