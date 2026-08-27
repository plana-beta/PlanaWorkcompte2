const fs = require('fs');
let code = fs.readFileSync('src/views/ProgressionView.tsx', 'utf8');

code = code.replace(
  "const { pmc } = useAppStore();",
  "const { pmc, recommendations } = useAppStore();"
);

const newInsight = `      {/* Human Synthesis (from Recommendations) */}
      {recommendations.filter(r => r.type === 'PROGRESS' || r.type === 'RECOVERY' || r.type === 'WARNING').slice(0, 1).map(rec => (
        <div key={rec.id} className="bg-blue-50 border border-blue-200/50 rounded-3xl p-5 flex gap-4 items-start shadow-sm">
          <div className="shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mt-0.5">
            <Info size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              Synthèse du Coach
            </h4>
            <div className="text-sm font-black text-plana-black mb-1">{rec.title}</div>
            <p className="text-sm font-medium text-slate-700 leading-relaxed">
              {rec.message} {rec.reason}
            </p>
          </div>
        </div>
      ))}

      {/* Insight Technique */}
      <div className="bg-orange-50 border border-plana-orange/20 rounded-3xl p-5 flex gap-4 items-start">`;

code = code.replace(
  "      {/* Insight */}\n      <div className=\"bg-orange-50 border border-plana-orange/20 rounded-3xl p-5 flex gap-4 items-start\">",
  newInsight
);

fs.writeFileSync('src/views/ProgressionView.tsx', code);
