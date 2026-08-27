const fs = require('fs');
let code = fs.readFileSync('src/views/TodayView.tsx', 'utf8');

code = code.replace(
  "import { Play, Zap, Droplets, Bike, Footprints, Target } from 'lucide-react';",
  "import { Play, Zap, Droplets, Bike, Footprints, Target, Info, Activity, AlertTriangle } from 'lucide-react';"
);

code = code.replace(
  "const { plannedWorkouts, pmc, goal } = useAppStore();",
  "const { plannedWorkouts, pmc, goal, recommendations } = useAppStore();"
);

const newUI = `
      {/* Recommandation Principale */}
      {mainRecommendation && mainRecommendation.type === 'TODAY_WORKOUT' && todayPlanned ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 font-bold text-sm">
            {getSportIcon(todayPlanned.sport)}
            <span className="uppercase tracking-wider text-slate-600">{todayPlanned.sport}</span>
          </div>
          
          <h3 className="text-2xl font-black text-plana-black mb-1">{todayPlanned.title}</h3>
          <div className="flex items-center gap-2 mb-6">
            <p className="text-slate-500 font-medium">
              {todayPlanned.targetDurationMin} min
              {todayPlanned.isAdapted && todayPlanned.originalTargetDurationMin && todayPlanned.originalTargetDurationMin !== todayPlanned.targetDurationMin && (
                <span className="line-through text-slate-300 ml-2 text-xs">{todayPlanned.originalTargetDurationMin} min</span>
              )}
            </p>
            {todayPlanned.isAdapted && (
              <span className="bg-amber-100 text-amber-700 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full">
                Adaptée
              </span>
            )}
          </div>

          <div className="bg-orange-50 border border-plana-orange/20 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2 text-plana-orange font-bold text-xs uppercase tracking-wider">
              <Zap size={14} /> Pourquoi cette séance ?
            </div>
            <p className="text-sm font-medium text-plana-black leading-relaxed">
              {mainRecommendation.reason}
            </p>
          </div>
          
          <button className="w-full py-4 rounded-2xl bg-plana-black text-white font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 active:scale-[0.98]">
            <Play size={18} fill="currentColor" /> Commencer la séance
          </button>
        </div>
      ) : mainRecommendation ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm text-center py-8">
          <div className="flex justify-center mb-4">
             {mainRecommendation.priority === 'HIGH' ? <AlertTriangle size={32} className="text-amber-500" /> : <Activity size={32} className="text-emerald-500" />}
          </div>
          <h3 className="text-xl font-black text-plana-black mb-2">{mainRecommendation.title}</h3>
          <p className="text-sm text-slate-500 font-medium mb-4">{mainRecommendation.message}</p>
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 inline-block text-left">
            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              {mainRecommendation.reason}
            </p>
          </div>
        </div>
      ) : null}

      {/* Recommandations Secondaires */}
      {secondaryRecommendations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">À retenir</h4>
          {secondaryRecommendations.map(rec => (
            <div key={rec.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                 {rec.type === 'PLAN_ADAPTED' ? <Zap size={16} className="text-amber-500" /> : <Info size={16} className="text-blue-500" />}
              </div>
              <div>
                <div className="text-sm font-bold text-plana-black">{rec.title}</div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">{rec.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}
`;

const replaceTarget = `      {/* Séance du jour */}
      {todayPlanned ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 font-bold text-sm">
            {getSportIcon(todayPlanned.sport)}
            <span className="uppercase tracking-wider text-slate-600">{todayPlanned.sport}</span>
          </div>
          
          <h3 className="text-2xl font-black text-plana-black mb-1">{todayPlanned.title}</h3>
          <div className="flex items-center gap-2 mb-6">
            <p className="text-slate-500 font-medium">
              {todayPlanned.targetDurationMin} min
              {todayPlanned.isAdapted && todayPlanned.originalTargetDurationMin && todayPlanned.originalTargetDurationMin !== todayPlanned.targetDurationMin && (
                <span className="line-through text-slate-300 ml-2 text-xs">{todayPlanned.originalTargetDurationMin} min</span>
              )}
            </p>
            {todayPlanned.isAdapted && (
              <span className="bg-amber-100 text-amber-700 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full">
                Adaptée
              </span>
            )}
          </div>
          
          <button className="w-full py-4 rounded-2xl bg-plana-black text-white font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 active:scale-[0.98]">
            <Play size={18} fill="currentColor" /> Commencer la séance
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm text-center py-8">
          <h3 className="text-lg font-black text-plana-black mb-1">Repos aujourd'hui</h3>
          <p className="text-sm text-slate-500 font-medium">Profite de cette journée pour récupérer.</p>
        </div>
      )}

      {/* Pourquoi cette séance ? */}
      {todayPlanned?.explanation && (
        <div className="bg-orange-50 border border-plana-orange/20 rounded-3xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-2 text-plana-orange font-bold text-xs uppercase tracking-wider">
            <Zap size={14} /> Pourquoi cette séance ?
          </div>
          <p className="text-sm font-medium text-plana-black leading-relaxed">
            {todayPlanned.explanation}
            <br/><br/>
            {todayPlanned.description}
          </p>
        </div>
      )}
      
      {/* Explication de l'adaptation */}
      {todayPlanned?.isAdapted && todayPlanned.adaptedReason && (
        <div className="bg-amber-50 border border-amber-200/50 rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
            <Zap size={14} /> Adaptation
          </div>
          <p className="text-sm font-medium text-amber-900 leading-relaxed">
            {todayPlanned.adaptedReason}
          </p>
        </div>
      )}`;

code = code.replace(replaceTarget, newUI);
code = code.replace(
  "  let daysToGoal = 0;",
  "  const mainRecommendation = recommendations[0];\n  const secondaryRecommendations = recommendations.slice(1, 3);\n\n  let daysToGoal = 0;"
);

fs.writeFileSync('src/views/TodayView.tsx', code);
