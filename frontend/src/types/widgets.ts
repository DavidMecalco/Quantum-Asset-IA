/**
 * Tipos para el sistema de widgets
 */
import { UserRole } from './auth';

// Enums para widgets
export enum WidgetType {
  WELCOME = 'welcome',
  SYSTEM_STATUS = 'system_status',
  TASKS = 'tasks',
  METRICS = 'metrics',
  QUICK_ACTIONS = 'quick_actions',
  NOTIFICATIONS = 'notifications',
  WEATHER = 'weather'
}

export enum WidgetSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

// Configuración base de widget
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  name: string;
  description?: string;
  component: React.ComponentType<WidgetProps>;
  defaultSize: WidgetSize;
  minSize: WidgetSize;
  maxSize?: WidgetSize;
  requiredRole?: UserRole[];
  refreshInterval?: number;
  isOptional: boolean;
  isResizable?: boolean;
  isDraggable?: boolean;
  category?: string;
  icon?: string;
}

// Props base para todos los widgets
export interface WidgetProps {
  id: string;
  size: WidgetSize;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onResize?: (size: WidgetSize) => void;
  onRemove?: () => void;
  className?: string;
}

// Estado de un widget individual
export interface WidgetState {
  id: string;
  type: WidgetType;
  size: WidgetSize;
  position: WidgetPosition;
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated?: Date;
  data?: any;
  settings?: Record<string, any>;
}

// Posición y dimensiones del widget
export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
}

// Layout del grid de widgets
export interface WidgetLayout {
  id: string;
  widgets: WidgetState[];
  columns: number;
  rowHeight: number;
  margin: [number, number];
  containerPadding: [number, number];
  breakpoints: Record<string, number>;
  cols: Record<string, number>;
}

// Configuración específica por tipo de widget
export interface WelcomeWidgetData {
  userName: string;
  lastLogin?: Date;
  greeting: string;
  recentActivity?: {
    action: string;
    timestamp: Date;
    description: string;
  }[];
}

export interface SystemStatusWidgetData {
  isConnected: boolean;
  performance: 'good' | 'warning' | 'critical';
  lastSync: Date;
  activeUsers: number;
  systemLoad: number;
  alerts?: {
    id: string;
    type: 'info' | 'warning' | 'error';
    message: string;
    timestamp: Date;
  }[];
}

export interface TasksWidgetData {
  totalTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completedToday: number;
  recentTasks: {
    id: string;
    title: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    dueDate: Date;
    status: string;
  }[];
}

export interface MetricsWidgetData {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  activeConnections: number;
  errorRate: number;
  trends?: {
    period: string;
    values: number[];
    labels: string[];
  };
}

export interface QuickActionsWidgetData {
  actions: {
    id: string;
    label: string;
    icon: string;
    url: string;
    description?: string;
    isExternal?: boolean;
    requiredRole?: UserRole[];
  }[];
}

export interface NotificationsWidgetData {
  totalCount: number;
  unreadCount: number;
  recentNotifications: {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: Date;
    isRead: boolean;
    actionUrl?: string;
  }[];
}

// Configuración de personalización
export interface WidgetCustomization {
  userId: string;
  widgetId: string;
  settings: {
    refreshInterval?: number;
    displayOptions?: Record<string, any>;
    filters?: Record<string, any>;
    theme?: 'light' | 'dark';
    compactMode?: boolean;
  };
  updatedAt: Date;
}

// Eventos de widgets
export interface WidgetEvent {
  type: 'refresh' | 'resize' | 'move' | 'remove' | 'configure';
  widgetId: string;
  payload?: any;
  timestamp: Date;
}

// Registro de widgets disponibles
export interface WidgetRegistry {
  [key: string]: WidgetConfig;
}

// Configuración del grid responsivo
export interface ResponsiveBreakpoint {
  breakpoint: string;
  cols: number;
  margin: [number, number];
  containerPadding: [number, number];
}

export interface GridConfig {
  breakpoints: ResponsiveBreakpoint[];
  rowHeight: number;
  maxRows?: number;
  isDraggable: boolean;
  isResizable: boolean;
  preventCollision?: boolean;
  compactType?: 'vertical' | 'horizontal' | null;
}