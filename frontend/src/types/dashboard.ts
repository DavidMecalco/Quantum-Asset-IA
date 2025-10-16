/**
 * Tipos para el sistema de dashboard
 */
import { Notification } from './notifications';

// Enums para estados y prioridades
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export enum SystemPerformance {
  GOOD = 'good',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

// Interfaces principales del dashboard
export interface SystemStatus {
  isConnected: boolean;
  lastSync: Date;
  performance: SystemPerformance;
  activeUsers: number;
  systemLoad: number;
  version?: string;
  uptime?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate: Date;
  status: TaskStatus;
  assignedTo: string;
  workOrderNumber?: string;
  estimatedHours?: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  activeConnections: number;
  errorRate: number;
  throughput?: number;
  responseTime?: number;
  timestamp: Date;
}

// Datos principales del dashboard
export interface DashboardData {
  systemStatus: SystemStatus;
  userTasks: Task[];
  notifications: Notification[];
  metrics?: SystemMetrics;
  lastUpdated: Date;
}

// Configuración del dashboard
export interface DashboardConfig {
  userId: string;
  enabledWidgets: string[];
  widgetOrder: string[];
  widgetSizes: Record<string, WidgetSize>;
  refreshInterval: number;
  theme?: 'light' | 'dark' | 'auto';
  compactMode?: boolean;
}

// Tipos para widgets
export type WidgetSize = 'small' | 'medium' | 'large';

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Estados de carga y error
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastFetch?: Date;
}

// Respuestas de API
export interface DashboardApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: Date;
}

// Filtros y búsqueda
export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignedTo?: string[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
  searchTerm?: string;
}

export interface DashboardFilters {
  tasks?: TaskFilters;
  dateRange?: {
    from: Date;
    to: Date;
  };
}