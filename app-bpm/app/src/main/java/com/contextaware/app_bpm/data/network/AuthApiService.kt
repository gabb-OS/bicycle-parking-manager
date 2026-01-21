package com.contextaware.app_bpm.data.network

import com.contextaware.app_bpm.data.model.UserResponse
import retrofit2.Response
import retrofit2.http.Header
import retrofit2.http.POST

interface AuthApiService {
    @POST("users/signin")
    suspend fun verifyUserToken(@Header("Authorization") authHeader: String): Response<UserResponse>

    @POST("users/signup")
    suspend fun signupUser(@Header("Authorization") authHeader: String): Response<UserResponse>
}