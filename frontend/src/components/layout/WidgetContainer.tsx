import React, { useState, useCallback, useEffect, useRef } from 'react';
import { WidgetState, WidgetSize } from '../../types/widgets';
import { RefreshCw, Settings, X, Maximize2, Minimize2, AlertCircle } from 'lucide-react';

// Props para el WidgetContainer
interface WidgetContainerProps {
  widget: WidgetState;
  children: React.ReactNode;
  onRefresh?: () => void;
  onResize?: (size: WidgetSize) => void;
  onRemove?: () => void;
  onSettings?: () => void;
  className?: string;
  showControls?: boolean;
  isRefreshing?: boolean;
  refreshInterval?: number;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

// Componente de loading spinner
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`${sizeClasses[size]} border-2 border-white/30 border-t-white rounded-full animate-spin`} />
  );
};

// Componente de error
const ErrorDisplay: React.FC<{ 
  error: string; 
  onRetry?: () => void;
  compact?: boolean;
}> = ({ error, onRetry, compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center justify-center h-full text-red-400">
        <div className="text-center">
          <AlertCircle className="w-6 h-6 mx-auto mb-2" />
          <p className="text-xs">Error</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-1 text-xs text-red-300 hover:text-red-200 underline"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-red-400 max-w-xs">
        <AlertCircle className="w-8 h-8 mx-auto mb-3" />
        <h3 className="font-medium mb-2">Error al cargar</h3>
        <p className="text-sm text-red-300 mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-colors duration-200"
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
};

// Componente principal WidgetContainer
export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  widget,
  children,
  onRefresh,
  onResize,
  onRemove,
  onSettings,
  className = '',
  showControls = true,
  isRefreshing = false,
  refreshInterval,
  title,
  subtitle,
  icon
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(!!refreshInterval);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-refresh si está habilitado
  useEffect(() => {
    if (!autoRefreshEnabled || !refreshInterval || !onRefresh) return;

    const interval = setInterval(() => {
      onRefresh();
      setLastRefresh(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshInterval, onRefresh]);

  // Manejar refresh manual
  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
      setLastRefresh(new Date());
    }
  }, [onRefresh]);

  // Manejar cambio de tamaño
  const handleResize = useCallback(() => {
    if (!onResize) return;

    const sizes = [WidgetSize.SMALL, WidgetSize.MEDIUM, WidgetSize.LARGE];
    const currentIndex = sizes.indexOf(widget.size);
    const nextIndex = (currentIndex + 1) % sizes.length;
    onResize(sizes[nextIndex]);
  }, [widget.size, onResize]);

  // Manejar navegación por teclado
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Solo procesar si el widget está enfocado
    if (!isFocused) return;

    switch (event.key) {
      case 'r':
      case 'R':
        if (onRefresh) {
          event.preventDefault();
          handleRefresh();
        }
        break;
      case 's':
      case 'S':
        if (onSettings) {
          event.preventDefault();
          onSettings();
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (onRemove) {
          event.preventDefault();
          onRemove();
        }
        break;
      case '+':
      case '=':
        if (onResize && widget.size !== WidgetSize.LARGE) {
          event.preventDefault();
          const sizes = [WidgetSize.SMALL, WidgetSize.MEDIUM, WidgetSize.LARGE];
          const currentIndex = sizes.indexOf(widget.size);
          onResize(sizes[currentIndex + 1]);
        }
        break;
      case '-':
        if (onResize && widget.size !== WidgetSize.SMALL) {
          event.preventDefault();
          const sizes = [WidgetSize.SMALL, WidgetSize.MEDIUM, WidgetSize.LARGE];
          const currentIndex = sizes.indexOf(widget.size);
          onResize(sizes[currentIndex - 1]);
        }
        break;
      case 'Enter':
      case ' ':
        // Activar el primer elemento interactivo dentro del widget
        event.preventDefault();
        const firstButton = containerRef.current?.querySelector('button:not([disabled])') as HTMLElement;
        if (firstButton) {
          firstButton.focus();
        }
        break;
    }
  }, [isFocused, onRefresh, onSettings, onRemove, onResize, widget.size, handleRefresh]);

  // Obtener clases CSS según el tamaño
  const getSizeClasses = (): string => {
    switch (widget.size) {
      case WidgetSize.SMALL:
        return 'min-h-[240px]';
      case WidgetSize.MEDIUM:
        return 'min-h-[320px]';
      case WidgetSize.LARGE:
        return 'min-h-[400px]';
      default:
        return 'min-h-[320px]';
    }
  };

  // Formatear tiempo de último refresh
  const formatLastRefresh = (): string => {
    if (!lastRefresh) return '';
    
    const now = new Date();
    const diff = now.getTime() - lastRefresh.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Hace un momento';
    if (minutes === 1) return 'Hace 1 minuto';
    return `Hace ${minutes} minutos`;
  };

  const baseClasses = `
    relative bg-glass-50 backdrop-blur-md rounded-2xl border border-glass-100
    transition-all duration-300 ease-in-out
    hover:bg-glass-100 hover:border-glass-200 hover:shadow-lg
    animate-in slide-in-from-bottom-4 fade-in duration-300
    ${getSizeClasses()}
    ${className}
  `;

  return (
    <div
      ref={containerRef}
      className={baseClasses}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={handleKeyDown}
      data-widget-id={widget.id}
      data-widget-type={widget.type}
      tabIndex={0}
      role="region"
      aria-label={`Widget ${title || widget.type}. Presiona R para actualizar, S para configuración, Enter para interactuar`}
      aria-describedby={`widget-${widget.id}-description`}
    >
      {/* Header del widget */}
      {(title || showControls) && (
        <div className="flex items-center justify-between p-4 pb-2">
          {/* Título e icono */}
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {icon && (
              <div className="flex-shrink-0 text-glass-300">
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {title && (
                <h3 className="text-white font-medium text-sm truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-glass-300 text-xs truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Controles del widget */}
          {showControls && (
            <div className={`flex items-center space-x-1 transition-opacity duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              {/* Auto-refresh toggle */}
              {refreshInterval && (
                <button
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  className={`p-1.5 rounded-lg transition-colors duration-200 ${
                    autoRefreshEnabled 
                      ? 'bg-quantum-blue/20 text-quantum-blue' 
                      : 'text-glass-400 hover:text-white hover:bg-glass-200'
                  }`}
                  title={autoRefreshEnabled ? 'Deshabilitar auto-refresh' : 'Habilitar auto-refresh'}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${autoRefreshEnabled ? 'animate-spin' : ''}`} />
                </button>
              )}

              {/* Refresh manual */}
              {onRefresh && (
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 text-glass-400 hover:text-white hover:bg-glass-200 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  title="Actualizar"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              )}

              {/* Configuración */}
              {onSettings && (
                <button
                  onClick={onSettings}
                  className="p-1.5 text-glass-400 hover:text-white hover:bg-glass-200 rounded-lg transition-colors duration-200"
                  title="Configuración"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Resize */}
              {onResize && (
                <button
                  onClick={handleResize}
                  className="p-1.5 text-glass-400 hover:text-white hover:bg-glass-200 rounded-lg transition-colors duration-200"
                  title="Cambiar tamaño"
                >
                  {widget.size === WidgetSize.LARGE ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              {/* Remover */}
              {onRemove && (
                <button
                  onClick={onRemove}
                  className="p-1.5 text-glass-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors duration-200"
                  title="Remover widget"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 p-4 pt-2">
        {widget.isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white">
              <LoadingSpinner size="lg" />
              <p className="mt-3 text-sm text-glass-300">Cargando...</p>
            </div>
          </div>
        ) : widget.error ? (
          <ErrorDisplay 
            error={widget.error} 
            onRetry={onRefresh}
            compact={widget.size === WidgetSize.SMALL}
          />
        ) : (
          children
        )}
      </div>

      {/* Descripción oculta para screen readers */}
      <div 
        id={`widget-${widget.id}-description`} 
        className="sr-only"
      >
        Widget {title || widget.type}. 
        {widget.isLoading && 'Cargando contenido. '}
        {widget.error && `Error: ${widget.error}. `}
        Atajos de teclado: R para actualizar, S para configuración, + y - para cambiar tamaño, Delete para remover.
      </div>

      {/* Footer con información adicional */}
      {(lastRefresh || autoRefreshEnabled) && !widget.isLoading && !widget.error && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-xs text-glass-400">
            {lastRefresh && (
              <span>{formatLastRefresh()}</span>
            )}
            {autoRefreshEnabled && refreshInterval && (
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-quantum-blue rounded-full animate-pulse" />
                <span>Auto-refresh: {Math.floor(refreshInterval / 1000)}s</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Overlay de carga global */}
      {isRefreshing && !widget.isLoading && (
        <div className="absolute inset-0 bg-glass-50/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <div className="bg-glass-100 rounded-lg p-3 flex items-center space-x-2">
            <LoadingSpinner size="sm" />
            <span className="text-white text-sm">Actualizando...</span>
          </div>
        </div>
      )}

      {/* Indicador de estado del widget */}
      <div className="absolute top-2 left-2">
        <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
          widget.error ? 'bg-red-500' :
          widget.isLoading ? 'bg-yellow-500 animate-pulse' :
          'bg-green-500'
        }`} />
      </div>

      {/* Animación de entrada se maneja con CSS classes */}
    </div>
  );
};

export default WidgetContainer;