import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ParkingEvent, ParkingEventsGeoJSON } from '@core/types/parking-event';

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
  private parkingEventsGeoJSONSource = new BehaviorSubject<ParkingEventsGeoJSON | null>(null);

  /**
   * Internal BehaviorSubject that holds the current parking events list.
   * Initialized with null until the first data is fetched.
   */
  private parkingEventsSource = new BehaviorSubject<ParkingEvent[] | null>(null);

  /**
   * Public Observable that components can subscribe to for parking events updates.
   * Emits the latest parking events data whenever it changes.
   */
  parkingEventsGeoJSON$ = this.parkingEventsGeoJSONSource.asObservable();

  /**
   * Public Observable that components can subscribe to for parking events list updates.
   * Emits the latest list of parking events whenever it changes.
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
   * Fetches all parking events from the backend API.
   *
   * @returns Observable<ParkingEvent[]> - An observable that emits an array of parking event objects
   *
   * @description
   * This method performs an HTTP GET request to retrieve all parking events with their
   * complete data including geometry, timestamps, and event type.
   *
   * The data includes:
   * - id: Unique identifier for the parking event
   * - user_id: ID of the user who created the event
   * - parking_area_id: ID of the parking area where the event occurred
   * - location_point: Point geometry representing the event location
   * - type: Type of event ('park' or 'leave')
   * - start_time: Start time of the parking event
   * - end_time: End time of the parking event
   */
  getParkingEvents(): Observable<ParkingEvent[]> {
    return this.http.get<ParkingEvent[]>(`${this.baseUrl}/`).pipe(
      tap((parkingEvents) => this.setParkingEventsListSource(parkingEvents))
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
    this.parkingEventsGeoJSONSource.next(parkingEvents);
  }

  /**
   * Updates the internal BehaviorSubject with new parking events list.
   *
   * @param parkingEvents - The list of parking events to broadcast to all subscribers
   *
   * @private
   * This method is called internally by getParkingEvents() and should not
   * be called directly from outside the service.
   */
  private setParkingEventsListSource(parkingEvents: ParkingEvent[]): void {
    this.parkingEventsSource.next(parkingEvents);
  }
}
