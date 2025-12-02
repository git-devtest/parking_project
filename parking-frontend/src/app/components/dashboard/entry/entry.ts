import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../../services/api.service";

@Component({
    selector: 'app-entry',
    standalone: true,
    templateUrl: './entry.html',
    styleUrls: ['./entry.css'],
    imports: [CommonModule, FormsModule]
})

export class EntryComponent {

  @Output() vehicleEntered = new EventEmitter<void>();
    
  activeTab: string = 'entry';
  isLoading: boolean = true;

  // Propiedades para el registro de entrada
  entryPlateNumber: string = '';
  entryVehicleType: string = 'CAR';
  isRegistering: boolean = false;
  entryAlert: { message: string; type: 'success' | 'error' } = { message: '', type: 'success' };

  constructor(private apiService: ApiService) { }

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
        } else {
          this.showEntryAlert(`❌ ${response.message}`, 'error');
        }
      },
      error: err => { alert(err.message);  }
    });
  }

  // Resetear formulario
  private resetEntryForm(): void {
    this.entryPlateNumber = '';
    this.entryVehicleType = 'CAR';
    this.vehicleEntered.emit();
  }
    
}