package com.contextaware.app_bpm.ui.personalevents

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.contextaware.app_bpm.R
import com.contextaware.app_bpm.data.model.PersonalEvent

class PersonalEventsAdapter(private var events: List<PersonalEvent>) :
    RecyclerView.Adapter<PersonalEventsAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val typeTextView: TextView = view.findViewById(R.id.text_event_type)
        val parkingIdTextView: TextView = view.findViewById(R.id.text_parking_id)
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
        holder.typeTextView.text = event.type
        holder.parkingIdTextView.text = "Area ID: ${event.parkingAreaId}"
        
        //TODO: Check date format
        holder.startTimeTextView.text = "Start: ${event.startTime}"
        holder.endTimeTextView.text = "End: ${event.endTime ?: "-"}"
    }

    override fun getItemCount() = events.size

    fun updateData(newEvents: List<PersonalEvent>) {
        events = newEvents
        notifyDataSetChanged()
    }
}