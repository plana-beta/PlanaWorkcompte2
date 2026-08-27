import { describe, it, expect } from 'vitest';
import { generateRecommendations } from './recommendationEngine';
import { AthleteProfile, Goal, PlannedWorkout, ActualWorkout, AdaptationResult } from '../domain/models';
import { PmcData } from '../types';
import { addDays, format, subDays } from 'date-fns';

describe('Recommendation Engine', () => {
  const baseProfile: AthleteProfile = {
    id: '1',
    level: { swim: 'beginner', ride: 'intermediate', run: 'beginner' },
    weeklyTimeCommitmentMinutes: 420,
    availableDays: [1, 2, 4, 6],
    dataConnection: 'none'
  };

  const currentDate = new Date('2026-08-27');
  
  const createPlanned = (daysOffset: number, duration: number, isAdapted = false): PlannedWorkout => ({
    id: `pw_${daysOffset}`,
    sport: 'Ride',
    date: format(addDays(currentDate, daysOffset), 'yyyy-MM-dd'),
    title: 'Test',
    targetDurationMin: duration,
    targetIntensity: { type: 'rpe', value: 'moderate' },
    isAdapted
  });

  const basePmc: PmcData[] = [{ date: format(currentDate, 'yyyy-MM-dd'), ctl: 50, atl: 50, tsb: 0, tss: 0 }];

  it('TEST 1: Une séance aujourd\'hui génère une recommandation TODAY_WORKOUT', () => {
    const planned = [createPlanned(0, 60)];
    const recs = generateRecommendations({
      athleteProfile: baseProfile,
      goal: null,
      plannedWorkouts: planned,
      actualWorkouts: [],
      trainingMetrics: basePmc,
      adaptationResult: null,
      currentDate
    });

    const main = recs[0];
    expect(main.type).toBe('TODAY_WORKOUT');
    expect(main.priority).toBe('HIGH');
  });

  it('TEST 2: Aucune séance aujourd\'hui génère une recommandation de repos', () => {
    const planned = [createPlanned(1, 60)]; // Tomorrow
    const recs = generateRecommendations({
      athleteProfile: baseProfile,
      goal: null,
      plannedWorkouts: planned,
      actualWorkouts: [],
      trainingMetrics: basePmc,
      adaptationResult: null,
      currentDate
    });

    const main = recs[0];
    expect(main.type).toBe('INFO');
    expect(main.title).toContain('Repos');
  });

  it('TEST 3: Fatigue élevée -> recommandation de récupération', () => {
    const pmc: PmcData[] = [{ date: format(currentDate, 'yyyy-MM-dd'), ctl: 50, atl: 80, tsb: -20, tss: 0 }];
    const recs = generateRecommendations({
      athleteProfile: baseProfile,
      goal: null,
      plannedWorkouts: [], // No workout today
      actualWorkouts: [],
      trainingMetrics: pmc,
      adaptationResult: null,
      currentDate
    });

    const main = recs[0];
    expect(main.type).toBe('RECOVERY');
    expect(main.priority).toBe('HIGH');
  });

  it('TEST 4: Plan adapté -> recommandation PLAN_ADAPTED', () => {
    const adaptationResult: AdaptationResult = {
      changed: true,
      changes: [],
      summary: 'Test adaptation',
      newPlan: []
    };
    const planned = [createPlanned(1, 60, true)]; // Adapted tomorrow

    const recs = generateRecommendations({
      athleteProfile: baseProfile,
      goal: null,
      plannedWorkouts: planned,
      actualWorkouts: [],
      trainingMetrics: basePmc,
      adaptationResult,
      currentDate
    });

    const adaptedRec = recs.find(r => r.type === 'PLAN_ADAPTED');
    expect(adaptedRec).toBeDefined();
    expect(adaptedRec?.reason).toBe('Test adaptation');
  });

  it('TEST 5: Séance manquée -> message non culpabilisant', () => {
    const planned = [createPlanned(-1, 60)]; // Yesterday, but no actual workout
    const recs = generateRecommendations({
      athleteProfile: baseProfile,
      goal: null,
      plannedWorkouts: planned,
      actualWorkouts: [],
      trainingMetrics: basePmc,
      adaptationResult: null,
      currentDate
    });

    const missedRec = recs.find(r => r.type === 'MISSED_WORKOUT');
    expect(missedRec).toBeDefined();
    expect(missedRec?.reason).toContain('progressivement');
  });
  
  it('TEST 12: Déterminisme', () => {
    const planned = [createPlanned(0, 60)];
    const recs1 = generateRecommendations({
      athleteProfile: baseProfile,
      goal: null,
      plannedWorkouts: planned,
      actualWorkouts: [],
      trainingMetrics: basePmc,
      adaptationResult: null,
      currentDate
    });
    
    const recs2 = generateRecommendations({
      athleteProfile: baseProfile,
      goal: null,
      plannedWorkouts: planned,
      actualWorkouts: [],
      trainingMetrics: basePmc,
      adaptationResult: null,
      currentDate
    });
    
    expect(recs1).toEqual(recs2);
  });
});
