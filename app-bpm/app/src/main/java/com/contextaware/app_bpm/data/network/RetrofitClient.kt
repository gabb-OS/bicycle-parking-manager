package com.contextaware.app_bpm.data.network

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

// Singleton for Retrofit instance
object RetrofitClient {
    private const val BASE_URL = "http://10.0.2.2:80/api/"  //10.0.2.2 is the IP to use for the emulator

    val instance: ParkingApiService by lazy {
        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        retrofit.create(ParkingApiService::class.java)
    }
}