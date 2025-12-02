import { Component, Input, SimpleChanges } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface DashboardStats {
  parkedVehicles: number;
  availableSpaces: number;
  vehiclesToday: number;
  dailyIncome: number;
}

@Component({
    selector: 'app-reports',
    templateUrl: './reports.html',
    styleUrl: './reports.css',
    imports: [CommonModule, FormsModule],
})

export class ReportsComponent {
    // ⭐ Recibir stats del padre
    @Input() stats: DashboardStats = {  
        parkedVehicles: 0,
        availableSpaces: 0,
        vehiclesToday: 0,
        dailyIncome: 0
    };
    constructor(private apiService: ApiService) {}

    activeTab: string = 'entry';
    isLoading: boolean = true;
    
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

    // Propiedades para el registro de entrada
    entryPlateNumber: string = '';
    entryVehicleType: string = 'CAR';
    isRegistering: boolean = false;
    entryAlert: { message: string; type: 'success' | 'error' } = { message: '', type: 'success' };

    // Inicializar currentParked cuando el componente carga
    ngOnInit(): void {
        this.currentParked = this.stats.parkedVehicles;
    }

    // Actualizar currentParked cuando stats cambia desde el padre
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['stats'] && changes['stats'].currentValue) {
            this.currentParked = this.stats.parkedVehicles;
        }
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

    // Cambio de tipo de reporte - Diario o Personalizado
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

    // Formatear fecha para reporte
    formatReportDate(dateString: string): string {
        if (!dateString) return '--';
        
        // Conversión directa sin problemas de UTC - formato YYYY-MM-DD a DD/MM/YYYY
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }

    // Cambio de rango diario
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
}