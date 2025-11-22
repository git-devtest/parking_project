import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

export interface Vehicle {
  id: string;
  plateNumber: string;
  vehicleType: string;
  entryTime: string;
  exitTime?: string;
  status: string;
  totalAmount?: number;
}

export interface ParkingCapacity {
  vehicleType: string;
  vehicle_type_description: string;
  maxCapacity: number;
  currentCount: number;
  availableSpaces: number;
}

export interface ParkingSession {
  id: string;
  plateNumber: string;
  vehicleType: string;
  entryTime: string;
  exitTime?: string;
  duration?: number;
  amount?: number;
  status: string;
}

// Interfaces para respuestas de la API
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  count?: number;
  pagination?: any;
}

export interface VehicleEntryResponse {
  vehicleId: string;
  plateNumber: string;
  message: string;
}

export interface VehicleExitResponse {
  vehicleId: string;
  plateNumber: string;
  durationMinutes: number;
  totalAmount: number;
  message: string;
}

export interface ParkedVehicle {
  plateNumber: string;
  vehicleType: string;
  entryTime: string;
  minutes_parked: number;
  vehicle_type_description: string;
}

export interface DashboardData {
  parkedVehicles: any[];
  todayIncome: number;
  todayVehicles: number;
  capacity: ParkingCapacity[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api';
  //private baseUrl = 'http://192.168.0.100:3000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /*private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }*/

  // Auth endpoints
  getProfile() {
    return this.http.get(`${this.baseUrl}/auth/me`/*, { headers: this.getHeaders() }*/);
  }

  // Vehicle endpoints
  registerVehicleEntry(plateNumber: string, vehicleType: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/vehicles/entry`, 
      { plateNumber, vehicleType }/*, 
      { headers: this.getHeaders() }*/
    );
  }

  registerVehicleExit(plateNumber: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/vehicles/exit`, 
      { plateNumber }/*, 
      { headers: this.getHeaders() }*/
    );
  }

  getParkedVehicles(): Observable<any> {
    return this.http.get(`${this.baseUrl}/vehicles/parked`/*, { headers: this.getHeaders() }*/);
  }

  getParkingCapacity(): Observable<any> {
    return this.http.get(`${this.baseUrl}/vehicles/capacity`/*, { headers: this.getHeaders() }*/);
  }

  getVehicleHistory(page: number = 1, limit: number = 20): Observable<any> {
    return this.http.get(`${this.baseUrl}/vehicles/history?page=${page}&limit=${limit}`/*, 
      { headers: this.getHeaders() }*/
    );
  }

  // Report endpoints
  getDailyReport(range: string = 'today'): Observable<any> {
    return this.http.get(`${this.baseUrl}/reports/daily?range=${range}`/*, 
      { headers: this.getHeaders() }*/
    );
  }

  getDashboardData(): Observable<any> {
    return this.http.get(`${this.baseUrl}/reports/dashboard`/*, 
      { headers: this.getHeaders() }*/
    );
  }

  getCustomReport(startDate: string, endDate: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/reports/custom?startDate=${startDate}&endDate=${endDate}`/*, 
      { headers: this.getHeaders() }*/
    );
  }
}