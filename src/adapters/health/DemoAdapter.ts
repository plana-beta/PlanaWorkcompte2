import { HealthAdapter, HealthPermissionStatus } from './HealthAdapter';
import { ActualWorkout } from '../../domain/models';
import { format, subDays, isAfter } from 'date-fns';

export class DemoAdapter implements HealthAdapter {
  private permissions: HealthPermissionStatus = 'not_determined';
  private workouts: ActualWorkout[] = [];

  constructor() {
    // Generate some historical mock data
    const today = new Date();
    this.workouts = [
      {
        id: `demo-${subDays(today, 5).getTime()}`,
        source: 'Manual',
        sourceId: 'demo-run-1',
        sport: 'Run',
        date: format(subDays(today, 5), 'yyyy-MM-dd'),
        startTime: subDays(today, 5).toISOString(),
        durationMin: 45,
        distanceKm: 8.5,
        averageHeartRate: 155,
        tss: 45
      },
      {
        id: `demo-${subDays(today, 3).getTime()}`,
        source: 'Manual',
        sourceId: 'demo-ride-1',
        sport: 'Ride',
        date: format(subDays(today, 3), 'yyyy-MM-dd'),
        startTime: subDays(today, 3).toISOString(),
        durationMin: 90,
        distanceKm: 42,
        averageHeartRate: 140,
        normalizedPower: 180,
        tss: 85
      },
      {
        id: `demo-${subDays(today, 1).getTime()}`,
        source: 'Manual',
        sourceId: 'demo-swim-1',
        sport: 'Swim',
        date: format(subDays(today, 1), 'yyyy-MM-dd'),
        startTime: subDays(today, 1).toISOString(),
        durationMin: 60,
        distanceKm: 2.5,
        tss: 55
      }
    ];
  }

  getProviderName(): string {
    return 'Mode Démo';
  }

  async checkAvailability(): Promise<boolean> {
    return true; // Demo is always available
  }

  async requestPermissions(): Promise<boolean> {
    return new Promise(resolve => {
      setTimeout(() => {
        this.permissions = 'granted';
        resolve(true);
      }, 1000);
    });
  }

  async getPermissionStatus(): Promise<HealthPermissionStatus> {
    return this.permissions;
  }

  async getWorkouts(since?: string): Promise<ActualWorkout[]> {
    if (this.permissions !== 'granted') {
      throw new Error("Permissions not granted");
    }

    return new Promise(resolve => {
      setTimeout(() => {
        if (!since) {
          resolve(this.workouts);
        } else {
          const sinceDate = new Date(since);
          const filtered = this.workouts.filter(w => isAfter(new Date(w.startTime), sinceDate));
          resolve(filtered);
        }
      }, 800);
    });
  }

  async disconnect(): Promise<void> {
    this.permissions = 'not_determined';
  }
  
  // Test helper to inject a new workout
  _injectWorkout(workout: ActualWorkout) {
    this.workouts.push(workout);
  }
}
