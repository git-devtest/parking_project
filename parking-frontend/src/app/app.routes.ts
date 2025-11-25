import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { UsersComponent } from './components/dashboard/users/users';
import { AuditTrailComponent } from './components/dashboard/audit-trail/audit-trail';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { InsightsDashboardComponent } from './components/dashboard/insights-dashboard/insights-dashboard.component';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' },
  {
    path: 'usuarios',
    component: UsersComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },

  {
    path: 'auditoria',
    component: AuditTrailComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'insights',
    component: InsightsDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  }
];
