import React, { useState, useEffect, useMemo, memo, useRef } from 'react';
import { WidgetState, WidgetSize, GridConfig } from '../../types/widgets';
import { useStableCallback, useThrottle } from '../../utils/memoization';
import { 
  useTouchGestures, 
  isTouchDevice, 
  getTouchOptimizedButtonSize,
  SwipeGesture 
} from '../../utils/touchGestures';

// Props para el DashboardGrid
interface DashboardGridProps {
  widgets: WidgetState[];
  gridConfig: GridConfig;
  onLayoutChange?: (newLayout: WidgetState[]) => void;
  onWidgetResize?: (widgetId: string, size: WidgetSize) => void;
  onWidgetMove?: (widgetId: string, position: { x: number; y: number }) => void;
  className?: string;
  children?: React.ReactNode;
  isDraggable?: boolean;
  isResizable?: boolean;
  enableDropZone?: boolean;
  id?: string;
  role?: string;
  'aria-label'?: string;
  tabIndex?: number;
}

// Props para items individuales del grid
interface GridItemProps {
  widget: WidgetState;
  isDraggable: boolean;
  isResizable: boolean;
  onDragStart?: (widgetId: string, event: React.DragEvent) => void;
  onDragEnd?: (widgetId: string, event: React.DragEvent) => void;
  onResize?: (widgetId: string, size: WidgetSize) => void;
  children: React.ReactNode;
  className?: string;
}

// Memoized component for individual grid items
const GridItem: React.FC<GridItemProps> = memo(({
  widget,
  isDraggable,
  isResizable,
  onDragStart,
  onDragEnd,
  onResize,
  children,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const isTouch = isTouchDevice();

  // Memoized size classes mapping
  const sizeClasses = useMemo(() => {
    switch (widget.size) {
      case WidgetSize.SMALL:
        return 'col-span-1 row-span-2';
      case WidgetSize.MEDIUM:
        return 'col-span-2 row-span-2';
      case WidgetSize.LARGE:
        return 'col-span-2 row-span-3';
      default:
        return 'col-span-2 row-span-2';
    }
  }, [widget.size]);

  // Stable callbacks for drag operations
  const handleDragStart = useStableCallback((event: React.DragEvent) => {
    if (!isDraggable) return;
    
    setIsDragging(true);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', widget.id);
    
    // Agregar clase visual durante el drag
    event.currentTarget.classList.add('opacity-50', 'scale-95');
    
    onDragStart?.(widget.id, event);
  }, [isDraggable, widget.id, onDragStart]);

  const handleDragEnd = useStableCallback((event: React.DragEvent) => {
    setIsDragging(false);
    
    // Remover clases visuales
    event.currentTarget.classList.remove('opacity-50', 'scale-95');
    
    onDragEnd?.(widget.id, event);
  }, [widget.id, onDragEnd]);

  const handleSizeChange = useStableCallback((newSize: WidgetSize) => {
    if (!isResizable) return;
    onResize?.(widget.id, newSize);
  }, [isResizable, widget.id, onResize]);

  // Configurar gestos táctiles
  const gestureHandler = useTouchGestures(itemRef, {
    swipeThreshold: 30,
    longPressDelay: 300,
    preventScroll: isDraggable
  });

  // Manejar gestos táctiles
  useEffect(() => {
    if (!gestureHandler || !isDraggable) return;

    // Long press para iniciar drag en móvil
    gestureHandler.onLongPressGesture(() => {
      setIsTouchDragging(true);
      // Simular evento de drag start
      const fakeEvent = new DragEvent('dragstart');
      onDragStart?.(widget.id, fakeEvent as any);
    });

    // Swipe para cambiar tamaño en móvil
    gestureHandler.onSwipeGesture((gesture: SwipeGesture) => {
      if (!isResizable) return;
      
      if (gesture.direction === 'up' && widget.size !== WidgetSize.LARGE) {
        const sizes = [WidgetSize.SMALL, WidgetSize.MEDIUM, WidgetSize.LARGE];
        const currentIndex = sizes.indexOf(widget.size);
        onResize?.(widget.id, sizes[currentIndex + 1]);
      } else if (gesture.direction === 'down' && widget.size !== WidgetSize.SMALL) {
        const sizes = [WidgetSize.SMALL, WidgetSize.MEDIUM, WidgetSize.LARGE];
        const currentIndex = sizes.indexOf(widget.size);
        onResize?.(widget.id, sizes[currentIndex - 1]);
      }
    });

    // Double tap para cambiar tamaño
    gestureHandler.onDoubleTapGesture(() => {
      if (isResizable) {
        const sizes = [WidgetSize.SMALL, WidgetSize.MEDIUM, WidgetSize.LARGE];
        const currentIndex = sizes.indexOf(widget.size);
        const nextIndex = (currentIndex + 1) % sizes.length;
        onResize?.(widget.id, sizes[nextIndex]);
      }
    });

  }, [gestureHandler, isDraggable, isResizable, widget.id, widget.size, onDragStart, onResize, handleSizeChange]);

  // Memoized base classes
  const baseClasses = useMemo(() => `
    relative bg-glass-50 backdrop-blur-md rounded-2xl border border-glass-100
    transition-all duration-300 ease-in-out
    hover:bg-glass-100 hover:border-glass-200
    ${sizeClasses}
    ${isDragging || isTouchDragging ? 'z-50' : 'z-10'}
    ${isDraggable ? (isTouch ? 'cursor-grab active:cursor-grabbing' : 'cursor-move') : ''}
    ${isTouchDragging ? 'opacity-75 scale-105 shadow-2xl' : ''}
    ${className}
  `, [sizeClasses, isDragging, isTouchDragging, isDraggable, isTouch, className]);

  return (
    <div
      ref={itemRef}
      className={baseClasses}
      draggable={isDraggable && !isTouch}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-widget-id={widget.id}
      data-widget-type={widget.type}
    >
      {/* Handle de drag (visible solo en hover si es draggable) */}
      {isDraggable && (
        <div className={`absolute top-2 right-2 transition-opacity duration-200 ${
          isTouch ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <div className={`flex items-center justify-center text-glass-300 hover:text-white ${
            isTouch ? 'w-8 h-8 bg-glass-200 rounded-lg' : 'w-6 h-6 cursor-move'
          }`}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
            </svg>
          </div>
          {isTouch && (
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-glass-400 whitespace-nowrap">
              Mantén presionado
            </div>
          )}
        </div>
      )}

      {/* Controles de resize (visible solo en hover si es resizable) */}
      {isResizable && (
        <div className={`absolute bottom-2 right-2 transition-opacity duration-200 ${
          isTouch ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <div className={`flex ${isTouch ? 'flex-col space-y-1' : 'space-x-1'}`}>
            <button
              onClick={() => handleSizeChange(WidgetSize.SMALL)}
              className={`${isTouch ? 'w-6 h-6' : 'w-3 h-3'} rounded-full border-2 transition-colors duration-200 ${
                widget.size === WidgetSize.SMALL 
                  ? 'bg-quantum-blue border-quantum-blue' 
                  : 'border-glass-300 hover:border-white'
              }`}
              title="Pequeño"
              style={{ minWidth: isTouch ? getTouchOptimizedButtonSize(24) : undefined }}
            />
            <button
              onClick={() => handleSizeChange(WidgetSize.MEDIUM)}
              className={`${isTouch ? 'w-6 h-6' : 'w-3 h-3'} rounded-full border-2 transition-colors duration-200 ${
                widget.size === WidgetSize.MEDIUM 
                  ? 'bg-quantum-purple border-quantum-purple' 
                  : 'border-glass-300 hover:border-white'
              }`}
              title="Mediano"
              style={{ minWidth: isTouch ? getTouchOptimizedButtonSize(24) : undefined }}
            />
            <button
              onClick={() => handleSizeChange(WidgetSize.LARGE)}
              className={`${isTouch ? 'w-6 h-6' : 'w-3 h-3'} rounded-full border-2 transition-colors duration-200 ${
                widget.size === WidgetSize.LARGE 
                  ? 'bg-quantum-indigo border-quantum-indigo' 
                  : 'border-glass-300 hover:border-white'
              }`}
              title="Grande"
              style={{ minWidth: isTouch ? getTouchOptimizedButtonSize(24) : undefined }}
            />
          </div>
          {isTouch && (
            <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 text-xs text-glass-400 whitespace-nowrap">
              Doble toque o desliza
            </div>
          )}
        </div>
      )}

      {/* Contenido del widget */}
      <div className="h-full w-full p-4 group">
        {children}
      </div>

      {/* Overlay de loading si el widget está cargando */}
      {widget.isLoading && (
        <div className="absolute inset-0 bg-glass-50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <div className="flex items-center space-x-2 text-white">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span className="text-sm">Cargando...</span>
          </div>
        </div>
      )}

      {/* Overlay de error si hay error */}
      {widget.error && (
        <div className="absolute inset-0 bg-red-500/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <div className="text-center text-red-400">
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-sm">Error al cargar</div>
          </div>
        </div>
      )}
    </div>
  );
});

GridItem.displayName = 'GridItem';

// Memoized main DashboardGrid component
export const DashboardGrid = React.forwardRef<HTMLDivElement, DashboardGridProps>(({
  widgets,
  gridConfig,
  onLayoutChange,
  onWidgetResize,
  onWidgetMove,
  className = '',
  children,
  isDraggable = true,
  isResizable = true,
  enableDropZone = true,
  id,
  role,
  'aria-label': ariaLabel,
  tabIndex
}, ref) => {
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dropZoneActive, setDropZoneActive] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [currentPage, setCurrentPage] = useState(0);
  const isTouch = isTouchDevice();

  // Throttle window resize events for better performance
  const throttledWindowWidth = useThrottle(
    typeof window !== 'undefined' ? window.innerWidth : 1024, 
    100
  );

  // Detect current breakpoint based on throttled window width
  useEffect(() => {
    const width = throttledWindowWidth;
    if (width >= 1024) setCurrentBreakpoint('lg');
    else if (width >= 768) setCurrentBreakpoint('md');
    else if (width >= 640) setCurrentBreakpoint('sm');
    else setCurrentBreakpoint('xs');
  }, [throttledWindowWidth]);

  // Obtener configuración del breakpoint actual
  const currentGridConfig = useMemo(() => {
    const breakpointConfig = gridConfig.breakpoints.find(bp => bp.breakpoint === currentBreakpoint);
    return breakpointConfig || gridConfig.breakpoints[0];
  }, [gridConfig, currentBreakpoint]);

  // Generar clases CSS para el grid
  const gridClasses = useMemo(() => {
    const { cols, margin, containerPadding } = currentGridConfig;
    
    return `
      grid grid-cols-${cols} auto-rows-[${gridConfig.rowHeight}px]
      gap-${Math.floor(margin[0] / 4)} 
      p-${Math.floor(containerPadding[0] / 4)}
      ${className}
    `;
  }, [currentGridConfig, gridConfig.rowHeight, className]);

  // Stable callbacks for drag operations
  const handleDragStart = useStableCallback((widgetId: string, _event: React.DragEvent) => {
    setDraggedWidget(widgetId);
  }, []);

  const handleDragEnd = useStableCallback((_widgetId: string, _event: React.DragEvent) => {
    setDraggedWidget(null);
    setDropZoneActive(false);
  }, []);

  const handleDragOver = useStableCallback((event: React.DragEvent) => {
    if (!enableDropZone) return;
    
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropZoneActive(true);
  }, [enableDropZone]);

  const handleDragLeave = useStableCallback((event: React.DragEvent) => {
    // Solo desactivar si realmente salimos del grid
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setDropZoneActive(false);
    }
  }, []);

  // Stable callback for drop operations
  const handleDrop = useStableCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDropZoneActive(false);
    
    if (!draggedWidget || !onLayoutChange) return;

    // Calcular nueva posición basada en donde se soltó
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convertir coordenadas de pixel a posición de grid
    const { cols, margin } = currentGridConfig;
    const cellWidth = (rect.width - margin[0] * (cols - 1)) / cols;
    const cellHeight = gridConfig.rowHeight + margin[1];
    
    const gridX = Math.floor(x / (cellWidth + margin[0]));
    const gridY = Math.floor(y / cellHeight);

    // Actualizar posición del widget
    const updatedWidgets = widgets.map(widget => {
      if (widget.id === draggedWidget) {
        const newPosition = {
          ...widget.position,
          x: Math.max(0, Math.min(gridX, cols - widget.position.width)),
          y: Math.max(0, gridY)
        };
        
        onWidgetMove?.(widget.id, { x: newPosition.x, y: newPosition.y });
        
        return {
          ...widget,
          position: newPosition
        };
      }
      return widget;
    });

    onLayoutChange(updatedWidgets);
    setDraggedWidget(null);
  }, [draggedWidget, widgets, currentGridConfig, gridConfig.rowHeight, onLayoutChange, onWidgetMove]);

  // Stable callback for widget resize
  const handleWidgetResize = useStableCallback((widgetId: string, size: WidgetSize) => {
    if (!onWidgetResize || !onLayoutChange) return;

    onWidgetResize(widgetId, size);

    const updatedWidgets = widgets.map(widget => 
      widget.id === widgetId ? { ...widget, size } : widget
    );

    onLayoutChange(updatedWidgets);
  }, [widgets, onWidgetResize, onLayoutChange]);

  // Memoized enabled widgets
  const enabledWidgets = useMemo(() => 
    widgets.filter(widget => widget.isEnabled), 
    [widgets]
  );

  // Configurar gestos táctiles para el grid
  const gridGestureHandler = useTouchGestures(ref as React.RefObject<HTMLElement>, {
    swipeThreshold: 50,
    swipeVelocityThreshold: 0.5
  });

  // Paginación para móviles (mostrar menos widgets por página)
  const widgetsPerPage = useMemo(() => {
    if (!isTouch) return enabledWidgets.length;
    
    switch (currentBreakpoint) {
      case 'xs':
      case 'sm':
        return 2; // 2 widgets por página en móvil
      case 'md':
        return 4; // 4 widgets por página en tablet
      default:
        return enabledWidgets.length; // Todos en desktop
    }
  }, [isTouch, currentBreakpoint, enabledWidgets.length]);

  const totalPages = Math.ceil(enabledWidgets.length / widgetsPerPage);
  const currentWidgets = useMemo(() => {
    if (!isTouch || widgetsPerPage >= enabledWidgets.length) {
      return enabledWidgets;
    }
    
    const startIndex = currentPage * widgetsPerPage;
    return enabledWidgets.slice(startIndex, startIndex + widgetsPerPage);
  }, [enabledWidgets, currentPage, widgetsPerPage, isTouch]);

  // Manejar navegación por swipe en móviles
  useEffect(() => {
    if (!gridGestureHandler || !isTouch || totalPages <= 1) return;

    gridGestureHandler.onSwipeGesture((gesture: SwipeGesture) => {
      if (gesture.direction === 'left' && currentPage < totalPages - 1) {
        setCurrentPage(prev => prev + 1);
      } else if (gesture.direction === 'right' && currentPage > 0) {
        setCurrentPage(prev => prev - 1);
      }
    });
  }, [gridGestureHandler, isTouch, totalPages, currentPage]);

  return (
    <div className="w-full h-full relative">
      {/* Indicador de página para móviles */}
      {isTouch && totalPages > 1 && (
        <div className="flex justify-center items-center mb-4 space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="p-2 rounded-lg bg-glass-100 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minWidth: getTouchOptimizedButtonSize(40), minHeight: getTouchOptimizedButtonSize(40) }}
          >
            ←
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentPage ? 'bg-quantum-blue' : 'bg-glass-300'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-2 rounded-lg bg-glass-100 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minWidth: getTouchOptimizedButtonSize(40), minHeight: getTouchOptimizedButtonSize(40) }}
          >
            →
          </button>
        </div>
      )}

      {/* Instrucciones para móviles */}
      {isTouch && totalPages > 1 && (
        <div className="text-center mb-4">
          <p className="text-glass-300 text-sm">
            Desliza horizontalmente para navegar entre páginas
          </p>
        </div>
      )}

      {/* Grid principal */}
      <div
        ref={ref}
        id={id}
        role={role}
        aria-label={ariaLabel}
        tabIndex={tabIndex}
        className={`${gridClasses} ${dropZoneActive ? 'bg-quantum-blue/10 border-2 border-dashed border-quantum-blue/50 rounded-lg' : ''} ${
          isTouch ? 'touch-pan-x' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {currentWidgets.map((widget) => (
          <GridItem
            key={widget.id}
            widget={widget}
            isDraggable={isDraggable && gridConfig.isDraggable}
            isResizable={isResizable && gridConfig.isResizable}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onResize={handleWidgetResize}
          >
            {/* El contenido del widget se renderizará aquí */}
            {children}
          </GridItem>
        ))}

        {/* Indicador de drop zone cuando está activo */}
        {dropZoneActive && draggedWidget && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="bg-quantum-blue/20 backdrop-blur-sm rounded-lg p-4 border-2 border-dashed border-quantum-blue">
              <div className="text-quantum-blue text-center">
                <div className="text-2xl mb-2">📍</div>
                <div className="text-sm font-medium">Suelta aquí para reposicionar</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Información de debug (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs p-2 rounded opacity-50 hover:opacity-100 transition-opacity">
          <div>Breakpoint: {currentBreakpoint}</div>
          <div>Columnas: {currentGridConfig.cols}</div>
          <div>Widgets: {enabledWidgets.length}</div>
          {draggedWidget && <div>Arrastrando: {draggedWidget}</div>}
        </div>
      )}
    </div>
  );
});

DashboardGrid.displayName = 'DashboardGrid';

export default DashboardGrid;