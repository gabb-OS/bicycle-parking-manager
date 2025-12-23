import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ParkingEventsGeoJSON } from '@core/types/parking-event';

@Injectable({
  providedIn: 'root',
})
export class ParkingEventsService {
  private baseUrl = `${environment.apiUrl}/events`;
  private http = inject(HttpClient);

  private parkingEventsSource = new BehaviorSubject<ParkingEventsGeoJSON | null>(null);
  parkingEvents$ = this.parkingEventsSource.asObservable();

  getParkingEventsGEOJSON(): Observable<ParkingEventsGeoJSON> {
    return this.http.get<ParkingEventsGeoJSON>(`${this.baseUrl}/geojson`).pipe(
      tap((parkingEvents) => this.setParkingEventsSource(parkingEvents))
    );
  }

  private setParkingEventsSource(parkingEvents: ParkingEventsGeoJSON): void {
    this.parkingEventsSource.next(parkingEvents);
  }
}
