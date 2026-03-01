package com.contextaware.app_bpm.ui.parkme

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import com.google.android.gms.location.ActivityRecognition
import com.google.android.gms.location.ActivityTransition
import com.google.android.gms.location.ActivityTransitionRequest
import com.google.android.gms.location.DetectedActivity

/**
 * Manages the registration and handling of user activity transitions using the Google Activity Recognition API.
 *
 * This class allows the application to subscribe to specific changes in user activity, such as
 * transitioning from driving to walking (indicating a potential parking event) or vice versa.
 * It encapsulates the setup of the [ActivityRecognitionClient], the construction of transition
 * requests, and the lifecycle of registering/unregistering for updates.
 *
 * Usage:
 * 1. Instantiate this manager with a valid [Context].
 * 2. Call [registerActivityTransitions] to start listening for specific activity changes.
 * 3. Updates are delivered via a broadcast to [TransitionsReceiver].
 * 4. Call [removeActivityTransitions] when updates are no longer needed to conserve battery.
 *
 * @property context The application context used to initialize clients and intents.
 */
class UserActivityTransitionManager(private val context: Context) {

    private val activityRecognitionClient = ActivityRecognition.getClient(context)

    // A PendingIntent callback where app receives notifications
    private val transitionPendingIntent: PendingIntent by lazy {
        val intent = Intent(context, TransitionsReceiver::class.java)
        intent.action = "com.contextaware.app_bpm.ACTION_PROCESS_ACTIVITY_TRANSITIONS"
        PendingIntent.getBroadcast(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
        )
    }

    @SuppressLint("MissingPermission")
    fun registerActivityTransitions(onSuccess: () -> Unit, onFailure: (Exception) -> Unit) {
        val transitions = listOf(
            // Detect when user starts BICYCLING (potential Leave Parking)
            //For physical testing: STILL
            ActivityTransition.Builder()
                .setActivityType(DetectedActivity.ON_BICYCLE)
                .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_ENTER)
                .build(),
            // Detect when user starts WALKING (potential Park)
            ActivityTransition.Builder()
                .setActivityType(DetectedActivity.WALKING)
                .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_ENTER)
                .build()
        )

        //ActivityTransitionRequest object with the list of ActivityTransitions
        val request = ActivityTransitionRequest(transitions)

        activityRecognitionClient.requestActivityTransitionUpdates(request, transitionPendingIntent)
            .addOnSuccessListener { onSuccess() }
            .addOnFailureListener { onFailure(it) }
    }

    @SuppressLint("MissingPermission")
    fun removeActivityTransitions() {
        activityRecognitionClient.removeActivityTransitionUpdates(transitionPendingIntent)
    }
}