const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf8');

// Imports
code = code.replace(
  "import { adaptTrainingPlan } from './lib/adaptationEngine';",
  "import { adaptTrainingPlan } from './lib/adaptationEngine';\nimport { generateRecommendations } from './lib/recommendationEngine';\nimport { AdaptationResult, Recommendation } from './domain/models';"
);

// AppState
code = code.replace(
  "generatePlan: () => void;\n  adaptPlan: () => void;",
  "generatePlan: () => void;\n  adaptPlan: () => void;\n  recommendations: Recommendation[];"
);

// inside AppProvider
code = code.replace(
  "const [events, setEvents] = useState<EventGoal[]>(mockEvents);",
  "const [events, setEvents] = useState<EventGoal[]>(mockEvents);\n  const [adaptationResult, setAdaptationResult] = useState<AdaptationResult | null>(null);"
);

// adaptPlan
const oldAdaptPlan = `  const adaptPlan = () => {
    if (!athleteProfile || plannedWorkouts.length === 0) return;
    const result = adaptTrainingPlan({
      athleteProfile,
      goal,
      plannedWorkouts,
      actualWorkouts,
      trainingMetrics: pmc,
      currentDate: new Date()
    });
    if (result.changed) {
      setPlannedWorkouts(result.newPlan);
    }
  };`;
const newAdaptPlan = `  const adaptPlan = () => {
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
  };`;
code = code.replace(oldAdaptPlan, newAdaptPlan);

// Recommendations useMemo
const recsCode = `
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
`;

code = code.replace(
  "const setAthleteProfile = (p: AthleteProfile) => {",
  recsCode + "\n  const setAthleteProfile = (p: AthleteProfile) => {"
);

// Context value
code = code.replace(
  "plannedWorkouts, setPlannedWorkouts, generatePlan, adaptPlan,",
  "plannedWorkouts, setPlannedWorkouts, generatePlan, adaptPlan, recommendations,"
);

fs.writeFileSync('src/store.tsx', code);
