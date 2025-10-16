# Testing Strategy - Home Dashboard

## Overview

This directory contains the testing infrastructure for the Home Dashboard feature. The test suite is built using Vitest and React Testing Library.

## Test Structure

```
src/test/
├── setup.ts          # Global test setup and mocks
├── utils.tsx         # Testing utilities and helpers
└── README.md         # This file
```

## Testing Utilities

### Mock Data
- `mockSystemStatus` - Mock system status data
- `mockTask` - Mock task/work order data
- `mockNotification` - Mock notification data
- `mockSystemMetrics` - Mock metrics data for admin widgets
- `mockUser` - Mock user data

### Render Helpers
- `renderWithProviders` - Renders components with necessary providers (Router, QueryClient)
- `createMockService` - Creates mock service objects with specified methods
- `createMockQuery` - Creates mock React Query hook responses

### Test Configuration
- Global mocks for browser APIs (IntersectionObserver, ResizeObserver, matchMedia)
- localStorage and sessionStorage mocks
- Vitest configuration with coverage reporting

## Running Tests

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Categories

### Unit Tests (Optional - marked with *)
- Individual widget components
- Custom hooks
- Service functions
- Utility functions

### Integration Tests (Optional - marked with *)
- Widget interactions
- Data flow between components
- Error handling scenarios
- Responsive behavior

## Best Practices

1. Use `renderWithProviders` for components that need React Query or Router
2. Mock external services using `createMockService`
3. Use descriptive test names that explain the scenario
4. Test both success and error states
5. Verify accessibility features where applicable
6. Mock time-dependent functions for consistent results

## Coverage Goals

- Focus on critical business logic
- Test error boundaries and fallback states
- Verify user interactions work correctly
- Ensure responsive behavior functions properly