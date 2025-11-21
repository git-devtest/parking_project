// src/app/core/interceptors/error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {

      // 🔥 Error sin respuesta del servidor (router caído, internet)
      if (error.status === 0) {
        console.error('Error de red o servidor caído:', error);
        return throwError(() => new Error('No hay conexión con el servidor'));
      }

      // 🔐 Token expirado o inválido
      if (error.status === 401) {
        console.warn('Sesión expirada. Cerrando sesión...');
        authService.logout();
        return throwError(() => new Error('Tu sesión expiró, vuelve a ingresar.'));
      }

      // 🚫 Sin permisos
      if (error.status === 403) {
        return throwError(() => new Error('No tienes permisos para realizar esta acción.'));
      }

      // ❓ Ruta o recurso no encontrado
      if (error.status === 404) {
        return throwError(() => new Error('Recurso no encontrado.'));
      }

      // 💥 Error interno del servidor
      if (error.status === 500) {
        console.error('Error interno del servidor:', error);
        return throwError(() => new Error('Error interno del sistema. Estamos trabajando en ello.'));
      }

      // 🟨 Otros errores
      console.error('Error inesperado:', error);
      return throwError(() => new Error(error.error?.message || 'Ocurrió un error inesperado'));
    })
  );
};
