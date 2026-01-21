package com.contextaware.app_bpm.data.model

import com.google.gson.annotations.SerializedName

/**
 * Represents the user data returned by the backend after authentication.
 */
data class UserResponse(
    val id: Int,
    val username: String?,
    val email: String,
    @SerializedName("created_at")
    val createdAt: String?
)