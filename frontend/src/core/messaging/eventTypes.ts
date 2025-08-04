// =============================================================================
// TYPES GLOBAUX POUR LE SYSTÈME DE MESSAGING
// =============================================================================

/**
 * Interface commune pour tous les événements de l'application
 * Permet l'unification des Domain Events et Integration Events
 */
export interface AppEvent {
  type: string;
  timestamp?: number;
  source?: string; // Bounded Context d'origine
  metadata?: Record<string, any>; // Données additionnelles
}

/**
 * Types d'événements système (Integration Events)
 */
export type SystemEventKind = 'app_started' | 'app_error' | 'user_action';

export interface SystemEvent extends AppEvent {
  type: SystemEventKind;
  message: string;
  style?: 'success' | 'info' | 'warning' | 'error';
}

/**
 * Helper pour créer un événement avec timestamp automatique
 */
export function createAppEvent<T extends AppEvent>(
  event: Omit<T, 'timestamp'>
): T {
  return {
    ...event,
    timestamp: Date.now(),
  } as T;
} 