import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

export interface FeedbackMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  isVisible: boolean;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  showIcon?: boolean;
  className?: string;
}

/**
 * Componente de mensaje de feedback con animaciones
 */
export const FeedbackMessage: React.FC<FeedbackMessageProps> = ({
  type,
  title,
  message,
  isVisible,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
  showIcon = true,
  className = '',
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      
      if (autoClose && autoCloseDelay > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Esperar a que termine la animación
  };

  const getStyles = () => {
    const baseStyles = "border backdrop-blur-md rounded-lg p-4 shadow-lg transition-all duration-300";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-500/20 border-green-500/30 text-green-200`;
      case 'error':
        return `${baseStyles} bg-red-500/20 border-red-500/30 text-red-200`;
      case 'warning':
        return `${baseStyles} bg-yellow-500/20 border-yellow-500/30 text-yellow-200`;
      case 'info':
        return `${baseStyles} bg-blue-500/20 border-blue-500/30 text-blue-200`;
      default:
        return `${baseStyles} bg-glass-50 border-glass-100 text-white`;
    }
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5 flex-shrink-0";
    
    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-400`} />;
      case 'error':
        return <XCircle className={`${iconClass} text-red-400`} />;
      case 'warning':
        return <AlertCircle className={`${iconClass} text-yellow-400`} />;
      case 'info':
        return <Info className={`${iconClass} text-blue-400`} />;
      default:
        return <Info className={`${iconClass} text-white`} />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`
      ${getStyles()} 
      ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      ${className}
    `}>
      <div className="flex items-start space-x-3">
        {showIcon && getIcon()}
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-medium mb-1">
              {title}
            </h4>
          )}
          <p className="text-sm">
            {message}
          </p>
        </div>
        
        {onClose && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-current hover:opacity-70 transition-opacity duration-200"
            aria-label="Cerrar mensaje"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Toast notification que aparece en la esquina
 */
export interface ToastProps extends Omit<FeedbackMessageProps, 'isVisible' | 'className'> {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const Toast: React.FC<ToastProps> = ({
  position = 'top-right',
  ...props
}) => {
  const getPositionStyles = () => {
    const baseStyles = "fixed z-50 max-w-sm";
    
    switch (position) {
      case 'top-right':
        return `${baseStyles} top-4 right-4`;
      case 'top-left':
        return `${baseStyles} top-4 left-4`;
      case 'bottom-right':
        return `${baseStyles} bottom-4 right-4`;
      case 'bottom-left':
        return `${baseStyles} bottom-4 left-4`;
      case 'top-center':
        return `${baseStyles} top-4 left-1/2 transform -translate-x-1/2`;
      case 'bottom-center':
        return `${baseStyles} bottom-4 left-1/2 transform -translate-x-1/2`;
      default:
        return `${baseStyles} top-4 right-4`;
    }
  };

  return (
    <FeedbackMessage
      {...props}
      isVisible={true}
      className={getPositionStyles()}
    />
  );
};

/**
 * Componente de progreso con animación
 */
export interface ProgressFeedbackProps {
  progress: number; // 0-100
  message?: string;
  showPercentage?: boolean;
  variant?: 'quantum' | 'simple';
  className?: string;
}

export const ProgressFeedback: React.FC<ProgressFeedbackProps> = ({
  progress,
  message,
  showPercentage = true,
  variant = 'quantum',
  className = '',
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`space-y-2 ${className}`}>
      {message && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-glass-200">{message}</span>
          {showPercentage && (
            <span className="text-sm text-glass-200 font-medium">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      
      <div className="w-full bg-glass-100 rounded-full h-2 overflow-hidden">
        <div 
          className={`
            h-full rounded-full transition-all duration-300 ease-out
            ${variant === 'quantum' 
              ? 'bg-gradient-to-r from-quantum-blue to-quantum-purple' 
              : 'bg-quantum-blue'
            }
          `}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Shake animation para errores
 */
export const ShakeContainer: React.FC<{
  children: React.ReactNode;
  isShaking: boolean;
  className?: string;
}> = ({ children, isShaking, className = '' }) => {
  return (
    <div className={`
      ${isShaking ? 'animate-shake' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

export default FeedbackMessage;