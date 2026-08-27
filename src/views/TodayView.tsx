import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { format, isSameDay, differenceInDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Play, Zap, Droplets, Bike, Footprints, Target, Info, Activity, AlertTriangle } from 'lucide-react';
import { CoachChat } from '../components/CoachChat';
import { useAppStore } from '../store';
import { Sport } from '../domain/models';

function getSportIcon(sport: Sport) {
  switch (sport) {
    case 'Swim': return <Droplets size={18} className="text-blue-500" />;
    case 'Ride': return <Bike size={18} className="text-emerald-500" />;
    case 'Run': return <Footprints size={18} className="text-plana-orange" />;
    default: return <Footprints size={18} className="text-slate-500" />;
  }
}

export default function TodayView() {
  const { plannedWorkouts, pmc, goal, recommendations } = useAppStore();
  const today = new Date();
  
  const todayPlanned = useMemo(() => {
    return plannedWorkouts.find(w => isSameDay(parseISO(w.date), today));
  }, [plannedWorkouts, today]);

  const latestPmc = pmc.length > 0 ? pmc[pmc.length - 1] : { ctl: 0, atl: 0, tsb: 0 };
  
  const mainRecommendation = recommendations[0];
  const secondaryRecommendations = recommendations.slice(1, 3);

  let daysToGoal = 0;
  if (goal && goal.date) {
    daysToGoal = differenceInDays(parseISO(goal.date), today);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 pb-24 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-plana-black tracking-wide">Aujourd'hui</h2>
        <p className="text-sm text-slate-500 font-medium capitalize mt-1">
          {format(today, 'EEEE d MMMM', { locale: fr })}
        </p>
      </div>


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


      {/* État actuel */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">État actuel</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-600">Forme</span>
              <span className={`text-sm font-black ${latestPmc.tsb >= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {latestPmc.tsb > 10 ? 'Très Frais' : latestPmc.tsb >= -10 ? 'Optimale' : 'Fatigué'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-600">Fatigue</span>
              <span className="text-sm font-black text-slate-800">{Math.round(latestPmc.atl)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-600">Fitness</span>
              <span className="text-sm font-black text-plana-orange">{Math.round(latestPmc.ctl)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Objectif</h4>
            {goal ? (
               <>
                 <div className="text-sm font-black text-plana-black mb-1">{goal.title}</div>
                 <div className="text-xs font-medium text-slate-500 capitalize">{goal.type}</div>
               </>
            ) : (
               <div className="text-sm font-medium text-slate-500">Aucun objectif</div>
            )}
          </div>
          {goal && (
             <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <Target size={16} className="text-plana-orange" />
                <div className="text-right">
                  <span className="text-lg font-black text-plana-black">{daysToGoal > 0 ? daysToGoal : 0}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Jours</span>
                </div>
             </div>
          )}
        </div>
      </div>
      <CoachChat />
    </motion.div>
  );
}
