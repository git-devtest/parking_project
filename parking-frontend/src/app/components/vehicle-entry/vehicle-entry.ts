import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, ApiResponse, VehicleEntryResponse } from '../../services/api.service';

interface VehicleType {
  value: string;
  label: string;
}

@Component({
  selector: 'app-vehicle-entry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-entry.html',
  styleUrl: './vehicle-entry.css'
})
export class VehicleEntry {
  @Output() vehicleRegistered = new EventEmitter<void>();

  plateNumber: string = '';
  vehicleType: string = 'CAR';
  isLoading: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';

  vehicleTypes: VehicleType[] = [
    { value: 'CAR', label: 'Automóvil' },
    { value: 'MOTORCYCLE', label: 'Motocicleta' },
    { value: 'TRUCK', label: 'Camión' }
  ];

  constructor(private apiService: ApiService) {}

  onSubmit(): void {
    if (!this.plateNumber.trim()) {
      this.showMessage('La placa es requerida', 'error');
      return;
    }

    // Validar formato de placa (solo letras mayúsculas y números)
    const plateRegex = /^[A-Z0-9]{3,10}$/;
    if (!plateRegex.test(this.plateNumber)) {
      this.showMessage('La placa debe contener solo letras mayúsculas y números (3-10 caracteres)', 'error');
      return;
    }

    this.isLoading = true;
    this.message = '';

    this.apiService.registerVehicleEntry(this.plateNumber, this.vehicleType).subscribe({
      next: (response: ApiResponse<VehicleEntryResponse>) => {
        this.isLoading = false;
        if (response.success) {
          const data = response.data!;
          this.showMessage(`✅ ${response.message} - Placa: ${data.plateNumber}`, 'success');
          this.resetForm();
          this.vehicleRegistered.emit(); // Notificar al dashboard para actualizar datos
        } else {
          this.showMessage(`❌ ${response.message}`, 'error');
        }
      },
      error: err => { alert(err.message); }
      /*error: (error) => {
        this.isLoading = false;
        const errorMsg = error.error?.message || 'Error al registrar la entrada';
        this.showMessage(`❌ ${errorMsg}`, 'error');
        console.error('Error registering vehicle:', error);
      }*/
    });
  }

  private showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;
    
    // Auto-ocultar mensaje después de 5 segundos
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }

  private resetForm(): void {
    this.plateNumber = '';
    this.vehicleType = 'CAR';
  }

  onPlateInput(event: any): void {
    // Convertir a mayúsculas automáticamente
    this.plateNumber = event.target.value.toUpperCase();
  }
}