import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ParkingEventsGeoJSON } from '@core/types/parking-event';

/**
 * Service for managing parking events data.
 *
 * This service follows a reactive pattern using RxJS BehaviorSubject to manage
 * parking events state. It provides a centralized data source that components
 * can subscribe to for real-time updates.
 *
 * @description
 * The service acts as a bridge between the backend API and the frontend components,
 * specifically designed to work with the map component for displaying individual
 * parking events as GeoJSON point features.
 *
 * Architecture:
 * - Uses BehaviorSubject to maintain current state and emit updates to subscribers
 * - Exposes an Observable (parkingEvents$) for components to subscribe to
 * - Automatically updates all subscribers when new data is fetched
 *
 * Usage Example:
 * ```typescript
 * // In a component:
 * this.parkingEventsService.parkingEvents$.subscribe(events => {
 *   // React to parking events updates
 * });
 *
 * // Fetch and broadcast new data:
 * this.parkingEventsService.getParkingEventsGEOJSON().subscribe();
 * ```
 *
 * Integration with Map Component:
 * The map component subscribes to parkingEvents$ and converts the GeoJSON data
 * into OpenLayers features. Each parking event is rendered as a point marker
 * with a bicycle icon, showing the location of individual parked bicycles.
 */
@Injectable({
  providedIn: 'root',
})
export class ParkingEventsService {
  private baseUrl = `${environment.apiUrl}/events`;
  private http = inject(HttpClient);

  /**
   * Internal BehaviorSubject that holds the current parking events state.
   * Initialized with null until the first data is fetched.
   */
  private parkingEventsSource = new BehaviorSubject<ParkingEventsGeoJSON | null>(null);

  /**
   * Public Observable that components can subscribe to for parking events updates.
   * Emits the latest parking events data whenever it changes.
   */
  parkingEvents$ = this.parkingEventsSource.asObservable();

  /**
   * Fetches parking events data from the backend API in GeoJSON format.
   *
   * @returns Observable<ParkingEventsGeoJSON> - An observable that emits the parking events data
   *
   * @description
   * This method performs an HTTP GET request to retrieve parking events and automatically
   * updates the internal BehaviorSubject using the tap operator. This ensures that all
   * subscribers to parkingEvents$ receive the updated data.
   *
   * The data includes:
   * - Point geometries representing individual bicycle parking locations
   * - Properties including event timestamps, user information, and status
   * - Additional metadata for each parking event
   */
  getParkingEventsGEOJSON(): Observable<ParkingEventsGeoJSON> {
    return this.http.get<ParkingEventsGeoJSON>(`${this.baseUrl}/geojson`).pipe(
      tap((parkingEvents) => this.setParkingEventsSource(parkingEvents))
    );
  }

  /**
   * Updates the internal BehaviorSubject with new parking events data.
   *
   * @param parkingEvents - The parking events data to broadcast to all subscribers
   *
   * @private
   * This method is called internally by getParkingEventsGEOJSON() and should not
   * be called directly from outside the service.
   */
  private setParkingEventsSource(parkingEvents: ParkingEventsGeoJSON): void {
    this.parkingEventsSource.next(parkingEvents);
  }
}
