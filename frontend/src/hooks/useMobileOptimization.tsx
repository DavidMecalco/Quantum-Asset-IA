/**
 * Hook personalizado para optimizaciones móviles
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  isMobileDevice, 
  isTouchDevice, 
  getViewportSize, 
  isPortrait, 
  handleOrientationChange,
  disablePullToRefresh 
} from '../utils/touchGestures';

// Tipos para el hook
export interface MobileOptimizationState {
  isMobile: boolean;
  isTouch: boolean;
  viewport: { width: number; height: number };
  orientation: 'portrait' | 'landscape';
  isSmallScreen: boolean;
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface MobileOptimizationOptions {
  enablePullToRefreshDisable?: boolean;
  enableViewportMetaFix?: boolean;
  enableIOSScrollFix?: boolean;
}

/**
 * Hook principal para optimizaciones móviles
 */
export const useMobileOptimization = (options: MobileOptimizationOptions = {}) => {
  const {
    enablePullToRefreshDisable = true,
    enableViewportMetaFix = true,
    enableIOSScrollFix = true
  } = options;

  const [state, setState] = useState<MobileOptimizationState>(() => ({
    isMobile: isMobileDevice(),
    isTouch: isTouchDevice(),
    viewport: getViewportSize(),
    orientation: isPortrait() ? 'portrait' : 'landscape',
    isSmallScreen: window.innerWidth < 768,
    breakpoint: getBreakpoint(window.innerWidth)
  }));

  // Función para determinar el breakpoint
  function getBreakpoint(width: number): MobileOptimizationState['breakpoint'] {
    if (width < 640) return 'xs';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1280) return 'lg';
    return 'xl';
  }

  // Actualizar estado cuando cambie el viewport
  const updateViewport = useCallback(() => {
    const viewport = getViewportSize();
    setState(prev => ({
      ...prev,
      viewport,
      orientation: isPortrait() ? 'portrait' : 'landscape',
      isSmallScreen: viewport.width < 768,
      breakpoint: getBreakpoint(viewport.width)
    }));
  }, []);

  // Configurar optimizaciones móviles
  useEffect(() => {
    // Deshabilitar pull-to-refresh si está habilitado
    if (enablePullToRefreshDisable && state.isMobile) {
      disablePullToRefresh();
    }

    // Configurar viewport meta tag si está habilitado
    if (enableViewportMetaFix) {
      let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        document.head.appendChild(viewportMeta);
      }
      
      // Configuración optimizada para móviles
      viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    }

    // Configurar scroll fix para iOS si está habilitado
    if (enableIOSScrollFix && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      (document.body.style as any).webkitOverflowScrolling = 'touch';
      (document.body.style as any).overflowScrolling = 'touch';
    }
  }, [state.isMobile, enablePullToRefreshDisable, enableViewportMetaFix, enableIOSScrollFix]);

  // Escuchar cambios de orientación y viewport
  useEffect(() => {
    const cleanup = handleOrientationChange(updateViewport);
    window.addEventListener('resize', updateViewport);

    return () => {
      cleanup();
      window.removeEventListener('resize', updateViewport);
    };
  }, [updateViewport]);

  return state;
};

/**
 * Hook para detectar si el dispositivo está en modo landscape
 */
export const useIsLandscape = () => {
  const [isLandscapeMode, setIsLandscapeMode] = useState(() => 
    window.innerWidth > window.innerHeight
  );

  useEffect(() => {
    const handleResize = () => {
      setIsLandscapeMode(window.innerWidth > window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return isLandscapeMode;
};

/**
 * Hook para manejar el teclado virtual en móviles
 */
export const useVirtualKeyboard = () => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!isMobileDevice()) return;

    const initialViewportHeight = window.visualViewport?.height || window.innerHeight;
    
    const handleViewportChange = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      
      // Si la diferencia es significativa, probablemente el teclado está abierto
      const keyboardOpen = heightDifference > 150;
      
      setIsKeyboardOpen(keyboardOpen);
      setKeyboardHeight(keyboardOpen ? heightDifference : 0);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
      };
    } else {
      // Fallback para navegadores que no soportan visualViewport
      window.addEventListener('resize', handleViewportChange);
      return () => {
        window.removeEventListener('resize', handleViewportChange);
      };
    }
  }, []);

  return { isKeyboardOpen, keyboardHeight };
};

/**
 * Hook para optimizar el rendimiento en dispositivos móviles
 */
export const useMobilePerformance = () => {
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);

  useEffect(() => {
    // Detectar dispositivos de gama baja basado en características del navegador
    const checkDevicePerformance = () => {
      // Verificar memoria disponible (si está disponible)
      const memory = (navigator as any).deviceMemory;
      if (memory && memory <= 2) {
        setIsLowEndDevice(true);
        return;
      }

      // Verificar número de núcleos del procesador
      const cores = navigator.hardwareConcurrency;
      if (cores && cores <= 2) {
        setIsLowEndDevice(true);
        return;
      }

      // Verificar user agent para dispositivos conocidos de gama baja
      const userAgent = navigator.userAgent.toLowerCase();
      const lowEndPatterns = [
        'android 4',
        'android 5',
        'android 6',
        'iphone os 9',
        'iphone os 10',
        'iphone os 11'
      ];

      if (lowEndPatterns.some(pattern => userAgent.includes(pattern))) {
        setIsLowEndDevice(true);
        return;
      }

      setIsLowEndDevice(false);
    };

    checkDevicePerformance();
  }, []);

  return { isLowEndDevice };
};

/**
 * Hook para manejar gestos de navegación móvil
 */
export const useMobileNavigation = () => {
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    const updateNavigationState = () => {
      setCanGoBack(window.history.length > 1);
      // canGoForward es más difícil de detectar de forma confiable
      setCanGoForward(false);
    };

    updateNavigationState();
    
    // Escuchar cambios en el historial
    window.addEventListener('popstate', updateNavigationState);
    
    return () => {
      window.removeEventListener('popstate', updateNavigationState);
    };
  }, []);

  const goBack = useCallback(() => {
    if (canGoBack) {
      window.history.back();
    }
  }, [canGoBack]);

  const goForward = useCallback(() => {
    if (canGoForward) {
      window.history.forward();
    }
  }, [canGoForward]);

  return {
    canGoBack,
    canGoForward,
    goBack,
    goForward
  };
};

/**
 * Hook para manejar el estado de conexión en móviles
 */
export const useMobileConnection = () => {
  const [connectionState, setConnectionState] = useState(() => ({
    isOnline: navigator.onLine,
    connectionType: (navigator as any).connection?.effectiveType || 'unknown',
    isSlowConnection: false
  }));

  useEffect(() => {
    const updateConnectionState = () => {
      const connection = (navigator as any).connection;
      const effectiveType = connection?.effectiveType || 'unknown';
      
      setConnectionState({
        isOnline: navigator.onLine,
        connectionType: effectiveType,
        isSlowConnection: ['slow-2g', '2g'].includes(effectiveType)
      });
    };

    // Escuchar cambios de conexión
    window.addEventListener('online', updateConnectionState);
    window.addEventListener('offline', updateConnectionState);
    
    // Escuchar cambios en el tipo de conexión (si está disponible)
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateConnectionState);
    }

    return () => {
      window.removeEventListener('online', updateConnectionState);
      window.removeEventListener('offline', updateConnectionState);
      
      if (connection) {
        connection.removeEventListener('change', updateConnectionState);
      }
    };
  }, []);

  return connectionState;
};

/**
 * Hook para optimizar imágenes en móviles
 */
export const useMobileImageOptimization = () => {
  const { isSmallScreen } = useMobileOptimization();
  const { isSlowConnection } = useMobileConnection();
  const { isLowEndDevice } = useMobilePerformance();

  const getOptimizedImageProps = useCallback((src: string, alt: string) => {
    const shouldOptimize = isSmallScreen || isSlowConnection || isLowEndDevice;
    
    return {
      src: shouldOptimize ? `${src}?w=400&q=75` : src,
      alt,
      loading: 'lazy' as const,
      decoding: 'async' as const,
      ...(shouldOptimize && {
        sizes: '(max-width: 768px) 100vw, 50vw'
      })
    };
  }, [isSmallScreen, isSlowConnection, isLowEndDevice]);

  return { getOptimizedImageProps };
};