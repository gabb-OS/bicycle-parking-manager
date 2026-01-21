package com.contextaware.app_bpm.ui.privacy

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.contextaware.app_bpm.databinding.FragmentPrivacySettingsBinding

class PrivacySettingsFragment : Fragment() {

    private var _binding: FragmentPrivacySettingsBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentPrivacySettingsBinding.inflate(inflater, container, false)
        val sharedPref = requireActivity().getSharedPreferences("privacy_prefs", Context.MODE_PRIVATE)

        // Load current state
        val isPrivacyEnabled = sharedPref.getBoolean("is_privacy_enabled", false)
        binding.switchPrivacy.isChecked = isPrivacyEnabled

        // Handle change
        binding.switchPrivacy.setOnCheckedChangeListener { _, isChecked ->
            with(sharedPref.edit()) {
                putBoolean("is_privacy_enabled", isChecked)
                apply()
            }
            val msg = if (isChecked) "Spatial Cloaking attivato" else "Spatial Cloaking disattivato"
            Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
        }

        return binding.root
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}