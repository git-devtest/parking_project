// src/app/interfaces/insights.ts

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  datasets: T;
}

export interface ExecutiveSummary {
  dataset_type: string;
  dias_operativos: number;
  total_servicios: number;
  ingresos_totales: string;
  ticket_promedio: string;
  duracion_promedio_min: string;
  horas_vendidas_totales: string;
  vehiculos_unicos: number;
}

export interface RevenueByVehicleType {
  dataset_type: string;
  vehicleType: string;
  tipo_descripcion: string;
  total_servicios: number;
  ingresos_totales: string;
  ingreso_promedio: string;
  porcentaje_ingresos: string;
  duracion_promedio_min: string;
}

export interface DailyRevenueTrend {
  dataset_type: string;
  fecha: string;
  dia_semana: string;
  servicios: number;
  ingresos: string;
  duracion_promedio: string;
  vehiculos_unicos: number;
}

export interface PeakHour {
  dataset_type: string;
  hora: number;
  total_ingresos: number;
  ingresos_hora: string;
  duracion_promedio: string;
  autos: number;
  motos: number;
  camiones: number;
}

export interface CurrentOccupancyDashboard {
  dataset_type: string;
  vehicleType: string;
  tipo_descripcion: string;
  capacidad_maxima: number;
  espacios_ocupados: number;
  espacios_disponibles: number;
  porcentaje_ocupacion: string;
  tarifa_hora: string;
  tarifa_dia: string;
}

export interface CurrentOccupancy {
  vehicleType: string;
  tipo_descripcion: string;
  maxCapacity: number;
  currentCount: number;
  availableSpaces: number;
  occupancyPercentage: string;
}

export interface FrequentCustomer {
  dataset_type: string;
  placa: string;
  tipo_vehiculo: string;
  numero_visitas: number;
  gasto_total: string;
  gasto_promedio_visita: string;
  duracion_promedio_min: string;
  primera_visita: string;
  ultima_visita: string;
  dias_cliente: number;
}

export interface WeeklyPattern {
  dataset_type: string;
  dia_semana: string;
  num_dia: number;
  total_servicios: number;
  ingresos_totales: string;
  ingreso_promedio: string;
  duracion_promedio: string;
}

export interface RotationRate {
  dataset_type: string;
  fecha: string;
  vehicleType: string;
  tipo_descripcion: string;
  rotaciones: number;
  capacidad: number;
  tasa_rotacion_diaria: string;
  ingresos_dia: string;
}

export interface PeriodComparison {
  dataset_type: string;
  vehicleType: string;
  ingresos_periodo_actual: string;
  ingresos_periodo_anterior: string;
  servicios_actual: number;
  servicios_anterior: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface DashboardData {
  executiveSummary: ExecutiveSummary;
  revenueByVehicleType: RevenueByVehicleType[];
  dailyRevenueTrend: DailyRevenueTrend[];
  peakHours: PeakHour[];
  currentOccupancy: CurrentOccupancyDashboard[];
  frequentCustomers: FrequentCustomer[];
  weeklyPattern: WeeklyPattern[];
  rotationRate: RotationRate[];
  periodComparison: PeriodComparison[];
  dateRange: DateRange;
}

export interface CurrentlyParkedVehicle {
  plateNumber: string;
  vehicleType: string;
  entryTime: string;
  minutes_parked: number;
  vehicle_type_description: string;
  hours_parked: string;
}

// Filtros
export interface InsightsFilters {
  startDate: string;
  endDate: string;
  vehicleType: string | null; // 'ALL', 'CAR', 'MOTORCYCLE', 'TRUCK'
}

export type VehicleType = 'ALL' | 'CAR' | 'MOTORCYCLE' | 'TRUCK';

export const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: 'ALL', label: 'Todos los vehículos' },
  { value: 'CAR', label: 'Automóviles' },
  { value: 'MOTORCYCLE', label: 'Motocicletas' },
  { value: 'TRUCK', label: 'Camiones' }
];