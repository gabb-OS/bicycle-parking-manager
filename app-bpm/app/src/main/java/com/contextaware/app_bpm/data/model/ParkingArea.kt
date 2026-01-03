package com.contextaware.app_bpm.data.model

import com.google.gson.annotations.SerializedName

data class ParkingArea(
    val id: Int,
    val name: String,
    @SerializedName("location_area")        // Mapping the JSON key to 'camelCase' style name
    val locationArea: GeoJsonPolygon,
    @SerializedName("max_capacity")
    val maxCapacity: Int,
    @SerializedName("residual_capacity")
    val residualCapacity: Int,
    @SerializedName("occupancy_percentage")
    val occupancyPercentage: Double
)

/**
 * Represents a GeoJSON Polygon geometry object.
 *
 * This data class is used to define a closed shape on a map, typically representing the
 * boundaries of a specific area (e.g., a parking lot). It adheres to the GeoJSON format
 * specification for Polygons.
 *
 * @property type The type of the geometry, which should typically be "Polygon".
 * @property coordinates A list of lists of positions (coordinate pairs), where the first list
 *                       represents the exterior ring (boundary) and subsequent lists represent
 *                       interior rings (holes). Each position is defined as [longitude, latitude].
 */
data class GeoJsonPolygon(
    val type: String,
    val coordinates: List<List<List<Double>>>
)