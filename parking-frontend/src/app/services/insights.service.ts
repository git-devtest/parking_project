import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardData {
  executiveSummary: any;
  revenueByVehicleType: any[];
  dailyRevenueTrend: any[];
  peakHours: any[];
  currentOccupancy: any[];
  frequentCustomers: any[];
  weeklyPattern: any[];
  rotationRate: any[];
  periodComparison: any[];
  dateRange: { startDate: string; endDate: string };
}

@Injectable({
  providedIn: 'root'
})
export class InsightsService {
  private apiUrl = `${environment.apiUrl}/insights`;

  constructor(private http: HttpClient) {}

  getDashboard(startDate: string, endDate: string): Observable<DashboardData> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<DashboardData>(`${this.apiUrl}/dashboard`, { params });
  }
}