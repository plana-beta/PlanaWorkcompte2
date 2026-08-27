const fs = require('fs');
let code = fs.readFileSync('src/views/OnboardingView.tsx', 'utf8');

// Replace the Apple and Google Health Connect button clicks with actual setters
// First, add dataConnection state
code = code.replace(
  "const [goalDate, setGoalDate] = useState<string>('');",
  "const [goalDate, setGoalDate] = useState<string>('');\n  const [dataConnection, setDataConnection] = useState<'none' | 'apple_health' | 'google_health_connect' | 'demo'>('none');"
);

// Then update the completion block
code = code.replace(
  "weeklyTimeCommitmentMinutes: 420,",
  "weeklyTimeCommitmentMinutes: 420,\n        dataConnection,"
);

// Then update the buttons
code = code.replace(
  /<button onClick=\{handleNext\} className="w-full p-4 rounded-2xl border border-gray-100 flex items-center gap-4 hover:border-plana-orange transition-all bg-white shadow-sm">[\s\S]*?<div className="font-bold text-plana-black">Apple Health<\/div>[\s\S]*?<\/button>/,
  `<button onClick={() => { setDataConnection('apple_health'); handleNext(); }} className="w-full p-4 rounded-2xl border border-gray-100 flex items-center gap-4 hover:border-plana-orange transition-all bg-white shadow-sm">
                   <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 font-bold"></div>
                   <div className="text-left flex-1">
                     <div className="font-bold text-plana-black">Apple Health</div>
                     <div className="text-xs text-slate-500 font-medium">Recommandé sur iOS</div>
                   </div>
                 </button>`
);

code = code.replace(
  /<button onClick=\{handleNext\} className="w-full p-4 rounded-2xl border border-gray-100 flex items-center gap-4 hover:border-plana-orange transition-all bg-white shadow-sm">[\s\S]*?<div className="font-bold text-plana-black">Google Health Connect<\/div>[\s\S]*?<\/button>/,
  `<button onClick={() => { setDataConnection('google_health_connect'); handleNext(); }} className="w-full p-4 rounded-2xl border border-gray-100 flex items-center gap-4 hover:border-plana-orange transition-all bg-white shadow-sm">
                   <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 font-bold">G</div>
                   <div className="text-left flex-1">
                     <div className="font-bold text-plana-black">Google Health Connect</div>
                     <div className="text-xs text-slate-500 font-medium">Recommandé sur Android</div>
                   </div>
                 </button>`
);

code = code.replace(
  /<button onClick=\{handleNext\} className="mt-6 text-sm font-bold text-slate-400 hover:text-slate-600">\s*Passer cette étape pour l'instant\s*<\/button>/,
  `<button onClick={() => { setDataConnection('none'); handleNext(); }} className="mt-6 text-sm font-bold text-slate-400 hover:text-slate-600">
                Passer cette étape pour l'instant
              </button>
              <button onClick={() => { setDataConnection('demo'); handleNext(); }} className="mt-2 text-sm font-bold text-blue-500 hover:text-blue-700">
                Utiliser le Mode Démo (Données simulées)
              </button>`
);

fs.writeFileSync('src/views/OnboardingView.tsx', code);
