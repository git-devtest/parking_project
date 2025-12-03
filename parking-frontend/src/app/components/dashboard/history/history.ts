import { ApiService } from '../../../services/api.service';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-history',
  templateUrl: './history.html',
  styleUrl: './history.css',
  imports: [CommonModule, FormsModule],
})
export class HistoryComponent {
  constructor(private apiService: ApiService) { }

  activeTab: string = '';
  isLoading: boolean = true;

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

  // Inicializar componentes
  ngOnInit(): void {
    this.loadVehicleHistory();
  }
  // Cargar historial de vehículos - pasar a HistoryComponent
  loadVehicleHistory(): void {
    const searchTerm = this.historySearch.trim().toUpperCase();
    this.apiService.getVehicleHistory(this.currentPage, this.itemsPerPage, searchTerm).subscribe({
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
    this.loadVehicleHistory();
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

  // Paginación
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadVehicleHistory();
    }
  }

  // Paginación
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadVehicleHistory();
    }
  }

}