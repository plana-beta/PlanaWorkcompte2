import React from 'react';
import { motion } from 'motion/react';
import { Droplets, Bike, Footprints, Info } from 'lucide-react';
import { cn } from '../utils';
import { useAppStore } from '../store';
import { differenceInDays, parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function GoalView() {
  const { goal, athleteProfile, recommendations } = useAppStore();
  
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

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 pb-24 space-y-6">
      {/* Header */}
      <div className="text-center pt-8 pb-4">
        <h2 className="text-3xl font-black text-plana-black tracking-wide mb-1">{goal.title}</h2>
        <p className="text-sm text-slate-500 font-medium">{formattedDate}</p>
        
        <div className="mt-8">
          <div className="text-6xl font-black text-plana-orange tracking-tight">{daysToGoal}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">Jours restants</div>
        </div>
      </div>

      {/* Ton niveau actuel */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-6">Ton niveau actuel</h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                <Droplets size={20} />
              </div>
              <span className="font-bold text-plana-black text-sm uppercase tracking-wider">Natation</span>
            </div>
            {athleteProfile.level.swim === 'intermediate' ? (
              <span className="px-3 py-1 bg-blue-50 rounded-lg text-[10px] font-bold text-blue-600 uppercase tracking-wider">Intermédiaire</span>
            ) : athleteProfile.level.swim === 'advanced' ? (
              <span className="px-3 py-1 bg-blue-100 rounded-lg text-[10px] font-bold text-blue-700 uppercase tracking-wider">Avancé</span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-wider">Débutant</span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <Bike size={20} />
              </div>
              <span className="font-bold text-plana-black text-sm uppercase tracking-wider">Vélo</span>
            </div>
            {athleteProfile.level.ride === 'advanced' ? (
              <span className="px-3 py-1 bg-emerald-50 rounded-lg text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Avancé</span>
            ) : athleteProfile.level.ride === 'intermediate' ? (
              <span className="px-3 py-1 bg-emerald-50 rounded-lg text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Intermédiaire</span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-wider">Débutant</span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-plana-orange">
                <Footprints size={20} />
              </div>
              <span className="font-bold text-plana-black text-sm uppercase tracking-wider">Course</span>
            </div>
            {athleteProfile.level.run === 'advanced' ? (
              <span className="px-3 py-1 bg-orange-100 rounded-lg text-[10px] font-bold text-orange-600 uppercase tracking-wider">Avancé</span>
            ) : athleteProfile.level.run === 'intermediate' ? (
              <span className="px-3 py-1 bg-orange-50 rounded-lg text-[10px] font-bold text-orange-500 uppercase tracking-wider">Intermédiaire</span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-wider">Débutant</span>
            )}
          </div>
        </div>
      </div>

      {/* Estimation */}
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
      </div>
    </motion.div>
  );
}
