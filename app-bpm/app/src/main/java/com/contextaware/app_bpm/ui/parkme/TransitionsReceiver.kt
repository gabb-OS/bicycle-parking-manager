package com.contextaware.app_bpm.ui.parkme

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.google.android.gms.location.ActivityTransitionResult

/**
 * A [BroadcastReceiver] responsible for listening to activity transition updates broadcast by the
 * Activity Recognition API.
 *
 * This receiver processes intents containing [ActivityTransitionResult] data. When an activity
 * transition event occurs (e.g., user starts walking or stops driving), this receiver extracts
 * the event details and forwards the detected activity type to the [transitionListener].
 *
 * Usage:
 * 1. Define a [transitionListener] in the companion object to handle the received activity type `Int`.
 * 2. Register this receiver in the AndroidManifest or dynamically in code to receive activity transition intents.
 *
 * @see com.google.android.gms.location.ActivityTransitionResult
 * @see com.google.android.gms.location.ActivityTransitionEvent
 */
class TransitionsReceiver : BroadcastReceiver() {

    companion object {
        var transitionListener: ((Int) -> Unit)? = null
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (ActivityTransitionResult.hasResult(intent)) {
            val result = ActivityTransitionResult.extractResult(intent)
            result?.transitionEvents?.forEach { event ->
                // Pass the activity type to the listener
                transitionListener?.invoke(event.activityType)
            }
        }
    }
}