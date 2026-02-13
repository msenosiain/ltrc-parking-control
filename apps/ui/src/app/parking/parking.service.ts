// parking.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ParkingStatus {
  total: number;
  occupied: number;
  available: number;
}

@Injectable({ providedIn: 'root' })
export class ParkingService {
  private parkingApiUrl = `${environment.apiBaseUrl}/parking`;

  private parkingStatusSubject = new BehaviorSubject<ParkingStatus | null>(null);
  parkingStatus$: Observable<ParkingStatus | null> = this.parkingStatusSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** Cargar estado desde el backend */
  loadStatus(): Observable<ParkingStatus> {
    return this.http.get<ParkingStatus>(`${this.parkingApiUrl}/status`).pipe(
      tap(status => this.parkingStatusSubject.next(status))
    );
  }

  /** Auto entra */
  carEnters(): Observable<ParkingStatus> {
    return this.http.post<ParkingStatus>(`${this.parkingApiUrl}/enter`, {}).pipe(
      tap(status => this.parkingStatusSubject.next(status))
    );
  }

  /** Auto sale */
  carLeaves(): Observable<ParkingStatus> {
    return this.http.post<ParkingStatus>(`${this.parkingApiUrl}/leave`, {}).pipe(
      tap(status => this.parkingStatusSubject.next(status))
    );
  }
}
