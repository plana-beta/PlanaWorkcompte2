import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Activity, Calendar, Trophy, Zap, Watch } from 'lucide-react';
import { cn } from '../utils';

interface OnboardingViewProps {
  onComplete: () => void;
}

export default function OnboardingView({ onComplete }: OnboardingViewProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 6;
  
  const [goalSport, setGoalSport] = useState<string | null>(null);
  const [goalDistance, setGoalDistance] = useState<string | null>(null);
  const [goalDate, setGoalDate] = useState<string | null>(null);
  const [goalName, setGoalName] = useState<string | null>(null);
  const [levels, setLevels] = useState<{ [key: string]: string | null }>({ Natation: null, Vélo: null, Course: null });
  const [dataConnection, setDataConnection] = useState<'none' | 'apple_health' | 'google_health_connect' | 'demo'>('none');
  
  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else onComplete();
  };
  
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-5 safe-top safe-bottom overflow-hidden">
      
      {/* Progress Bar */}
      <div className="absolute top-10 left-5 right-5 flex gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full", i < step ? "bg-plana-orange" : "bg-gray-100")} />
        ))}
      </div>
      
      <div className="w-full max-w-md flex-1 flex flex-col mt-16 pb-24">
        <AnimatePresence mode="wait">
        
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col justify-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-plana-orange flex items-center justify-center mb-6">
                <Trophy size={32} />
              </div>
              <h1 className="text-3xl font-black text-plana-black mb-2">Quel est ton objectif principal ?</h1>
              <p className="text-slate-500 mb-8 font-medium">Nous allons optimiser ton plan pour ça.</p>
              
              <div className="space-y-3">
                {['Triathlon', 'Course à pied', 'Cyclisme', 'Natation'].map(s => (
                  <button 
                    key={s} 
                    onClick={() => { setGoalSport(s); setTimeout(handleNext, 300); }}
                    className={cn(
                      "w-full p-4 rounded-2xl border-2 text-left font-bold transition-all",
                      goalSport === s ? "border-plana-orange bg-orange-50 text-plana-orange" : "border-gray-100 hover:border-gray-200 text-plana-black"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col justify-center">
              <h1 className="text-3xl font-black text-plana-black mb-2">Quelle distance ?</h1>
              <p className="text-slate-500 mb-8 font-medium">Pour ajuster le volume nécessaire.</p>
              
              <div className="space-y-3">
                {['Sprint', 'Olympique', 'Half / 70.3', 'Ironman', 'Personnalisé'].map(s => (
                  <button 
                    key={s} 
                    onClick={() => { setGoalDistance(s); setTimeout(handleNext, 300); }}
                    className={cn(
                      "w-full p-4 rounded-2xl border-2 text-left font-bold transition-all",
                      goalDistance === s ? "border-plana-orange bg-orange-50 text-plana-orange" : "border-gray-100 hover:border-gray-200 text-plana-black"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col justify-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-plana-orange flex items-center justify-center mb-6">
                <Calendar size={32} />
              </div>
              <h1 className="text-3xl font-black text-plana-black mb-2">Ta course cible</h1>
              <p className="text-slate-500 mb-8 font-medium">Quand a-t-elle lieu ?</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Nom de la course</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Ironman de Nice"
                    onChange={e => setGoalName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-plana-black focus:outline-none focus:border-plana-orange focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Date</label>
                  <input 
                    type="date" 
                    onChange={e => setGoalDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-plana-black focus:outline-none focus:border-plana-orange focus:bg-white transition-all"
                  />
                </div>
              </div>
              
              <button 
                onClick={handleNext} 
                disabled={!goalName || !goalDate}
                className="mt-8 w-full py-4 rounded-2xl bg-plana-black disabled:bg-gray-200 text-white font-bold tracking-wide flex items-center justify-center gap-2"
              >
                Continuer <ArrowRight size={18} />
              </button>
              <button onClick={handleNext} className="mt-4 text-sm font-bold text-slate-400 hover:text-slate-600">
                Passer cette étape (pas de course prévue)
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col justify-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-plana-orange flex items-center justify-center mb-6">
                <Activity size={32} />
              </div>
              <h1 className="text-3xl font-black text-plana-black mb-2">Ton niveau actuel</h1>
              <p className="text-slate-500 mb-8 font-medium">Pour calibrer les séances intelligemment.</p>
              
              <div className="space-y-6">
                {['Natation', 'Vélo', 'Course'].map(sport => (
                  <div key={sport}>
                    <label className="text-xs font-bold text-plana-black uppercase tracking-wider mb-2 block">{sport}</label>
                    <div className="flex gap-2">
                       {['Débutant', 'Intermédiaire', 'Avancé'].map(lvl => {
                         const isSelected = levels[sport] === lvl;
                         return (
                           <button 
                             key={lvl} 
                             onClick={() => setLevels(prev => ({ ...prev, [sport]: lvl }))}
                             className={cn(
                               "flex-1 py-2 text-xs font-bold border rounded-xl transition-all",
                               isSelected 
                                 ? "border-plana-orange bg-orange-50 text-plana-orange" 
                                 : "border-gray-100 hover:border-plana-orange text-plana-black"
                             )}
                           >
                             {lvl}
                           </button>
                         );
                       })}
                    </div>
                  </div>
                ))}
              </div>
              
              <button onClick={handleNext} className="mt-8 w-full py-4 rounded-2xl bg-plana-black text-white font-bold tracking-wide flex items-center justify-center gap-2">
                Continuer <ArrowRight size={18} />
              </button>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col justify-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-plana-orange flex items-center justify-center mb-6">
                <Zap size={32} />
              </div>
              <h1 className="text-3xl font-black text-plana-black mb-2">Combien de temps ?</h1>
              <p className="text-slate-500 mb-8 font-medium">Temps disponible par semaine.</p>
              
              <div className="grid grid-cols-2 gap-3">
                {['4 h', '6 h', '8 h', '10 h', '12 h+', 'Personnalisé'].map(t => (
                  <button 
                    key={t} 
                    onClick={() => setTimeout(handleNext, 300)}
                    className="p-4 rounded-2xl border-2 border-gray-100 text-center font-bold text-plana-black hover:border-plana-orange focus:border-plana-orange focus:bg-orange-50 focus:text-plana-orange transition-all"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col justify-center">
              <div className="w-16 h-16 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center mb-6">
                <Watch size={32} />
              </div>
              <h1 className="text-3xl font-black text-plana-black mb-2">Connecte tes données</h1>
              <p className="text-slate-500 mb-8 font-medium">Plana s'adapte à ce que tu fais réellement grâce à tes applications de santé.</p>
              
              <div className="space-y-3">
                 <button onClick={() => { setDataConnection('apple_health'); handleNext(); }} className="w-full p-4 rounded-2xl border border-gray-100 flex items-center gap-4 hover:border-plana-orange transition-all bg-white shadow-sm">
                   <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 font-bold"></div>
                   <div className="text-left flex-1">
                     <div className="font-bold text-plana-black">Apple Health</div>
                     <div className="text-xs text-slate-500 font-medium">Recommandé sur iOS</div>
                   </div>
                 </button>
                 
                 <button onClick={() => { setDataConnection('google_health_connect'); handleNext(); }} className="w-full p-4 rounded-2xl border border-gray-100 flex items-center gap-4 hover:border-plana-orange transition-all bg-white shadow-sm">
                   <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 font-bold">G</div>
                   <div className="text-left flex-1">
                     <div className="font-bold text-plana-black">Google Health Connect</div>
                     <div className="text-xs text-slate-500 font-medium">Recommandé sur Android</div>
                   </div>
                 </button>
              </div>
              
              <button onClick={() => { setDataConnection('none'); handleNext(); }} className="mt-6 text-sm font-bold text-slate-400 hover:text-slate-600">
                Passer cette étape pour l'instant
              </button>
              <button onClick={() => { setDataConnection('demo'); handleNext(); }} className="mt-2 text-sm font-bold text-blue-500 hover:text-blue-700">
                Utiliser le Mode Démo (Données simulées)
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
