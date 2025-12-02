import { Component, EventEmitter, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "../../../services/api.service";
import { ParkingTicketComponent, TicketData } from "../../parking-ticket/parking-ticket";
import { FormsModule } from "@angular/forms";

@Component({
  selector: 'app-parked',
  templateUrl: './parked.html',
  styleUrls: ['./parked.css'],
  imports: [CommonModule, FormsModule, ParkingTicketComponent]
})

export class ParkedComponent {

  @Output() vehicleExited = new EventEmitter<void>();

  dashboardComponent: any;
  constructor(private apiService: ApiService) { }

  // Propiedades para vehículos estacionados
  parkedVehicles: any[] = [];
  filteredParkedVehicles: any[] = [];
  searchPlate: string = '';
  isProcessingExit: string | null = null;

  alertMessage: string = '';
  alertType: string = '';
  searchPlateForReprint: string = '';

  activeTab: string = 'entry';
  isLoading: boolean = true;
  
  // Variables para el ticket
  showTicketModal = false;
  currentTicketData: TicketData | null = null;

  ngOnInit(): void {
    this.loadParkedVehicles();
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

  showAlert(message: string, type: string) {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => {
      this.alertMessage = '';
      this.alertType = '';
    }, 3000);
  }

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
          this.vehicleExited.emit();

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

    this.loadParkedVehicles();
  }

  // Manejar la impresión del ticket
  handleTicketPrint() {
    // Después de imprimir, cerrar el modal automáticamente
    setTimeout(() => {
      this.closeTicketModal();
    }, 500);
  }

  loadDashboardData() {
    this.dashboardComponent.loadDashboardData();
  }
}