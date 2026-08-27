import { HealthAdapter, HealthPermissionStatus } from './HealthAdapter';
import { ActualWorkout } from '../../domain/models';

/**
 * Google Health Connect Adapter.
 * In a real mobile app, this would use a plugin like @capacitor-community/health-connect
 * or equivalent React Native wrappers.
 * Since this codebase currently runs as a PWA/Web, it safely detects the environment
 * and warns if native APIs are missing.
 */
export class HealthConnectAdapter implements HealthAdapter {
  
  getProviderName(): string {
    return 'Google Health Connect';
  }

  async checkAvailability(): Promise<boolean> {
    // Check if we are running in a native Android Capacitor environment
    const isAndroidNative = !!(window as any).Capacitor && (window as any).Capacitor.getPlatform() === 'android';
    
    if (!isAndroidNative) {
      console.warn('[HealthConnectAdapter] Google Health Connect is only available on Android native devices.');
      return false;
    }

    // In a real implementation: check if the Health Connect plugin and app are available
    return true; 
  }

  async requestPermissions(): Promise<boolean> {
    const isAvailable = await this.checkAvailability();
    if (!isAvailable) return false;

    console.log('[HealthConnectAdapter] Requesting Health Connect permissions (READ EXERCISE)...');
    // Call native plugin to request read permissions
    return true;
  }

  async getPermissionStatus(): Promise<HealthPermissionStatus> {
    const isAvailable = await this.checkAvailability();
    if (!isAvailable) return 'not_determined';
    
    // Call native plugin to get status
    return 'not_determined';
  }

  async getWorkouts(since?: string): Promise<ActualWorkout[]> {
    console.log(`[HealthConnectAdapter] Fetching workouts since ${since || 'beginning'}...`);
    
    // Call native plugin, e.g. HealthConnect.readRecords({ recordType: 'ExerciseSession', timeRangeFilter: { startTime: since } })
    // Map native workout formats to Plana ActualWorkout
    
    return [];
  }

  async disconnect(): Promise<void> {
    console.log('[HealthConnectAdapter] Disconnecting...');
  }
}
