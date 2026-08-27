const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf8');

code = code.replace(
  "import { AdaptationResult, Recommendation } from './domain/models';",
  "import { AdaptationResult, Recommendation } from './domain/models';\nimport { ChatMessage, CoachContext } from './domain/coach';\nimport { CoachService } from './services/coach/coachService';\nimport { format as formatDateFns } from 'date-fns';"
);

// Interface
code = code.replace(
  "recommendations: Recommendation[];",
  "recommendations: Recommendation[];\n  chatHistory: ChatMessage[];\n  sendMessageToCoach: (text: string) => Promise<void>;\n  clearChatHistory: () => void;"
);

// AppProvider state
code = code.replace(
  "const [events, setEvents] = useState<EventGoal[]>(mockEvents);",
  "const [events, setEvents] = useState<EventGoal[]>(mockEvents);\n  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);"
);

// Message handling
const chatHandling = `
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
`;

code = code.replace(
  "const setAthleteProfile = (p: AthleteProfile) => {",
  chatHandling + "\n  const setAthleteProfile = (p: AthleteProfile) => {"
);

// Context Provider
code = code.replace(
  "recommendations,",
  "recommendations, chatHistory, sendMessageToCoach, clearChatHistory,"
);

fs.writeFileSync('src/store.tsx', code);
