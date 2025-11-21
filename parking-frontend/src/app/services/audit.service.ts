import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  //private baseUrl = `http://localhost:3000/api/audit/dashboard`;
  private baseUrl = `http://192.168.0.100:3000/api/audit/dashboard`;


  constructor(private http: HttpClient) {}

  getAuditLogs(page = 1, limit = 10): Observable<any> {
    return this.http.get(`${this.baseUrl}?page=${page}&limit=${limit}`);
  }

}
