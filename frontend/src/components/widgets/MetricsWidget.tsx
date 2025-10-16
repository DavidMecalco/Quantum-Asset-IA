import React, { useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Users, 
  Server, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Wifi,
  HardDrive
} from 'lucide-react';
import { WidgetContainer } from '../layout/WidgetContainer';
import { WidgetProps, WidgetType } from '../../types/widgets';
import { useSystemMetrics } from '../../hooks/useDashboardData';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types/auth';
import { SystemMetrics } from '../../types/dashboard';

// Props específicas para MetricsWidget
interface MetricsWidgetProps extends WidgetProps {
  showTrends?: boolean;
  showAlerts?: boolean;
  compactMode?: boolean;
}

// Función para obtener color según el valor de métrica
const getMetricColor = (value: number, thresholds: { warning: number; critical: number }): string => {
  if (value >= thresholds.critical) return 'text-red-400';
  if (value >= thresholds.warning) return 'text-yellow-400';
  return 'text-green-400';
};

// Función para obtener color de fondo según el valor de métrica
const getMetricBgColor = (value: number, thresholds: { warning: number; critical: number }): string => {
  if (value >= thresholds.critical) return 'bg-red-500/20';
  if (value >= thresholds.warning) return 'bg-yellow-500/20';
  return 'bg-green-500/20';
};

// Función para formatear números
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};



// Función para formatear latencia
const formatLatency = (ms: number): string => {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms.toFixed(0)}ms`;
};

// Componente de métrica individual
const MetricCard: React.FC<{
  title: string;
  value: number;
  unit?: string;
  icon: React.ReactNode;
  thresholds: { warning: number; critical: number };
  formatter?: (value: number) => string;
  showProgress?: boolean;
  compactMode?: boolean;
}> = ({ 
  title, 
  value, 
  unit = '%', 
  icon, 
  thresholds, 
  formatter,
  showProgress = true,
  compactMode = false 
}) => {
  const color = getMetricColor(value, thresholds);
  const bgColor = getMetricBgColor(value, thresholds);
  const formattedValue = formatter ? formatter(value) : `${value.toFixed(1)}${unit}`;

  if (compactMode) {
    return (
      <div className="text-center">
        <div className={`flex items-center justify-center w-6 h-6 ${bgColor} rounded mx-auto mb-1`}>
          <div className={`${color}`}>
            {icon}
          </div>
        </div>
        <p className={`text-sm font-semibold ${color}`}>{formattedValue}</p>
        <p className="text-xs text-glass-300 truncate">{title}</p>
      </div>
    );
  }

  return (
    <div className="bg-glass-100 rounded-lg p-3">
      <div className="flex items-center space-x-2 mb-2">
        <div className={`${color}`}>
          {icon}
        </div>
        <span className="text-sm text-glass-200 truncate">{title}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{formattedValue}</p>
      {showProgress && unit === '%' && (
        <div className="w-full bg-glass-200 rounded-full h-2 mt-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              value >= thresholds.critical ? 'bg-red-400' :
              value >= thresholds.warning ? 'bg-yellow-400' : 'bg-green-400'
            }`}
            style={{ width: `${Math.min(value, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

// Componente de gráfico de tendencias simple
const TrendChart: React.FC<{
  title: string;
  data: number[];
  labels: string[];
  color: string;
  compactMode?: boolean;
}> = ({ title, data, labels, color, compactMode = false }) => {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  if (compactMode) {
    return (
      <div className="bg-glass-100 rounded-lg p-2">
        <h4 className="text-xs font-medium text-glass-200 mb-1">{title}</h4>
        <div className="flex items-end space-x-1 h-8">
          {data.slice(-6).map((value, index) => {
            const height = ((value - minValue) / range) * 100;
            return (
              <div
                key={index}
                className={`flex-1 ${color} rounded-sm min-h-[2px]`}
                style={{ height: `${Math.max(height, 10)}%` }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-glass-100 rounded-lg p-3">
      <h4 className="text-sm font-medium text-glass-200 mb-3">{title}</h4>
      <div className="flex items-end space-x-1 h-16">
        {data.map((value, index) => {
          const height = ((value - minValue) / range) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full ${color} rounded-sm transition-all duration-300 min-h-[2px]`}
                style={{ height: `${Math.max(height, 5)}%` }}
              />
              <span className="text-xs text-glass-400 mt-1 truncate">
                {labels[index]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Componente de alertas de métricas
const MetricsAlerts: React.FC<{
  metrics: SystemMetrics;
  compactMode?: boolean;
}> = ({ metrics, compactMode = false }) => {
  const alerts = useMemo(() => {
    const alertList = [];
    
    if (metrics.cpuUsage >= 90) {
      alertList.push({
        id: 'cpu',
        type: 'error' as const,
        message: `CPU crítico (${metrics.cpuUsage.toFixed(1)}%)`,
        icon: <Activity className="w-4 h-4" />,
        priority: 'critical' as const
      });
    } else if (metrics.cpuUsage >= 80) {
      alertList.push({
        id: 'cpu',
        type: 'warning' as const,
        message: `CPU alto (${metrics.cpuUsage.toFixed(1)}%)`,
        icon: <Activity className="w-4 h-4" />,
        priority: 'high' as const
      });
    }
    
    if (metrics.memoryUsage >= 90) {
      alertList.push({
        id: 'memory',
        type: 'error' as const,
        message: `Memoria crítica (${metrics.memoryUsage.toFixed(1)}%)`,
        icon: <Database className="w-4 h-4" />,
        priority: 'critical' as const
      });
    } else if (metrics.memoryUsage >= 80) {
      alertList.push({
        id: 'memory',
        type: 'warning' as const,
        message: `Memoria alta (${metrics.memoryUsage.toFixed(1)}%)`,
        icon: <Database className="w-4 h-4" />,
        priority: 'high' as const
      });
    }
    
    if (metrics.diskUsage >= 95) {
      alertList.push({
        id: 'disk',
        type: 'error' as const,
        message: `Disco crítico (${metrics.diskUsage.toFixed(1)}%)`,
        icon: <HardDrive className="w-4 h-4" />,
        priority: 'critical' as const
      });
    } else if (metrics.diskUsage >= 85) {
      alertList.push({
        id: 'disk',
        type: 'warning' as const,
        message: `Disco alto (${metrics.diskUsage.toFixed(1)}%)`,
        icon: <HardDrive className="w-4 h-4" />,
        priority: 'high' as const
      });
    }
    
    if (metrics.networkLatency >= 1000) {
      alertList.push({
        id: 'network',
        type: 'error' as const,
        message: `Latencia crítica (${formatLatency(metrics.networkLatency)})`,
        icon: <Wifi className="w-4 h-4" />,
        priority: 'critical' as const
      });
    } else if (metrics.networkLatency >= 500) {
      alertList.push({
        id: 'network',
        type: 'warning' as const,
        message: `Latencia alta (${formatLatency(metrics.networkLatency)})`,
        icon: <Wifi className="w-4 h-4" />,
        priority: 'high' as const
      });
    }
    
    if (metrics.errorRate >= 5) {
      alertList.push({
        id: 'errors',
        type: 'error' as const,
        message: `Tasa de errores alta (${metrics.errorRate.toFixed(1)}%)`,
        icon: <AlertTriangle className="w-4 h-4" />,
        priority: 'critical' as const
      });
    }
    
    return alertList;
  }, [metrics]);

  if (alerts.length === 0) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="flex items-center space-x-2 text-green-400">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Métricas normales</span>
        </div>
      </div>
    );
  }

  if (compactMode) {
    const criticalCount = alerts.filter(a => a.priority === 'critical').length;
    const warningCount = alerts.filter(a => a.priority === 'high').length;
    
    return (
      <div className="flex items-center justify-center space-x-3">
        {criticalCount > 0 && (
          <div className="flex items-center space-x-1 text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">{criticalCount}</span>
          </div>
        )}
        {warningCount > 0 && (
          <div className="flex items-center space-x-1 text-yellow-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">{warningCount}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-glass-200 mb-2">Alertas de Rendimiento</h4>
      {alerts.slice(0, 3).map((alert) => (
        <div 
          key={alert.id}
          className={`flex items-center space-x-3 p-2 rounded-lg border ${
            alert.type === 'error' 
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
          }`}
        >
          <div className="flex-shrink-0">
            {alert.icon}
          </div>
          <p className="text-sm flex-1">{alert.message}</p>
        </div>
      ))}
      {alerts.length > 3 && (
        <p className="text-xs text-glass-400 text-center">
          +{alerts.length - 3} alertas más
        </p>
      )}
    </div>
  );
};

// Componente principal MetricsWidget
export const MetricsWidget: React.FC<MetricsWidgetProps> = ({
  id,
  size,
  isLoading: propIsLoading = false,
  error: propError = null,
  onRefresh,
  onResize,
  onRemove,
  className = '',
  showTrends = true,
  showAlerts = true,
  compactMode = false
}) => {
  const { user } = useAuthStore();
  
  // Verificar si el usuario es administrador
  const isAdmin = user?.role === UserRole.ADMIN;
  
  // Usar el hook para obtener métricas del sistema
  const {
    data: systemMetrics,
    isLoading: queryIsLoading,
    isError,
    error: queryError,
    refresh
  } = useSystemMetrics({
    enabled: isAdmin, // Solo cargar si es admin
    refetchInterval: 60000 // Refresh cada minuto
  });

  // Combinar estados de loading y error
  const isLoading = propIsLoading || queryIsLoading;
  const error = propError || (isError ? queryError?.message || 'Error al cargar métricas del sistema' : null);

  // Crear widget state para el container
  const widgetState = {
    id,
    type: WidgetType.METRICS,
    size,
    position: { x: 0, y: 0, width: 2, height: 2 },
    isEnabled: true,
    isLoading,
    error,
    settings: {}
  };

  // Manejar refresh
  const handleRefresh = () => {
    refresh();
    onRefresh?.();
  };

  // Determinar si usar modo compacto basado en el tamaño
  const useCompactMode = compactMode || size === 'small';

  // Si no es admin, mostrar mensaje de acceso restringido
  if (!isAdmin) {
    return (
      <WidgetContainer
        widget={widgetState}
        title="Métricas del Sistema"
        subtitle="Solo administradores"
        icon={<BarChart3 className="w-4 h-4" />}
        onRefresh={handleRefresh}
        onResize={onResize}
        onRemove={onRemove}
        className={className}
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 bg-glass-100 rounded-full flex items-center justify-center mb-4">
            <Server className="w-8 h-8 text-glass-400" />
          </div>
          <p className="text-glass-300 mb-2">Acceso Restringido</p>
          <p className="text-sm text-glass-400">
            Las métricas del sistema solo están disponibles para administradores
          </p>
        </div>
      </WidgetContainer>
    );
  }

  // Datos por defecto si no hay métricas
  const defaultMetrics: SystemMetrics = {
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkLatency: 0,
    activeConnections: 0,
    errorRate: 0,
    throughput: 0,
    responseTime: 0,
    timestamp: new Date()
  };

  const currentMetrics = systemMetrics || defaultMetrics;

  // Datos simulados para tendencias (en producción vendrían de la API)
  const trendData = useMemo(() => ({
    cpu: {
      data: [45, 52, 48, 61, 55, 67, currentMetrics.cpuUsage],
      labels: ['6h', '5h', '4h', '3h', '2h', '1h', 'Ahora']
    },
    memory: {
      data: [62, 58, 65, 70, 68, 72, currentMetrics.memoryUsage],
      labels: ['6h', '5h', '4h', '3h', '2h', '1h', 'Ahora']
    },
    network: {
      data: [120, 95, 110, 85, 92, 105, currentMetrics.networkLatency],
      labels: ['6h', '5h', '4h', '3h', '2h', '1h', 'Ahora']
    }
  }), [currentMetrics]);

  // Umbrales para las métricas
  const thresholds = {
    cpu: { warning: 70, critical: 85 },
    memory: { warning: 75, critical: 90 },
    disk: { warning: 80, critical: 95 },
    network: { warning: 200, critical: 500 },
    errors: { warning: 2, critical: 5 }
  };

  return (
    <WidgetContainer
      widget={widgetState}
      title="Métricas del Sistema"
      subtitle={`Actualizado: ${currentMetrics.timestamp.toLocaleTimeString('es-ES')}`}
      icon={<BarChart3 className="w-4 h-4" />}
      onRefresh={handleRefresh}
      onResize={onResize}
      onRemove={onRemove}
      className={className}
    >
      <div className="h-full flex flex-col space-y-4">
        {/* Métricas principales */}
        <div className={useCompactMode ? "grid grid-cols-2 gap-2" : "grid grid-cols-2 gap-3"}>
          <MetricCard
            title="CPU"
            value={currentMetrics.cpuUsage}
            icon={<Activity className="w-4 h-4" />}
            thresholds={thresholds.cpu}
            compactMode={useCompactMode}
          />
          
          <MetricCard
            title="Memoria"
            value={currentMetrics.memoryUsage}
            icon={<Database className="w-4 h-4" />}
            thresholds={thresholds.memory}
            compactMode={useCompactMode}
          />
          
          {!useCompactMode && (
            <>
              <MetricCard
                title="Disco"
                value={currentMetrics.diskUsage}
                icon={<HardDrive className="w-4 h-4" />}
                thresholds={thresholds.disk}
                compactMode={useCompactMode}
              />
              
              <MetricCard
                title="Latencia"
                value={currentMetrics.networkLatency}
                unit="ms"
                icon={<Wifi className="w-4 h-4" />}
                thresholds={thresholds.network}
                formatter={formatLatency}
                showProgress={false}
                compactMode={useCompactMode}
              />
            </>
          )}
        </div>

        {/* Métricas adicionales */}
        {!useCompactMode && (
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-500/20 rounded-lg mx-auto mb-1">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-lg font-semibold text-white">{formatNumber(currentMetrics.activeConnections)}</p>
              <p className="text-xs text-glass-300">Conexiones</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-500/20 rounded-lg mx-auto mb-1">
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-lg font-semibold text-white">
                {currentMetrics.throughput ? formatNumber(currentMetrics.throughput) : 'N/A'}
              </p>
              <p className="text-xs text-glass-300">Req/min</p>
            </div>
            
            <div className="text-center">
              <div className={`flex items-center justify-center w-8 h-8 ${getMetricBgColor(currentMetrics.errorRate, thresholds.errors)} rounded-lg mx-auto mb-1`}>
                <AlertTriangle className={`w-4 h-4 ${getMetricColor(currentMetrics.errorRate, thresholds.errors)}`} />
              </div>
              <p className={`text-lg font-semibold ${getMetricColor(currentMetrics.errorRate, thresholds.errors)}`}>
                {currentMetrics.errorRate.toFixed(1)}%
              </p>
              <p className="text-xs text-glass-300">Errores</p>
            </div>
          </div>
        )}

        {/* Gráficos de tendencias */}
        {showTrends && size === 'large' && (
          <div className="grid grid-cols-1 gap-3 flex-1">
            <TrendChart
              title="Tendencia CPU (6h)"
              data={trendData.cpu.data}
              labels={trendData.cpu.labels}
              color="bg-blue-400"
              compactMode={useCompactMode}
            />
            
            <TrendChart
              title="Tendencia Memoria (6h)"
              data={trendData.memory.data}
              labels={trendData.memory.labels}
              color="bg-purple-400"
              compactMode={useCompactMode}
            />
          </div>
        )}

        {/* Alertas de métricas */}
        {showAlerts && (
          <div className="flex-1">
            <MetricsAlerts
              metrics={currentMetrics}
              compactMode={useCompactMode}
            />
          </div>
        )}

        {/* Información de tiempo de respuesta */}
        {!useCompactMode && currentMetrics.responseTime && (
          <div className="mt-auto">
            <div className="bg-glass-100 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-glass-300" />
                <span className="text-sm text-glass-200">Tiempo de respuesta promedio</span>
              </div>
              <span className="text-sm font-medium text-white">
                {formatLatency(currentMetrics.responseTime)}
              </span>
            </div>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};

export default MetricsWidget;