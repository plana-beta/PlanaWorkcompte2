import { describe, it, expect } from 'vitest';
import { adaptTrainingPlan } from './adaptationEngine';
import { AthleteProfile, Goal, PlannedWorkout, ActualWorkout } from '../domain/models';
import { PmcData } from '../types';
import { addDays, format, subDays } from 'date-fns';

describe('Adaptation Engine', () => {
  const baseProfile: AthleteProfile = {
    id: '1',
    level: { swim: 'beginner', ride: 'intermediate', run: 'beginner' },
    weeklyTimeCommitmentMinutes: 420,
    availableDays: [1, 2, 4, 6],
    dataConnection: 'none'
  };

  const baseGoal: Goal = {
    id: 'g1',
    title: 'Race',
    date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    type: 'olympic',
    sportFocus: 'Triathlon'
  };

  const currentDate = new Date('2026-08-27');
  
  const createPlanned = (daysOffset: number, duration: number, importance: 'low'|'medium'|'high' = 'medium', isAdapted = false): PlannedWorkout => ({
    id: `pw_${daysOffset}`,
    sport: 'Ride',
    date: format(addDays(currentDate, daysOffset), 'yyyy-MM-dd'),
    title: 'Test',
    targetDurationMin: duration,
    originalTargetDurationMin: duration,
    targetIntensity: { type: 'rpe', value: 'moderate' },
    importance,
    isAdapted
  });

  const createActual = (daysOffset: number, duration: number): ActualWorkout => ({
    id: `aw_${daysOffset}`,
    source: 'Manual',
    sport: 'Ride',
    date: format(addDays(currentDate, daysOffset), 'yyyy-MM-dd'),
    startTime: new Date().toISOString(),
    durationMin: duration
  });

  it('TEST 1: Aucune adaptation', () => {
    const pmc: PmcData[] = [{ date: format(currentDate, 'yyyy-MM-dd'), ctl: 50, atl: 50, tsb: 0, tss: 0 }];
    const planned = [createPlanned(-1, 60), createPlanned(1, 60)];
    const actual = [createActual(-1, 60)];

    const result = adaptTrainingPlan({
      athleteProfile: baseProfile,
      goal: baseGoal,
      plannedWorkouts: planned,
      actualWorkouts: actual,
      trainingMetrics: pmc,
      currentDate
    });

    expect(result.changed).toBe(false);
    expect(result.newPlan[1].targetDurationMin).toBe(60);
  });

  it('TEST 2 & 8: Plusieurs séances manquées -> reprise progressive', () => {
    const pmc: PmcData[] = [{ date: format(currentDate, 'yyyy-MM-dd'), ctl: 50, atl: 50, tsb: 0, tss: 0 }];
    const planned = [createPlanned(-3, 60), createPlanned(-2, 60), createPlanned(-1, 60), createPlanned(1, 60, 'high')];
    const actual: ActualWorkout[] = []; // All missed

    const result = adaptTrainingPlan({
      athleteProfile: baseProfile,
      goal: baseGoal,
      plannedWorkouts: planned,
      actualWorkouts: actual,
      trainingMetrics: pmc,
      currentDate
    });

    expect(result.changed).toBe(true);
    // Should reduce next 'high' session because missedCount >= 3
    expect(result.newPlan[3].targetDurationMin).toBeLessThan(60);
    expect(result.newPlan[3].adaptedReason).toContain('reprise');
  });

  it('TEST 4: Séance trop longue -> surcharge', () => {
    const pmc: PmcData[] = [{ date: format(currentDate, 'yyyy-MM-dd'), ctl: 50, atl: 50, tsb: 0, tss: 0 }];
    const planned = [createPlanned(-1, 60), createPlanned(1, 60)];
    const actual = [createActual(-1, 120)]; // Way longer

    const result = adaptTrainingPlan({
      athleteProfile: baseProfile,
      goal: baseGoal,
      plannedWorkouts: planned,
      actualWorkouts: actual,
      trainingMetrics: pmc,
      currentDate
    });

    expect(result.changed).toBe(true);
    expect(result.newPlan[1].targetDurationMin).toBeLessThan(60);
  });

  it('TEST 6: Fatigue élevée (TSB très négatif)', () => {
    const pmc: PmcData[] = [{ date: format(currentDate, 'yyyy-MM-dd'), ctl: 50, atl: 80, tsb: -30, tss: 0 }]; // Extremely high
    const planned = [createPlanned(1, 60, 'low')]; // Future session

    const result = adaptTrainingPlan({
      athleteProfile: baseProfile,
      goal: baseGoal,
      plannedWorkouts: planned,
      actualWorkouts: [],
      trainingMetrics: pmc,
      currentDate
    });

    expect(result.changed).toBe(true);
    expect(result.newPlan[0].targetDurationMin).toBeLessThan(60);
    expect(result.newPlan[0].targetIntensity.value).toBe('easy');
  });

  it('TEST 7: Forme positive -> plan conservé', () => {
    const pmc: PmcData[] = [{ date: format(currentDate, 'yyyy-MM-dd'), ctl: 50, atl: 40, tsb: 10, tss: 0 }];
    const planned = [createPlanned(1, 60)];

    const result = adaptTrainingPlan({
      athleteProfile: baseProfile,
      goal: baseGoal,
      plannedWorkouts: planned,
      actualWorkouts: [],
      trainingMetrics: pmc,
      currentDate
    });

    expect(result.changed).toBe(false);
    expect(result.newPlan[0].targetDurationMin).toBe(60);
  });

  it('TEST 15: Idempotence', () => {
    const pmc: PmcData[] = [{ date: format(currentDate, 'yyyy-MM-dd'), ctl: 50, atl: 80, tsb: -30, tss: 0 }];
    const planned = [createPlanned(1, 60)];

    // First run
    const result1 = adaptTrainingPlan({
      athleteProfile: baseProfile,
      goal: baseGoal,
      plannedWorkouts: planned,
      actualWorkouts: [],
      trainingMetrics: pmc,
      currentDate
    });

    expect(result1.changed).toBe(true);
    const adaptedPlan = result1.newPlan;
    const reducedDuration = adaptedPlan[0].targetDurationMin;

    // Second run
    const result2 = adaptTrainingPlan({
      athleteProfile: baseProfile,
      goal: baseGoal,
      plannedWorkouts: adaptedPlan,
      actualWorkouts: [],
      trainingMetrics: pmc,
      currentDate
    });

    expect(result2.newPlan[0].targetDurationMin).toBe(reducedDuration); // Should not reduce further
  });

  it('TEST 12: Protège les séances importantes sauf fatigue extrême', () => {
    const pmcHigh: PmcData[] = [{ date: format(currentDate, 'yyyy-MM-dd'), ctl: 50, atl: 70, tsb: -20, tss: 0 }]; // High fatigue but not extreme
    const planned = [createPlanned(1, 120, 'high')];

    const result = adaptTrainingPlan({
      athleteProfile: baseProfile,
      goal: baseGoal,
      plannedWorkouts: planned,
      actualWorkouts: [],
      trainingMetrics: pmcHigh,
      currentDate
    });

    // High importance sessions are protected from normal high fatigue
    expect(result.newPlan[0].targetDurationMin).toBe(120);
  });
});
