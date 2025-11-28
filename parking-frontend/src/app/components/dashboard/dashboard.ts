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
import { ParkingTicketComponent, TicketData } from '../parking-ticket/parking-ticket';
import { InsightsComponent } from './insights/insights';

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
    ParkingTicketComponent,
    InsightsComponent],
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

  // Propiedades para el registro de entrada
  entryPlateNumber: string = '';
  entryVehicleType: string = 'CAR';
  isRegistering: boolean = false;
  entryAlert: { message: string; type: 'success' | 'error' } = { message: '', type: 'success' };  

  // Propiedades para vehículos estacionados
  parkedVehicles: any[] = [];
  filteredParkedVehicles: any[] = [];
  searchPlate: string = '';
  isProcessingExit: string | null = null;

  // Propiedades para el historial
  vehicleHistory: any[] = [];
  filteredVehicleHistory: any[] = [];
  paginatedHistory: any[] = [];

  historySearch: string = '';
  itemsPerPage: number = 20;
  currentPage: number = 1;
  totalPages: number = 1;
  totalItems: number = 0;

  startIndex: number = 0;
  endIndex: number = 0;

  // Propiedades para reportes
  reportType: string = 'daily';
  dailyRange: string = 'today';
  startDate: string = '';
  endDate: string = '';
  maxDate: string = '';
  isGeneratingReport: boolean = false;
  reportData: any[] = [];
  totalIncome: number = 0;
  totalVehicles: number = 0;
  averageDuration: string = '0h';
  currentParked: number = 0;

  dbInfo: any;

  role: string = '';

  // Variables para el ticket
  showTicketModal = false;
  currentTicketData: TicketData | null = null;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private appInfoService: AppInfoService,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {

    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.role = user.role || '';
    }

    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();

    // Configurar fecha máxima (hoy)
    this.maxDate = new Date().toISOString().split('T')[0];
    this.startDate = this.maxDate;
    this.endDate = this.maxDate;
    
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

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

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

    // Cargar vehículos estacionados
    this.loadParkedVehicles();

    // Cargar historial solo si estamos en esa pestaña
    if (this.activeTab === 'history') {
      this.loadVehicleHistory();
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;

    // Cargar datos específicos de la pestaña
    if (tab === 'history') {
      this.loadVehicleHistory();
    } else if (tab === 'reports' && this.reportData.length === 0) {
      // Generar reporte inicial si no hay datos
      this.generateReport();
    }
  }

  logout(): void {
    this.authService.logout();
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  // Manejar input de placa
  onPlateInput(event: any): void {
    // Convertir a mayúsculas automáticamente
    this.entryPlateNumber = event.target.value.toUpperCase();
    
    // Validar formato de placa en tiempo real
    if (this.entryPlateNumber && !this.isValidPlate(this.entryPlateNumber)) {
      this.showEntryAlert('La placa debe contener solo letras mayúsculas y números (3-10 caracteres)', 'error');
    } else {
      this.clearEntryAlert();
    }
  }

  // Validar formato de placa
  private isValidPlate(plate: string): boolean {
    const plateRegex = /^[A-Z0-9]{3,10}$/;
    return plateRegex.test(plate);
  }

  // Registrar entrada de vehículo
  registerVehicleEntry(): void {
    const plate = this.entryPlateNumber.trim();
    
    // Validaciones
    if (!plate) {
      this.showEntryAlert('La placa es requerida', 'error');
      return;
    }

    if (!this.isValidPlate(plate)) {
      this.showEntryAlert('La placa debe contener solo letras mayúsculas y números (3-10 caracteres)', 'error');
      return;
    }

    this.isRegistering = true;
    this.clearEntryAlert();

    this.apiService.registerVehicleEntry(plate, this.entryVehicleType).subscribe({
      next: (response: any) => {
        this.isRegistering = false;
        if (response.success) {
          this.showEntryAlert(`✅ ${response.message} - Placa: ${response.data?.plateNumber || plate}`, 'success');
          this.resetEntryForm();
          this.loadDashboardData(); // Recargar stats
        } else {
          this.showEntryAlert(`❌ ${response.message}`, 'error');
        }
      },
      error: err => { alert(err.message);  }
    });
  }

  // Mostrar alerta
  private showEntryAlert(message: string, type: 'success' | 'error'): void {
    this.entryAlert = { message, type };
    
    // Auto-ocultar después de 10 segundos
    setTimeout(() => {
      this.clearEntryAlert();
    }, 10000);
  }

  // Limpiar alerta
  private clearEntryAlert(): void {
    this.entryAlert = { message: '', type: 'success' };
  }

  // Resetear formulario
  private resetEntryForm(): void {
    this.entryPlateNumber = '';
    this.entryVehicleType = 'CAR';
  }

  // Cargar vehículos estacionados
  loadParkedVehicles(): void {
    this.apiService.getParkedVehicles().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.parkedVehicles = response.data || [];
          this.filterParkedVehicles();
        }
      },
      error: err => { alert(err.message); }
    });
  }

  // Filtrar vehículos por placa
  onSearchPlate(): void {
    this.filterParkedVehicles();
  }

  filterParkedVehicles(): void {
    if (!this.searchPlate.trim()) {
      this.filteredParkedVehicles = this.parkedVehicles;
    } else {
      const searchTerm = this.searchPlate.trim().toUpperCase();
      this.filteredParkedVehicles = this.parkedVehicles.filter(vehicle =>
        vehicle.plateNumber.includes(searchTerm)
      );
    }
  }

  // Registrar salida de vehículo
  registerVehicleExit(plateNumber: string): void {
    this.isProcessingExit = plateNumber;

    this.apiService.registerVehicleExit(plateNumber).subscribe({
      next: (response: any) => {
        this.isProcessingExit = null;
        if (response.success) {
          this.showEntryAlert(`✅ ${response.message} - Monto: $${response.data?.totalAmount || 0}`, 'success');
          this.loadDashboardData(); // Recargar stats
          this.loadParkedVehicles(); // Recargar lista
        } else {
          this.showEntryAlert(`❌ ${response.message}`, 'error');
        }
      },
      error: err => { alert(err.message); }
    });
  }

  // Obtener etiqueta del tipo de vehículo
  getVehicleTypeLabel(vehicleType: string): string {
    const types: { [key: string]: string } = {
      'CAR': 'Automóvil',
      'MOTORCYCLE': 'Motocicleta',
      'TRUCK': 'Camión'
    };
    return types[vehicleType] || vehicleType;
  }

  // Formatear fecha y hora
  formatDateTime(dateTime: string): string {
    return new Date(dateTime).toLocaleString('es-CO');
  }

  // Calcular tiempo estacionado
  calculateParkedTime(entryTime: string): string {
    const entry = new Date(entryTime);
    const now = new Date();
    const diffMs = now.getTime() - entry.getTime();
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }

  // Calcular costo actual
  calculateCurrentCost(entryTime: string, vehicleType: string): number {
    const entry = new Date(entryTime);
    const now = new Date();
    const diffMs = now.getTime() - entry.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    
    // Tarifas por hora
    const rates: { [key: string]: number } = {
      'CAR': 20.00,
      'MOTORCYCLE': 10.00,
      'TRUCK': 40.00
    };
    
    const hourlyRate = rates[vehicleType] || 20.00;
    return Math.max(hourlyRate, hourlyRate * Math.ceil(hours)); // Mínimo 1 hora
  }

  // Cargar historial de vehículos
  loadVehicleHistory(): void {
    this.apiService.getVehicleHistory(this.currentPage, this.itemsPerPage).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.vehicleHistory = response.data || [];

          // Para búsqueda local temporal
          this.filteredVehicleHistory = this.vehicleHistory;

          // Datos de paginación del backend
          this.totalItems = response.pagination.total;
          this.totalPages = response.pagination.pages;

          // Calcular rangos mostrados
          this.startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
          this.endIndex = Math.min(this.startIndex + this.vehicleHistory.length - 1, this.totalItems);

          // Lo que se muestra en tabla = ya viene paginado del backend
          this.paginatedHistory = this.filteredVehicleHistory;

        }
      },
      error: err => { alert(err.message); }
    });
  }

  // Filtrar historial por placa
  onHistorySearch(): void {
    this.currentPage = 1;
    this.filterVehicleHistory();
  }

  filterVehicleHistory(): void {
    const searchTerm = this.historySearch.trim().toUpperCase();
    if (!searchTerm) {
      this.filteredVehicleHistory = this.vehicleHistory;
    } else {
      this.filteredVehicleHistory = this.vehicleHistory.filter(record =>
        record.plateNumber?.includes(searchTerm)
      );
    }
    this.paginatedHistory = this.filteredVehicleHistory;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadVehicleHistory();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadVehicleHistory();
    }
  }

  // Formatear duración
  formatDuration(minutes: number): string {
    if (!minutes) return '--';
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  }

  // Cambio de tipo de reporte
  onReportTypeChange(): void {
    if (this.reportType === 'daily') {
      this.generateReport();
    }
  }

  // Validar formulario de reporte
  isReportFormValid(): boolean {
    if (this.reportType === 'daily') {
      return true;
    } else {
      return !!this.startDate && !!this.endDate;
    }
  }

  // Generar reporte
  generateReport(): void {
    if (!this.isReportFormValid()) {
      this.showEntryAlert('Por favor complete todas las fechas requeridas', 'error');
      return;
    }

    this.isGeneratingReport = true;

    // SOLO limpiar los datos si vamos a cambiar de tipo de reporte o hay error previo
    if (this.reportType === 'daily') {
      // Reporte diario
      this.apiService.getDailyReport(this.dailyRange).subscribe({
        next: (response: any) => {
          this.isGeneratingReport = false;
          if (response.success && response.data) {
            this.processReportData(response.data, response.summary);
          } else {
            this.reportData = []; // ← Limpiar solo si no hay datos
            this.showEntryAlert('No se encontraron datos para el período seleccionado', 'error');
          }
        },
        error: (error: any) => {
          this.isGeneratingReport = false;
          const errorMsg = error.error?.message || 'Error al generar el reporte';
          this.showEntryAlert(`❌ ${errorMsg}`, 'error');
          console.error('Error generating report:', error);
        }
      });
    } else {
      // Reporte personalizado
      this.apiService.getCustomReport(this.startDate, this.endDate).subscribe({
        next: (response: any) => {
          this.isGeneratingReport = false;
          if (response.success && response.data) {
            this.processReportData(response.data);
          } else {
            this.reportData = []; // ← Limpiar solo si no hay datos
            this.showEntryAlert('No se encontraron datos para el período seleccionado', 'error');
          }
        },
        error: (error: any) => {
          this.isGeneratingReport = false;
          this.reportData = []; // ← Limpiar solo si no hay datos
          const errorMsg = error.error?.message || 'Error al generar el reporte';
          this.showEntryAlert(`❌ ${errorMsg}`, 'error');
          console.error('Error generating custom report:', error);
        }
      });
    }
  }

  // Procesar datos del reporte
  processReportData(data: any[], summary?: any): void {
    this.reportData = data;
    
    // Calcular totales
    this.totalIncome = data.reduce((sum, item) => { 
    const income = parseFloat(item.total_income) || 0;
    return sum + income;
  }, 0);
    this.totalVehicles = data.reduce((sum, item) => sum + (item.vehicles_served || 0), 0);
    
    // Calcular duración promedio
    // ✅ Duración promedio ponderada correcta
    const totalDurationMinutes = data.reduce((sum, item) => {
      const vehiclesServed = parseInt(item.vehicles_served) || 0;
      const avgDuration = parseFloat(item.avg_duration_minutes) || 0;
      return sum + (vehiclesServed * avgDuration);
    }, 0);
    const avgMinutes = data.length > 0 ? totalDurationMinutes / data.length : 0;
    this.averageDuration = this.formatDuration(avgMinutes);
    
    // Usar datos del summary si están disponibles
    if (summary) {
      this.totalIncome = summary.totalIncome || this.totalIncome;
      this.totalVehicles = summary.totalVehicles || this.totalVehicles;
      this.averageDuration = this.formatDuration(summary.averageDuration) || this.averageDuration;
    }
    
    // Obtener cantidad actual de estacionados desde las stats
    this.currentParked = this.stats.parkedVehicles;
  }

  // Formatear fecha para reporte
  formatReportDate(dateString: string): string {
    if (!dateString) return '--';
    
    // Conversión directa sin problemas de UTC - formato YYYY-MM-DD a DD/MM/YYYY
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }

  // Obtener texto del período del reporte
  getReportPeriodText(): string {
    if (this.reportType === 'daily') {
      const ranges: { [key: string]: string } = {
        'today': 'Hoy',
        'last_week': 'Última Semana',
        'last_month': 'Último Mes'
      };
      return ranges[this.dailyRange] || 'Período no especificado';
    } else {
      if (this.startDate && this.endDate) {
        const start = this.formatReportDate(this.startDate);
        const end = this.formatReportDate(this.endDate);
        return `Desde ${start} hasta ${end}`;
      }
    }
    return 'Período no especificado';
  }

  // Cambio de rango diario - generar automáticamente
  onDailyRangeChange(): void {
    this.generateReport();
  }

  // Extraer solo la fecha de un string ISO
  extractDateFromISO(isoString: string): string {
    if (!isoString) return '--';
    
    // Si ya es una fecha simple (YYYY-MM-DD), usarla directamente
    if (isoString.length === 10 && isoString.includes('-')) {
      return this.formatReportDate(isoString);
    }
    
    // Si es un string ISO completo, extraer la parte de la fecha
    if (isoString.includes('T')) {
      const datePart = isoString.split('T')[0];
      return this.formatReportDate(datePart);
    }
    
    // Para cualquier otro caso, intentar formatear
    return this.formatReportDate(isoString);
  }

  // Método para procesar la salida del vehículo
  exitVehicle(vehicle: any) {
    // Mostrar confirmación (opcional)
    if (!confirm(`¿Confirmar salida del vehículo ${vehicle.plateNumber}?`)) {
      return;
    }

    this.apiService.exitVehicle(vehicle.plateNumber).subscribe({
      next: (response) => {
        if (response.success && response.data.ticket) {
          // Mostrar ticket inmediatamente
          this.currentTicketData = response.data.ticket;
          this.showTicketModal = true;
          
          // Mostrar mensaje de éxito
          this.showAlert(response.message || 'Salida registrada exitosamente', 'success');
        }
      },
      error: (error) => {
        const errorMsg = error.error?.message || 'Error al procesar salida';
        this.showAlert(errorMsg, 'error');
        console.error('Error en salida:', error);
      }
    });
  }

  // Cerrar el modal del ticket
  closeTicketModal() {
    this.showTicketModal = false;
    this.currentTicketData = null;
    
    // Recargar estadísticas después de cerrar el ticket
    this.loadDashboardData();
    this.loadParkedVehicles();
  }

  // Manejar la impresión del ticket
  handleTicketPrint() {
    // Después de imprimir, cerrar el modal automáticamente
    setTimeout(() => {
      this.closeTicketModal();
    }, 500);
  }

  showAlert(message: string, type: string) {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => {
      this.alertMessage = '';
      this.alertType = '';
    }, 3000);
  }

  alertMessage: string = '';
  alertType: string = '';
  searchPlateForReprint: string = '';

  reprintTicket() {
    if (!this.searchPlateForReprint?.trim()) {
      this.showAlert('Ingrese una placa', 'error');
      return;
    }

    this.apiService.getLastTicket(this.searchPlateForReprint.toUpperCase()).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentTicketData = response.data;
          this.showTicketModal = true;
          this.searchPlateForReprint = '';
        }
      },
      error: (error) => {
        this.showAlert(error.error?.message || 'Ticket no encontrado', 'error');
      }
    });
  }
  
}