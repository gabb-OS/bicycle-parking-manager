package com.contextaware.app_bpm.ui.parkingareas

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import com.contextaware.app_bpm.databinding.FragmentGalleryBinding

class ParkingAreasFragment : Fragment() {

    private var _binding: FragmentGalleryBinding? = null
    private val binding get() = _binding!!
    private lateinit var adapter: ParkingAreasAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val parkingViewModel =
            ViewModelProvider(this).get(ParkingAreasViewModel::class.java)

        _binding = FragmentGalleryBinding.inflate(inflater, container, false)
        val root: View = binding.root

        // Setup RecyclerView
        adapter = ParkingAreasAdapter(emptyList())
        binding.recyclerViewParkingAreas.layoutManager = LinearLayoutManager(context)
        binding.recyclerViewParkingAreas.adapter = adapter

        // Observe Data
        parkingViewModel.parkingAreas.observe(viewLifecycleOwner) { areas ->
            adapter.updateData(areas)
        }

        parkingViewModel.statusMessage.observe(viewLifecycleOwner) { message ->
            if (message.isNotEmpty() && message != "Success") {
                Toast.makeText(context, message, Toast.LENGTH_LONG).show()
                binding.textStatus.text = message
            }
        }

        // Fetch Data
        parkingViewModel.fetchParkingAreas()

        return root
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}