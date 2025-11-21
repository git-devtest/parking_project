import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

export interface DatabaseInfo {
  name: string;
  version: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppInfoService {
  //private apiUrl = 'http://localhost:3000/api/info';
  private apiUrl = 'http://192.168.0.100:3000/api/info';

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
  
  getDatabaseInfo() {
    return this.http.get<DatabaseInfo>(`${this.apiUrl}/database`/*, 
      { headers: this.getHeaders() }*/
    );
  }
}
