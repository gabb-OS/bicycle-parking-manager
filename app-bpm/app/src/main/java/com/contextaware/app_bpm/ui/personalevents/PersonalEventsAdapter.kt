package com.contextaware.app_bpm.ui.personalevents

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.contextaware.app_bpm.R
import com.contextaware.app_bpm.data.model.PersonalEvent
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

class PersonalEventsAdapter(private var events: List<PersonalEvent>) :
    RecyclerView.Adapter<PersonalEventsAdapter.ViewHolder>() {

    // Input format from backend (ISO 8601)
    private val inputFormatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME
    // Output format for the user
    private val outputFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val typeTextView: TextView = view.findViewById(R.id.text_event_type)
        val parkingNameTextView: TextView = view.findViewById(R.id.text_parking_id)
        val startTimeTextView: TextView = view.findViewById(R.id.text_start_time)
        val endTimeTextView: TextView = view.findViewById(R.id.text_end_time)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_personal_event, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val event = events[position]
        holder.typeTextView.text = event.type.name
        holder.parkingNameTextView.text = event.parkingAreaName ?: "Area ID: ${event.parkingAreaId}"
        
        holder.startTimeTextView.text = "Inizio: ${formatDate(event.startTime)}"
        holder.endTimeTextView.text = "Fine: ${formatDate(event.endTime)}"
    }

    private fun formatDate(dateStr: String?): String {
        if (dateStr == null) return "-"
        return try {
            val dateTime = LocalDateTime.parse(dateStr, inputFormatter)
            dateTime.format(outputFormatter)
        } catch (e: Exception) {
            dateStr // Fallback to raw string if parsing fails
        }
    }

    override fun getItemCount() = events.size

    fun updateData(newEvents: List<PersonalEvent>) {
        events = newEvents
        notifyDataSetChanged()
    }
}