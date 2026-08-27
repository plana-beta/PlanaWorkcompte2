import { HealthAdapter, HealthPermissionStatus } from './HealthAdapter';
import { ActualWorkout } from '../../domain/models';

/**
 * Apple HealthKit Adapter.
 * In a real mobile app, this would use a plugin like @capacitor-community/apple-fitness
 * or equivalent React Native HealthKit wrappers.
 * Since this codebase currently runs as a PWA/Web, it safely detects the environment
 * and warns if native APIs are missing.
 */
export class HealthKitAdapter implements HealthAdapter {
  
  getProviderName(): string {
    return 'Apple Health';
  }

  async checkAvailability(): Promise<boolean> {
    // Check if we are running in a native iOS Capacitor environment
    const isIOSNative = !!(window as any).Capacitor && (window as any).Capacitor.getPlatform() === 'ios';
    
    if (!isIOSNative) {
      console.warn('[HealthKitAdapter] Apple HealthKit is only available on iOS native devices.');
      return false;
    }

    // In a real implementation: check if the HealthKit plugin is available
    return true; 
  }

  async requestPermissions(): Promise<boolean> {
    const isAvailable = await this.checkAvailability();
    if (!isAvailable) return false;

    console.log('[HealthKitAdapter] Requesting HealthKit permissions (READ WORKOUTS)...');
    // Call native plugin to request read permissions for workouts, HR, power, distance
    return true;
  }

  async getPermissionStatus(): Promise<HealthPermissionStatus> {
    const isAvailable = await this.checkAvailability();
    if (!isAvailable) return 'not_determined';
    
    // Call native plugin to get status
    return 'not_determined';
  }

  async getWorkouts(since?: string): Promise<ActualWorkout[]> {
    console.log(`[HealthKitAdapter] Fetching workouts since ${since || 'beginning'}...`);
    
    // Call native plugin, e.g. HealthKit.getWorkouts({ startDate: since })
    // Map native workout formats to Plana ActualWorkout
    
    return [];
  }

  async disconnect(): Promise<void> {
    console.log('[HealthKitAdapter] Disconnecting...');
    // Clear local permission cache if any
  }
}
