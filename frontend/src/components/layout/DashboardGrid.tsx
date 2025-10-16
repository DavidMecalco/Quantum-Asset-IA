import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { WidgetState, WidgetSize, GridConfig } from '../../types/widgets';

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

// Componente para items individuales del grid
const GridItem: React.FC<GridItemProps> = ({
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

  // Mapear tamaños de widget a clases CSS
  const getSizeClasses = (size: WidgetSize): string => {
    switch (size) {
      case WidgetSize.SMALL:
        return 'col-span-1 row-span-2';
      case WidgetSize.MEDIUM:
        return 'col-span-2 row-span-2';
      case WidgetSize.LARGE:
        return 'col-span-2 row-span-3';
      default:
        return 'col-span-2 row-span-2';
    }
  };

  // Manejar inicio de drag
  const handleDragStart = useCallback((event: React.DragEvent) => {
    if (!isDraggable) return;
    
    setIsDragging(true);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', widget.id);
    
    // Agregar clase visual durante el drag
    event.currentTarget.classList.add('opacity-50', 'scale-95');
    
    onDragStart?.(widget.id, event);
  }, [isDraggable, widget.id, onDragStart]);

  // Manejar fin de drag
  const handleDragEnd = useCallback((event: React.DragEvent) => {
    setIsDragging(false);
    
    // Remover clases visuales
    event.currentTarget.classList.remove('opacity-50', 'scale-95');
    
    onDragEnd?.(widget.id, event);
  }, [widget.id, onDragEnd]);

  // Manejar cambio de tamaño
  const handleSizeChange = useCallback((newSize: WidgetSize) => {
    if (!isResizable) return;
    onResize?.(widget.id, newSize);
  }, [isResizable, widget.id, onResize]);

  const baseClasses = `
    relative bg-glass-50 backdrop-blur-md rounded-2xl border border-glass-100
    transition-all duration-300 ease-in-out
    hover:bg-glass-100 hover:border-glass-200
    ${getSizeClasses(widget.size)}
    ${isDragging ? 'z-50' : 'z-10'}
    ${isDraggable ? 'cursor-move' : ''}
    ${className}
  `;

  return (
    <div
      className={baseClasses}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-widget-id={widget.id}
      data-widget-type={widget.type}
    >
      {/* Handle de drag (visible solo en hover si es draggable) */}
      {isDraggable && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-6 h-6 flex items-center justify-center text-glass-300 hover:text-white cursor-move">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
            </svg>
          </div>
        </div>
      )}

      {/* Controles de resize (visible solo en hover si es resizable) */}
      {isResizable && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex space-x-1">
            <button
              onClick={() => handleSizeChange(WidgetSize.SMALL)}
              className={`w-3 h-3 rounded-full border-2 transition-colors duration-200 ${
                widget.size === WidgetSize.SMALL 
                  ? 'bg-quantum-blue border-quantum-blue' 
                  : 'border-glass-300 hover:border-white'
              }`}
              title="Pequeño"
            />
            <button
              onClick={() => handleSizeChange(WidgetSize.MEDIUM)}
              className={`w-3 h-3 rounded-full border-2 transition-colors duration-200 ${
                widget.size === WidgetSize.MEDIUM 
                  ? 'bg-quantum-purple border-quantum-purple' 
                  : 'border-glass-300 hover:border-white'
              }`}
              title="Mediano"
            />
            <button
              onClick={() => handleSizeChange(WidgetSize.LARGE)}
              className={`w-3 h-3 rounded-full border-2 transition-colors duration-200 ${
                widget.size === WidgetSize.LARGE 
                  ? 'bg-quantum-indigo border-quantum-indigo' 
                  : 'border-glass-300 hover:border-white'
              }`}
              title="Grande"
            />
          </div>
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
};

// Componente principal DashboardGrid
export const DashboardGrid: React.FC<DashboardGridProps> = ({
  widgets,
  gridConfig,
  onLayoutChange,
  onWidgetResize,
  onWidgetMove,
  className = '',
  children,
  isDraggable = true,
  isResizable = true,
  enableDropZone = true
}) => {
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dropZoneActive, setDropZoneActive] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');

  // Detectar breakpoint actual basado en el ancho de la ventana
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= 1024) setCurrentBreakpoint('lg');
      else if (width >= 768) setCurrentBreakpoint('md');
      else if (width >= 640) setCurrentBreakpoint('sm');
      else setCurrentBreakpoint('xs');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

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

  // Manejar inicio de drag
  const handleDragStart = useCallback((widgetId: string, _event: React.DragEvent) => {
    setDraggedWidget(widgetId);
  }, []);

  // Manejar fin de drag
  const handleDragEnd = useCallback((_widgetId: string, _event: React.DragEvent) => {
    setDraggedWidget(null);
    setDropZoneActive(false);
  }, []);

  // Manejar drag over en el grid
  const handleDragOver = useCallback((event: React.DragEvent) => {
    if (!enableDropZone) return;
    
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropZoneActive(true);
  }, [enableDropZone]);

  // Manejar drag leave del grid
  const handleDragLeave = useCallback((event: React.DragEvent) => {
    // Solo desactivar si realmente salimos del grid
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setDropZoneActive(false);
    }
  }, []);

  // Manejar drop en el grid
  const handleDrop = useCallback((event: React.DragEvent) => {
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

  // Manejar resize de widget
  const handleWidgetResize = useCallback((widgetId: string, size: WidgetSize) => {
    if (!onWidgetResize || !onLayoutChange) return;

    onWidgetResize(widgetId, size);

    const updatedWidgets = widgets.map(widget => 
      widget.id === widgetId ? { ...widget, size } : widget
    );

    onLayoutChange(updatedWidgets);
  }, [widgets, onWidgetResize, onLayoutChange]);

  // Renderizar widgets habilitados
  const enabledWidgets = widgets.filter(widget => widget.isEnabled);

  return (
    <div className="w-full h-full relative">
      {/* Grid principal */}
      <div
        className={`${gridClasses} ${dropZoneActive ? 'bg-quantum-blue/10 border-2 border-dashed border-quantum-blue/50 rounded-lg' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {enabledWidgets.map((widget) => (
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
};

export default DashboardGrid;