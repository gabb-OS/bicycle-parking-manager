import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ParkingAreasGeoJSON } from '@core/types/parking-area';

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
  private parkingAreasSource = new BehaviorSubject<ParkingAreasGeoJSON | null>(null);
  
  /**
   * Public Observable that components can subscribe to for parking areas updates.
   * Emits the latest parking areas data whenever it changes.
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
    return this.http.get<ParkingAreasGeoJSON>(`${this.baseUrl}/geojson`).pipe(
      tap((parkingAreas) => this.setParkingAreasSource(parkingAreas))
    );
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
  private setParkingAreasSource(parkingAreas: ParkingAreasGeoJSON): void {
    this.parkingAreasSource.next(parkingAreas);
  }
}
