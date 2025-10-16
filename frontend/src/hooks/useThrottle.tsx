import { useRef, useCallback } from 'react';

/**
 * Hook para throttling de funciones
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): [T, boolean] => {
  const lastCallTime = useRef<number>(0);
  const isThrottled = useRef<boolean>(false);

  const throttledFunction = useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCallTime.current >= delay) {
        lastCallTime.current = now;
        isThrottled.current = false;
        return func(...args);
      } else {
        isThrottled.current = true;
        return Promise.reject(new Error('Función throttled'));
      }
    }) as T,
    [func, delay]
  );

  return [throttledFunction, isThrottled.current];
};

/**
 * Hook para debouncing de funciones
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedFunction = useCallback(
    ((...args: Parameters<T>) => {
      clearTimeout(timeoutRef.current);
      
      return new Promise((resolve, reject) => {
        timeoutRef.current = setTimeout(() => {
          try {
            const result = func(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    }) as T,
    [func, delay]
  );

  return debouncedFunction;
};

/**
 * Hook para rate limiting avanzado con ventana deslizante
 */
export const useAdvancedRateLimit = (
  maxRequests: number,
  windowMs: number
) => {
  const requests = useRef<number[]>([]);

  const isAllowed = useCallback(() => {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Filtrar requests dentro de la ventana actual
    requests.current = requests.current.filter(time => time > windowStart);

    // Verificar si se puede hacer otra request
    if (requests.current.length < maxRequests) {
      requests.current.push(now);
      return true;
    }

    return false;
  }, [maxRequests, windowMs]);

  const getRemainingRequests = useCallback(() => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Filtrar requests dentro de la ventana actual
    const currentRequests = requests.current.filter(time => time > windowStart);
    
    return Math.max(0, maxRequests - currentRequests.length);
  }, [maxRequests, windowMs]);

  const getTimeUntilReset = useCallback(() => {
    if (requests.current.length === 0) return 0;
    
    const oldestRequest = Math.min(...requests.current);
    const resetTime = oldestRequest + windowMs;
    
    return Math.max(0, resetTime - Date.now());
  }, [windowMs]);

  const reset = useCallback(() => {
    requests.current = [];
  }, []);

  return {
    isAllowed,
    getRemainingRequests,
    getTimeUntilReset,
    reset,
  };
};

/**
 * Hook para prevenir spam de clicks
 */
export const useClickThrottle = (delay: number = 1000) => {
  const lastClick = useRef<number>(0);

  const handleClick = useCallback(
    (callback: () => void) => {
      const now = Date.now();
      
      if (now - lastClick.current >= delay) {
        lastClick.current = now;
        callback();
        return true;
      }
      
      return false;
    },
    [delay]
  );

  const canClick = useCallback(() => {
    const now = Date.now();
    return now - lastClick.current >= delay;
  }, [delay]);

  const timeUntilNextClick = useCallback(() => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClick.current;
    return Math.max(0, delay - timeSinceLastClick);
  }, [delay]);

  return {
    handleClick,
    canClick,
    timeUntilNextClick,
  };
};

/**
 * Hook para gestión de cooldown
 */
export const useCooldown = (duration: number) => {
  const cooldownEnd = useRef<number>(0);

  const start = useCallback(() => {
    cooldownEnd.current = Date.now() + duration;
  }, [duration]);

  const isActive = useCallback(() => {
    return Date.now() < cooldownEnd.current;
  }, []);

  const remaining = useCallback(() => {
    return Math.max(0, cooldownEnd.current - Date.now());
  }, []);

  const reset = useCallback(() => {
    cooldownEnd.current = 0;
  }, []);

  return {
    start,
    isActive,
    remaining,
    reset,
  };
};

export default useThrottle;