import { ValidationRules } from '../types/auth';

// Expresiones regulares para validación
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

// Reglas de validación configurables
export const validationRules: ValidationRules = {
  email: {
    required: true,
    pattern: EMAIL_REGEX,
    message: 'Ingresa un email válido',
  },
  password: {
    required: true,
    minLength: PASSWORD_MIN_LENGTH,
    message: 'La contraseña debe tener al menos 8 caracteres',
  },
};

// Resultado de validación
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validar formato de email
 */
export const validateEmail = (email: string): ValidationResult => {
  // Verificar si está vacío
  if (!email || email.trim() === '') {
    return {
      isValid: false,
      error: 'El email es obligatorio',
    };
  }

  // Verificar formato
  if (!EMAIL_REGEX.test(email.trim())) {
    return {
      isValid: false,
      error: validationRules.email.message,
    };
  }

  return { isValid: true };
};

/**
 * Validar contraseña
 */
export const validatePassword = (password: string): ValidationResult => {
  // Verificar si está vacía
  if (!password || password === '') {
    return {
      isValid: false,
      error: 'La contraseña es obligatoria',
    };
  }

  // Verificar longitud mínima
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      isValid: false,
      error: validationRules.password.message,
    };
  }

  return { isValid: true };
};

/**
 * Validar credenciales de login completas
 */
export const validateLoginCredentials = (email: string, password: string) => {
  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);

  return {
    email: emailValidation,
    password: passwordValidation,
    isValid: emailValidation.isValid && passwordValidation.isValid,
  };
};

/**
 * Sanitizar input de texto - remover caracteres peligrosos
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remover < y > para prevenir XSS básico
    .replace(/javascript:/gi, '') // Remover javascript: URLs
    .replace(/on\w+=/gi, ''); // Remover event handlers
};

/**
 * Sanitizar email - formato específico para emails
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  
  return email
    .trim()
    .toLowerCase()
    .replace(/[^\w@.-]/g, ''); // Solo permitir caracteres válidos para email
};

/**
 * Validar y sanitizar email en una sola función
 */
export const validateAndSanitizeEmail = (email: string): {
  sanitized: string;
  validation: ValidationResult;
} => {
  const sanitized = sanitizeEmail(email);
  const validation = validateEmail(sanitized);
  
  return { sanitized, validation };
};

/**
 * Debounce para validación en tiempo real
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Crear función de validación con debounce para campos de formulario
 */
export const createDebouncedValidator = (
  validator: (value: string) => ValidationResult,
  delay: number = 300
) => {
  return debounce(validator, delay);
};

/**
 * Verificar fortaleza de contraseña (opcional, para feedback adicional)
 */
export const checkPasswordStrength = (password: string): {
  score: number; // 0-4
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('Usa al menos 8 caracteres');
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Incluye letras minúsculas');
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Incluye letras mayúsculas');
  }

  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('Incluye números');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  } else {
    feedback.push('Incluye símbolos especiales');
  }

  return { score, feedback };
};

/**
 * Validar múltiples campos de formulario
 */
export const validateForm = (fields: Record<string, string>): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};
  
  // Validar cada campo
  Object.entries(fields).forEach(([fieldName, value]) => {
    switch (fieldName) {
      case 'email':
        const emailResult = validateEmail(value);
        if (!emailResult.isValid) {
          errors[fieldName] = emailResult.error!;
        }
        break;
      case 'password':
        const passwordResult = validatePassword(value);
        if (!passwordResult.isValid) {
          errors[fieldName] = passwordResult.error!;
        }
        break;
      default:
        // Validación genérica para campos requeridos
        if (!value || value.trim() === '') {
          errors[fieldName] = `${fieldName} es obligatorio`;
        }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Limpiar errores de validación después de un tiempo
 */
export const createErrorCleaner = (
  clearFunction: () => void,
  delay: number = 5000
) => {
  return setTimeout(clearFunction, delay);
};