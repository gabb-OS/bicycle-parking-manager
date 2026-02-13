import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ParkinAreasService } from '@core/services/parking-areas.service';
import { catchError, finalize, of, take, switchMap } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private parkingAreasService = inject(ParkinAreasService);

  isMenuCollapsed = true;
  logoUrl = 'assets/bpmLogo.png';
  isClusteringRunning = signal(false);

  runClustering(): void {
    if (this.isClusteringRunning()) return;

    this.isClusteringRunning.set(true);
    this.parkingAreasService
      .triggerClustering()
      .pipe(
        take(1),
        catchError((error) => {
          console.error('Clustering failed:', error);
          return of(null);
        }),
        switchMap((result) => {
          if (result) {
            // Refetch parking areas after successful clustering
            return this.parkingAreasService.getParkingAreasGEOJSON();
          }
          return of(null);
        }),
        finalize(() => {
          this.isClusteringRunning.set(false);
        })
      )
      .subscribe((parkingAreas) => {
        if (parkingAreas) {
          console.log('Parking areas updated after clustering');
        }
      });
  }
}
