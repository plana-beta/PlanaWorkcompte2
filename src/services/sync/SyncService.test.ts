import { describe, it, expect, beforeEach } from 'vitest';
import { SyncService } from './SyncService';
import { ActualWorkout, PlannedWorkout } from '../../domain/models';
import { subDays, format } from 'date-fns';
import { DemoAdapter } from '../../adapters/health/DemoAdapter';

describe('SyncService & Deduplication', () => {
  let syncService: SyncService;

  beforeEach(() => {
    syncService = new SyncService();
  });

  it('TEST 1: Connection DemoAdapter and Status', async () => {
    const success = await syncService.initializeAdapter('demo');
    await syncService.getAdapter()!.requestPermissions();
    await syncService.getAdapter()!.requestPermissions();
    expect(success).toBe(true);
    expect(syncService.getStatus().state).toBe('idle');
  });

  it('TEST 2: First Sync imports all new workouts', async () => {
    await syncService.initializeAdapter('demo');
    await syncService.getAdapter()!.requestPermissions();
    
    const existing: ActualWorkout[] = [];
    const planned: PlannedWorkout[] = [];

    const { newWorkouts, updatedWorkouts } = await syncService.sync(existing, planned);
    
    expect(newWorkouts.length).toBeGreaterThan(0);
    expect(updatedWorkouts.length).toBe(0);
    expect(syncService.getStatus().state).toBe('success');
    expect(syncService.getStatus().importedCount).toBe(newWorkouts.length);
  });

  it('TEST 3: Identical Second Sync imports nothing (Deduplication)', async () => {
    await syncService.initializeAdapter('demo');
    await syncService.getAdapter()!.requestPermissions();
    
    // 1st sync
    const { newWorkouts } = await syncService.sync([], []);
    
    // 2nd sync with same data
    const { newWorkouts: newW2, updatedWorkouts } = await syncService.sync(newWorkouts, []);
    
    expect(newW2.length).toBe(0);
    expect(updatedWorkouts.length).toBe(0);
    expect(syncService.getStatus().importedCount).toBe(0);
  });

  it('TEST 4: Update existing workout', async () => {
    await syncService.initializeAdapter('demo');
    await syncService.getAdapter()!.requestPermissions();
    
    const existing: ActualWorkout[] = [
      {
        id: 'w1',
        source: 'Manual',
        sourceId: 'demo-run-1',
        sport: 'Run',
        date: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
        startTime: subDays(new Date(), 5).toISOString(),
        durationMin: 40, // Different from demo adapter (which is 45)
      }
    ];

    const { newWorkouts, updatedWorkouts } = await syncService.sync(existing, []);
    
    expect(updatedWorkouts.length).toBe(1);
    expect(updatedWorkouts[0].durationMin).toBe(45);
    expect(syncService.getStatus().updatedCount).toBe(1);
  });

  it('TEST 5: Matching Planned to Actual (partial vs completed)', async () => {
    await syncService.initializeAdapter('demo');
    await syncService.getAdapter()!.requestPermissions();
    const adapter = syncService.getAdapter() as DemoAdapter;
    
    // Inject a workout for today
    const today = new Date();
    adapter._injectWorkout({
      id: 'mock1',
      source: 'AppleHealth',
      sourceId: 'apple-123',
      sport: 'Ride',
      date: format(today, 'yyyy-MM-dd'),
      startTime: today.toISOString(),
      durationMin: 50 // Planned is 60, so partial
    });

    const planned: PlannedWorkout[] = [
      {
        id: 'p1',
        sport: 'Ride',
        date: format(today, 'yyyy-MM-dd'),
        title: 'Ride',
        targetDurationMin: 90, // Not matching as well as 60?
        targetIntensity: { type: 'rpe', value: '5' }
      },
      {
        id: 'p2',
        sport: 'Ride',
        date: format(today, 'yyyy-MM-dd'),
        title: 'Ride close',
        targetDurationMin: 60, // Better match
        targetIntensity: { type: 'rpe', value: '5' }
      }
    ];

    const { matchedPlannedIds } = await syncService.sync([], planned);
    
    // Find our injected mock1 match
    const match = matchedPlannedIds.find(m => m.actualId === 'mock1');
    expect(match).toBeDefined();
    expect(match?.plannedId).toBe('p2'); // Should match the closer duration one
    
    // 50 / 60 > 70% ? 50/60 = 83%, so it should be 'completed'
    expect(match?.status).toBe('completed');
  });

  it('TEST 6: Matching returns partial for < 70%', async () => {
    await syncService.initializeAdapter('demo');
    await syncService.getAdapter()!.requestPermissions();
    const adapter = syncService.getAdapter() as DemoAdapter;
    
    const today = new Date();
    adapter._injectWorkout({
      id: 'mock2',
      source: 'AppleHealth',
      sourceId: 'apple-456',
      sport: 'Run',
      date: format(today, 'yyyy-MM-dd'),
      startTime: today.toISOString(),
      durationMin: 20
    });

    const planned: PlannedWorkout[] = [
      {
        id: 'p3',
        sport: 'Run',
        date: format(today, 'yyyy-MM-dd'),
        title: 'Long run',
        targetDurationMin: 60, 
        targetIntensity: { type: 'rpe', value: '5' }
      }
    ];

    const { matchedPlannedIds } = await syncService.sync([], planned);
    const match = matchedPlannedIds.find(m => m.actualId === 'mock2');
    expect(match).toBeDefined();
    // 20/60 = 33% < 70%, so partial
    expect(match?.status).toBe('partial');
  });

});
