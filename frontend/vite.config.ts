/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react'],
          'query-vendor': ['@tanstack/react-query'],
          
          // Feature chunks
          'widgets': [
            './src/components/widgets/WelcomeWidget',
            './src/components/widgets/SystemStatusWidget',
            './src/components/widgets/TasksWidget',
            './src/components/widgets/QuickActionsWidget',
            './src/components/widgets/NotificationsWidget'
          ],
          'admin-widgets': [
            './src/components/widgets/MetricsWidget'
          ],
          'modals': [
            './src/components/modals/NotificationModal',
            './src/components/modals/SettingsModal',
            './src/components/modals/HelpModal'
          ],
          'services': [
            './src/services/dashboardService',
            './src/services/maximoService',
            './src/services/notificationService'
          ],
          'layout': [
            './src/components/layout/DashboardGrid',
            './src/components/layout/DashboardHeader',
            './src/components/layout/WidgetContainer'
          ]
        },
        chunkFileNames: () => {
          return `js/[name]-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return `images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext || '')) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for better debugging
    sourcemap: true
  },
})