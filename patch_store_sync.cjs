const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf8');

code = code.replace(
  "import { AdaptationResult, Recommendation } from './domain/models';",
  "import { AdaptationResult, Recommendation } from './domain/models';\nimport { syncService, SyncStatus } from './services/sync/SyncService';"
);

code = code.replace(
  "clearChatHistory: () => void;",
  "clearChatHistory: () => void;\n  syncStatus: SyncStatus;\n  triggerSync: () => Promise<void>;"
);

// AppProvider state
code = code.replace(
  "const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);",
  "const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);\n  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus());"
);

// Add triggerSync logic
const triggerSyncCode = `
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
`;

code = code.replace(
  "const pmc = useMemo(() => generatePMC(actualWorkouts, ftp), [actualWorkouts, ftp]);",
  triggerSyncCode + "\n  const pmc = useMemo(() => generatePMC(actualWorkouts, ftp), [actualWorkouts, ftp]);"
);

// Context Provider
code = code.replace(
  "recommendations, chatHistory, sendMessageToCoach, clearChatHistory,",
  "recommendations, chatHistory, sendMessageToCoach, clearChatHistory, syncStatus, triggerSync,"
);

fs.writeFileSync('src/store.tsx', code);
