import React, { Suspense, ComponentType, LazyExoticComponent } from 'react';
import { WidgetType } from '../types/widgets';

// Loading fallback component for widgets
const WidgetLoadingFallback: React.FC<{ widgetType?: WidgetType }> = ({ widgetType }) => (
  <div className="w-full h-full min-h-[200px] bg-glass-50 backdrop-blur-md border border-glass-100 rounded-xl p-6 flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-quantum-blue/30 border-t-quantum-blue rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-glass-300 text-sm">
        Cargando {widgetType ? widgetType.replace('_', ' ').toLowerCase() : 'widget'}...
      </p>
    </div>
  </div>
);

// Loading fallback for modals
const ModalLoadingFallback: React.FC = () => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="bg-glass-50 backdrop-blur-md border border-glass-100 rounded-2xl p-8 max-w-md w-full mx-4">
      <div className="text-center">
        <div className="w-12 h-12 border-3 border-quantum-blue/30 border-t-quantum-blue rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Cargando...</p>
      </div>
    </div>
  </div>
);

// Higher-order component for lazy loading with Suspense
export const withLazyLoading = (
  LazyComponent: LazyExoticComponent<ComponentType<any>>,
  fallback?: React.ReactNode,
  widgetType?: WidgetType
) => {
  const WrappedComponent: React.FC<any> = (props) => (
    <Suspense fallback={fallback || <WidgetLoadingFallback widgetType={widgetType} />}>
      <LazyComponent {...props} />
    </Suspense>
  );

  WrappedComponent.displayName = `LazyLoaded(Component)`;
  
  return WrappedComponent;
};

// Utility for creating lazy widgets with proper fallbacks
export const createLazyWidget = <P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  widgetType: WidgetType
) => {
  const LazyComponent = React.lazy(importFn);
  return withLazyLoading(LazyComponent, <WidgetLoadingFallback widgetType={widgetType} />, widgetType);
};

// Utility for creating lazy modals
export const createLazyModal = <P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>
) => {
  const LazyComponent = React.lazy(importFn);
  return withLazyLoading(LazyComponent, <ModalLoadingFallback />);
};

// Preload function for critical components
export const preloadComponent = (importFn: () => Promise<any>) => {
  // Start loading the component but don't wait for it
  importFn().catch(error => {
    console.warn('Failed to preload component:', error);
  });
};

// Utility to preload components based on user role or interaction
export const preloadByRole = (userRole: string) => {
  // Preload components that are likely to be used based on user role
  if (userRole === 'ADMIN') {
    // Preload admin-specific components
    preloadComponent(() => import('../components/widgets/MetricsWidget'));
  }
  
  // Always preload commonly used components
  preloadComponent(() => import('../components/modals/SettingsModal'));
};

// Intersection Observer utility for lazy loading on scroll
export const useLazyLoadOnScroll = (
  ref: React.RefObject<HTMLElement>,
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
            observer.unobserve(element);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, callback, options]);
};

export { WidgetLoadingFallback, ModalLoadingFallback };