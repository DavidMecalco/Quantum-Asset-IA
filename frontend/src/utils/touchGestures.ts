/**
 * Utilidades para gestos táctiles y optimización móvil
 */

import React from 'react';

// Tipos para gestos táctiles
export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  duration: number;
  velocity: number;
}

export interface PinchGesture {
  scale: number;
  center: TouchPoint;
}

export interface TouchGestureOptions {
  swipeThreshold?: number;
  swipeVelocityThreshold?: number;
  pinchThreshold?: number;
  longPressDelay?: number;
  preventScroll?: boolean;
}

// Configuración por defecto
const DEFAULT_OPTIONS: Required<TouchGestureOptions> = {
  swipeThreshold: 50,
  swipeVelocityThreshold: 0.3,
  pinchThreshold: 0.1,
  longPressDelay: 500,
  preventScroll: false
};

/**
 * Calcula la distancia entre dos puntos
 */
export const getDistance = (point1: TouchPoint, point2: TouchPoint): number => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calcula el ángulo entre dos puntos
 */
export const getAngle = (point1: TouchPoint, point2: TouchPoint): number => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.atan2(dy, dx) * 180 / Math.PI;
};

/**
 * Determina la dirección del swipe basado en el ángulo
 */
export const getSwipeDirection = (angle: number): SwipeGesture['direction'] => {
  const absAngle = Math.abs(angle);
  
  if (absAngle <= 45 || absAngle >= 135) {
    return angle > 0 ? 'right' : 'left';
  } else {
    return angle > 0 ? 'down' : 'up';
  }
};

/**
 * Obtiene las coordenadas de un evento táctil
 */
export const getTouchPoint = (touch: Touch): TouchPoint => ({
  x: touch.clientX,
  y: touch.clientY,
  timestamp: Date.now()
});

/**
 * Clase para manejar gestos táctiles
 */
export class TouchGestureHandler {
  private element: HTMLElement;
  private options: Required<TouchGestureOptions>;
  private startPoint: TouchPoint | null = null;
  private currentPoint: TouchPoint | null = null;
  private isTracking = false;
  private longPressTimer: number | null = null;
  private initialDistance = 0;


  // Callbacks
  private onSwipe?: (gesture: SwipeGesture) => void;
  private onPinch?: (gesture: PinchGesture) => void;
  private onLongPress?: (point: TouchPoint) => void;
  private onTap?: (point: TouchPoint) => void;
  private onDoubleTap?: (point: TouchPoint) => void;

  private lastTapTime = 0;
  private tapCount = 0;

  constructor(element: HTMLElement, options: TouchGestureOptions = {}) {
    this.element = element;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: !this.options.preventScroll });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: !this.options.preventScroll });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: !this.options.preventScroll });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: true });
  }

  private handleTouchStart(event: TouchEvent): void {
    if (this.options.preventScroll) {
      event.preventDefault();
    }

    const touches = event.touches;
    
    if (touches.length === 1) {
      // Gesto de un dedo
      this.startPoint = getTouchPoint(touches[0]);
      this.currentPoint = this.startPoint;
      this.isTracking = true;

      // Iniciar timer para long press
      this.longPressTimer = window.setTimeout(() => {
        if (this.isTracking && this.startPoint) {
          this.onLongPress?.(this.startPoint);
        }
      }, this.options.longPressDelay);

    } else if (touches.length === 2) {
      // Gesto de pinch
      const point1 = getTouchPoint(touches[0]);
      const point2 = getTouchPoint(touches[1]);
      this.initialDistance = getDistance(point1, point2);
      this.clearLongPressTimer();
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (!this.isTracking) return;

    if (this.options.preventScroll) {
      event.preventDefault();
    }

    const touches = event.touches;

    if (touches.length === 1 && this.startPoint) {
      // Actualizar punto actual
      this.currentPoint = getTouchPoint(touches[0]);
      
      // Cancelar long press si hay movimiento significativo
      const distance = getDistance(this.startPoint, this.currentPoint);
      if (distance > 10) {
        this.clearLongPressTimer();
      }

    } else if (touches.length === 2) {
      // Manejar pinch
      const point1 = getTouchPoint(touches[0]);
      const point2 = getTouchPoint(touches[1]);
      const currentDistance = getDistance(point1, point2);
      
      if (this.initialDistance > 0) {
        const scale = currentDistance / this.initialDistance;
        const center: TouchPoint = {
          x: (point1.x + point2.x) / 2,
          y: (point1.y + point2.y) / 2,
          timestamp: Date.now()
        };

        this.onPinch?.({ scale, center });
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (this.options.preventScroll) {
      event.preventDefault();
    }

    this.clearLongPressTimer();

    if (!this.isTracking || !this.startPoint || !this.currentPoint) {
      this.resetTracking();
      return;
    }

    const distance = getDistance(this.startPoint, this.currentPoint);
    const duration = this.currentPoint.timestamp - this.startPoint.timestamp;
    const velocity = distance / duration;

    // Determinar si es un swipe
    if (distance >= this.options.swipeThreshold && velocity >= this.options.swipeVelocityThreshold) {
      const angle = getAngle(this.startPoint, this.currentPoint);
      const direction = getSwipeDirection(angle);
      
      const swipeGesture: SwipeGesture = {
        direction,
        distance,
        duration,
        velocity
      };

      this.onSwipe?.(swipeGesture);
    } else if (distance < 10) {
      // Es un tap
      this.handleTap(this.currentPoint);
    }

    this.resetTracking();
  }

  private handleTouchCancel(): void {
    this.clearLongPressTimer();
    this.resetTracking();
  }

  private handleTap(point: TouchPoint): void {
    const now = Date.now();
    const timeSinceLastTap = now - this.lastTapTime;

    if (timeSinceLastTap < 300) {
      // Double tap
      this.tapCount++;
      if (this.tapCount === 2) {
        this.onDoubleTap?.(point);
        this.tapCount = 0;
      }
    } else {
      // Single tap
      this.tapCount = 1;
      setTimeout(() => {
        if (this.tapCount === 1) {
          this.onTap?.(point);
        }
        this.tapCount = 0;
      }, 300);
    }

    this.lastTapTime = now;
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private resetTracking(): void {
    this.isTracking = false;
    this.startPoint = null;
    this.currentPoint = null;
    this.initialDistance = 0;
  }

  // Métodos públicos para registrar callbacks
  public onSwipeGesture(callback: (gesture: SwipeGesture) => void): void {
    this.onSwipe = callback;
  }

  public onPinchGesture(callback: (gesture: PinchGesture) => void): void {
    this.onPinch = callback;
  }

  public onLongPressGesture(callback: (point: TouchPoint) => void): void {
    this.onLongPress = callback;
  }

  public onTapGesture(callback: (point: TouchPoint) => void): void {
    this.onTap = callback;
  }

  public onDoubleTapGesture(callback: (point: TouchPoint) => void): void {
    this.onDoubleTap = callback;
  }

  // Limpiar event listeners
  public destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    this.clearLongPressTimer();
  }
}

/**
 * Hook personalizado para gestos táctiles
 */
export const useTouchGestures = (
  elementRef: React.RefObject<HTMLElement>,
  options: TouchGestureOptions = {}
) => {
  const [gestureHandler, setGestureHandler] = React.useState<TouchGestureHandler | null>(null);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handler = new TouchGestureHandler(element, options);
    setGestureHandler(handler);

    return () => {
      handler.destroy();
    };
  }, [elementRef, options]);

  return gestureHandler;
};

/**
 * Utilidades para detección de dispositivos móviles
 */
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const getViewportSize = () => ({
  width: window.innerWidth,
  height: window.innerHeight
});

export const isPortrait = (): boolean => {
  return window.innerHeight > window.innerWidth;
};

export const isLandscape = (): boolean => {
  return window.innerWidth > window.innerHeight;
};

/**
 * Optimizaciones para botones táctiles
 */
export const getTouchOptimizedButtonSize = (baseSize: number): number => {
  // Mínimo 44px según las guías de accesibilidad
  const minTouchSize = 44;
  return Math.max(baseSize, minTouchSize);
};

/**
 * Utilidad para prevenir el zoom en inputs en iOS
 */
export const preventIOSZoom = (input: HTMLInputElement): void => {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    const fontSize = parseFloat(window.getComputedStyle(input).fontSize);
    if (fontSize < 16) {
      input.style.fontSize = '16px';
    }
  }
};

/**
 * Utilidad para manejar la orientación del dispositivo
 */
export const handleOrientationChange = (callback: (orientation: 'portrait' | 'landscape') => void): (() => void) => {
  const handleChange = () => {
    // Pequeño delay para que el viewport se actualice
    setTimeout(() => {
      callback(isPortrait() ? 'portrait' : 'landscape');
    }, 100);
  };

  window.addEventListener('orientationchange', handleChange);
  window.addEventListener('resize', handleChange);

  return () => {
    window.removeEventListener('orientationchange', handleChange);
    window.removeEventListener('resize', handleChange);
  };
};

/**
 * Utilidad para optimizar el scroll en móviles
 */
export const enableMomentumScrolling = (element: HTMLElement): void => {
  (element.style as any).webkitOverflowScrolling = 'touch';
  (element.style as any).overflowScrolling = 'touch';
};

/**
 * Utilidad para deshabilitar el pull-to-refresh en móviles
 */
export const disablePullToRefresh = (): void => {
  document.body.style.overscrollBehavior = 'none';
  
  // Para iOS Safari
  let startY = 0;
  document.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    const currentY = e.touches[0].clientY;
    if (startY < currentY && window.scrollY === 0) {
      e.preventDefault();
    }
  }, { passive: false });
};