package com.contextaware.app_bpm.ui.personalevents

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import com.contextaware.app_bpm.databinding.FragmentPersonaleventsBinding

class PersonalEventsFragment : Fragment() {

    private var _binding: FragmentPersonaleventsBinding? = null
    private val binding get() = _binding!!
    private lateinit var adapter: PersonalEventsAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val viewModel =
            ViewModelProvider(this).get(PersonalEventsViewModel::class.java)

        _binding = FragmentPersonaleventsBinding.inflate(inflater, container, false)
        val root: View = binding.root

        // Setup RecyclerView
        adapter = PersonalEventsAdapter(emptyList())
        binding.recyclerViewPersonalEvents.layoutManager = LinearLayoutManager(context)
        binding.recyclerViewPersonalEvents.adapter = adapter

        // Observe Data
        viewModel.events.observe(viewLifecycleOwner) { events ->
            adapter.updateData(events)
        }

        viewModel.statusMessage.observe(viewLifecycleOwner) { message ->
            if (message.isNotEmpty() && message != "Success") {
                Toast.makeText(context, message, Toast.LENGTH_LONG).show()
                binding.textStatus.text = message
            }
        }

        // Fetch Data
        viewModel.fetchUserEvents()

        return root
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}