package com.contextaware.app_bpm.data.network

import com.google.gson.annotations.SerializedName
import retrofit2.Response
import retrofit2.http.Header
import retrofit2.http.POST

interface AuthApiService {
    @POST("users/signin")
    suspend fun verifyUserToken(@Header("Authorization") authHeader: String): Response<UserResponse>

    @POST("users/signup")
    suspend fun signupUser(@Header("Authorization") authHeader: String): Response<UserResponse>
}

data class UserResponse(
    val id: Int,
    val username: String?,
    val email: String,
    @SerializedName("created_at")
    val createdAt: String?,
)