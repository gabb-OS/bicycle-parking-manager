package com.contextaware.app_bpm.ui.privacy

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.RadioGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.contextaware.app_bpm.R
import com.contextaware.app_bpm.data.model.GeoprivacyType
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

        try {
            // Load main privacy switch state
            val isPrivacyEnabled = sharedPref.getBoolean("is_privacy_enabled", false)
            binding.switchPrivacy.isChecked = isPrivacyEnabled

            // Load selected privacy type (default to Random if not found)
            val savedPrivacyType = sharedPref.getString("geoprivacy_type", GeoprivacyType.RANDOM.name)
            when (GeoprivacyType.valueOf(savedPrivacyType ?: GeoprivacyType.RANDOM.name)) {
                GeoprivacyType.RANDOM -> binding.radioRandom.isChecked = true
                GeoprivacyType.CENTROID -> binding.radioFixedPoint.isChecked = true
                else -> { /* NONE is handled by main switch being off */ }
            }

            // Enable/disable RadioGroup based on main switch
            binding.radioGroupPrivacyType.isEnabled = isPrivacyEnabled
            binding.radioRandom.isEnabled = isPrivacyEnabled
            binding.radioFixedPoint.isEnabled = isPrivacyEnabled

            // Handle main privacy switch change
            binding.switchPrivacy.setOnCheckedChangeListener { _, isChecked ->
                with(sharedPref.edit()) {
                    putBoolean("is_privacy_enabled", isChecked)
                    apply()
                }
                binding.radioGroupPrivacyType.isEnabled = isChecked
                binding.radioRandom.isEnabled = isChecked
                binding.radioFixedPoint.isEnabled = isChecked
                val msg = if (isChecked) "Offuscamento Geoprivacy Attivato" else "Offuscamento Geoprivacy Disattivato"
                Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
            }

            // Handle RadioGroup change
            binding.radioGroupPrivacyType.setOnCheckedChangeListener { group: RadioGroup, checkedId: Int ->
                val selectedType = when (checkedId) {
                    R.id.radio_random -> GeoprivacyType.RANDOM
                    R.id.radio_fixed_point -> GeoprivacyType.CENTROID
                    else -> GeoprivacyType.RANDOM // Default
                }
                with(sharedPref.edit()) {
                    putString("geoprivacy_type", selectedType.name)
                    apply()
                }
                Toast.makeText(context, "Metodo privacy: ${selectedType.name}", Toast.LENGTH_SHORT).show()
            }

        } catch (e: Exception) {
            Toast.makeText(context, "Errore nel caricamento impostazioni privacy", Toast.LENGTH_LONG).show()
        }

        return binding.root
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}