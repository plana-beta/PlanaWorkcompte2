import { AthleteProfile, Goal, PlannedWorkout, ActualWorkout, Sport } from '../domain/models';
import { PmcData } from '../types';
import { differenceInDays, addDays, startOfWeek, parseISO, getDay, format } from 'date-fns';

function generateId(dateStr: string, sport: string): string {
  return `pw_${dateStr}_${sport}`;
}

// Pseudo-random deterministic based on date
function isHard(dateStr: string): boolean {
  return dateStr.charCodeAt(dateStr.length - 1) % 2 === 0;
}

function getIntensityForLevel(sport: Sport, level: string, isLong: boolean, dateStr: string): 'easy' | 'moderate' | 'hard' {
  if (isLong) return 'easy';
  if (level === 'beginner') return 'easy';
  if (level === 'intermediate') return isHard(dateStr) ? 'hard' : 'moderate';
  return isHard(dateStr) ? 'hard' : 'moderate';
}

function getPurpose(sport: Sport, intensity: string, isLong: boolean): string {
  if (isLong) return `Développer l'endurance fondamentale en ${sport.toLowerCase()}`;
  if (intensity === 'hard') return `Travail spécifique et intensité au seuil (${sport})`;
  if (intensity === 'moderate') return `Travail rythmé (Tempo) en ${sport}`;
  return `Récupération et technique (${sport})`;
}

export function generateTrainingPlan(
  profile: AthleteProfile,
  goal: Goal | null,
  history: ActualWorkout[],
  pmc: PmcData[],
  startDate: Date,
  endDate: Date
): PlannedWorkout[] {
  const plan: PlannedWorkout[] = [];
  
  if (differenceInDays(endDate, startDate) < 0) return plan;

  const availableDaysSet = new Set(profile.availableDays || [0, 1, 2, 3, 4, 5, 6]);
  if (availableDaysSet.size === 0) return plan;

  let currentWeekStart = startOfWeek(startDate, { weekStartsOn: 1 });
  
  while (currentWeekStart <= endDate) {
    let taperFactor = 1.0;
    if (goal && goal.date) {
      const goalDate = parseISO(goal.date);
      const daysToGoal = differenceInDays(goalDate, currentWeekStart);
      if (daysToGoal >= 0 && daysToGoal <= 7) taperFactor = 0.5; // Race week
      else if (daysToGoal > 7 && daysToGoal <= 14) taperFactor = 0.75; // Pre-race
    }
    
    const weeklyTargetMin = profile.weeklyTimeCommitmentMinutes * taperFactor;
    if (weeklyTargetMin <= 0) {
      currentWeekStart = addDays(currentWeekStart, 7);
      continue;
    }
    
    const availableDates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(currentWeekStart, i);
      if (d >= startDate && d <= endDate && availableDaysSet.has(getDay(d))) {
        availableDates.push(d);
      }
    }
    
    if (availableDates.length > 0) {
      // Prorate target minutes if we don't have the full week available in the requested range
      const proratedTargetMin = weeklyTargetMin * (availableDates.length / availableDaysSet.size);

      let swimMin = 0, bikeMin = 0, runMin = 0;
      if (goal?.sportFocus === 'Run') {
        runMin = proratedTargetMin;
      } else if (goal?.sportFocus === 'Ride') {
        bikeMin = proratedTargetMin;
      } else {
        swimMin = proratedTargetMin * 0.20;
        bikeMin = proratedTargetMin * 0.50;
        runMin = proratedTargetMin * 0.30;
      }
      
      const generateSessions = (sport: Sport, totalMin: number, level: string) => {
        if (totalMin < 20) return [];
        let numSessions = Math.max(1, Math.round(totalMin / 60));
        numSessions = Math.min(numSessions, 4);
        
        const sessions = [];
        let remainingMin = totalMin;
        
        if (numSessions > 1 && sport !== 'Swim') {
          const longMin = Math.round(totalMin * 0.45);
          sessions.push({ sport, duration: longMin, isLong: true, level });
          remainingMin -= longMin;
          numSessions--;
        }
        
        const avgMin = Math.round(remainingMin / numSessions);
        for (let i = 0; i < numSessions; i++) {
          sessions.push({ sport, duration: avgMin, isLong: false, level });
        }
        return sessions;
      };
      
      const allSessions = [
        ...generateSessions('Swim', swimMin, profile.level?.swim || 'beginner'),
        ...generateSessions('Ride', bikeMin, profile.level?.ride || 'beginner'),
        ...generateSessions('Run', runMin, profile.level?.run || 'beginner')
      ];
      
      allSessions.sort((a, b) => b.duration - a.duration);
      
      const sortedDates = [...availableDates];
      let dateIndex = sortedDates.length - 1;
      
      for (const session of allSessions) {
        const d = sortedDates[dateIndex];
        const dateStr = format(d, 'yyyy-MM-dd');
        
        const intensity = getIntensityForLevel(session.sport, session.level, session.isLong, dateStr);
        const purpose = getPurpose(session.sport, intensity, session.isLong);
        
        const importance = session.isLong ? 'high' : (intensity === 'hard' ? 'high' : (intensity === 'moderate' ? 'medium' : 'low'));
        
        plan.push({
          id: generateId(dateStr, session.sport),
          sport: session.sport,
          date: dateStr,
          title: `${session.isLong ? 'Sortie Longue' : 'Entraînement'} ${session.sport}`,
          description: purpose,
          targetDurationMin: session.duration,
          targetIntensity: {
            type: 'rpe',
            value: intensity
          },
          explanation: `Cette séance respecte ton volume disponible de la semaine et s'adapte à ton niveau ${session.level}.`,
          importance,
          originalTargetDurationMin: session.duration
        });
        
        dateIndex--;
        if (dateIndex < 0) dateIndex = sortedDates.length - 1;
      }
    }
    
    currentWeekStart = addDays(currentWeekStart, 7);
  }
  
  plan.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return plan;
}
