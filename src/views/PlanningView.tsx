import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { format, isSameDay, parseISO, startOfWeek, addDays, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Droplets, Bike, Footprints, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store';
import { Sport } from '../domain/models';

function getSportIcon(sport: Sport) {
  switch (sport) {
    case 'Swim': return <Droplets size={16} className="text-blue-500" />;
    case 'Ride': return <Bike size={16} className="text-emerald-500" />;
    case 'Run': return <Footprints size={16} className="text-plana-orange" />;
    default: return <Footprints size={16} className="text-slate-500" />;
  }
}

export default function PlanningView() {
  const { plannedWorkouts, generatePlan, athleteProfile } = useAppStore();
  const today = new Date();
  
  // Group by week and day for the next 4 weeks
  const weeks = useMemo(() => {
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const result = [];
    
    for (let w = 0; w < 4; w++) {
      const weekStart = addDays(start, w * 7);
      const days = [];
      for (let d = 0; d < 7; d++) {
        const currentDay = addDays(weekStart, d);
        const dayWorkouts = plannedWorkouts.filter(pw => isSameDay(parseISO(pw.date), currentDay));
        days.push({
          date: currentDay,
          workouts: dayWorkouts
        });
      }
      result.push({ start: weekStart, days });
    }
    return result;
  }, [plannedWorkouts, today]);

  const totalPlannedHours = useMemo(() => {
     let totalMin = 0;
     plannedWorkouts.forEach(w => totalMin += w.targetDurationMin);
     return (totalMin / 60).toFixed(1);
  }, [plannedWorkouts]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 pb-24 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-plana-black tracking-wide">Planning</h2>
          <p className="text-xs text-slate-500 mt-0.5">Calendrier d'entraînement généré</p>
        </div>
        <button 
          onClick={() => generatePlan()}
          className="w-10 h-10 rounded-2xl bg-white border border-gray-200 text-slate-600 flex items-center justify-center shadow-sm hover:bg-gray-50 active:scale-95"
        >
          <RefreshCw size={18} />
        </button>
      </div>
      
      {/* Overview Stats */}
      <div className="bg-orange-50 border border-plana-orange/20 rounded-3xl p-5 mb-6 shrink-0 flex items-center justify-between">
         <div>
           <div className="text-[10px] font-bold text-plana-orange uppercase tracking-wider mb-1">Volume Prévu (Total)</div>
           <div className="text-2xl font-black text-plana-black">{totalPlannedHours} <span className="text-sm text-slate-500 font-medium">heures</span></div>
         </div>
         <div className="text-right">
           <div className="text-[10px] font-bold text-plana-orange uppercase tracking-wider mb-1">Disponibilité</div>
           <div className="text-lg font-black text-plana-black">
             {athleteProfile ? (athleteProfile.weeklyTimeCommitmentMinutes / 60).toFixed(1) : 0} <span className="text-sm text-slate-500 font-medium">h/semaine</span>
           </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-8">
        {weeks.map((week, idx) => (
          <div key={idx}>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
              Semaine du {format(week.start, 'd MMM', { locale: fr })}
            </h3>
            <div className="space-y-3">
              {week.days.map((day, dIdx) => {
                const isToday = isSameDay(day.date, today);
                const isAvailable = athleteProfile?.availableDays.includes(getDay(day.date));
                
                return (
                  <div key={dIdx} className={`p-4 rounded-2xl border ${isToday ? 'bg-orange-50 border-plana-orange/30' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-plana-orange' : 'text-slate-400'}`}>
                        {format(day.date, 'EEEE d', { locale: fr })}
                      </div>
                      {!isAvailable && <div className="text-[10px] font-bold text-slate-300">INDISPONIBLE</div>}
                    </div>
                    
                    {day.workouts.length > 0 ? (
                      <div className="space-y-2">
                        {day.workouts.map(w => (
                          <div key={w.id} className="flex items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm mr-3">
                              {getSportIcon(w.sport)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-black text-plana-black truncate">{w.title}</div>
                                {w.isAdapted && (
                                  <span className="shrink-0 bg-amber-100 text-amber-700 text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm">
                                    Adaptée
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-medium text-slate-500 truncate">{w.description}</div>
                            </div>
                            <div className="text-right ml-2 shrink-0">
                              <div className="text-sm font-bold text-plana-black">
                                {w.targetDurationMin}m
                              </div>
                              {w.isAdapted && w.originalTargetDurationMin && w.originalTargetDurationMin !== w.targetDurationMin && (
                                <div className="text-[10px] font-medium text-slate-400 line-through">
                                  {w.originalTargetDurationMin}m
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs font-medium text-slate-400 italic">
                        {isAvailable ? "Repos ou journée libre" : "Repos"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
