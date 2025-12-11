import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface BackupFile {
  filename: string;
  path: string;
  size: number;
  sizeMB: string;
  createdAt: string;
  readableDate: string;
  type: 'json' | 'sql';
}

interface BackupResponse {
  success: boolean;
  data: BackupFile[];
  count?: number;
}

interface ProgressData {
  percent: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class BackupService {

  //private apiUrl = 'http://localhost:3000/api/backups';
  //private apiUrl = 'http://192.168.0.100:3000/api/backups';
  private apiUrl = environment.apiUrl+'/api/backups';

  constructor(private http: HttpClient, private auth: AuthService) {}

  getBackups(): Observable<BackupResponse> {
    return this.http.get<BackupResponse>(this.apiUrl, { headers: this.auth.getAuthHeaders() });
  }

  createBackup(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, {}, { headers: this.auth.getAuthHeaders() });
  }

  downloadBackup(file: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${file}`, {
      headers: this.auth.getAuthHeaders(),
      responseType: 'blob' // ✅ Importante para descargas
    });
  }

  createSqlBackup(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create-sql`, {}, { 
        headers: this.auth.getAuthHeaders() 
    });
  }

  viewJsonBackup(file: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/view-json/${file}`, { 
        headers: this.auth.getAuthHeaders() 
    });
  }
}
