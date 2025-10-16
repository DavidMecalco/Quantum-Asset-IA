/**
 * Utilidades de seguridad para el frontend
 */

// Configuración de seguridad
export const SECURITY_CONFIG = {
  // Tiempo de inactividad antes de limpiar campos (en milisegundos)
  INACTIVITY_TIMEOUT: 10 * 60 * 1000, // 10 minutos
  
  // Tiempo de inactividad antes de logout automático (en milisegundos)
  AUTO_LOGOUT_TIMEOUT: 30 * 60 * 1000, // 30 minutos
  
  // Máximo número de intentos de login fallidos
  MAX_LOGIN_ATTEMPTS: 5,
  
  // Tiempo de bloqueo después de intentos fallidos (en milisegundos)
  LOCKOUT_DURATION: 5 * 60 * 1000, // 5 minutos
  
  // Tiempo mínimo entre intentos de login (en milisegundos)
  LOGIN_THROTTLE_DELAY: 1000, // 1 segundo
};

/**
 * Clase para manejar la limpieza automática de campos sensibles
 */
export class FieldCleaner {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private lastActivity: number = Date.now();

  /**
   * Registrar actividad del usuario
   */
  recordActivity(): void {
    this.lastActivity = Date.now();
  }

  /**
   * Configurar limpieza automática para un campo
   */
  setupFieldCleaning(
    fieldId: string,
    clearCallback: () => void,
    timeout: number = SECURITY_CONFIG.INACTIVITY_TIMEOUT
  ): void {
    // Limpiar timer existente si existe
    this.clearFieldTimer(fieldId);

    // Configurar nuevo timer
    const timer = setTimeout(() => {
      clearCallback();
      this.timers.delete(fieldId);
    }, timeout);

    this.timers.set(fieldId, timer);
  }

  /**
   * Limpiar timer específico
   */
  clearFieldTimer(fieldId: string): void {
    const timer = this.timers.get(fieldId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(fieldId);
    }
  }

  /**
   * Limpiar todos los timers
   */
  clearAllTimers(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  /**
   * Verificar si ha pasado el tiempo de inactividad
   */
  isInactive(timeout: number = SECURITY_CONFIG.INACTIVITY_TIMEOUT): boolean {
    return Date.now() - this.lastActivity > timeout;
  }

  /**
   * Destruir la instancia
   */
  destroy(): void {
    this.clearAllTimers();
  }
}

/**
 * Clase para manejar rate limiting de intentos de login
 */
export class LoginRateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number; blockedUntil?: number }> = new Map();

  /**
   * Verificar si un identificador está bloqueado
   */
  isBlocked(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    if (!record || !record.blockedUntil) return false;

    if (Date.now() > record.blockedUntil) {
      // El bloqueo ha expirado, limpiar
      this.clearAttempts(identifier);
      return false;
    }

    return true;
  }

  /**
   * Verificar si se debe aplicar throttling
   */
  shouldThrottle(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    if (!record) return false;

    return Date.now() - record.lastAttempt < SECURITY_CONFIG.LOGIN_THROTTLE_DELAY;
  }

  /**
   * Registrar un intento de login fallido
   */
  recordFailedAttempt(identifier: string): void {
    const now = Date.now();
    const record = this.attempts.get(identifier) || { count: 0, lastAttempt: 0 };

    record.count++;
    record.lastAttempt = now;

    // Si se alcanza el máximo de intentos, bloquear
    if (record.count >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      record.blockedUntil = now + SECURITY_CONFIG.LOCKOUT_DURATION;
    }

    this.attempts.set(identifier, record);
  }

  /**
   * Registrar un intento de login exitoso
   */
  recordSuccessfulAttempt(identifier: string): void {
    this.clearAttempts(identifier);
  }

  /**
   * Limpiar intentos para un identificador
   */
  clearAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Obtener información de intentos
   */
  getAttemptInfo(identifier: string): {
    count: number;
    isBlocked: boolean;
    timeUntilUnblock?: number;
    remainingAttempts: number;
  } {
    const record = this.attempts.get(identifier);
    const isBlocked = this.isBlocked(identifier);
    
    if (!record) {
      return {
        count: 0,
        isBlocked: false,
        remainingAttempts: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS,
      };
    }

    const timeUntilUnblock = record.blockedUntil 
      ? Math.max(0, record.blockedUntil - Date.now())
      : undefined;

    return {
      count: record.count,
      isBlocked,
      timeUntilUnblock,
      remainingAttempts: Math.max(0, SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - record.count),
    };
  }
}

/**
 * Utilidades para manejo seguro de contraseñas
 */
export class PasswordSecurity {
  /**
   * Generar una contraseña temporal segura
   */
  static generateSecurePassword(length: number = 12): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  /**
   * Limpiar campo de contraseña de forma segura
   */
  static clearPasswordField(element: HTMLInputElement): void {
    if (element && element.type === 'password') {
      // Sobrescribir con datos aleatorios antes de limpiar
      const randomData = this.generateSecurePassword(element.value.length || 20);
      element.value = randomData;
      
      // Limpiar después de un breve delay
      setTimeout(() => {
        element.value = '';
      }, 10);
    }
  }

  /**
   * Verificar si una contraseña es segura
   */
  static isPasswordSecure(password: string): {
    isSecure: boolean;
    score: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 0;

    if (password.length < 8) {
      issues.push('Debe tener al menos 8 caracteres');
    } else {
      score++;
    }

    if (!/[a-z]/.test(password)) {
      issues.push('Debe incluir letras minúsculas');
    } else {
      score++;
    }

    if (!/[A-Z]/.test(password)) {
      issues.push('Debe incluir letras mayúsculas');
    } else {
      score++;
    }

    if (!/\d/.test(password)) {
      issues.push('Debe incluir números');
    } else {
      score++;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      issues.push('Debe incluir símbolos especiales');
    } else {
      score++;
    }

    return {
      isSecure: score >= 4,
      score,
      issues,
    };
  }
}

/**
 * Detector de actividad del usuario
 */
export class ActivityDetector {
  private callbacks: Set<() => void> = new Set();
  private isListening: boolean = false;

  /**
   * Agregar callback para actividad
   */
  addCallback(callback: () => void): void {
    this.callbacks.add(callback);
    this.startListening();
  }

  /**
   * Remover callback
   */
  removeCallback(callback: () => void): void {
    this.callbacks.delete(callback);
    if (this.callbacks.size === 0) {
      this.stopListening();
    }
  }

  /**
   * Iniciar detección de actividad
   */
  private startListening(): void {
    if (this.isListening) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, this.handleActivity, { passive: true });
    });

    this.isListening = true;
  }

  /**
   * Detener detección de actividad
   */
  private stopListening(): void {
    if (!this.isListening) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.removeEventListener(event, this.handleActivity);
    });

    this.isListening = false;
  }

  /**
   * Manejar actividad detectada
   */
  private handleActivity = (): void => {
    this.callbacks.forEach(callback => callback());
  };

  /**
   * Destruir detector
   */
  destroy(): void {
    this.stopListening();
    this.callbacks.clear();
  }
}

/**
 * Instancias globales para uso en la aplicación
 */
export const globalFieldCleaner = new FieldCleaner();
export const globalRateLimiter = new LoginRateLimiter();
export const globalActivityDetector = new ActivityDetector();

/**
 * Hook de limpieza para componentes
 */
export const useSecurityCleanup = () => {
  return {
    setupFieldCleaning: globalFieldCleaner.setupFieldCleaning.bind(globalFieldCleaner),
    clearFieldTimer: globalFieldCleaner.clearFieldTimer.bind(globalFieldCleaner),
    recordActivity: globalFieldCleaner.recordActivity.bind(globalFieldCleaner),
    
    isBlocked: globalRateLimiter.isBlocked.bind(globalRateLimiter),
    recordFailedAttempt: globalRateLimiter.recordFailedAttempt.bind(globalRateLimiter),
    recordSuccessfulAttempt: globalRateLimiter.recordSuccessfulAttempt.bind(globalRateLimiter),
    getAttemptInfo: globalRateLimiter.getAttemptInfo.bind(globalRateLimiter),
    
    addActivityCallback: globalActivityDetector.addCallback.bind(globalActivityDetector),
    removeActivityCallback: globalActivityDetector.removeCallback.bind(globalActivityDetector),
  };
};