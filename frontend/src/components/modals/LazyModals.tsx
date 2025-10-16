import { lazy } from 'react';

// Lazy load modal components
export const LazyNotificationModal = lazy(() => import('./NotificationModal'));

export const LazySettingsModal = lazy(() => import('./SettingsModal'));

export const LazyHelpModal = lazy(() => import('./HelpModal'));

// Preload commonly used modals
export const preloadCriticalModals = () => {
  // Settings modal is commonly accessed
  import('./SettingsModal');
};

// Preload modals on user interaction hints
export const preloadOnInteraction = () => {
  // Preload when user hovers over notification or settings buttons
  const preloadNotificationModal = () => import('./NotificationModal');
  const preloadSettingsModal = () => import('./SettingsModal');
  const preloadHelpModal = () => import('./HelpModal');

  return {
    preloadNotificationModal,
    preloadSettingsModal,
    preloadHelpModal,
  };
};