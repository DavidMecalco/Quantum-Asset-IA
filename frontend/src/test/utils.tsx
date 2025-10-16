import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Mock data for testing
export const mockSystemStatus = {
  isConnected: true,
  lastSync: new Date(),
  performance: 'good' as const,
  activeUsers: 25,
  systemLoad: 45,
}

export const mockTask = {
  id: '1',
  title: 'Test Task',
  priority: 'medium' as const,
  dueDate: new Date(),
  status: 'pending' as const,
  assignedTo: 'test-user',
  workOrderNumber: 'WO-001',
}

export const mockNotification = {
  id: '1',
  type: 'info' as const,
  title: 'Test Notification',
  message: 'This is a test notification',
  timestamp: new Date(),
  isRead: false,
}

export const mockSystemMetrics = {
  cpuUsage: 45,
  memoryUsage: 60,
  diskUsage: 30,
  networkLatency: 25,
  activeConnections: 150,
  errorRate: 0.5,
}

export const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user' as const,
  lastLogin: new Date(),
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  queryClient?: QueryClient
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    initialEntries = ['/'],
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    }),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </BrowserRouter>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Helper to create mock functions for services
export const createMockService = <T extends Record<string, any>>(
  methods: (keyof T)[]
): T => {
  const mock = {} as T
  methods.forEach((method) => {
    mock[method] = vi.fn() as any
  })
  return mock
}

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Helper to create mock widget settings
export const createMockWidgetSettings = (overrides = {}) => ({
  enabledWidgets: ['welcome', 'system-status', 'tasks'],
  widgetOrder: ['welcome', 'system-status', 'tasks'],
  widgetSizes: {
    welcome: 'medium' as const,
    'system-status': 'small' as const,
    tasks: 'large' as const,
  },
  ...overrides,
})

// Helper to mock React Query hooks
export const createMockQuery = <T,>(
  data: T, 
  options: { isLoading?: boolean; error?: Error } = {}
) => ({
  data,
  isLoading: options.isLoading ?? false,
  error: options.error ?? null,
  isError: !!options.error,
  refetch: vi.fn(),
  ...options,
})