package com.contextaware.app_bpm.ui.parkme

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.location.Location
import android.os.Build
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import com.contextaware.app_bpm.R
import com.contextaware.app_bpm.databinding.FragmentParkmeBinding
import com.google.android.gms.location.DetectedActivity
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource

class ParkMeFragment : Fragment() {

    private var _binding: FragmentParkmeBinding? = null
    private val binding get() = _binding!!

    private lateinit var parkMeViewModel: ParkMeViewModel
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var transitionManager: UserActivityTransitionManager

    private val requestPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
            val fine = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
            val coarse = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] ?: false
            val activity = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                permissions[Manifest.permission.ACTIVITY_RECOGNITION] ?: false
            } else true

            if ((fine || coarse) && activity) {
                setupActivityTransitions()
            } else {
                binding.textStatusMessage.text = getString(R.string.location_permission_denied)
            }
        }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        parkMeViewModel = ViewModelProvider(this).get(ParkMeViewModel::class.java)

        _binding = FragmentParkmeBinding.inflate(inflater, container, false)
        val root: View = binding.root

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(requireActivity())
        transitionManager = UserActivityTransitionManager(requireContext())

        val buttonPark: Button = binding.buttonParkAction
        val textStatus: TextView = binding.textStatusMessage
        val activityStatus: TextView = binding.activityStatusMessage

        parkMeViewModel.isParking.observe(viewLifecycleOwner) { isParking ->
            buttonPark.text = if (isParking) getString(R.string.parcheggia) else getString(R.string.lasciaparcheggio)
        }

        parkMeViewModel.statusMessage.observe(viewLifecycleOwner) { message ->
            textStatus.text = message
        }

        buttonPark.setOnClickListener {
            if (hasPermissions()) {
                getCurrentLocationAndSendEvent()
            } else {
                requestPermissions()
            }
        }

        // Setup auto-detection listener
        TransitionsReceiver.transitionListener = { activityType ->
            // Display detected activity
            val activityName = getActivityString(activityType)
            activityStatus.text = "Detected activity: $activityName"

            when (activityType) {
                //For physical testing: STILL
                DetectedActivity.WALKING -> {
                    // Potential Parking Event (transitioned to WALKING)
                    performAutoAction(isParkAction = true)
                }
                //For physical testing: WALKING
                DetectedActivity.ON_BICYCLE -> {
                    // Potential Leaving Event (transitioned to BICYCLE)
                    performAutoAction(isParkAction = false)
                }
            }
        }

        if (hasPermissions()) {
            setupActivityTransitions()
        } else {
            requestPermissions()
        }

        return root
    }

    private fun getActivityString(detectedActivityType: Int): String {
        return when (detectedActivityType) {
            DetectedActivity.IN_VEHICLE -> "In Vehicle"
            DetectedActivity.ON_BICYCLE -> "On Bicycle"
            DetectedActivity.ON_FOOT -> "On Foot"
            DetectedActivity.RUNNING -> "Running"
            DetectedActivity.STILL -> "Still"
            DetectedActivity.TILTING -> "Tilting"
            DetectedActivity.UNKNOWN -> "Unknown"
            DetectedActivity.WALKING -> "Walking"
            else -> "Unidentifiable"
        }
    }

    private fun hasPermissions(): Boolean {
        val location = ContextCompat.checkSelfPermission(
            requireContext(),
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED || ContextCompat.checkSelfPermission(
            requireContext(),
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        val recognition = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContextCompat.checkSelfPermission(
                requireContext(),
                Manifest.permission.ACTIVITY_RECOGNITION
            ) == PackageManager.PERMISSION_GRANTED
        } else true

        return location && recognition
    }

    private fun requestPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            permissions.add(Manifest.permission.ACTIVITY_RECOGNITION)
        }
        requestPermissionLauncher.launch(permissions.toTypedArray())
    }

    private fun setupActivityTransitions() {
        transitionManager.registerActivityTransitions(
            onSuccess = { /* Successfully registered */ },
            onFailure = { binding.activityStatusMessage.text = "Activity Recognition Setup Failed: ${it.message}" }
        )
    }

    private fun removeActivityTransitions() {
        if (hasPermissions()) {
            transitionManager.removeActivityTransitions()
        }
    }

    /* Warning: the emulator takes a little time to change the GPS position.
    * To test this case, wait a little bit for the Android system to update the position correctly*/
    @SuppressLint("MissingPermission")
    private fun performAutoAction(isParkAction: Boolean) {
         val cancellationTokenSource = CancellationTokenSource()
         fusedLocationClient.getCurrentLocation(
            Priority.PRIORITY_HIGH_ACCURACY,
            cancellationTokenSource.token
        ).addOnSuccessListener { location: Location? ->
            if (location != null) {
                parkMeViewModel.handleAutoEvent(isParkAction, location)
            }
        }
    }

    @SuppressLint("MissingPermission")
    private fun getCurrentLocationAndSendEvent() {
        val cancellationTokenSource = CancellationTokenSource()

        fusedLocationClient.getCurrentLocation(
            Priority.PRIORITY_HIGH_ACCURACY,
            cancellationTokenSource.token
        ).addOnSuccessListener { location: Location? ->
            if (location != null) {
                parkMeViewModel.sendParkingEvent(location)
            }
        }.addOnFailureListener {
            binding.textStatusMessage.text = "Unable to retrieve current location"
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        removeActivityTransitions()
        TransitionsReceiver.transitionListener = null
        _binding = null
    }
}