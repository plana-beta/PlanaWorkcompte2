import { differenceInDays, addDays, format, parseISO, startOfDay, isValid } from 'date-fns';
import { PmcData } from '../types';
import { ActualWorkout } from '../domain/models';

/**
 * Calculate Normalized Power (NP) from a 1-second power array.
 * Uses a 30-second moving average, raised to the 4th power, averaged, then 4th root.
 */
export function calculateNP(powerData: number[]): number {
  if (!powerData || powerData.length === 0) return 0;
  
  let sumP4 = 0;
  let count = 0;
  
  for (let i = 0; i < powerData.length; i++) {
    let windowSum = 0;
    let windowSize = 0;
    
    const startIdx = Math.max(0, i - 29);
    for (let j = startIdx; j <= i; j++) {
      windowSum += powerData[j];
      windowSize++;
    }
    
    const p30 = windowSum / windowSize;
    sumP4 += Math.pow(p30, 4);
    count++;
  }
  
  return count > 0 ? Math.pow(sumP4 / count, 0.25) : 0;
}

/**
 * Calculate Intensity Factor (IF).
 */
export function calculateIF(np: number, ftp: number): number {
  if (ftp <= 0) return 0;
  return np / ftp;
}

/**
 * Calculate Training Stress Score (TSS).
 */
export function calculateTSS(durationSeconds: number, np: number, ftp: number): number {
  if (ftp <= 0 || durationSeconds <= 0) return 0;
  const IF = calculateIF(np, ftp);
  return (durationSeconds * np * IF) / (ftp * 36);
}

/**
 * Estimates TSS when Power is not available, based on Heart Rate.
 * A very simplified HR-TSS (hrTSS) estimation.
 * Assuming threshold HR is ~85% of max HR. 
 */
export function estimateHrTss(durationMin: number, avgHr: number, maxHr: number = 190): number {
  if (avgHr <= 0 || durationMin <= 0 || maxHr <= 0) return 0;
  const thr = maxHr * 0.85; // Default estimation if not provided
  // Simple heuristic: IF ~ avgHr / thr.
  // TSS = (duration_h) * IF^2 * 100
  const estimatedIF = avgHr / thr;
  return (durationMin / 60) * Math.pow(estimatedIF, 2) * 100;
}

/**
 * Estimates TSS purely on duration and sport when neither power nor HR are available.
 */
export function estimateDurationTss(durationMin: number, sport: string): number {
  if (durationMin <= 0) return 0;
  // Fallbacks: Swim ~ 50 TSS/h, Run ~ 60 TSS/h, Ride ~ 40 TSS/h (assuming easy/moderate efforts)
  let tssPerHour = 50; 
  if (sport.toLowerCase() === 'run') tssPerHour = 60;
  else if (sport.toLowerCase() === 'ride') tssPerHour = 40;
  
  return (durationMin / 60) * tssPerHour;
}

/**
 * Calculates the training load for a single workout.
 */
export function calculateTrainingLoad(
  workout: Partial<ActualWorkout> & { powerData?: number[] },
  ftp: number,
  maxHr: number = 190
): number {
  // If we already have a pre-calculated TSS (from Garmin etc.), trust it.
  if (workout.tss !== undefined && workout.tss > 0) {
    return workout.tss;
  }
  
  const durationMin = workout.durationMin || 0;
  if (durationMin <= 0) return 0;

  // Power-based calculation (Ride usually)
  let np = workout.normalizedPower || 0;
  if (workout.powerData && workout.powerData.length > 0) {
    np = calculateNP(workout.powerData);
  }
  if (np > 0 && ftp > 0) {
    return calculateTSS(durationMin * 60, np, ftp);
  }

  // Heart Rate-based calculation
  if (workout.averageHeartRate && workout.averageHeartRate > 0) {
    return estimateHrTss(durationMin, workout.averageHeartRate, maxHr);
  }

  // Duration/Sport fallback
  return estimateDurationTss(durationMin, workout.sport || 'Other');
}

/**
 * Generates PMC data (ATL, CTL, TSB) for a list of workouts.
 */
export function generatePMC(
  workouts: (Partial<ActualWorkout> & { powerData?: number[] })[], 
  ftp: number, 
  upToDate: Date = new Date()
): PmcData[] {
  if (!workouts || workouts.length === 0) return [];
  
  // Sort activities by date
  const sorted = [...workouts].sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime());
  let startDate = startOfDay(new Date(sorted[0].date || new Date()));
  
  if (!isValid(startDate)) {
    startDate = startOfDay(new Date());
  }

  // Group TSS by date
  const tssMap = new Map<string, number>();
  
  sorted.forEach(act => {
    if (!act.date) return;
    const activityTss = calculateTrainingLoad(act, ftp);
    const dStr = format(parseISO(act.date), 'yyyy-MM-dd');
    tssMap.set(dStr, (tssMap.get(dStr) || 0) + activityTss);
  });

  const pmc: PmcData[] = [];
  const endDate = startOfDay(upToDate);
  const totalDays = Math.max(0, differenceInDays(endDate, startDate) + 14); // Predict 14 days into the future
  
  let currentATL = 0;
  let currentCTL = 0;

  for (let i = 0; i <= totalDays; i++) {
    const currentDate = addDays(startDate, i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const tssJour = tssMap.get(dateStr) || 0;

    // ATL: 7 day time constant, CTL: 42 day time constant
    currentATL = currentATL + (tssJour - currentATL) / 7;
    currentCTL = currentCTL + (tssJour - currentCTL) / 42;
    
    // TSB = CTL - ATL (Form)
    const currentTSB = currentCTL - currentATL;

    pmc.push({
      date: dateStr,
      tss: tssJour,
      atl: currentATL,
      ctl: currentCTL,
      tsb: currentTSB
    });
  }

  return pmc;
}
