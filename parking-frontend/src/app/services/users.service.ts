import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  //private baseUrl = `http://localhost:3000/api/users`;
  private baseUrl = 'http://192.168.0.100:3000/api/users';

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
    return this.http.get(`${this.baseUrl}`, this.getHeaders());
  }

  // Obtener usuario por ID
  getUserById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`, this.getHeaders());
  }

  // Crear usuario
  createUser(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}`, userData, this.getHeaders());
  }

  // Actualizar usuario
  updateUser(id: string, userData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, userData, this.getHeaders());
  }

  // Inactivar usuario
  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, this.getHeaders());
  }
}
