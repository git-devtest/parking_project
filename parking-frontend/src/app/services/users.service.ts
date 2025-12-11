import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  //private baseUrl = `http://localhost:3000/api/users`;
  //private baseUrl = 'http://192.168.0.100:3000/api/users';
  private apiUrl = environment.apiUrl+'/api/users';

  constructor(private http: HttpClient) {}

  // Obtener token del localStorage
  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  // Obtener todos los usuarios
  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`, this.getHeaders());
  }

  // Obtener usuario por ID
  getUserById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${id}`, this.getHeaders());
  }

  // Crear usuario
  createUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, userData, this.getHeaders());
  }

  // Actualizar usuario
  updateUser(id: string, userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}`, userData, this.getHeaders());
  }

  // Inactivar usuario
  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`, this.getHeaders());
  }
}
