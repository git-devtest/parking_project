import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: any): boolean {
    const expectedRoles: string[] = route.data['roles'];

    const user = this.authService.getCurrentUser();

    // Si no hay usuario, redirige a login
    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    // Si el rol NO está permitido
    if (!expectedRoles.includes(user.role)) {
      this.router.navigate(['/dashboard']); // redirige a un lugar seguro
      return false;
    }

    return true;
  }
}
