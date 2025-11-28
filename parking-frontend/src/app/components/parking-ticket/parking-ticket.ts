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

    // Tamaño estándar de impresoras térmicas: 80mm de ancho
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 120] // Ancho fijo 80mm, alto ajustable
    });

    const vehicleTypeLabel = this.getVehicleTypeLabel(this.ticketData.vehicleType);
    const pageWidth = 80;
    const centerX = pageWidth / 2;
    const margin = 8; // Márgenes laterales

    let y = 10; // Posición Y inicial

    // ============ HEADER ============
    // Logo (círculo azul más pequeño)
    doc.setFillColor(37, 99, 235);
    doc.circle(centerX, y + 5, 6, 'F');
    
    // Icono de carro
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.6);
    doc.line(centerX - 3, y + 5, centerX + 3, y + 5);
    doc.circle(centerX - 1.5, y + 6.5, 0.8, 'F');
    doc.circle(centerX + 1.5, y + 6.5, 0.8, 'F');

    y += 17;

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(31, 41, 55);
    doc.text('PARQUEADERO', centerX, y, { align: 'center' });
    
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text('Sistema de Gestión', centerX, y, { align: 'center' });

    y += 5;

    // Línea separadora
    doc.setDrawColor(209, 213, 219);
    for (let i = margin; i < pageWidth - margin; i += 3) {
      doc.line(i, y, i + 1.5, y);
    }

    y += 5;

    // ============ TICKET ID ============
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 6, 1.5, 1.5, 'F');
    
    y += 4;
    doc.setFont('courier', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(75, 85, 99);
    const ticketIdShort = `#${this.ticketData.ticketId.substring(0, 20)}...`;
    doc.text(ticketIdShort, centerX, y, { align: 'center' });

    y += 6;

    // ============ INFORMACIÓN DEL VEHÍCULO ============
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const addInfoRow = (label: string, value: string, isBold: boolean = false) => {
      doc.setTextColor(107, 114, 128);
      doc.text(label, margin, y);
      
      doc.setTextColor(31, 41, 55);
      if (isBold) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
      }
      doc.text(value, pageWidth - margin, y, { align: 'right' });
      
      if (isBold) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
      }
      
      y += 1;
      doc.setDrawColor(229, 231, 235);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    };

    addInfoRow('Placa', this.ticketData.plateNumber, true);
    addInfoRow('Tipo', vehicleTypeLabel);
    addInfoRow('Entrada', this.formatDateTime(this.ticketData.entryTime));
    addInfoRow('Salida', this.formatDateTime(this.ticketData.exitTime));
    addInfoRow('Duración', this.formatDuration(this.ticketData.duration));

    y += 2;

    // ============ TOTAL A PAGAR ============
    const boxHeight = 13;
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), boxHeight, 2, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('TOTAL A PAGAR', margin + 3, y + 5);
    
    doc.setFontSize(14);
    doc.text(`$${this.ticketData.amount.toFixed(2)}`, pageWidth - margin - 3, y + 9, { align: 'right' });

    y += boxHeight + 4;

    // ============ FOOTER ============
    // Línea separadora
    doc.setDrawColor(209, 213, 219);
    for (let i = margin; i < pageWidth - margin; i += 3) {
      doc.line(i, y, i + 1.5, y);
    }

    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    
    doc.text(`Emisión: ${this.formatDateTime(this.ticketData.generatedAt)}`, centerX, y, { align: 'center' });
    
    y += 3;
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(6.5);
    doc.text('¡Gracias por su preferencia!', centerX, y, { align: 'center' });
    
    y += 3;
    doc.text('Conserve este ticket como comprobante', centerX, y, { align: 'center' });

    if (this.ticketData.isReprint) {
      y += 3;
      doc.setTextColor(239, 68, 68);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text('(REIMPRESIÓN)', centerX, y, { align: 'center' });
    }

    y += 5; // Margen final pequeño

    // ============ AJUSTAR ALTURA FINAL ============
    // Recortar el PDF a la altura exacta usada
    const finalHeight = y;
    const finalDoc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, finalHeight]
    });

    // Copiar contenido al documento con altura ajustada
    const pageData = doc.output('datauristring');
    
    // ============ GUARDAR PDF ============
    const fileName = `${this.ticketData.plateNumber}-${vehicleTypeLabel}.pdf`;
    doc.save(fileName);
    
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