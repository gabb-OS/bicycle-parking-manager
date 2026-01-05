package com.contextaware.app_bpm.ui.parkme

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.location.Location
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import com.contextaware.app_bpm.R
import com.contextaware.app_bpm.databinding.FragmentHomeBinding
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource

class ParkMeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    private lateinit var parkMeViewModel: ParkMeViewModel
    private lateinit var fusedLocationClient: FusedLocationProviderClient

    // Permission launcher
    private val requestPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
            if (permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
            ) {
                getCurrentLocationAndSendEvent()
            } else {
                Toast.makeText(context, "Location permission denied", Toast.LENGTH_SHORT).show()
            }
        }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        parkMeViewModel =
            ViewModelProvider(this).get(ParkMeViewModel::class.java)

        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        val root: View = binding.root

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(requireActivity())

        val buttonPark: Button = binding.buttonParkAction
        val textStatus: TextView = binding.textStatusMessage

        // Observe Button State (Park vs Leave)
        parkMeViewModel.isParking.observe(viewLifecycleOwner) { isParking ->
            buttonPark.text = if (isParking) getString(R.string.parcheggia) else getString(R.string.lasciaparcheggio)
        }

        // Observe Status Messages
        parkMeViewModel.statusMessage.observe(viewLifecycleOwner) { message ->
            textStatus.text = message
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }

        buttonPark.setOnClickListener {
            checkPermissionsAndAct()
        }

        return root
    }

    private fun checkPermissionsAndAct() {
        if (ContextCompat.checkSelfPermission(
                requireContext(),
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(
                requireContext(),
                Manifest.permission.ACCESS_COARSE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            getCurrentLocationAndSendEvent()
        } else {
            requestPermissionLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        }
    }

    @SuppressLint("MissingPermission")
    private fun getCurrentLocationAndSendEvent() {
        val cancellationTokenSource = CancellationTokenSource()
        
        // Try to get high accuracy current location
        fusedLocationClient.getCurrentLocation(
            Priority.PRIORITY_HIGH_ACCURACY,
            cancellationTokenSource.token
        ).addOnSuccessListener { location: Location? ->
            if (location != null) {
                parkMeViewModel.sendParkingEvent(location)
            }
        }.addOnFailureListener {
            Toast.makeText(context, "Failed to get location: ${it.message}", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}