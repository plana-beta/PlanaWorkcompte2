import { AthleteProfile, Goal, PlannedWorkout, Recommendation } from './models';

export interface CoachContext {
  athleteProfile: Pick<AthleteProfile, 'level' | 'weeklyTimeCommitmentMinutes' | 'dataConnection'>;
  goal: Pick<Goal, 'title' | 'date' | 'type'> | null;
  currentDate: string;
  todayWorkout: Pick<PlannedWorkout, 'id' | 'sport' | 'title' | 'targetDurationMin' | 'explanation' | 'isAdapted' | 'adaptedReason'> | null;
  upcomingWorkouts: Pick<PlannedWorkout, 'id' | 'sport' | 'date' | 'targetDurationMin' | 'isAdapted' | 'adaptedReason'>[];
  recentFatigue: { atl: number; ctl: number; tsb: number } | null;
  activeRecommendations: Pick<Recommendation, 'type' | 'priority' | 'title' | 'message' | 'reason'>[];
}

export type CoachActionType = 
  | 'VIEW_TODAY_WORKOUT'
  | 'EXPLAIN_WORKOUT'
  | 'EXPLAIN_ADAPTATION'
  | 'VIEW_PROGRESS'
  | 'VIEW_GOAL'
  | 'REQUEST_WORKOUT_SUBSTITUTION'
  | 'REQUEST_WORKOUT_RESCHEDULE'
  | 'REQUEST_RECOVERY'
  | 'REQUEST_SYNC'
  | 'GENERAL_ADVICE';

export interface CoachIntent {
  type: CoachActionType;
  workoutId?: string;
  requestedChange?: string;
  userMessage: string;
}

export interface CoachResponse {
  message: string;
  intent?: CoachIntent;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
  intent?: CoachIntent;
  requiresConfirmation?: boolean;
}

export interface CoachProvider {
  generateResponse(context: CoachContext, message: string, history: ChatMessage[]): Promise<CoachResponse>;
}
