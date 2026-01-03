package com.contextaware.app_bpm.data.network

import com.contextaware.app_bpm.data.model.ParkingArea
import retrofit2.Response
import retrofit2.http.GET

// Retrofit interface for API calls
interface ParkingApiService {
    @GET("areas/")
    suspend fun getParkingAreas(): Response<List<ParkingArea>>
}