export type Sport = 'Swim' | 'Ride' | 'Run' | 'Strength' | 'Other';

export interface AthleteProfile {
  id: string;
  name?: string;
  level: {
    swim: 'beginner' | 'intermediate' | 'advanced';
    ride: 'beginner' | 'intermediate' | 'advanced';
    run: 'beginner' | 'intermediate' | 'advanced';
  };
  weeklyTimeCommitmentMinutes: number;
  availableDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  dataConnection: 'none' | 'apple_health' | 'google_health_connect' | 'demo';
}

export interface Goal {
  id: string;
  title: string;
  date: string;
  type: 'sprint' | 'olympic' | 'half' | 'ironman' | 'custom';
  sportFocus: Sport | 'Triathlon';
  location?: string;
}

export interface PlannedWorkout {
  id: string;
  sport: Sport;
  date: string; // YYYY-MM-DD
  title: string;
  description?: string;
  targetDurationMin: number;
  targetIntensity: {
    type: 'zone' | 'hr' | 'power' | 'pace' | 'rpe';
    value: string;
  };
  targetTss?: number;
  explanation?: string; // Why this workout?
  importance?: 'low' | 'medium' | 'high';
  isAdapted?: boolean;
  adaptedReason?: string;
  originalTargetDurationMin?: number;
  originalDate?: string;
}

export interface AdaptationChange {
  plannedWorkoutId: string;
  type: 'modified' | 'moved' | 'deleted' | 'added';
  reason: string;
}

export interface AdaptationResult {
  changed: boolean;
  changes: AdaptationChange[];
  summary: string;
  newPlan: PlannedWorkout[];
}

export interface ActualWorkout {
  id: string;
  source: 'AppleHealth' | 'HealthConnect' | 'Manual' | 'Garmin';
  sourceId?: string;
  sport: Sport;
  date: string;
  startTime: string; // ISO
  durationMin: number;
  distanceKm?: number;
  averageHeartRate?: number;
  normalizedPower?: number;
  tss?: number;
}

export interface WorkoutExecution {
  plannedId: string;
  actualId: string;
  compliancePercentage: number;
  intensityDeviation: number; // positive = harder, negative = easier
}


export interface Recommendation {
  id: string;
  type: 'TODAY_WORKOUT' | 'RECOVERY' | 'PLAN_ADAPTED' | 'MISSED_WORKOUT' | 'PROGRESS' | 'GOAL' | 'HEALTH_SYNC' | 'WARNING' | 'INFO';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  reason?: string;
  relatedWorkoutId?: string;
  action?: 'start_workout' | 'sync_health' | 'view_plan';
  createdAt: string;
}
