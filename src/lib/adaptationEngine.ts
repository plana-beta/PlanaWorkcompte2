import { AthleteProfile, Goal, PlannedWorkout, ActualWorkout, AdaptationResult, AdaptationChange } from '../domain/models';
import { PmcData } from '../types';
import { differenceInDays, isBefore, isSameDay, parseISO, format, addDays } from 'date-fns';

export function adaptTrainingPlan({
  athleteProfile,
  goal,
  plannedWorkouts,
  actualWorkouts,
  trainingMetrics,
  currentDate
}: {
  athleteProfile: AthleteProfile;
  goal: Goal | null;
  plannedWorkouts: PlannedWorkout[];
  actualWorkouts: ActualWorkout[];
  trainingMetrics: PmcData[];
  currentDate: Date;
}): AdaptationResult {
  const result: AdaptationResult = {
    changed: false,
    changes: [],
    summary: "Aucune adaptation nécessaire.",
    newPlan: []
  };

  // If no future planned workouts, return immediately
  const futureWorkouts = plannedWorkouts.filter(pw => !isBefore(parseISO(pw.date), currentDate) || isSameDay(parseISO(pw.date), currentDate));
  const pastPlanned = plannedWorkouts.filter(pw => isBefore(parseISO(pw.date), currentDate) && !isSameDay(parseISO(pw.date), currentDate));
  
  // Clone to avoid mutating original state directly until we return newPlan
  const newPlan = plannedWorkouts.map(w => ({ ...w, targetDurationMin: w.originalTargetDurationMin || w.targetDurationMin }));
  
  // 1. Detect missed sessions in the last 7 days
  const sevenDaysAgo = addDays(currentDate, -7);
  const recentPastPlanned = pastPlanned.filter(pw => !isBefore(parseISO(pw.date), sevenDaysAgo));
  let missedCount = 0;
  
  recentPastPlanned.forEach(pw => {
    const hasActual = actualWorkouts.some(aw => isSameDay(parseISO(aw.date), parseISO(pw.date)) && aw.sport === pw.sport);
    if (!hasActual) missedCount++;
  });

  // 2. Assess Fatigue from PMC
  const latestPmc = trainingMetrics.length > 0 ? trainingMetrics[trainingMetrics.length - 1] : { ctl: 0, atl: 0, tsb: 0 };
  const isHighFatigue = latestPmc.tsb <= -15 || latestPmc.atl > 60;
  const isExtremelyHighFatigue = latestPmc.tsb <= -25 || latestPmc.atl > 80;
  
  // 3. Assess if recent workouts were significantly longer/harder
  let plannedRecentDuration = 0;
  let actualRecentDuration = 0;
  recentPastPlanned.forEach(pw => plannedRecentDuration += pw.targetDurationMin);
  actualWorkouts.filter(aw => !isBefore(parseISO(aw.date), sevenDaysAgo) && isBefore(parseISO(aw.date), currentDate))
    .forEach(aw => actualRecentDuration += aw.durationMin);
    
  const overload = actualRecentDuration > plannedRecentDuration * 1.3 && plannedRecentDuration > 0;

  // 4. Proximity to goal
  let daysToGoal = 999;
  if (goal && goal.date) {
    daysToGoal = differenceInDays(parseISO(goal.date), currentDate);
  }
  const isRaceWeek = daysToGoal >= 0 && daysToGoal <= 7;

  // Now, adapt future workouts
  // We only adapt up to 7 days ahead to avoid messing up the whole plan
  const adaptationHorizon = addDays(currentDate, 7);
  
  let adaptationApplied = false;
  let summaryReasons = new Set<string>();

  for (let i = 0; i < newPlan.length; i++) {
    const pw = newPlan[i];
    const pwDate = parseISO(pw.date);
    
    // Skip past workouts or workouts beyond horizon
    if (isBefore(pwDate, currentDate) && !isSameDay(pwDate, currentDate)) continue;
    if (!isBefore(pwDate, adaptationHorizon)) continue;

    const originalDuration = pw.originalTargetDurationMin || pw.targetDurationMin;
    let newDuration = originalDuration;
    let newIntensity = pw.targetIntensity.value;
    let reason = "";

    if (isRaceWeek) {
      if (pw.importance !== 'high') {
         newDuration = Math.round(originalDuration * 0.7);
         if (newIntensity === 'hard') newIntensity = 'moderate';
         reason = "Course imminente : volume réduit pour privilégier la fraîcheur.";
      }
    } else if (isExtremelyHighFatigue) {
      if (pw.importance === 'high') {
         newDuration = Math.round(originalDuration * 0.8);
         reason = "Fatigue excessive : légère réduction de cette séance clé.";
      } else {
         newDuration = Math.round(originalDuration * 0.5);
         newIntensity = 'easy';
         reason = "Fatigue excessive : séance transformée en récupération.";
      }
    } else if (isHighFatigue || overload) {
      if (pw.importance !== 'high') {
         newDuration = Math.round(originalDuration * 0.8);
         if (newIntensity === 'hard') newIntensity = 'moderate';
         reason = "Charge récente élevée : séance allégée pour optimiser la récupération.";
      }
    } else if (missedCount >= 3) {
      if (pw.importance === 'high') {
         newDuration = Math.round(originalDuration * 0.8);
         reason = "Reprise après plusieurs séances manquées : reprise progressive.";
      } else if (newIntensity === 'hard') {
         newIntensity = 'moderate';
         reason = "Reprise après séances manquées : intensité réduite.";
      }
    }

    if (newDuration !== originalDuration || newIntensity !== pw.targetIntensity.value) {
      pw.targetDurationMin = newDuration;
      pw.targetIntensity = { ...pw.targetIntensity, value: newIntensity };
      pw.isAdapted = true;
      pw.adaptedReason = reason;
      
      adaptationApplied = true;
      summaryReasons.add(reason);
      
      result.changes.push({
        plannedWorkoutId: pw.id,
        type: 'modified',
        reason
      });
    } else {
      // Revert adaptation if conditions are no longer met (Idempotence based on original values)
      if (pw.isAdapted) {
         pw.isAdapted = false;
         pw.adaptedReason = undefined;
         adaptationApplied = true; // Technically a change back to original
      }
    }
  }

  result.newPlan = newPlan;
  result.changed = result.changes.length > 0 || adaptationApplied;
  
  if (result.changes.length > 0) {
    result.summary = "Ton plan a été adapté : " + Array.from(summaryReasons).join(" ");
  }

  return result;
}
