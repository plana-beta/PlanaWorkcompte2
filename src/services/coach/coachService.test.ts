import { describe, it, expect } from 'vitest';
import { CoachService } from './coachService';
import { CoachContext } from '../../domain/coach';

describe('Smart Coach - MockProvider', () => {
  const baseContext: CoachContext = {
    athleteProfile: {
      level: { swim: 'intermediate', ride: 'advanced', run: 'beginner' },
      weeklyTimeCommitmentMinutes: 420,
      dataConnection: 'none'
    },
    goal: { title: 'Test Race', date: '2026-10-10', type: 'olympic' },
    currentDate: '2026-08-27',
    todayWorkout: {
      id: 'w1',
      sport: 'Ride',
      title: 'Endurance de base',
      targetDurationMin: 60,
      explanation: 'Développement aérobie.',
      isAdapted: false
    },
    upcomingWorkouts: [],
    recentFatigue: { atl: 50, ctl: 50, tsb: 0 },
    activeRecommendations: []
  };

  it('TEST 1: Explique une séance existante', async () => {
    const res = await CoachService.generateResponse(baseContext, 'Pourquoi cette séance ?');
    expect(res.message).toContain('aérobie');
  });

  it('TEST 2: Pas de séance inventée si repos', async () => {
    const ctx = { ...baseContext, todayWorkout: null };
    const res = await CoachService.generateResponse(ctx, 'Que dois-je faire aujourd\'hui ?');
    expect(res.message.toLowerCase()).toContain('repos');
  });

  it('TEST 4: Explication adaptation', async () => {
    const ctx = {
      ...baseContext,
      todayWorkout: {
        ...baseContext.todayWorkout!,
        isAdapted: true,
        adaptedReason: 'Fatigue élevée, durée réduite.'
      }
    };
    const res = await CoachService.generateResponse(ctx, 'Pourquoi mon plan a changé ?');
    expect(res.message).toContain('Fatigue élevée');
  });

  it('TEST 5: Fatigue élevée expliquée sans diagnostic médical', async () => {
    const ctx = {
      ...baseContext,
      recentFatigue: { atl: 80, ctl: 50, tsb: -30 }
    };
    const res = await CoachService.generateResponse(ctx, 'Comment va ma forme ?');
    expect(res.message.toLowerCase()).toContain('fatigue');
    expect(res.message.toLowerCase()).not.toContain('blessé'); // no medical
    expect(res.message.toLowerCase()).not.toContain('malade');
  });

  it('TEST 8: Demande de modification génère une intention structurée', async () => {
    const res = await CoachService.generateResponse(baseContext, 'Remplace ma séance par de la course.');
    expect(res.intent).toBeDefined();
    expect(res.intent?.type).toBe('REQUEST_WORKOUT_SUBSTITUTION');
  });

});
