import { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { BikeComponent, MetricData, PmcData, EventGoal } from './types';
import { AthleteProfile, Goal, PlannedWorkout, ActualWorkout } from './domain/models';
import { format, subDays, addDays } from 'date-fns';
import { generatePMC } from './lib/trainingEngine';
import { generateTrainingPlan } from './lib/planningEngine';
import { adaptTrainingPlan } from './lib/adaptationEngine';
import { generateRecommendations } from './lib/recommendationEngine';
import { AdaptationResult, Recommendation } from './domain/models';
import { syncService, SyncStatus } from './services/sync/SyncService';
import { ChatMessage, CoachContext } from './domain/coach';
import { CoachService } from './services/coach/coachService';
import { format as formatDateFns } from 'date-fns';

interface AppState {
  athleteProfile: AthleteProfile | null;
  setAthleteProfile: (p: AthleteProfile) => void;
  
  goal: Goal | null;
  setGoal: (g: Goal) => void;

  actualWorkouts: ActualWorkout[];
  addActualWorkout: (w: ActualWorkout) => void;
  updateActualWorkout: (w: ActualWorkout) => void;
  removeActualWorkout: (id: string) => void;

  plannedWorkouts: PlannedWorkout[];
  setPlannedWorkouts: (w: PlannedWorkout[]) => void;
  generatePlan: () => void;
  adaptPlan: () => void;
  recommendations: Recommendation[];
  chatHistory: ChatMessage[];
  sendMessageToCoach: (text: string) => Promise<void>;
  clearChatHistory: () => void;
  syncStatus: SyncStatus;
  triggerSync: () => Promise<void>;

  components: BikeComponent[];
  metrics: MetricData[];
  pmc: PmcData[];
  events: EventGoal[];
  
  ftp: number;
  setFtp: (ftp: number) => void;
  addComponent: (c: BikeComponent) => void;
  updateComponent: (c: BikeComponent) => void;
  removeComponent: (id: string) => void;
  addEvent: (e: EventGoal) => void;
  updateEvent: (e: EventGoal) => void;
  removeEvent: (id: string) => void;
}

const mockComponents: BikeComponent[] = [];
const mockMetrics: MetricData[] = [];
const mockEvents: EventGoal[] = [];

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [athleteProfile, setAthleteProfileState] = useState<AthleteProfile | null>(() => {
    const saved = localStorage.getItem('plana_athlete_profile');
    if (saved) return JSON.parse(saved);
    return {
      id: 'default',
      level: { swim: 'intermediate', ride: 'advanced', run: 'beginner' },
      weeklyTimeCommitmentMinutes: 420, // 7h
      availableDays: [1, 2, 3, 5, 6], // Tue, Wed, Thu, Sat, Sun
      dataConnection: 'none'
    };
  });

  const [goal, setGoal] = useState<Goal | null>(() => {
    return {
      id: 'g1',
      title: 'Triathlon Objectif',
      date: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
      type: 'olympic',
      sportFocus: 'Triathlon'
    };
  });

  const [actualWorkouts, setActualWorkouts] = useState<ActualWorkout[]>([]);
  const [plannedWorkouts, setPlannedWorkouts] = useState<PlannedWorkout[]>([]);

  const [components, setComponents] = useState<BikeComponent[]>(mockComponents);
  const [events, setEvents] = useState<EventGoal[]>(mockEvents);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus());
  const [adaptationResult, setAdaptationResult] = useState<AdaptationResult | null>(null);
  
  const [ftp, setFtpState] = useState<number>(250);
  const setFtp = (newFtp: number) => setFtpState(newFtp);

  
  const triggerSync = async () => {
    if (!athleteProfile?.dataConnection || athleteProfile.dataConnection === 'none') return;
    
    try {
      await syncService.initializeAdapter(athleteProfile.dataConnection);
      setSyncStatus({ ...syncService.getStatus() });
      
      const { newWorkouts, updatedWorkouts, matchedPlannedIds } = await syncService.sync(actualWorkouts, plannedWorkouts);
      
      if (newWorkouts.length > 0 || updatedWorkouts.length > 0) {
        setActualWorkouts(prev => {
          let next = [...prev];
          for (const updated of updatedWorkouts) {
            next = next.map(w => w.id === updated.id ? updated : w);
          }
          next = [...next, ...newWorkouts];
          return next;
        });
      }
      
      // Update planned workouts status
      if (matchedPlannedIds.length > 0) {
        // Just as an example, normally we would add a status property to PlannedWorkout or handle it.
        // For now, it will trigger adaptation automatically because actualWorkouts changed.
      }

      setSyncStatus({ ...syncService.getStatus() });
    } catch (err) {
      setSyncStatus({ ...syncService.getStatus() });
    }
  };

  // Sync on startup if connection is configured
  useEffect(() => {
    if (athleteProfile && athleteProfile.dataConnection !== 'none') {
      triggerSync();
    }
  }, [athleteProfile?.dataConnection]);

  const pmc = useMemo(() => generatePMC(actualWorkouts, ftp), [actualWorkouts, ftp]);

  const generatePlan = () => {
    if (!athleteProfile) return;
    const startDate = new Date();
    const endDate = goal?.date ? new Date(goal.date) : addDays(startDate, 28);
    const plan = generateTrainingPlan(athleteProfile, goal, actualWorkouts, pmc, startDate, endDate);
    setPlannedWorkouts(plan);
  };

  
  const adaptPlan = () => {
    if (!athleteProfile || plannedWorkouts.length === 0) return;
    const result = adaptTrainingPlan({
      athleteProfile,
      goal,
      plannedWorkouts,
      actualWorkouts,
      trainingMetrics: pmc,
      currentDate: new Date()
    });
    setAdaptationResult(result);
    if (result.changed) {
      setPlannedWorkouts(result.newPlan);
    }
  };

  // Trigger adaptation when actualWorkouts or pmc change
  useEffect(() => {
    if (plannedWorkouts.length > 0) {
      adaptPlan();
    }
  }, [actualWorkouts, pmc]);

  // Generate initial plan if empty
  useEffect(() => {
    if (plannedWorkouts.length === 0 && athleteProfile) {
      generatePlan();
    }
  }, [athleteProfile, goal]); // Removed actualWorkouts and pmc to prevent infinite re-renders

  
  const recommendations = useMemo(() => {
    if (!athleteProfile) return [];
    return generateRecommendations({
      athleteProfile,
      goal,
      plannedWorkouts,
      actualWorkouts,
      trainingMetrics: pmc,
      adaptationResult,
      currentDate: new Date()
    });
  }, [athleteProfile, goal, plannedWorkouts, actualWorkouts, pmc, adaptationResult]);

  
  const clearChatHistory = () => setChatHistory([]);

  const sendMessageToCoach = async (text: string) => {
    if (!athleteProfile) return;
    
    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    
    const context: CoachContext = {
      athleteProfile: {
        level: athleteProfile.level,
        weeklyTimeCommitmentMinutes: athleteProfile.weeklyTimeCommitmentMinutes,
        dataConnection: athleteProfile.dataConnection
      },
      goal: goal ? { title: goal.title, date: goal.date, type: goal.type } : null,
      currentDate: formatDateFns(new Date(), 'yyyy-MM-dd'),
      todayWorkout: plannedWorkouts.find(w => w.date === formatDateFns(new Date(), 'yyyy-MM-dd')) || null,
      upcomingWorkouts: plannedWorkouts.filter(w => w.date > formatDateFns(new Date(), 'yyyy-MM-dd')).slice(0, 5),
      recentFatigue: pmc.length > 0 ? pmc[pmc.length - 1] : null,
      activeRecommendations: recommendations
    };

    const response = await CoachService.generateResponse(context, text, chatHistory);
    
    const coachMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: 'coach',
      text: response.message,
      timestamp: new Date().toISOString(),
      intent: response.intent
    };
    
    setChatHistory(prev => {
       const newHistory = [...prev, coachMessage];
       if (newHistory.length > 30) {
         return newHistory.slice(newHistory.length - 30);
       }
       return newHistory;
    });
  };

  const setAthleteProfile = (p: AthleteProfile) => {
    setAthleteProfileState(p);
    localStorage.setItem('plana_athlete_profile', JSON.stringify(p));
  };

  const addActualWorkout = (w: ActualWorkout) => setActualWorkouts([...actualWorkouts, w]);
  const updateActualWorkout = (updated: ActualWorkout) => setActualWorkouts(actualWorkouts.map(w => w.id === updated.id ? updated : w));
  const removeActualWorkout = (id: string) => setActualWorkouts(actualWorkouts.filter(w => w.id !== id));

  const addComponent = (c: BikeComponent) => setComponents([...components, c]);
  const updateComponent = (updated: BikeComponent) => setComponents(components.map(c => c.id === updated.id ? updated : c));
  const removeComponent = (id: string) => setComponents(components.filter(c => c.id !== id));
  
  const addEvent = (e: EventGoal) => setEvents([...events, e]);
  const updateEvent = (updated: EventGoal) => setEvents(events.map(e => e.id === updated.id ? updated : e));
  const removeEvent = (id: string) => setEvents(events.filter(e => e.id !== id));

  return (
    <AppContext.Provider value={{
      athleteProfile, setAthleteProfile,
      goal, setGoal,
      actualWorkouts, addActualWorkout, updateActualWorkout, removeActualWorkout,
      plannedWorkouts, setPlannedWorkouts, generatePlan, adaptPlan, recommendations, chatHistory, sendMessageToCoach, clearChatHistory, syncStatus, triggerSync,
      components, metrics: mockMetrics, pmc, events, ftp, setFtp,
      addComponent, updateComponent, removeComponent, addEvent, updateEvent, removeEvent
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
}
