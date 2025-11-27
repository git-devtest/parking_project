import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import jsPDF from 'jspdf';

export interface TicketData {
  ticketId: string;
  sessionId: string;
  plateNumber: string;
  vehicleType: string;
  vehicleTypeDescription?: string;
  entryTime: string;
  exitTime: string;
  duration: number;
  amount: number;
  generatedAt: string;
  status: string;
  isReprint?: boolean;
}

@Component({
  selector: 'app-parking-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parking-ticket.html',
  styleUrls: ['./parking-ticket.css']
})
export class ParkingTicketComponent {
  @Input() ticketData: TicketData | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onPrint = new EventEmitter<void>();

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  handlePrint(): void {
    if (!this.ticketData) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5'
    });

    // Generar nombre del archivo basado en placa y tipo de vehículo
    const vehicleTypeLabel = this.getVehicleTypeLabel(this.ticketData.vehicleType);
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    // ============ HEADER ============
    // Logo simulado (círculo azul)
    doc.setFillColor(37, 99, 235); // #2563eb
    doc.circle(centerX, 15, 8, 'F');
    
    // Icono de carro dentro del círculo (líneas simples)
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.8);
    doc.line(centerX - 4, 15, centerX + 4, 15);
    doc.circle(centerX - 2, 17, 1, 'F');
    doc.circle(centerX + 2, 17, 1, 'F');

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(31, 41, 55); // #1f2937
    doc.text('PARQUEADERO', centerX, 30, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // #6b7280
    doc.text('Sistema de Gestión', centerX, 36, { align: 'center' });

    // Línea separadora superior (discontinua simulada con líneas pequeñas)
    doc.setDrawColor(209, 213, 219);
    for (let i = 15; i < pageWidth - 15; i += 4) {
      doc.line(i, 40, i + 2, 40);
    }

    // ============ TICKET ID ============
    doc.setFillColor(243, 244, 246); // #f3f4f6
    doc.roundedRect(15, 45, pageWidth - 30, 8, 2, 2, 'F');
    
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(75, 85, 99); // #4b5563
    const ticketIdShort = `#${this.ticketData.ticketId.substring(0, 18)}...`;
    doc.text(ticketIdShort, centerX, 50, { align: 'center' });

    // ============ INFORMACIÓN DEL VEHÍCULO ============
    let y = 62;
    const leftMargin = 20;
    const rightMargin = pageWidth - 20;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Función helper para agregar fila
    const addInfoRow = (label: string, value: string, isBold: boolean = false) => {
      doc.setTextColor(107, 114, 128);
      doc.text(label, leftMargin, y);
      
      doc.setTextColor(31, 41, 55);
      if (isBold) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
      }
      doc.text(value, rightMargin, y, { align: 'right' });
      
      if (isBold) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
      }
      
      // Línea separadora
      doc.setDrawColor(229, 231, 235);
      doc.line(leftMargin, y + 2, rightMargin, y + 2);
      
      y += 10;
    };

    addInfoRow('Placa', this.ticketData.plateNumber, true);
    addInfoRow('Tipo de Vehículo', vehicleTypeLabel);
    addInfoRow('Entrada', this.formatDateTime(this.ticketData.entryTime));
    addInfoRow('Salida', this.formatDateTime(this.ticketData.exitTime));
    addInfoRow('Duración', this.formatDuration(this.ticketData.duration));

    // ============ TOTAL A PAGAR ============
    y += 5;
    
    // Rectángulo con color sólido (simulando gradiente con opacidad)
    doc.setFillColor(37, 99, 235); // #2563eb
    doc.roundedRect(15, y, pageWidth - 30, 18, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('TOTAL A PAGAR', leftMargin + 5, y + 7);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(`$${this.ticketData.amount.toFixed(2)}`, rightMargin - 5, y + 12, { align: 'right' });

    // ============ FOOTER ============
    y += 25;
    
    // Línea separadora inferior (discontinua simulada)
    doc.setDrawColor(209, 213, 219);
    for (let i = 15; i < pageWidth - 15; i += 4) {
      doc.line(i, y, i + 2, y);
    }

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    
    doc.text(`Fecha de emisión: ${this.formatDateTime(this.ticketData.generatedAt)}`, centerX, y, { align: 'center' });
    
    y += 5;
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(7);
    doc.text('¡Gracias por su preferencia!', centerX, y, { align: 'center' });
    
    y += 4;
    doc.text('Conserve este ticket como comprobante', centerX, y, { align: 'center' });

    if (this.ticketData.isReprint) {
      y += 5;
      doc.setTextColor(239, 68, 68); // #ef4444
      doc.setFont('helvetica', 'bold');
      doc.text('(REIMPRESIÓN)', centerX, y, { align: 'center' });
    }

    // ============ GUARDAR PDF ============
    const fileName = `${this.ticketData.plateNumber}-${vehicleTypeLabel}.pdf`;
    doc.save(fileName);
    
    // Emitir evento
    this.onPrint.emit();
  }

  handleClose(): void {
    this.onClose.emit();
  }

  getVehicleTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'CAR': 'Automóvil',
      'MOTORCYCLE': 'Motocicleta',
      'TRUCK': 'Camión'
    };
    return labels[type] || type;
  }

}