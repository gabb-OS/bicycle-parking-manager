import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ParkingArea, ParkingAreasGeoJSON } from '@core/types/parking-area';

/**
 * Service for managing parking areas data.
 *
 * This service follows a reactive pattern using RxJS BehaviorSubject to manage
 * parking areas state. It provides a centralized data source that components
 * can subscribe to for real-time updates.
 *
 * @description
 * The service acts as a bridge between the backend API and the frontend components,
 * specifically designed to work with the map component for displaying parking areas
 * as GeoJSON features.
 *
 * Architecture:
 * - Uses BehaviorSubject to maintain current state and emit updates to subscribers
 * - Exposes an Observable (parkingAreas$) for components to subscribe to
 * - Automatically updates all subscribers when new data is fetched
 *
 * Usage Example:
 * ```typescript
 * // In a component:
 * this.parkingAreasService.parkingAreas$.subscribe(areas => {
 *   // React to parking areas updates
 * });
 *
 * // Fetch and broadcast new data:
 * this.parkingAreasService.getParkingAreasGEOJSON().subscribe();
 * ```
 *
 * Integration with Map Component:
 * The map component subscribes to parkingAreas$ and converts the GeoJSON data
 * into OpenLayers features. The parking areas are rendered as polygons with
 * color-coded styling based on their occupancy ratio (residual_capacity vs max_capacity).
 */
@Injectable({
  providedIn: 'root',
})
export class ParkinAreasService {
  private baseUrl = `${environment.apiUrl}/areas`;
  private http = inject(HttpClient);

  /**
   * Internal BehaviorSubject that holds the current parking areas state.
   * Initialized with null until the first data is fetched.
   */
  private parkingAreasGeoJSONSource = new BehaviorSubject<ParkingAreasGeoJSON | null>(null);

  /**
   * Internal BehaviorSubject that holds the current parking areas list.
   * Initialized with null until the first data is fetched.
   */
  private parkingAreasSource = new BehaviorSubject<ParkingArea[] | null>(null);

  /**
   * Public Observable that components can subscribe to for parking areas updates.
   * Emits the latest parking areas data whenever it changes.
   */
  parkingAreasGeoJSON$ = this.parkingAreasGeoJSONSource.asObservable();

  /**
   * Public Observable that components can subscribe to for parking areas list updates.
   * Emits the latest list of parking areas whenever it changes.
   */
  parkingAreas$ = this.parkingAreasSource.asObservable();

  /**
   * Fetches parking areas data from the backend API in GeoJSON format.
   *
   * @returns Observable<ParkingAreasGeoJSON> - An observable that emits the parking areas data
   *
   * @description
   * This method performs an HTTP GET request to retrieve parking areas and automatically
   * updates the internal BehaviorSubject using the tap operator. This ensures that all
   * subscribers to parkingAreas$ receive the updated data.
   *
   * The data includes:
   * - Polygon geometries representing parking area boundaries
   * - Properties including max_capacity and residual_capacity
   * - Additional metadata for each parking area
   */
  getParkingAreasGEOJSON(): Observable<ParkingAreasGeoJSON> {
    return this.http
      .get<ParkingAreasGeoJSON>(`${this.baseUrl}/geojson`)
      .pipe(tap((parkingAreas) => this.setParkingAreasGeoJSONSource(parkingAreas)));
  }

  /**
   * Fetches all parking areas from the backend API.
   *
   * @returns Observable<ParkingArea[]> - An observable that emits an array of parking area objects
   *
   * @description
   * This method performs an HTTP GET request to retrieve all parking areas with their
   * complete data including geometry, capacity information, and occupancy percentage.
   *
   * The data includes:
   * - id: Unique identifier for the parking area
   * - name: Name of the parking area
   * - location_area: Polygon geometry representing the parking area boundary
   * - max_capacity: Maximum number of bicycles that can be parked
   * - residual_capacity: Current number of available spots
   * - occupancy_percentage: Percentage of occupied spots
   */
  getParkingAreas(): Observable<ParkingArea[]> {
    return this.http
      .get<ParkingArea[]>(`${this.baseUrl}/`)
      .pipe(tap((parkingAreas) => this.setParkingAreasSource(parkingAreas)));
  }

  /**
   * Updates the internal BehaviorSubject with new parking areas data.
   *
   * @param parkingAreas - The parking areas data to broadcast to all subscribers
   *
   * @private
   * This method is called internally by getParkingAreasGEOJSON() and should not
   * be called directly from outside the service.
   */
  private setParkingAreasGeoJSONSource(parkingAreas: ParkingAreasGeoJSON): void {
    this.parkingAreasGeoJSONSource.next(parkingAreas);
  }

  /**
   * Updates the internal BehaviorSubject with new parking areas list.
   *
   * @param parkingAreas - The list of parking areas to broadcast to all subscribers
   *
   * @private
   * This method is called internally by getParkingAreas() and should not
   * be called directly from outside the service.
   */
  private setParkingAreasSource(parkingAreas: ParkingArea[]): void {
    this.parkingAreasSource.next(parkingAreas);
  }

  /**
   * Triggers the clustering algorithm on the backend.
   *
   * @returns Observable<any> - An observable that emits the clustering result
   *
   * @description
   * This method performs an HTTP POST request to manually trigger the parking
   * area clustering algorithm. The backend will run the clustering service
   * and return the result.
   */
  triggerClustering(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/cluster/run`, {});
  }
}
