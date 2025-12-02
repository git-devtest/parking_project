import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { AppInfoService } from '../../services/app-info.service';
import { AuditTrailComponent } from './audit-trail/audit-trail';
import { UsersService } from '../../services/users.service';
import { UsersComponent } from './users/users';
import { BackupsComponent } from './backups/backups';
import { InsightsComponent } from './insights/insights';
import { ReportsComponent } from './reports/reports';
import { HistoryComponent } from './history/history';
import { ParkedComponent } from './parked/parked';
import { EntryComponent } from './entry/entry';

interface DashboardStats {
  parkedVehicles: number;
  availableSpaces: number;
  vehiclesToday: number;
  dailyIncome: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    AuditTrailComponent, 
    UsersComponent,
    BackupsComponent,
    InsightsComponent,
    ReportsComponent,
    HistoryComponent,
    ParkedComponent,
    EntryComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy {
  currentUser: User | null = null;
  
  stats: DashboardStats = {
    parkedVehicles: 0,
    availableSpaces: 0,
    vehiclesToday: 0,
    dailyIncome: 0
  };
  
  activeTab: string = 'entry';
  isLoading: boolean = true;
  private refreshInterval: any;  

  dbInfo: any;

  role: string = '';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private appInfoService: AppInfoService,
    private usersService: UsersService
  ) {}

  // Método para inicializar el componente
  ngOnInit(): void {

    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.role = user.role || '';
    }

    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
    
    // Actualizar datos cada 60 segundos
    this.refreshInterval = setInterval(() => {
      this.loadDashboardData();
    }, 120000);

    // Cargar información de la base de datos
    this.appInfoService.getDatabaseInfo().subscribe({
      next:  data => this.dbInfo = data,
      error: err  => console.log('Error al cargar info de BD',err)      
    });

    this.usersService.getUsers().subscribe({
      next: res => console.log("USERS OK:", res),
      error: err => console.error("ERROR USERS:", err)
    });
  }

  // Método para destruir el intervalo al destruir el componente
  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // Método para cargar datos del dashboard
  loadDashboardData(): void {
    this.isLoading = true;

    // Cargar datos del dashboard
    this.apiService.getDashboardData().subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.stats.parkedVehicles = response.data.parkedVehicles?.length || 0;
          this.stats.vehiclesToday = response.data.todayVehicles || 0;
          this.stats.dailyIncome = response.data.todayIncome || 0;
          
          // Calcular espacios disponibles
          if (response.data.capacity && Array.isArray(response.data.capacity)) {
            this.stats.availableSpaces = response.data.capacity.reduce((total: number, item: any) => 
              total + (item.availableSpaces || 0), 0
            );
          }
        }
      },
      error: err => { alert(err.message); }
    });
  }

  // Refrescar estadísticas
  refreshStatistics(): void {
    this.loadDashboardData();
  }

  // Método para cambiar de pestaña
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Método para cerrar sesión
  logout(): void {
    this.authService.logout();
  }

  // Método para refrescar datos
  refreshData(): void {
    this.loadDashboardData();
  }
 
}