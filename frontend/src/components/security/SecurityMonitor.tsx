import React, { useEffect, useState, useCallback } from 'react';
import { Shield, Eye, AlertTriangle, Activity } from 'lucide-react';
import { FeedbackMessage } from '../ui/FeedbackMessage';

export interface SecurityEvent {
  type: 'login_attempt' | 'failed_login' | 'suspicious_activity' | 'rate_limit' | 'session_timeout';
  timestamp: number;
  details?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface SecurityMonitorProps {
  isVisible?: boolean;
  maxEvents?: number;
  className?: string;
}

/**
 * Componente para monitorear eventos de seguridad
 */
export const SecurityMonitor: React.FC<SecurityMonitorProps> = ({
  isVisible = false,
  maxEvents = 10,
  className = '',
}) => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const addEvent = useCallback((event: SecurityEvent) => {
    setEvents(prev => {
      const newEvents = [event, ...prev].slice(0, maxEvents);
      return newEvents;
    });
  }, [maxEvents]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'login_attempt':
        return <Activity className="w-4 h-4 text-blue-400" />;
      case 'failed_login':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'suspicious_activity':
        return <Eye className="w-4 h-4 text-yellow-400" />;
      case 'rate_limit':
        return <Shield className="w-4 h-4 text-orange-400" />;
      case 'session_timeout':
        return <Shield className="w-4 h-4 text-gray-400" />;
      default:
        return <Shield className="w-4 h-4 text-gray-400" />;
    }
  };

  const getEventColor = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-300 bg-red-500/10 border-red-500/20';
      case 'medium':
        return 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20';
      case 'low':
        return 'text-blue-300 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-gray-300 bg-gray-500/10 border-gray-500/20';
    }
  };

  const formatEventType = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'login_attempt':
        return 'Intento de Login';
      case 'failed_login':
        return 'Login Fallido';
      case 'suspicious_activity':
        return 'Actividad Sospechosa';
      case 'rate_limit':
        return 'Límite de Velocidad';
      case 'session_timeout':
        return 'Sesión Expirada';
      default:
        return 'Evento Desconocido';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Exponer funciones para uso externo
  useEffect(() => {
    // Agregar al objeto global para acceso desde otros componentes
    (window as any).securityMonitor = {
      addEvent,
      clearEvents,
      setMonitoring: setIsMonitoring,
    };

    return () => {
      delete (window as any).securityMonitor;
    };
  }, [addEvent, clearEvents]);

  if (!isVisible) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-quantum-blue" />
          <h3 className="text-white font-medium">Monitor de Seguridad</h3>
          {isMonitoring && (
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          )}
        </div>
        
        {events.length > 0 && (
          <button
            onClick={clearEvents}
            className="text-xs text-glass-200 hover:text-white transition-colors duration-200"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Events List */}
      {events.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {events.map((event, index) => (
            <div
              key={`${event.timestamp}-${index}`}
              className={`p-3 rounded-lg border ${getEventColor(event.severity)} transition-all duration-200`}
            >
              <div className="flex items-start space-x-3">
                {getEventIcon(event.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      {formatEventType(event.type)}
                    </h4>
                    <span className="text-xs opacity-75">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                  {event.details && (
                    <p className="text-xs mt-1 opacity-90">
                      {event.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Shield className="w-8 h-8 text-glass-200 mx-auto mb-2" />
          <p className="text-glass-200 text-sm">
            No hay eventos de seguridad recientes
          </p>
        </div>
      )}

      {/* Security Status */}
      <div className="bg-glass-50 rounded-lg p-3 border border-glass-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-glass-200">Estado de Seguridad</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm text-green-400">Activo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook para usar el monitor de seguridad
 */
export const useSecurityMonitor = () => {
  const addSecurityEvent = useCallback((
    type: SecurityEvent['type'],
    details?: string,
    severity: SecurityEvent['severity'] = 'medium'
  ) => {
    const event: SecurityEvent = {
      type,
      timestamp: Date.now(),
      details,
      severity,
    };

    // Usar el monitor global si está disponible
    if ((window as any).securityMonitor) {
      (window as any).securityMonitor.addEvent(event);
    }

    // También log en consola para desarrollo
    console.log('Security Event:', event);
  }, []);

  const logLoginAttempt = useCallback((email: string) => {
    addSecurityEvent('login_attempt', `Intento de login para: ${email}`, 'low');
  }, [addSecurityEvent]);

  const logFailedLogin = useCallback((email: string, reason?: string) => {
    addSecurityEvent(
      'failed_login', 
      `Login fallido para: ${email}${reason ? ` - ${reason}` : ''}`, 
      'medium'
    );
  }, [addSecurityEvent]);

  const logSuspiciousActivity = useCallback((activity: string) => {
    addSecurityEvent('suspicious_activity', activity, 'high');
  }, [addSecurityEvent]);

  const logRateLimit = useCallback((action: string) => {
    addSecurityEvent('rate_limit', `Rate limit alcanzado para: ${action}`, 'medium');
  }, [addSecurityEvent]);

  const logSessionTimeout = useCallback(() => {
    addSecurityEvent('session_timeout', 'Sesión expirada por inactividad', 'low');
  }, [addSecurityEvent]);

  return {
    addSecurityEvent,
    logLoginAttempt,
    logFailedLogin,
    logSuspiciousActivity,
    logRateLimit,
    logSessionTimeout,
  };
};

export default SecurityMonitor;