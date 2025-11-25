import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

interface DashboardData {
  executiveSummary: any;
  revenueByVehicleType: any[];
  dailyRevenueTrend: any[];
  peakHours: any[];
  currentOccupancy: any[];
  frequentCustomers: any[];
  weeklyPattern: any[];
  rotationRate: any[];
  periodComparison: any[];
  dateRange: { startDate: string; endDate: string };
}

@Component({
  selector: 'app-insights-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './insights-dashboard.component.html',
  styleUrls: ['./insights-dashboard.component.css']
})
export class InsightsDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('revenueByTypeCanvas') revenueByTypeCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('dailyRevenueCanvas') dailyRevenueCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('peakHoursCanvas') peakHoursCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('weeklyPatternCanvas') weeklyPatternCanvas?: ElementRef<HTMLCanvasElement>;

  // Estados
  loading = false;
  error: string | null = null;
  dashboardData: DashboardData | null = null;

  // Filtros de fecha
  startDate: string = '';
  endDate: string = '';

  // KPIs principales
  totalRevenue = 0;
  totalServices = 0;
  avgTicket = 0;
  avgDuration = 0;
  uniqueVehicles = 0;

  // Referencias a los gráficos
  private charts: Chart[] = [];

  constructor(private http: HttpClient) {
    // Inicializar fechas: últimos 30 días
    const today = new Date();
    this.endDate = this.formatDate(today);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    this.startDate = this.formatDate(thirtyDaysAgo);
  }

  ngOnInit(): void {
    // No cargar datos aquí, esperar a que la vista esté lista
  }

  ngAfterViewInit(): void {
    // Ahora sí cargar los datos
    setTimeout(() => {
      this.loadDashboard();
    }, 100);
  }

  ngOnDestroy(): void {
    // Destruir todos los gráficos para evitar memory leaks
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = null;

    const url = `/api/insights/dashboard?startDate=${this.startDate}&endDate=${this.endDate}`;

    this.http.get<DashboardData>(url).subscribe({
      next: (data) => {
        console.log('✅ Datos recibidos:', data);
        this.dashboardData = data;
        this.processData(data);
        this.createCharts();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar dashboard:', error);
        this.error = error.message || 'Error al cargar el dashboard';
        this.loading = false;
      }
    });
  }

  processData(data: DashboardData): void {
    // KPIs principales
    if (data.executiveSummary) {
      this.totalRevenue = data.executiveSummary.ingresos_totales || 0;
      this.totalServices = data.executiveSummary.total_servicios || 0;
      this.avgTicket = data.executiveSummary.ticket_promedio || 0;
      this.avgDuration = data.executiveSummary.duracion_promedio_min || 0;
      this.uniqueVehicles = data.executiveSummary.vehiculos_unicos || 0;
    }
  }

  createCharts(): void {
    // Destruir gráficos existentes
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];

    // Esperar un momento para asegurar que los canvas están en el DOM
    setTimeout(() => {
      this.createRevenueByTypeChart();
      this.createDailyRevenueChart();
      this.createPeakHoursChart();
      this.createWeeklyPatternChart();
    }, 100);
  }

  createRevenueByTypeChart(): void {
    if (!this.revenueByTypeCanvas || !this.dashboardData?.revenueByVehicleType) {
      console.warn('⚠️ Canvas o datos no disponibles para Revenue by Type');
      return;
    }

    const ctx = this.revenueByTypeCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.dashboardData.revenueByVehicleType;
    
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(item => item.tipo_descripcion),
        datasets: [{
          data: data.map(item => item.ingresos_totales),
          backgroundColor: ['#4F46E5', '#10B981', '#F59E0B'],
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed || 0;
                return `${context.label}: $${value.toLocaleString()}`;
              }
            }
          }
        }
      }
    });

    this.charts.push(chart);
  }

  createDailyRevenueChart(): void {
    if (!this.dailyRevenueCanvas || !this.dashboardData?.dailyRevenueTrend) {
      console.warn('⚠️ Canvas o datos no disponibles para Daily Revenue');
      return;
    }

    const ctx = this.dailyRevenueCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = [...this.dashboardData.dailyRevenueTrend].reverse();
    
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(item => {
          const date = new Date(item.fecha);
          return `${date.getDate()}/${date.getMonth() + 1}`;
        }),
        datasets: [{
          label: 'Ingresos Diarios',
          data: data.map(item => item.ingresos),
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '$' + value.toLocaleString()
            }
          }
        }
      }
    });

    this.charts.push(chart);
  }

  createPeakHoursChart(): void {
    if (!this.peakHoursCanvas || !this.dashboardData?.peakHours) {
      console.warn('⚠️ Canvas o datos no disponibles para Peak Hours');
      return;
    }

    const ctx = this.peakHoursCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = [...this.dashboardData.peakHours].sort((a, b) => a.hora - b.hora);
    
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(item => `${item.hora}:00`),
        datasets: [{
          label: 'Servicios',
          data: data.map(item => item.total_ingresos),
          backgroundColor: '#10B981',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    this.charts.push(chart);
  }

  createWeeklyPatternChart(): void {
    if (!this.weeklyPatternCanvas || !this.dashboardData?.weeklyPattern) {
      console.warn('⚠️ Canvas o datos no disponibles para Weekly Pattern');
      return;
    }

    const ctx = this.weeklyPatternCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const daysSpanish = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const data = [...this.dashboardData.weeklyPattern].sort((a, b) => a.num_dia - b.num_dia);
    
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map((item, index) => daysSpanish[index] || item.dia_semana),
        datasets: [{
          label: 'Ingresos',
          data: data.map(item => item.ingresos_totales),
          backgroundColor: '#F59E0B',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '$' + value.toLocaleString()
            }
          }
        }
      }
    });

    this.charts.push(chart);
  }

  onDateChange(): void {
    this.loadDashboard();
  }

  exportData(): void {
    if (!this.dashboardData) return;
    
    const dataStr = JSON.stringify(this.dashboardData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `insights-${this.startDate}-to-${this.endDate}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getOccupancyColor(percentage: number): string {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }
}