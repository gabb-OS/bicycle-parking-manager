import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ParkingAreasGeoJSON } from '../types/parking-area';

@Injectable({
  providedIn: 'root',
})
export class ParkinAreasService {
  private baseUrl = `${environment.apiUrl}/areas`;
  private http = inject(HttpClient);

  private parkingAreasSource = new BehaviorSubject<ParkingAreasGeoJSON | null>(null);
  parkingAreas$ = this.parkingAreasSource.asObservable();

  getParkingAreasGEOJSON(): Observable<ParkingAreasGeoJSON> {
    return this.http.get<ParkingAreasGeoJSON>(`${this.baseUrl}/geojson`).pipe(
      tap((parkingAreas) => this.setParkingAreasSource(parkingAreas))
    );
  }

  private setParkingAreasSource(parkingAreas: ParkingAreasGeoJSON): void {
    this.parkingAreasSource.next(parkingAreas);
  }
}
