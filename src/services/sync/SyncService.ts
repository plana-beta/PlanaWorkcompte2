import { HealthAdapter } from '../../adapters/health/HealthAdapter';
import { DemoAdapter } from '../../adapters/health/DemoAdapter';
import { HealthKitAdapter } from '../../adapters/health/HealthKitAdapter';
import { HealthConnectAdapter } from '../../adapters/health/HealthConnectAdapter';
import { ActualWorkout, PlannedWorkout } from '../../domain/models';
import { isAfter, differenceInMinutes, startOfDay, isSameDay } from 'date-fns';

export type SyncState = 'idle' | 'syncing' | 'success' | 'error' | 'permission_denied' | 'unavailable';

export interface SyncStatus {
  state: SyncState;
  lastSyncAt: string | null;
  importedCount: number;
  updatedCount: number;
  error?: string;
}

export class SyncService {
  private adapter: HealthAdapter | null = null;
  private syncStatus: SyncStatus = {
    state: 'idle',
    lastSyncAt: null,
    importedCount: 0,
    updatedCount: 0
  };

  /**
   * Initializes the appropriate adapter based on the provider string.
   */
  async initializeAdapter(provider: 'apple_health' | 'google_health_connect' | 'demo'): Promise<boolean> {
    switch (provider) {
      case 'apple_health':
        this.adapter = new HealthKitAdapter();
        break;
      case 'google_health_connect':
        this.adapter = new HealthConnectAdapter();
        break;
      case 'demo':
        this.adapter = new DemoAdapter();
        break;
      default:
        this.adapter = null;
        return false;
    }

    if (!this.adapter) return false;

    const isAvailable = await this.adapter.checkAvailability();
    if (!isAvailable) {
      this.syncStatus.state = 'unavailable';
      return false;
    }

    return true;
  }

  getAdapter(): HealthAdapter | null {
    return this.adapter;
  }

  getStatus(): SyncStatus {
    return this.syncStatus;
  }

  async disconnect() {
    if (this.adapter) {
      await this.adapter.disconnect();
    }
    this.adapter = null;
    this.syncStatus = {
      state: 'idle',
      lastSyncAt: null,
      importedCount: 0,
      updatedCount: 0
    };
  }

  /**
   * Performs the synchronization process.
   * Fetches new workouts, normalizes them, deduplicates, and matches them.
   */
  async sync(
    existingWorkouts: ActualWorkout[],
    plannedWorkouts: PlannedWorkout[]
  ): Promise<{ 
    newWorkouts: ActualWorkout[], 
    updatedWorkouts: ActualWorkout[], 
    matchedPlannedIds: { actualId: string, plannedId: string, status: 'completed' | 'partial' }[] 
  }> {
    if (!this.adapter) {
      this.syncStatus.state = 'error';
      this.syncStatus.error = 'No adapter configured';
      throw new Error('No adapter configured');
    }

    this.syncStatus.state = 'syncing';
    this.syncStatus.importedCount = 0;
    this.syncStatus.updatedCount = 0;
    this.syncStatus.error = undefined;

    try {
      // 1. Fetch workouts since last sync (with a 24h margin for safety/delayed syncs)
      let sinceStr: string | undefined;
      if (this.syncStatus.lastSyncAt) {
        const sinceDate = new Date(this.syncStatus.lastSyncAt);
        sinceDate.setHours(sinceDate.getHours() - 24);
        sinceStr = sinceDate.toISOString();
      }

      const rawWorkouts = await this.adapter.getWorkouts(sinceStr);
      
      const newWorkouts: ActualWorkout[] = [];
      const updatedWorkouts: ActualWorkout[] = [];
      const matchedPlannedIds: { actualId: string, plannedId: string, status: 'completed' | 'partial' }[] = [];

      // 2. Deduplication and Normalization
      for (const raw of rawWorkouts) {
        // Find if it already exists by sourceId
        const existingBySourceId = existingWorkouts.find(w => w.sourceId && raw.sourceId && w.sourceId === raw.sourceId);
        
        // Find if it already exists by fuzzy matching (same sport, same date, within 15 mins start time)
        const existingByFuzzy = existingWorkouts.find(w => {
           if (w.id === existingBySourceId?.id) return false;
           return w.sport === raw.sport && 
                  isSameDay(new Date(w.startTime), new Date(raw.startTime)) &&
                  Math.abs(differenceInMinutes(new Date(w.startTime), new Date(raw.startTime))) < 15;
        });

        const existing = existingBySourceId || existingByFuzzy;

        if (existing) {
          // Check if it needs updating (e.g. duration or metrics changed)
          let needsUpdate = false;
          if (raw.durationMin !== existing.durationMin || 
              raw.distanceKm !== existing.distanceKm ||
              raw.averageHeartRate !== existing.averageHeartRate) {
            needsUpdate = true;
          }

          if (needsUpdate) {
            updatedWorkouts.push({
              ...existing,
              durationMin: raw.durationMin ?? existing.durationMin,
              distanceKm: raw.distanceKm ?? existing.distanceKm,
              averageHeartRate: raw.averageHeartRate ?? existing.averageHeartRate,
              normalizedPower: raw.normalizedPower ?? existing.normalizedPower,
              tss: raw.tss ?? existing.tss,
            });
            this.syncStatus.updatedCount++;
          }
        } else {
          // It's a new workout
          newWorkouts.push(raw);
          this.syncStatus.importedCount++;
        }
      }

      // 3. Match new and updated workouts to planned workouts
      const allToMatch = [...newWorkouts, ...updatedWorkouts];
      for (const actual of allToMatch) {
         const match = this.matchToPlannedWorkout(actual, plannedWorkouts);
         if (match) {
           matchedPlannedIds.push({
             actualId: actual.id,
             plannedId: match.plannedId,
             status: match.status
           });
         }
      }

      this.syncStatus.state = 'success';
      this.syncStatus.lastSyncAt = new Date().toISOString();

      return { newWorkouts, updatedWorkouts, matchedPlannedIds };

    } catch (err: any) {
      console.error('[SyncService] Sync error:', err);
      this.syncStatus.state = err.message === 'Permissions not granted' ? 'permission_denied' : 'error';
      this.syncStatus.error = err.message;
      throw err;
    }
  }

  /**
   * Matches an actual workout to a planned workout intelligently.
   */
  private matchToPlannedWorkout(actual: ActualWorkout, plannedWorkouts: PlannedWorkout[]): { plannedId: string, status: 'completed' | 'partial' } | null {
    const actualDate = new Date(actual.startTime);
    
    // Find planned workouts on the same day for the same sport
    const candidates = plannedWorkouts.filter(p => 
      p.sport === actual.sport && isSameDay(new Date(p.date), actualDate)
    );

    if (candidates.length === 0) return null;

    // Pick the one with the closest duration
    const bestMatch = candidates.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.targetDurationMin - actual.durationMin);
      const currDiff = Math.abs(curr.targetDurationMin - actual.durationMin);
      return currDiff < prevDiff ? curr : prev;
    });

    // Determine status
    // If actual is < 70% of planned, mark as partial
    let status: 'completed' | 'partial' = 'completed';
    if (actual.durationMin < bestMatch.targetDurationMin * 0.7) {
      status = 'partial';
    }

    return { plannedId: bestMatch.id, status };
  }
}

// Singleton instance
export const syncService = new SyncService();
