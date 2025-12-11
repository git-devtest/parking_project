// src/app/services/insights.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import {
  ApiResponse,
  DashboardData,
  CurrentOccupancy,
  CurrentlyParkedVehicle
} from '../interfaces/insights';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InsightsService {
  private http = inject(HttpClient);
  //private apiUrl = `http://localhost:3000/api/insights`; // Ajusta según tu configuración
  private apiUrl = environment.apiUrl+'/api/insights';

  /**
   * Obtiene el dashboard completo con todos los datasets
   * @param startDate Fecha inicio en formato YYYY-MM-DD
   * @param endDate Fecha fin en formato YYYY-MM-DD
   */
  getDashboard(startDate?: string, endDate?: string): Observable<DashboardData> {
    let params = new HttpParams();
    
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.http.get<ApiResponse<DashboardData>>(`${this.apiUrl}/dashboard`, { params })
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Error al obtener el dashboard');
          }
          return response.datasets;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene la ocupación actual en tiempo real
   */
  getCurrentOccupancy(): Observable<CurrentOccupancy[]> {
    return this.http.get<ApiResponse<CurrentOccupancy[]>>(`${this.apiUrl}/occupancy/current`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Error al obtener ocupación');
          }
          return response.datasets;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene los vehículos actualmente estacionados
   */
  getCurrentlyParked(): Observable<CurrentlyParkedVehicle[]> {
    return this.http.get<ApiResponse<CurrentlyParkedVehicle[]>>(`${this.apiUrl}/vehicles/currently-parked`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Error al obtener vehículos estacionados');
          }
          return response.datasets;
        }),
        catchError(this.handleError)
      );
  }

  private handleError(error: any): Observable<never> {
    console.error('Error en InsightsService:', error);
    
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      errorMessage = error.error?.message || 
                     `Error ${error.status}: ${error.statusText}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}