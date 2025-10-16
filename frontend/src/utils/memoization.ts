import { useMemo, useCallback, useRef, useEffect } from 'react';

// Debounce hook for expensive operations
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook for frequent events
export const useThrottle = <T>(value: T, limit: number): T => {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

// Memoized callback with dependencies
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps);
};

// Memoized value with deep comparison
export const useDeepMemo = <T>(factory: () => T, deps: React.DependencyList): T => {
  const ref = useRef<{ deps: React.DependencyList; value: T }>();

  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() };
  }

  return ref.current.value;
};

// Deep equality check for objects and arrays
const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }
  
  return false;
};

// Memoized expensive calculations
export const useExpensiveCalculation = <T, P extends any[]>(
  calculation: (...args: P) => T,
  dependencies: P,
  shouldRecalculate?: (prev: P, current: P) => boolean
): T => {
  return useMemo(() => {
    return calculation(...dependencies);
  }, shouldRecalculate ? [shouldRecalculate(dependencies, dependencies)] : dependencies);
};

// Cache for function results
class FunctionCache<T extends (...args: any[]) => any> {
  private cache = new Map<string, ReturnType<T>>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): ReturnType<T> | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: ReturnType<T>): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }
}

// Memoize function with cache
export const memoizeFunction = <T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string,
  maxCacheSize?: number
): T => {
  const cache = new FunctionCache<T>(maxCacheSize);
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      const cachedResult = cache.get(key);
      if (cachedResult !== undefined) {
        return cachedResult;
      }
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Debounced function for configuration updates
export const createDebouncedSetter = <T>(
  setter: (value: T) => void,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout;
  
  return (value: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      setter(value);
    }, delay);
  };
};

// Performance monitoring hook
export const usePerformanceMonitor = (name: string) => {
  const startTime = useRef<number>();
  
  useEffect(() => {
    startTime.current = performance.now();
    
    return () => {
      if (startTime.current) {
        const duration = performance.now() - startTime.current;
        console.log(`${name} render time: ${duration.toFixed(2)}ms`);
      }
    };
  });
};

// Intersection observer for lazy rendering
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
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
  }, [ref, options]);
  
  return isIntersecting;
};

// React import for useState
import React from 'react';