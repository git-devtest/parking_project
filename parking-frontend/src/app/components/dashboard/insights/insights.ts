// src/app/components/insights/insights.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { InsightsService } from '../../../services/insights.service';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  DashboardData,
  InsightsFilters,
  VEHICLE_TYPES,
  CurrentOccupancy
} from '../../../interfaces/insights';

Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './insights.html',
  styleUrls: ['./insights.css']
})
export class InsightsComponent implements OnInit, OnDestroy {
  private insightsService = inject(InsightsService);
  
  // Data
  dashboardData: DashboardData | null = null;
  currentOccupancy: CurrentOccupancy[] = [];
  
  // Loading & Error states
  isLoading = false;
  errorMessage = '';
  
  // Filtros
  filters: InsightsFilters = {
    startDate: this.getDefaultStartDate(),
    endDate: this.getDefaultEndDate(),
    vehicleType: null
  };
  
  vehicleTypes = VEHICLE_TYPES;
  
  // Charts
  private charts: Map<string, Chart> = new Map();
  
  // Refresh interval
  private occupancyInterval: any;

  ngOnInit(): void {
    this.loadDashboard();
    this.loadCurrentOccupancy();
  }

  ngOnDestroy(): void {
    this.destroyAllCharts();
    if (this.occupancyInterval) {
      clearInterval(this.occupancyInterval);
    }
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.insightsService.getDashboard(this.filters.startDate, this.filters.endDate)
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.isLoading = false;
          
          // Esperar a que el DOM se actualice antes de crear gráficos
          setTimeout(() => {
            this.createCharts();
          }, 100);
        },
        error: (error) => {
          this.errorMessage = error.message;
          this.isLoading = false;
        }
      });
  }

  loadCurrentOccupancy(): void {
    this.insightsService.getCurrentOccupancy()
      .subscribe({
        next: (data) => {
          this.currentOccupancy = data;
        },
        error: (error) => {
          console.error('Error cargando ocupación:', error);
        }
      });
  }

  applyFilters(): void {
    this.destroyAllCharts();
    this.loadDashboard();
  }

  resetFilters(): void {
    this.filters = {
      startDate: this.getDefaultStartDate(),
      endDate: this.getDefaultEndDate(),
      vehicleType: null
    };
    this.applyFilters();
  }

  // Filtrado de datos según tipo de vehículo
  getFilteredData<T extends { vehicleType?: string }>(data: T[]): T[] {
    if (!this.filters.vehicleType || this.filters.vehicleType === 'ALL') {
      return data;
    }
    return data.filter(item => item.vehicleType === this.filters.vehicleType);
  }

  private createCharts(): void {
    if (!this.dashboardData) return;

    this.createRevenueByVehicleChart();
    this.createDailyRevenueChart();
    this.createPeakHoursChart();
    this.createWeeklyPatternChart();
    this.createRotationRateChart();
  }

  private createRevenueByVehicleChart(): void {
    const canvas = document.getElementById('revenueByVehicleChart') as HTMLCanvasElement;
    if (!canvas || !this.dashboardData) return;

    const data = this.getFilteredData(this.dashboardData.revenueByVehicleType);
    
    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.tipo_descripcion),
        datasets: [{
          data: data.map(d => parseFloat(d.ingresos_totales)),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(251, 146, 60, 0.8)'
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(251, 146, 60, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#374151', font: { size: 12 } }
          },
          title: {
            display: true,
            text: 'Ingresos por Tipo de Vehículo',
            color: '#1f2937',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed;
                const total = data.reduce((sum, d) => sum + parseFloat(d.ingresos_totales), 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value.toLocaleString()} (${percentage}%)`;
              }
            }
          },
          datalabels: {
            color: '#000',
            font: {
              weight: 'bold',
              size: 14
            },
            formatter: (value, context) => {
              const total = data.reduce((sum, d) => sum + parseFloat(d.ingresos_totales), 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${percentage}%\n${value.toLocaleString()}`;
            }
          }
        }
      }
    };

    this.charts.set('revenueByVehicle', new Chart(canvas, config));
  }

  private createDailyRevenueChart(): void {
    const canvas = document.getElementById('dailyRevenueChart') as HTMLCanvasElement;
    if (!canvas || !this.dashboardData) return;

    const data = this.dashboardData.dailyRevenueTrend.sort((a, b) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: data.map(d => new Date(d.fecha).toLocaleDateString('es-ES', { 
          month: 'short', 
          day: 'numeric' 
        })),
        datasets: [{
          label: 'Ingresos Diarios',
          data: data.map(d => parseFloat(d.ingresos)),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Tendencia de Ingresos Diarios',
            color: '#1f2937',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                return value !== null ? `Ingresos: $${value.toLocaleString()}` : '';
              }
            }
          },
          datalabels: {
            anchor: 'end',
            align: 'top',
            color: '#1f2937',
            font: {
              weight: 'bold',
              size: 11
            },
            formatter: (value) => value ? `$${(value as number).toLocaleString()}` : ''
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `$${value}`
            }
          }
        }
      }
    };

    this.charts.set('dailyRevenue', new Chart(canvas, config));
  }

  private createPeakHoursChart(): void {
    const canvas = document.getElementById('peakHoursChart') as HTMLCanvasElement;
    if (!canvas || !this.dashboardData) return;

    const data = this.dashboardData.peakHours.sort((a, b) => a.hora - b.hora);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: data.map(d => `${d.hora}:00`),
        datasets: [{
          label: 'Ingresos por Hora',
          data: data.map(d => parseFloat(d.ingresos_hora)),
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Horas Pico de Ingresos',
            color: '#1f2937',
            font: { size: 16, weight: 'bold' }
          },
          datalabels: {
            anchor: 'end',
            align: 'top',
            color: '#1f2937',
            font: {
              weight: 'bold',
              size: 11
            },
            formatter: (value) => `${value.toLocaleString()}`
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `${value}`
            }
          }
        }
      }
    };

    this.charts.set('peakHours', new Chart(canvas, config));
  }

  private createWeeklyPatternChart(): void {
    const canvas = document.getElementById('weeklyPatternChart') as HTMLCanvasElement;
    if (!canvas || !this.dashboardData) return;

    const data = this.dashboardData.weeklyPattern.sort((a, b) => a.num_dia - b.num_dia);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.map(d => d.dia_semana.substring(0, 3)),
        datasets: [{
          label: 'Ingresos',
          data: data.map(d => parseFloat(d.ingresos_totales)),
          borderColor: 'rgba(251, 146, 60, 1)',
          backgroundColor: 'rgba(251, 146, 60, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointBackgroundColor: 'rgba(251, 146, 60, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Patrón Semanal de Ingresos',
            color: '#1f2937',
            font: { size: 16, weight: 'bold' }
          },
          datalabels: {
            align: 'top',
            color: '#1f2937',
            font: {
              weight: 'bold',
              size: 11
            },
            formatter: (value) => `${value.toLocaleString()}`
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `${value}`
            }
          }
        }
      }
    };

    this.charts.set('weeklyPattern', new Chart(canvas, config));
  }

  private createRotationRateChart(): void {
    const canvas = document.getElementById('rotationRateChart') as HTMLCanvasElement;
    if (!canvas || !this.dashboardData) return;

    // Agrupar por tipo de vehículo y sumar rotaciones
    const groupedData = this.dashboardData.rotationRate.reduce((acc, curr) => {
      if (!acc[curr.vehicleType]) {
        acc[curr.vehicleType] = {
          tipo: curr.tipo_descripcion,
          rotaciones: 0,
          ingresos: 0
        };
      }
      acc[curr.vehicleType].rotaciones += curr.rotaciones;
      acc[curr.vehicleType].ingresos += parseFloat(curr.ingresos_dia);
      return acc;
    }, {} as Record<string, { tipo: string; rotaciones: number; ingresos: number }>);

    const chartData = Object.values(groupedData);

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: chartData.map(d => d.tipo),
        datasets: [{
          data: chartData.map(d => d.rotaciones),
          backgroundColor: [
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(34, 197, 94, 0.8)'
          ],
          borderColor: [
            'rgba(139, 92, 246, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(34, 197, 94, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#374151', font: { size: 12 } }
          },
          title: {
            display: true,
            text: 'Tasa de Rotación por Tipo',
            color: '#1f2937',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = chartData.reduce((sum, d) => sum + d.rotaciones, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} rotaciones (${percentage}%)`;
              }
            }
          },
          datalabels: {
            color: '#000',
            font: {
              weight: 'bold',
              size: 14
            },
            formatter: (value, context) => {
              if (!value) return '';
              const total = chartData.reduce((sum, d) => sum + d.rotaciones, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${percentage}%\n${value}`;
            }
          }
        }
      }
    };

    this.charts.set('rotationRate', new Chart(canvas, config));
  }

  private destroyAllCharts(): void {
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();
  }

  private getDefaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }

  private getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Helpers para template
  formatCurrency(value: string | number): string {
    return `$${parseFloat(value.toString()).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;
  }

  formatNumber(value: number): string {
    return value.toLocaleString('es-CO');
  }

  formatPercentage(value: string | number): string {
    return `${parseFloat(value.toString()).toFixed(1)}%`;
  }

  formatDecimal(value: string | number, decimals: number = 1): string {
    return parseFloat(value.toString()).toFixed(decimals);
  }

  async exportToPDFBySections(): Promise<void> {
    try {
      this.showLoadingIndicator('Generando PDF...');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      let currentY = 10;

      // Título del reporte
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Insights & Analytics', pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Período: ${this.filters.startDate} - ${this.filters.endDate}`,
        pageWidth / 2,
        currentY,
        { align: 'center' }
      );

      currentY += 15;

      // Capturar KPIs
      const kpisElement = document.querySelector('.kpis-grid') as HTMLElement;
      if (kpisElement) {
        const kpisCanvas = await html2canvas(kpisElement, {
          scale: 2,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        const kpisImgHeight = (kpisCanvas.height * pageWidth) / kpisCanvas.width;
        
        if (currentY + kpisImgHeight > pageHeight - 10) {
          pdf.addPage();
          currentY = 10;
        }
        
        pdf.addImage(
          kpisCanvas.toDataURL('image/png'),
          'PNG',
          5,
          currentY,
          pageWidth - 10,
          kpisImgHeight
        );
        
        currentY += kpisImgHeight + 10;
      }

      // Capturar cada gráfico individualmente
      const chartCards = document.querySelectorAll('.chart-card');
      
      for (let i = 0; i < chartCards.length; i++) {
        const chartElement = chartCards[i] as HTMLElement;
        
        const chartCanvas = await html2canvas(chartElement, {
          scale: 2,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        const chartImgWidth = pageWidth - 10;
        const chartImgHeight = (chartCanvas.height * chartImgWidth) / chartCanvas.width;
        
        // Si no cabe en la página actual, crear una nueva
        if (currentY + chartImgHeight > pageHeight - 10) {
          pdf.addPage();
          currentY = 10;
        }
        
        pdf.addImage(
          chartCanvas.toDataURL('image/png'),
          'PNG',
          5,
          currentY,
          chartImgWidth,
          chartImgHeight
        );
        
        currentY += chartImgHeight + 10;
      }

      // Guardar PDF
      pdf.save(`insights-${this.formatDate(new Date())}.pdf`);
      this.hideLoadingIndicator();

    } catch (error) {
      console.error('Error:', error);
      this.hideLoadingIndicator();
      alert('Error al generar PDF');
    }
  }

  // Métodos auxiliares
  private showLoadingIndicator(message: string): void {
    const loader = document.createElement('div');
    loader.id = 'pdf-loader';
    loader.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      ">
        <div style="
          background: white;
          padding: 30px 50px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        ">
          <div style="
            width: 50px;
            height: 50px;
            border: 5px solid #f3f4f6;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          "></div>
          <p style="
            margin: 0;
            font-size: 16px;
            color: #1f2937;
            font-weight: 600;
          ">${message}</p>
        </div>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(loader);
  }

  private hideLoadingIndicator(): void {
    const loader = document.getElementById('pdf-loader');
    if (loader) {
      document.body.removeChild(loader);
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}