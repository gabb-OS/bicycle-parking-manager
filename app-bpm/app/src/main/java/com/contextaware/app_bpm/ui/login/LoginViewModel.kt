package com.contextaware.app_bpm.ui.login

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.contextaware.app_bpm.data.network.RetrofitClient
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import kotlinx.coroutines.launch
import org.json.JSONObject

class LoginViewModel : ViewModel() {

    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
    private val _user = MutableLiveData<FirebaseUser?>()
    val user: LiveData<FirebaseUser?> = _user

    private val _statusMessage = MutableLiveData<String>()
    val statusMessage: LiveData<String> = _statusMessage

    init {
        _user.value = auth.currentUser
    }

    fun login(email: String, pass: String) {
        if (email.isBlank() || pass.isBlank()) {
            _statusMessage.value = "Email and Password cannot be empty"
            return
        }

        auth.signInWithEmailAndPassword(email, pass)
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    val firebaseUser = auth.currentUser
                    firebaseUser?.getIdToken(true)?.addOnCompleteListener { tokenTask ->
                        if (tokenTask.isSuccessful) {
                            val idToken = tokenTask.result.token
                            if (idToken != null) {
                                verifyTokenWithBackend(idToken)
                            }
                        } else {
                            _statusMessage.value = "Failed to get auth token"
                        }
                    }
                } else {
                    _statusMessage.value = "Login Failed: wrong password"
                }
            }
    }

    private fun verifyTokenWithBackend(idToken: String) {
        viewModelScope.launch {
            try {
                val headerValue = "Bearer $idToken"
                val response = RetrofitClient.authApi.verifyUserToken(headerValue)
                if (response.isSuccessful) {
                    _user.value = auth.currentUser
                    _statusMessage.value = "Login Successful"
                } else {
                    val errorBody = response.errorBody()?.string()
                    val errorMsg = if (errorBody != null) {
                        try {
                            val jsonObject = JSONObject(errorBody)
                            jsonObject.optString("error", "User not found in Database")
                        } catch (e: Exception) {
                            "Error parsing response"
                        }
                    } else {
                        "Error: ${response.code()}"
                    }
                    
                    auth.signOut()
                    _user.value = null
                    _statusMessage.value = errorMsg
                }
            } catch (e: Exception) {
                auth.signOut()
                _user.value = null
                _statusMessage.value = "Network Error: ${e.message}"
            }
        }
    }

    fun register(email: String, pass: String) {
        if (email.isBlank() || pass.isBlank()) {
            _statusMessage.value = "Email and Password cannot be empty"
            return
        }

        auth.createUserWithEmailAndPassword(email, pass)
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    val firebaseUser = auth.currentUser
                    firebaseUser?.getIdToken(true)?.addOnCompleteListener { tokenTask ->
                        if (tokenTask.isSuccessful) {
                            val idToken = tokenTask.result.token
                            if (idToken != null) {
                                sendRegistrationToBackend(idToken)
                            }
                        } else {
                            _statusMessage.value = "Failed to get auth token for registration"
                        }
                    }
                } else {
                    _statusMessage.value = "Registration Failed: ${task.exception?.message}"
                }
            }
    }

    private fun sendRegistrationToBackend(idToken: String) {
        viewModelScope.launch {
            try {
                val headerValue = "Bearer $idToken"
                val response = RetrofitClient.authApi.signupUser(headerValue)
                if (response.isSuccessful) {
                    _user.value = auth.currentUser
                    _statusMessage.value = "Registration Successful"
                } else {
                    val errorBody = response.errorBody()?.string()
                    val errorMsg = if (errorBody != null) {
                        try {
                            val jsonObject = JSONObject(errorBody)
                            jsonObject.optString("error", "Backend Registration Failed")
                        } catch (e: Exception) {
                            "Error parsing response"
                        }
                    } else {
                        "Error: ${response.code()}"
                    }

                    auth.currentUser?.delete()
                    auth.signOut()
                    _user.value = null
                    _statusMessage.value = errorMsg
                }
            } catch (e: Exception) {
                auth.currentUser?.delete()
                auth.signOut()
                _user.value = null
                _statusMessage.value = "Network Error: ${e.message}"
            }
        }
    }
    
    fun logout() {
        auth.signOut()
        _user.value = null
    }
}