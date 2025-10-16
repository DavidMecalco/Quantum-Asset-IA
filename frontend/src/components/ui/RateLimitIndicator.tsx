import React, { useState, useEffect } from 'react';
import { Shield, Clock, AlertTriangle, Ban } from 'lucide-react';
import { FeedbackMessage } from './FeedbackMessage';

export interface RateLimitIndicatorProps {
  attemptCount: number;
  maxAttempts: number;
  isBlocked: boolean;
  timeUntilUnblock?: number;
  remainingAttempts: number;
  className?: string;
}

/**
 * Componente para mostrar información de rate limiting
 */
export const RateLimitIndicator: React.FC<RateLimitIndicatorProps> = ({
  attemptCount,
  maxAttempts,
  isBlocked,
  timeUntilUnblock,
  remainingAttempts,
  className = '',
}) => {
  const [countdown, setCountdown] = useState(timeUntilUnblock || 0);

  // Actualizar countdown cada segundo
  useEffect(() => {
    if (isBlocked && timeUntilUnblock) {
      setCountdown(timeUntilUnblock);
      
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1000) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isBlocked, timeUntilUnblock]);

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getWarningLevel = (): 'info' | 'warning' | 'error' => {
    if (isBlocked) return 'error';
    if (attemptCount >= maxAttempts * 0.8) return 'error';
    if (attemptCount >= maxAttempts * 0.6) return 'warning';
    return 'info';
  };

  const getIcon = () => {
    if (isBlocked) return <Ban className="w-4 h-4" />;
    if (attemptCount > 0) return <AlertTriangle className="w-4 h-4" />;
    return <Shield className="w-4 h-4" />;
  };

  const getMessage = (): string => {
    if (isBlocked) {
      return `Cuenta bloqueada. Tiempo restante: ${formatTime(countdown)}`;
    }
    
    if (attemptCount > 0) {
      return `Intentos fallidos: ${attemptCount}/${maxAttempts}. ${remainingAttempts} intentos restantes.`;
    }

    return 'Sistema de seguridad activo';
  };

  // No mostrar nada si no hay intentos y no está bloqueado
  if (attemptCount === 0 && !isBlocked) {
    return null;
  }

  return (
    <div className={className}>
      <FeedbackMessage
        type={getWarningLevel()}
        message={getMessage()}
        isVisible={true}
        autoClose={false}
        showIcon={true}
        className="animate-fadeInUp"
      />
      
      {/* Barra de progreso de intentos */}
      {!isBlocked && attemptCount > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs text-glass-200">
            <span>Intentos de seguridad</span>
            <span>{attemptCount}/{maxAttempts}</span>
          </div>
          
          <div className="w-full bg-glass-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                attemptCount >= maxAttempts * 0.8 
                  ? 'bg-red-500' 
                  : attemptCount >= maxAttempts * 0.6 
                    ? 'bg-yellow-500' 
                    : 'bg-blue-500'
              }`}
              style={{ width: `${(attemptCount / maxAttempts) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Información adicional cuando está bloqueado */}
      {isBlocked && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="text-red-200 font-medium text-sm">
                Acceso Temporalmente Restringido
              </h4>
              <p className="text-red-300 text-xs">
                Por seguridad, el acceso ha sido bloqueado debido a múltiples intentos fallidos. 
                El bloqueo se levantará automáticamente en {formatTime(countdown)}.
              </p>
              <div className="text-red-300 text-xs space-y-1">
                <p><strong>Recomendaciones:</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-0.5">
                  <li>Verifica que estés usando las credenciales correctas</li>
                  <li>Asegúrate de que Caps Lock esté desactivado</li>
                  <li>Si olvidaste tu contraseña, usa el enlace de recuperación</li>
                  <li>Contacta al soporte si el problema persiste</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Hook para manejar rate limiting con estado local
 */
export const useRateLimit = (maxAttempts: number = 5, blockDuration: number = 5 * 60 * 1000) => {
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockEndTime, setBlockEndTime] = useState<number | null>(null);

  // Verificar si el bloqueo ha expirado
  useEffect(() => {
    if (isBlocked && blockEndTime) {
      const checkExpiry = () => {
        if (Date.now() >= blockEndTime) {
          setIsBlocked(false);
          setAttempts(0);
          setBlockEndTime(null);
        }
      };

      const interval = setInterval(checkExpiry, 1000);
      return () => clearInterval(interval);
    }
  }, [isBlocked, blockEndTime]);

  const recordFailedAttempt = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= maxAttempts) {
      setIsBlocked(true);
      setBlockEndTime(Date.now() + blockDuration);
    }
  };

  const recordSuccessfulAttempt = () => {
    setAttempts(0);
    setIsBlocked(false);
    setBlockEndTime(null);
  };

  const reset = () => {
    setAttempts(0);
    setIsBlocked(false);
    setBlockEndTime(null);
  };

  const timeUntilUnblock = blockEndTime ? Math.max(0, blockEndTime - Date.now()) : 0;

  return {
    attempts,
    isBlocked,
    timeUntilUnblock,
    remainingAttempts: Math.max(0, maxAttempts - attempts),
    recordFailedAttempt,
    recordSuccessfulAttempt,
    reset,
  };
};

export default RateLimitIndicator;