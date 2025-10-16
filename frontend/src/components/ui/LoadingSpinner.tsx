import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'quantum' | 'simple' | 'dots' | 'pulse';
  className?: string;
  text?: string;
}

/**
 * Spinner de carga con estilos quantum
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'quantum',
  className = '',
  text,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  if (variant === 'quantum') {
    return (
      <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
        <div className="relative">
          {/* Anillo exterior */}
          <div className={`${sizeClasses[size]} border-2 border-quantum-blue/30 rounded-full animate-spin`}>
            <div className="absolute inset-0 border-2 border-transparent border-t-quantum-blue rounded-full animate-spin" 
                 style={{ animationDuration: '1s' }}></div>
          </div>
          
          {/* Anillo medio */}
          <div className={`absolute inset-1 border-2 border-quantum-purple/30 rounded-full animate-spin`}
               style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}>
            <div className="absolute inset-0 border-2 border-transparent border-t-quantum-purple rounded-full animate-spin"
                 style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          
          {/* Punto central */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-1 bg-quantum-indigo rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {text && (
          <p className={`text-glass-200 ${textSizes[size]} animate-pulse`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-quantum-blue rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-quantum-purple rounded-full animate-bounce" 
               style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-quantum-indigo rounded-full animate-bounce" 
               style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        {text && (
          <p className={`text-glass-200 ${textSizes[size]}`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
        <div className={`${sizeClasses[size]} bg-gradient-to-r from-quantum-blue to-quantum-purple rounded-full animate-pulse`}></div>
        
        {text && (
          <p className={`text-glass-200 ${textSizes[size]} animate-pulse`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  // Simple variant (default Loader2)
  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-quantum-blue animate-spin`} />
      
      {text && (
        <p className={`text-glass-200 ${textSizes[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
};

/**
 * Overlay de loading para pantalla completa
 */
export interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
  variant?: LoadingSpinnerProps['variant'];
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  text = 'Cargando...',
  variant = 'quantum',
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-glass-50 backdrop-blur-md rounded-2xl border border-glass-100 p-8">
        <LoadingSpinner 
          size="lg" 
          variant={variant} 
          text={text}
        />
      </div>
    </div>
  );
};

/**
 * Loading inline para botones
 */
export interface ButtonLoadingProps {
  isLoading: boolean;
  text: string;
  loadingText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  isLoading,
  text,
  loadingText,
  size = 'md',
}) => {
  const spinnerSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <>
      {isLoading ? (
        <>
          <Loader2 className={`${spinnerSizes[size]} mr-2 animate-spin`} />
          {loadingText || text}
        </>
      ) : (
        text
      )}
    </>
  );
};

export default LoadingSpinner;