import { AthleteProfile, Goal, PlannedWorkout, ActualWorkout, AdaptationResult, Recommendation } from '../domain/models';
import { PmcData } from '../types';
import { isSameDay, isBefore, parseISO, differenceInDays, format } from 'date-fns';

export function generateRecommendations({
  athleteProfile, goal,
  plannedWorkouts,
  actualWorkouts,
  trainingMetrics,
  adaptationResult,
  currentDate
}: {
  athleteProfile: AthleteProfile;
  goal: Goal | null;
  plannedWorkouts: PlannedWorkout[];
  actualWorkouts: ActualWorkout[];
  trainingMetrics: PmcData[];
  adaptationResult: AdaptationResult | null;
  currentDate: Date;
}): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const todayStr = format(currentDate, 'yyyy-MM-dd');

  // Helper to generate IDs
  const genId = (type: string) => `${type}_${todayStr}`;

  const todayWorkout = plannedWorkouts.find(w => isSameDay(parseISO(w.date), currentDate));
  const latestPmc = trainingMetrics.length > 0 ? trainingMetrics[trainingMetrics.length - 1] : { ctl: 0, atl: 0, tsb: 0 };
  const isHighFatigue = latestPmc.tsb <= -15 || latestPmc.atl > 60;
  
  // 1. Fatigue & Recovery
  if (isHighFatigue && !todayWorkout) {
    recommendations.push({
      id: genId('RECOVERY_FATIGUE'),
      type: 'RECOVERY',
      priority: 'HIGH',
      title: 'Récupération prioritaire',
      message: 'Ta fatigue récente est élevée.',
      reason: 'Profite de cette journée de repos pour assimiler ta charge d\'entraînement.',
      createdAt: currentDate.toISOString()
    });
  } else if (isHighFatigue && todayWorkout) {
    recommendations.push({
      id: genId('RECOVERY_WARNING'),
      type: 'WARNING',
      priority: 'HIGH',
      title: 'Attention à la fatigue',
      message: 'Ta charge récente est élevée.',
      reason: 'Écoute ton corps pendant la séance du jour. N\'hésite pas à lever le pied si besoin.',
      createdAt: currentDate.toISOString()
    });
  }

  // 2. Today's Workout OR Rest Day
  if (todayWorkout) {
    recommendations.push({
      id: genId('TODAY_WORKOUT'),
      type: 'TODAY_WORKOUT',
      priority: 'HIGH',
      title: 'Ta séance du jour',
      message: `${todayWorkout.sport} — ${todayWorkout.targetDurationMin} min`,
      reason: todayWorkout.explanation || 'Séance prévue dans ton plan.',
      relatedWorkoutId: todayWorkout.id,
      action: 'start_workout',
      createdAt: currentDate.toISOString()
    });
  } else if (!isHighFatigue) {
    recommendations.push({
      id: genId('REST_DAY'),
      type: 'INFO',
      priority: 'MEDIUM',
      title: 'Repos aujourd\'hui',
      message: 'Aucune séance n\'est prévue aujourd\'hui.',
      reason: 'Une journée sans séance fait partie du plan. Elle permet à ton corps d\'assimiler le travail effectué.',
      createdAt: currentDate.toISOString()
    });
  }

  // 3. Plan Adapted
  if (adaptationResult && adaptationResult.changed && adaptationResult.summary) {
    const adaptedWorkout = plannedWorkouts.find(w => w.isAdapted && !isBefore(parseISO(w.date), currentDate));
    recommendations.push({
      id: genId('PLAN_ADAPTED'),
      type: 'PLAN_ADAPTED',
      priority: 'MEDIUM',
      title: 'Ton plan a été adapté',
      message: 'Nous avons ajusté tes prochaines séances.',
      reason: adaptationResult.summary,
      relatedWorkoutId: adaptedWorkout?.id,
      action: 'view_plan',
      createdAt: currentDate.toISOString()
    });
  } else {
    // If no explicit adaptationResult is provided, infer from plannedWorkouts
    const adaptedFutureWorkouts = plannedWorkouts.filter(w => w.isAdapted && !isBefore(parseISO(w.date), currentDate));
    if (adaptedFutureWorkouts.length > 0 && (!adaptationResult || !adaptationResult.changed)) {
       const w = adaptedFutureWorkouts[0];
       recommendations.push({
          id: genId('PLAN_ADAPTED_INFERRED'),
          type: 'PLAN_ADAPTED',
          priority: 'MEDIUM',
          title: 'Ton plan a été adapté',
          message: 'Certaines séances futures ont été modifiées.',
          reason: w.adaptedReason || 'Ajustement suite à ton historique récent.',
          relatedWorkoutId: w.id,
          action: 'view_plan',
          createdAt: currentDate.toISOString()
       });
    }
  }

  // 4. Missed Workout
  const recentPastPlanned = plannedWorkouts.filter(w => isBefore(parseISO(w.date), currentDate) && !isSameDay(parseISO(w.date), currentDate) && differenceInDays(currentDate, parseISO(w.date)) <= 3);
  const missedWorkout = recentPastPlanned.find(pw => !actualWorkouts.some(aw => isSameDay(parseISO(aw.date), parseISO(pw.date)) && aw.sport === pw.sport));
  if (missedWorkout) {
    recommendations.push({
      id: genId('MISSED_WORKOUT'),
      type: 'MISSED_WORKOUT',
      priority: 'MEDIUM',
      title: 'Séance précédente manquée',
      message: `Tu as manqué ta séance de ${missedWorkout.sport}.`,
      reason: 'Pas besoin de la rattraper : ton plan a été ajusté pour repartir progressivement.',
      createdAt: currentDate.toISOString()
    });
  }

  // 5. Goal Proximity
  // We need to pass the goal as an argument
  // We will assume `goal` is passed in args. Let's add it. (Added to signature above)
  

  // 5. Goal Proximity
  if (goal && goal.date) {
    const daysToGoal = differenceInDays(parseISO(goal.date), currentDate);
    if (daysToGoal > 0 && daysToGoal <= 14) {
      recommendations.push({
        id: genId('GOAL_TAPER'),
        type: 'GOAL',
        priority: 'MEDIUM',
        title: 'Ton objectif approche',
        message: `Ta course est dans ${daysToGoal} jours.`,
        reason: 'Ton affûtage approche. La priorité est désormais la fraîcheur et la spécificité.',
        createdAt: currentDate.toISOString()
      });
    } else if (daysToGoal > 14 && daysToGoal <= 60) {
      recommendations.push({
        id: genId('GOAL_BUILD'),
        type: 'GOAL',
        priority: 'LOW',
        title: 'En route vers ton objectif',
        message: `Ta course est dans ${Math.floor(daysToGoal/7)} semaines.`,
        reason: 'Tu es actuellement dans une phase clé de développement pour ton objectif.',
        createdAt: currentDate.toISOString()
      });
    }
  }

  // 6. Progress

  if (actualWorkouts.length >= 3 && latestPmc.ctl > 10) {
    recommendations.push({
      id: genId('PROGRESS'),
      type: 'PROGRESS',
      priority: 'LOW',
      title: 'Ta progression',
      message: 'Ta régularité s\'améliore.',
      reason: 'Ton fitness (CTL) augmente progressivement, signe d\'une bonne assimilation.',
      createdAt: currentDate.toISOString()
    });
  }

  // 7. Health Sync
  if (athleteProfile.dataConnection !== 'none') {
    const syncWorkouts = actualWorkouts.filter(aw => aw.source === 'AppleHealth' || aw.source === 'HealthConnect');
    const latestSync = syncWorkouts.length > 0 ? syncWorkouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null;
    
    if (!latestSync || differenceInDays(currentDate, parseISO(latestSync.date)) > 3) {
      recommendations.push({
        id: genId('HEALTH_SYNC'),
        type: 'HEALTH_SYNC',
        priority: 'MEDIUM',
        title: 'Synchronise tes entraînements',
        message: 'Aucune synchronisation récente.',
        reason: 'Une synchronisation récente permet à Plana d\'adapter ton planning à ta charge réelle.',
        action: 'sync_health',
        createdAt: currentDate.toISOString()
      });
    }
  }

  // Sort by priority
  const priorityScore = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  recommendations.sort((a, b) => priorityScore[b.priority] - priorityScore[a.priority]);

  return recommendations;
}
