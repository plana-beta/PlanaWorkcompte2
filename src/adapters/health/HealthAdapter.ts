import { ActualWorkout } from '../../domain/models';

export type HealthPermissionStatus = 'granted' | 'denied' | 'not_determined';

export interface HealthAdapter {
  getProviderName(): string;
  checkAvailability(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  getPermissionStatus(): Promise<HealthPermissionStatus>;
  
  /**
   * Retrieves workouts from the health provider since the specified date.
   * @param since ISO Date string or timestamp
   */
  getWorkouts(since?: string): Promise<ActualWorkout[]>;
  
  disconnect(): Promise<void>;
}
