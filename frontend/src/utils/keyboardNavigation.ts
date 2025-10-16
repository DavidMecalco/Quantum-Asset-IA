/**
 * Utilidades para navegación por teclado y accesibilidad
 */

// Tipos para navegación por teclado
export interface KeyboardNavigationOptions {
  enableArrowKeys?: boolean;
  enableTabNavigation?: boolean;
  enableShortcuts?: boolean;
  wrapAround?: boolean;
  skipDisabled?: boolean;
}

export interface FocusableElement extends HTMLElement {
  tabIndex: number;
  disabled?: boolean;
}

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  category?: string;
}

// Selectores para elementos focusables
const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
  '[role="button"]:not([disabled])',
  '[role="link"]:not([disabled])',
  '[role="menuitem"]:not([disabled])',
  '[role="tab"]:not([disabled])',
  '[contenteditable="true"]'
].join(', ');

/**
 * Obtiene todos los elementos focusables dentro de un contenedor
 */
export const getFocusableElements = (container: HTMLElement): FocusableElement[] => {
  const elements = Array.from(
    container.querySelectorAll(FOCUSABLE_SELECTORS)
  ) as FocusableElement[];

  return elements.filter(element => {
    // Verificar si el elemento es visible
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    // Verificar si el elemento está deshabilitado
    if (element.disabled || element.getAttribute('aria-disabled') === 'true') {
      return false;
    }

    return true;
  });
};

/**
 * Encuentra el siguiente elemento focusable
 */
export const getNextFocusableElement = (
  current: HTMLElement,
  container: HTMLElement,
  direction: 'next' | 'previous' = 'next',
  wrapAround: boolean = true
): FocusableElement | null => {
  const focusableElements = getFocusableElements(container);
  const currentIndex = focusableElements.indexOf(current as FocusableElement);

  if (currentIndex === -1) return null;

  let nextIndex: number;
  if (direction === 'next') {
    nextIndex = currentIndex + 1;
    if (nextIndex >= focusableElements.length) {
      nextIndex = wrapAround ? 0 : focusableElements.length - 1;
    }
  } else {
    nextIndex = currentIndex - 1;
    if (nextIndex < 0) {
      nextIndex = wrapAround ? focusableElements.length - 1 : 0;
    }
  }

  return focusableElements[nextIndex] || null;
};

/**
 * Maneja la navegación por flechas en un grid
 */
export const handleGridNavigation = (
  event: KeyboardEvent,
  container: HTMLElement,
  columns: number
): boolean => {
  const focusableElements = getFocusableElements(container);
  const currentElement = document.activeElement as HTMLElement;
  const currentIndex = focusableElements.indexOf(currentElement as FocusableElement);

  if (currentIndex === -1) return false;

  let targetIndex: number | null = null;

  switch (event.key) {
    case 'ArrowRight':
      targetIndex = currentIndex + 1;
      if (targetIndex >= focusableElements.length) {
        targetIndex = 0; // Wrap to beginning
      }
      break;

    case 'ArrowLeft':
      targetIndex = currentIndex - 1;
      if (targetIndex < 0) {
        targetIndex = focusableElements.length - 1; // Wrap to end
      }
      break;

    case 'ArrowDown':
      targetIndex = currentIndex + columns;
      if (targetIndex >= focusableElements.length) {
        // Find element in same column on first row
        targetIndex = currentIndex % columns;
      }
      break;

    case 'ArrowUp':
      targetIndex = currentIndex - columns;
      if (targetIndex < 0) {
        // Find element in same column on last row
        const column = currentIndex % columns;
        const lastRowStart = Math.floor((focusableElements.length - 1) / columns) * columns;
        targetIndex = Math.min(lastRowStart + column, focusableElements.length - 1);
      }
      break;

    case 'Home':
      targetIndex = 0;
      break;

    case 'End':
      targetIndex = focusableElements.length - 1;
      break;

    default:
      return false;
  }

  if (targetIndex !== null && focusableElements[targetIndex]) {
    event.preventDefault();
    focusableElements[targetIndex].focus();
    return true;
  }

  return false;
};

/**
 * Crea skip links para navegación rápida
 */
export const createSkipLinks = (targets: Array<{ id: string; label: string }>): HTMLElement => {
  const skipLinksContainer = document.createElement('div');
  skipLinksContainer.className = 'skip-links sr-only focus-within:not-sr-only';
  skipLinksContainer.setAttribute('role', 'navigation');
  skipLinksContainer.setAttribute('aria-label', 'Enlaces de navegación rápida');

  const skipLinksList = document.createElement('ul');
  skipLinksList.className = 'fixed top-0 left-0 z-[9999] bg-quantum-dark border border-glass-100 rounded-br-lg p-2 space-y-1';

  targets.forEach(({ id, label }) => {
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    
    link.href = `#${id}`;
    link.textContent = label;
    link.className = 'block px-3 py-2 text-white bg-quantum-blue hover:bg-quantum-blue/80 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-quantum-purple';
    
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(id);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    listItem.appendChild(link);
    skipLinksList.appendChild(listItem);
  });

  skipLinksContainer.appendChild(skipLinksList);
  return skipLinksContainer;
};

/**
 * Gestor de atajos de teclado
 */
export class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Registra un atajo de teclado
   */
  register(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  /**
   * Desregistra un atajo de teclado
   */
  unregister(shortcut: Partial<KeyboardShortcut>): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.delete(key);
  }

  /**
   * Habilita o deshabilita los atajos de teclado
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Obtiene todos los atajos registrados
   */
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Obtiene atajos por categoría
   */
  getShortcutsByCategory(category: string): KeyboardShortcut[] {
    return this.getShortcuts().filter(shortcut => shortcut.category === category);
  }

  private getShortcutKey(shortcut: Partial<KeyboardShortcut>): string {
    const parts: string[] = [];
    
    if (shortcut.ctrlKey) parts.push('ctrl');
    if (shortcut.altKey) parts.push('alt');
    if (shortcut.shiftKey) parts.push('shift');
    if (shortcut.metaKey) parts.push('meta');
    if (shortcut.key) parts.push(shortcut.key.toLowerCase());

    return parts.join('+');
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    // No procesar atajos si estamos en un campo de entrada
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    const key = this.getShortcutKey({
      key: event.key,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey
    });

    const shortcut = this.shortcuts.get(key);
    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }

  /**
   * Limpia todos los event listeners
   */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.shortcuts.clear();
  }
}

/**
 * Hook personalizado para navegación por teclado
 */
export const useKeyboardNavigation = (
  containerRef: React.RefObject<HTMLElement>,
  options: KeyboardNavigationOptions = {}
) => {
  const {
    enableArrowKeys = true,
    enableTabNavigation = true,
    wrapAround = true,
    skipDisabled = true
  } = options;

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!enableArrowKeys && !enableTabNavigation) return;

      const { key } = event;
      const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
      const isTabKey = key === 'Tab';
      const isHomeEnd = ['Home', 'End'].includes(key);

      if (enableArrowKeys && (isArrowKey || isHomeEnd)) {
        const focusableElements = getFocusableElements(container);
        if (focusableElements.length === 0) return;

        const currentElement = document.activeElement as HTMLElement;
        const currentIndex = focusableElements.indexOf(currentElement as FocusableElement);

        if (currentIndex === -1) return;

        let targetIndex: number | null = null;

        switch (key) {
          case 'ArrowDown':
          case 'ArrowRight':
            targetIndex = currentIndex + 1;
            if (targetIndex >= focusableElements.length) {
              targetIndex = wrapAround ? 0 : currentIndex;
            }
            break;

          case 'ArrowUp':
          case 'ArrowLeft':
            targetIndex = currentIndex - 1;
            if (targetIndex < 0) {
              targetIndex = wrapAround ? focusableElements.length - 1 : currentIndex;
            }
            break;

          case 'Home':
            targetIndex = 0;
            break;

          case 'End':
            targetIndex = focusableElements.length - 1;
            break;
        }

        if (targetIndex !== null && focusableElements[targetIndex]) {
          event.preventDefault();
          focusableElements[targetIndex].focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, enableArrowKeys, enableTabNavigation, wrapAround, skipDisabled]);
};

// Instancia global del gestor de atajos
export const keyboardShortcutManager = new KeyboardShortcutManager();

// Atajos de teclado predefinidos para el dashboard
export const DASHBOARD_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'h',
    altKey: true,
    action: () => {
      const homeLink = document.querySelector('[data-shortcut="home"]') as HTMLElement;
      homeLink?.click();
    },
    description: 'Ir al inicio',
    category: 'navegacion'
  },
  {
    key: 'n',
    altKey: true,
    action: () => {
      const notificationsButton = document.querySelector('[data-shortcut="notifications"]') as HTMLElement;
      notificationsButton?.click();
    },
    description: 'Abrir notificaciones',
    category: 'navegacion'
  },
  {
    key: 's',
    altKey: true,
    action: () => {
      const settingsButton = document.querySelector('[data-shortcut="settings"]') as HTMLElement;
      settingsButton?.click();
    },
    description: 'Abrir configuración',
    category: 'navegacion'
  },
  {
    key: '?',
    action: () => {
      const helpButton = document.querySelector('[data-shortcut="help"]') as HTMLElement;
      helpButton?.click();
    },
    description: 'Mostrar ayuda',
    category: 'ayuda'
  },
  {
    key: 'Escape',
    action: () => {
      // Cerrar modales abiertos
      const closeButtons = document.querySelectorAll('[data-shortcut="close-modal"]');
      const lastCloseButton = closeButtons[closeButtons.length - 1] as HTMLElement;
      lastCloseButton?.click();
    },
    description: 'Cerrar modal',
    category: 'navegacion'
  },
  {
    key: 'f',
    ctrlKey: true,
    action: () => {
      const searchInput = document.querySelector('[data-shortcut="search"]') as HTMLInputElement;
      searchInput?.focus();
    },
    description: 'Enfocar búsqueda',
    category: 'navegacion'
  }
];

// Registrar atajos predefinidos
DASHBOARD_SHORTCUTS.forEach(shortcut => {
  keyboardShortcutManager.register(shortcut);
});