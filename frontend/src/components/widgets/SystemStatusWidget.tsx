import React, { useMemo } from 'react';
import { 
  Server, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity,
  Users,
  Clock,
  Zap,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { WidgetContainer } from '../layout/WidgetContainer';
import { WidgetProps, WidgetType } from '../../types/widgets';
import { useSystemStatus } from '../../hooks/useDashboardData';
import { SystemPerformance } from '../../types/dashboard';

// Props específicas para SystemStatusWidget
interface SystemStatusWidgetProps extends WidgetProps {
  showMetrics?: boolean;
  showAlerts?: boolean;
  compactMode?: boolean;
}

// Función para obtener color según el performance
const getPerformanceColor = (performance: SystemPerformance): string => {
  switch (performance) {
    case SystemPerformance.GOOD:
      return 'text-green-400';
    case SystemPerformance.WARNING:
      return 'text-yellow-400';
    case SystemPerformance.CRITICAL:
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

// Función para obtener color de fondo según el performance
const getPerformanceBgColor = (performance: SystemPerformance): string => {
  switch (performance) {
    case SystemPerformance.GOOD:
      return 'bg-green-500/20';
    case SystemPerformance.WARNING:
      return 'bg-yellow-500/20';
    case SystemPerformance.CRITICAL:
      return 'bg-red-500/20';
    default:
      return 'bg-gray-500/20';
  }
};

// Función para obtener icono según el performance
const getPerformanceIcon = (performance: SystemPerformance, isConnected: boolean) => {
  if (!isConnected) {
    return <XCircle className="w-5 h-5 text-red-400" />;
  }
  
  switch (performance) {
    case SystemPerformance.GOOD:
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    case SystemPerformance.WARNING:
      return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    case SystemPerformance.CRITICAL:
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    default:
      return <Server className="w-5 h-5 text-gray-400" />;
  }
};

// Función para obtener texto de estado
const getStatusText = (performance: SystemPerformance, isConnected: boolean): string => {
  if (!isConnected) {
    return 'Desconectado';
  }
  
  switch (performance) {
    case SystemPerformance.GOOD:
      return 'Operativo';
    case SystemPerformance.WARNING:
      return 'Advertencia';
    case SystemPerformance.CRITICAL:
      return 'Crítico';
    default:
      return 'Desconocido';
  }
};

// Función para formatear tiempo de sincronización
const formatLastSync = (lastSync: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Ahora mismo';
  if (diffInMinutes === 1) return 'Hace 1 minuto';
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours === 1) return 'Hace 1 hora';
  if (diffInHours < 24) return `Hace ${diffInHours} horas`;
  
  return lastSync.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Componente de indicador de conectividad
const ConnectivityIndicator: React.FC<{
  isConnected: boolean;
  lastSync: Date;
  compactMode?: boolean;
}> = ({ isConnected, lastSync, compactMode = false }) => {
  return (
    <div className="flex items-center space-x-2">
      {isConnected ? (
        <Wifi className="w-4 h-4 text-green-400" />
      ) : (
        <WifiOff className="w-4 h-4 text-red-400" />
      )}
      <div className="flex-1">
        <p className={`font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
          {isConnected ? 'Conectado' : 'Sin conexión'}
        </p>
        {!compactMode && (
          <p className="text-xs text-glass-400">
            Última sync: {formatLastSync(lastSync)}
          </p>
        )}
      </div>
    </div>
  );
};

// Componente de métricas del sistema
const SystemMetrics: React.FC<{
  activeUsers: number;
  systemLoad: number;
  uptime?: number;
  version?: string;
  compactMode?: boolean;
}> = ({ activeUsers, systemLoad, uptime, version, compactMode = false }) => {
  const formatUptime = (uptimeSeconds?: number): string => {
    if (!uptimeSeconds) return 'N/A';
    
    const days = Math.floor(uptimeSeconds / (24 * 60 * 60));
    const hours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return '< 1h';
  };

  const getLoadColor = (load: number): string => {
    if (load >= 80) return 'text-red-400';
    if (load >= 60) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getLoadBgColor = (load: number): string => {
    if (load >= 80) return 'bg-red-500/20';
    if (load >= 60) return 'bg-yellow-500/20';
    return 'bg-green-500/20';
  };

  if (compactMode) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div className="text-center">
          <div className="flex items-center justify-center w-6 h-6 bg-blue-500/20 rounded mx-auto mb-1">
            <Users className="w-3 h-3 text-blue-400" />
          </div>
          <p className="text-sm font-semibold text-white">{activeUsers}</p>
          <p className="text-xs text-glass-300">Usuarios</p>
        </div>
        
        <div className="text-center">
          <div className={`flex items-center justify-center w-6 h-6 ${getLoadBgColor(systemLoad)} rounded mx-auto mb-1`}>
            <Activity className={`w-3 h-3 ${getLoadColor(systemLoad)}`} />
          </div>
          <p className={`text-sm font-semibold ${getLoadColor(systemLoad)}`}>{systemLoad}%</p>
          <p className="text-xs text-glass-300">Carga</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-glass-100 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-glass-200">Usuarios Activos</span>
          </div>
          <p className="text-xl font-bold text-white">{activeUsers}</p>
        </div>
        
        <div className="bg-glass-100 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className={`w-4 h-4 ${getLoadColor(systemLoad)}`} />
            <span className="text-sm text-glass-200">Carga del Sistema</span>
          </div>
          <p className={`text-xl font-bold ${getLoadColor(systemLoad)}`}>{systemLoad}%</p>
          <div className="w-full bg-glass-200 rounded-full h-2 mt-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                systemLoad >= 80 ? 'bg-red-400' :
                systemLoad >= 60 ? 'bg-yellow-400' : 'bg-green-400'
              }`}
              style={{ width: `${Math.min(systemLoad, 100)}%` }}
            />
          </div>
        </div>
      </div>
      
      {(uptime !== undefined || version) && (
        <div className="grid grid-cols-2 gap-3">
          {uptime !== undefined && (
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-500/20 rounded-lg mx-auto mb-1">
                <Clock className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-sm font-semibold text-white">{formatUptime(uptime)}</p>
              <p className="text-xs text-glass-300">Uptime</p>
            </div>
          )}
          
          {version && (
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-indigo-500/20 rounded-lg mx-auto mb-1">
                <Zap className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-sm font-semibold text-white">{version}</p>
              <p className="text-xs text-glass-300">Versión</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Componente de alertas críticas
const CriticalAlerts: React.FC<{
  performance: SystemPerformance;
  isConnected: boolean;
  systemLoad: number;
  compactMode?: boolean;
}> = ({ performance, isConnected, systemLoad, compactMode = false }) => {
  const alerts = useMemo(() => {
    const alertList = [];
    
    if (!isConnected) {
      alertList.push({
        id: 'connection',
        type: 'error' as const,
        message: 'Sin conexión con Maximo',
        icon: <WifiOff className="w-4 h-4" />,
        priority: 'critical' as const
      });
    }
    
    if (performance === SystemPerformance.CRITICAL) {
      alertList.push({
        id: 'performance',
        type: 'error' as const,
        message: 'Rendimiento crítico del sistema',
        icon: <AlertCircle className="w-4 h-4" />,
        priority: 'critical' as const
      });
    } else if (performance === SystemPerformance.WARNING) {
      alertList.push({
        id: 'performance',
        type: 'warning' as const,
        message: 'Rendimiento degradado',
        icon: <AlertTriangle className="w-4 h-4" />,
        priority: 'high' as const
      });
    }
    
    if (systemLoad >= 90) {
      alertList.push({
        id: 'load',
        type: 'error' as const,
        message: `Carga del sistema muy alta (${systemLoad}%)`,
        icon: <TrendingUp className="w-4 h-4" />,
        priority: 'critical' as const
      });
    } else if (systemLoad >= 80) {
      alertList.push({
        id: 'load',
        type: 'warning' as const,
        message: `Carga del sistema alta (${systemLoad}%)`,
        icon: <TrendingUp className="w-4 h-4" />,
        priority: 'high' as const
      });
    }
    
    return alertList;
  }, [isConnected, performance, systemLoad]);

  if (alerts.length === 0) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="flex items-center space-x-2 text-green-400">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Sistema operativo</span>
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
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{criticalCount}</span>
          </div>
        )}
        {warningCount > 0 && (
          <div className="flex items-center space-x-1 text-yellow-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">{warningCount}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-glass-200 mb-2">Alertas del Sistema</h4>
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

// Componente principal SystemStatusWidget
export const SystemStatusWidget: React.FC<SystemStatusWidgetProps> = ({
  id,
  size,
  isLoading: propIsLoading = false,
  error: propError = null,
  onRefresh,
  onResize,
  onRemove,
  className = '',
  showMetrics = true,
  showAlerts = true,
  compactMode = false
}) => {
  // Usar el hook para obtener datos del sistema
  const {
    data: systemStatus,
    isLoading: queryIsLoading,
    isError,
    error: queryError,
    refetch
  } = useSystemStatus({
    refreshInterval: 30000 // Refresh cada 30 segundos
  });

  // Combinar estados de loading y error
  const isLoading = propIsLoading || queryIsLoading;
  const error = propError || (isError ? queryError?.message || 'Error al cargar estado del sistema' : null);

  // Crear widget state para el container
  const widgetState = {
    id,
    type: WidgetType.SYSTEM_STATUS,
    size,
    position: { x: 0, y: 0, width: 2, height: 2 },
    isEnabled: true,
    isLoading,
    error,
    settings: {}
  };

  // Manejar refresh
  const handleRefresh = () => {
    refetch();
    onRefresh?.();
  };

  // Determinar si usar modo compacto basado en el tamaño
  const useCompactMode = compactMode || size === 'small';

  // Datos por defecto si no hay datos del sistema
  const defaultSystemStatus = {
    isConnected: false,
    lastSync: new Date(),
    performance: SystemPerformance.CRITICAL,
    activeUsers: 0,
    systemLoad: 0,
    uptime: undefined,
    version: undefined
  };

  const currentStatus = systemStatus || defaultSystemStatus;
  const statusText = getStatusText(currentStatus.performance, currentStatus.isConnected);
  const statusIcon = getPerformanceIcon(currentStatus.performance, currentStatus.isConnected);
  const statusColor = getPerformanceColor(currentStatus.performance);

  return (
    <WidgetContainer
      widget={widgetState}
      title="Estado del Sistema"
      subtitle={`Maximo - ${statusText}`}
      icon={<Server className="w-4 h-4" />}
      onRefresh={handleRefresh}
      onResize={onResize}
      onRemove={onRemove}
      className={className}
    >
      <div className="h-full flex flex-col space-y-4">
        {/* Estado principal del sistema */}
        <div className={`${getPerformanceBgColor(currentStatus.performance)} rounded-lg p-3 border border-opacity-30 ${
          currentStatus.isConnected ? 'border-green-500' : 'border-red-500'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {statusIcon}
              <div>
                <h3 className={`font-semibold ${statusColor}`}>
                  {statusText}
                </h3>
                {!useCompactMode && (
                  <p className="text-sm text-glass-300">
                    Sistema Maximo
                  </p>
                )}
              </div>
            </div>
            {!useCompactMode && (
              <div className="text-right">
                <p className="text-xs text-glass-400">
                  {formatLastSync(currentStatus.lastSync)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Indicador de conectividad */}
        {!useCompactMode && (
          <ConnectivityIndicator
            isConnected={currentStatus.isConnected}
            lastSync={currentStatus.lastSync}
            compactMode={useCompactMode}
          />
        )}

        {/* Métricas del sistema */}
        {showMetrics && currentStatus.isConnected && (
          <SystemMetrics
            activeUsers={currentStatus.activeUsers}
            systemLoad={currentStatus.systemLoad}
            uptime={currentStatus.uptime}
            version={currentStatus.version}
            compactMode={useCompactMode}
          />
        )}

        {/* Alertas críticas */}
        {showAlerts && (
          <div className="flex-1">
            <CriticalAlerts
              performance={currentStatus.performance}
              isConnected={currentStatus.isConnected}
              systemLoad={currentStatus.systemLoad}
              compactMode={useCompactMode}
            />
          </div>
        )}

        {/* Mensaje de estado cuando no hay conexión */}
        {!currentStatus.isConnected && !useCompactMode && (
          <div className="mt-auto">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-center text-sm text-red-400">
                🔌 Verificando conexión con Maximo...
              </p>
            </div>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};

export default SystemStatusWidget;