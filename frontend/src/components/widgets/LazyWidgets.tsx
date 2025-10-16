import { lazy } from 'react';
import { WidgetType } from '../../types/widgets';

// Lazy load all widget components with proper fallbacks
export const LazyWelcomeWidget = lazy(() => import('./WelcomeWidget'));

export const LazySystemStatusWidget = lazy(() => import('./SystemStatusWidget'));

export const LazyTasksWidget = lazy(() => import('./TasksWidget'));

export const LazyMetricsWidget = lazy(() => import('./MetricsWidget'));

export const LazyQuickActionsWidget = lazy(() => import('./QuickActionsWidget'));

export const LazyNotificationsWidget = lazy(() => import('./NotificationsWidget'));

// Registry of lazy widgets for dynamic loading
export const LAZY_WIDGET_COMPONENTS = {
  [WidgetType.WELCOME]: LazyWelcomeWidget,
  [WidgetType.SYSTEM_STATUS]: LazySystemStatusWidget,
  [WidgetType.TASKS]: LazyTasksWidget,
  [WidgetType.METRICS]: LazyMetricsWidget,
  [WidgetType.QUICK_ACTIONS]: LazyQuickActionsWidget,
  [WidgetType.NOTIFICATIONS]: LazyNotificationsWidget,
} as const;

// Preload critical widgets (those that are always visible)
export const preloadCriticalWidgets = () => {
  // Preload welcome widget as it's always shown
  import('./WelcomeWidget');
  
  // Preload system status as it's commonly used
  import('./SystemStatusWidget');
};

// Preload widgets based on user role
export const preloadWidgetsByRole = (userRole: string) => {
  if (userRole === 'ADMIN') {
    // Preload admin-specific widgets
    import('./MetricsWidget');
  }
  
  // Preload commonly used widgets for all roles
  import('./TasksWidget');
  import('./QuickActionsWidget');
};