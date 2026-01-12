package com.contextaware.app_bpm.data.network

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {
    // 10.0.2.2 is the IP to use for the emulator
    // If using a physical device, use the device's IP address
    private const val BASE_URL = "http://10.0.2.2:80/api/"

    private val retrofit: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    val parkingApi: ParkingApiService by lazy {
        retrofit.create(ParkingApiService::class.java)
    }

    val authApi: AuthApiService by lazy {
        retrofit.create(AuthApiService::class.java)
    }
}