package com.contextaware.app_bpm.ui.parkingareas

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.contextaware.app_bpm.R
import com.contextaware.app_bpm.data.model.ParkingArea

class ParkingAreasAdapter(private var parkingAreas: List<ParkingArea>) :
    RecyclerView.Adapter<ParkingAreasAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val nameTextView: TextView = view.findViewById(R.id.text_parking_name)
        val remainingCapacityTextView: TextView = view.findViewById(R.id.text_remaining_capacity)
        val totalCapacityTextView: TextView = view.findViewById(R.id.text_total_capacity)
        val occupancyTextView: TextView = view.findViewById(R.id.text_occupancy_percentage)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_parking_area, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val area = parkingAreas[position]
        holder.nameTextView.text = area.name
        holder.remainingCapacityTextView.text = area.residualCapacity.toString()
        holder.totalCapacityTextView.text = "Total: ${area.maxCapacity}"
        holder.occupancyTextView.text = String.format("Occupancy: %.1f%%", area.occupancyPercentage)
    }

    override fun getItemCount() = parkingAreas.size

    fun updateData(newParkingAreas: List<ParkingArea>) {
        parkingAreas = newParkingAreas
        notifyDataSetChanged()
    }
}