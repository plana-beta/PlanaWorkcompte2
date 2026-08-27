const fs = require('fs');
let code = fs.readFileSync('src/views/GoalView.tsx', 'utf8');

code = code.replace(
  "import { cn } from '../utils';",
  "import { cn } from '../utils';\nimport { useAppStore } from '../store';\nimport { differenceInDays, parseISO, format } from 'date-fns';\nimport { fr } from 'date-fns/locale';"
);

const newUI = `  const { goal, athleteProfile, recommendations } = useAppStore();
  
  if (!goal || !athleteProfile) {
    return (
      <div className="p-5 flex items-center justify-center h-full text-slate-400 font-medium text-sm">
        Aucun objectif configuré.
      </div>
    );
  }

  const daysToGoal = Math.max(0, differenceInDays(parseISO(goal.date), new Date()));
  const formattedDate = format(parseISO(goal.date), 'd MMMM yyyy', { locale: fr });
  
  const goalRec = recommendations.find(r => r.type === 'GOAL');
`;

code = code.replace("export default function GoalView() {", "export default function GoalView() {\n" + newUI);

// Replace hardcoded values
code = code.replace("Ironman Nice", "{goal.title}");
code = code.replace("14 juin 2027", "{formattedDate}");
code = code.replace(">292<", ">{daysToGoal}<");

// Replace levels
code = code.replace(
  /<span className="px-3 py-1 bg-gray-100 rounded-lg text-\[10px\] font-bold text-slate-600 uppercase tracking-wider">Intermédiaire<\/span>/,
  `{athleteProfile.level.swim === 'intermediate' ? (
              <span className="px-3 py-1 bg-blue-50 rounded-lg text-[10px] font-bold text-blue-600 uppercase tracking-wider">Intermédiaire</span>
            ) : athleteProfile.level.swim === 'advanced' ? (
              <span className="px-3 py-1 bg-blue-100 rounded-lg text-[10px] font-bold text-blue-700 uppercase tracking-wider">Avancé</span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-wider">Débutant</span>
            )}`
);

code = code.replace(
  /<span className="px-3 py-1 bg-plana-orange\/10 rounded-lg text-\[10px\] font-bold text-plana-orange uppercase tracking-wider">Avancé<\/span>/,
  `{athleteProfile.level.ride === 'advanced' ? (
              <span className="px-3 py-1 bg-emerald-50 rounded-lg text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Avancé</span>
            ) : athleteProfile.level.ride === 'intermediate' ? (
              <span className="px-3 py-1 bg-emerald-50 rounded-lg text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Intermédiaire</span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-wider">Débutant</span>
            )}`
);

code = code.replace(
  /<span className="px-3 py-1 bg-gray-100 rounded-lg text-\[10px\] font-bold text-slate-600 uppercase tracking-wider">Débutant<\/span>/,
  `{athleteProfile.level.run === 'advanced' ? (
              <span className="px-3 py-1 bg-orange-100 rounded-lg text-[10px] font-bold text-orange-600 uppercase tracking-wider">Avancé</span>
            ) : athleteProfile.level.run === 'intermediate' ? (
              <span className="px-3 py-1 bg-orange-50 rounded-lg text-[10px] font-bold text-orange-500 uppercase tracking-wider">Intermédiaire</span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-wider">Débutant</span>
            )}`
);

// Replace estimation insight with Goal recommendation or fallback
const insightBlock = `      {/* Estimation */}
      <div className="bg-blue-50 border border-blue-200/50 rounded-3xl p-5 flex gap-4 items-start shadow-sm">
        <div className="shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mt-0.5">
          <Info size={16} />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            Synthèse du Coach
          </h4>
          <p className="text-sm font-medium text-slate-700 leading-relaxed">
            {goalRec ? goalRec.message + " " + goalRec.reason : "Continue de suivre ton plan d'entraînement pour construire tes fondations physiologiques vers ton objectif."}
          </p>
        </div>
      </div>`;

code = code.replace(
  /\{\/\* Estimation \*\/\}.*<\/p>\s*<\/div>/s,
  insightBlock
);

// Disable the "Préparation" section percentage mock, or hide it if we can't calculate it
code = code.replace(
  /\{\/\* Préparation \*\/\}.*?\{\/\* Ton niveau actuel \*\/\}/s,
  "{/* Préparation (Calcul à implémenter) */}\n      {/* Ton niveau actuel */}"
);

fs.writeFileSync('src/views/GoalView.tsx', code);
