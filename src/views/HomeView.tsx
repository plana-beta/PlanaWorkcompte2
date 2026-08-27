import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store';
import { isSameMonth, parseISO, differenceInDays } from 'date-fns';
import { EventGoal } from '../types';
import { EventForm } from '../components/EventModals';
import { 
  Zap, 
  Flame, 
  Activity as ActivityIcon, 
  Moon, 
  Heart, 
  ChevronRight, 
  Sparkles,
  Bike,
  Footprints,
  Waves,
  Dumbbell,
  MapPin,
  Clock,
  Target,
  Flag
} from 'lucide-react';

const getTypeIcon = (type?: string, size: number = 18) => {
  switch(type) {
    case 'Ride': return <Bike size={size} />;
    case 'Run': return <Footprints size={size} />;
    case 'Swim': return <Waves size={size} />;
    case 'Strength': return <Dumbbell size={size} />;
    default: return <Bike size={size} />;
  }
};

export default function HomeView() {
  const { activities, metrics, pmc, events, addEvent, updateEvent, removeEvent } = useAppStore();
  const [editingEvent, setEditingEvent] = useState<EventGoal | null | 'new'>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayPmc = pmc.find(p => p.date === todayStr) || pmc[pmc.length - 1] || { ctl: 60, atl: 65, tsb: -5, tss: 0 };
  const todayMetrics = metrics.find(m => m.date === todayStr) || metrics[metrics.length - 1] || { hrv: 65, rhr: 48, sleepHours: 7.5, sleepScore: 85 };

  // Readiness logic...
  const readiness = Math.min(100, Math.max(0, Math.round(50 + todayPmc.tsb + (todayMetrics.sleepHours > 7 ? 10 : -10))));
  
  let tip = "L'équilibre est bon, mais la fatigue est présente. Privilégiez une séance d'endurance fondamentale aujourd'hui pour favoriser l'assimilation.";
  let formColor = "text-[#22A06B]";
  let formBadgeBg = "bg-[#22A06B]/10 border-[#22A06B]/30 text-[#22A06B]";
  let readinessStatus = "Forme Optimale";
  
  if (todayPmc.tsb < -30) {
    formColor = "text-[#F26A00]";
    formBadgeBg = "bg-[#F26A00]/10 border-[#F26A00]/30 text-[#F26A00]";
    readinessStatus = "Surcharge de Fatigue";
    tip = "Vous êtes en surcharge. Un repos complet est vivement conseillé pour éviter le surentraînement.";
  } else if (todayPmc.tsb < -10) {
    formColor = "text-[#F26A00]/80";
    formBadgeBg = "bg-[#F26A00]/10 border-[#F26A00]/30 text-[#F26A00]/80";
    readinessStatus = "Fatigue Modérée";
  } else if (todayPmc.tsb > 25) {
    formColor = "text-[#3B82F6]";
    formBadgeBg = "bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#3B82F6]";
    readinessStatus = "Fraîcheur Élevée";
    tip = "Vous êtes frais et dispo ! Idéal pour une séance d'intensité ou une compétition.";
  }

  const todayActivities = activities.filter(a => a.date === todayStr);
  const todayTss = todayActivities.reduce((sum, a) => sum + (a.tss || 0), todayPmc.tss || 0);
  const todayDurationMin = todayActivities.reduce((sum, a) => sum + (a.durationMin || 0), 0);
  const sleepHours = Math.floor(todayMetrics.sleepHours);
  const sleepMinutes = Math.round((todayMetrics.sleepHours % 1) * 60);

  const { monthlyDistance, monthlyDuration, monthlySessions } = useMemo(() => {
    const currentMonthActivities = activities.filter(a => isSameMonth(parseISO(a.date), parseISO(todayStr)) && a.status === 'completed');
    return {
      monthlyDistance: currentMonthActivities.reduce((acc, a) => acc + (a.distanceKm || 0), 0),
      monthlyDuration: currentMonthActivities.reduce((acc, a) => acc + (a.durationMin || 0), 0) / 60,
      monthlySessions: currentMonthActivities.length
    };
  }, [activities, todayStr]);

  const challengeDistance = 500;
  const challengeDuration = 20;
  const challengeSessions = 15;

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date(todayStr))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const mainEvent = upcomingEvents[0];
  const secondaryEvent = upcomingEvents[1];

  if (editingEvent) {
     return <EventForm 
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
        onSave={(ev) => {
           if (editingEvent === 'new') addEvent(ev);
           else updateEvent(ev);
           setEditingEvent(null);
        }}
        onDelete={(id) => {
           removeEvent(id);
           setEditingEvent(null);
        }}
     />
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 space-y-4 pb-24"
    >
      {/* 1. SCORE READINESS (Top) */}
      <div className="flex flex-col items-center justify-center pt-2 cursor-pointer group select-none">
        <div className="relative flex items-center justify-center">
          <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 144 144">
            <circle cx="72" cy="72" r="62" className="stroke-slate-200" strokeWidth="10" fill="none" />
            <circle 
              cx="72" cy="72" r="62" 
              className="stroke-[#F26A00] transition-all duration-1000 ease-out group-hover:stroke-orange-500" 
              strokeWidth="10" 
              fill="none" 
              strokeDasharray="390" 
              strokeDashoffset={390 - (390 * readiness) / 100} 
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-extrabold text-[#111111] tracking-tight group-hover:scale-105 transition-transform">
              {readiness}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Readiness</span>
            <span className={`text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full border ${formBadgeBg}`}>
              {readinessStatus}
            </span>
          </div>
        </div>
      </div>

      {/* 2. FITNESS (CTL), FATIGUE (ATL), FORM (TSB) */}
      <div className="grid grid-cols-3 gap-3">
        <button className="bg-[#FFFFFF] hover:bg-[#F3F4F6] active:scale-[0.98] rounded-2xl p-3.5 flex flex-col items-center justify-center border border-[#F3F4F6] transition-all text-left shadow-sm group">
          <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1 group-hover:text-[#8B5CF6]">
            Fitness <ChevronRight size={10} />
          </span>
          <span className="text-xl font-extrabold text-[#111111]">{todayPmc.ctl.toFixed(1)}</span>
          <span className="text-[9px] text-[#8B5CF6] font-mono mt-0.5">CTL 42j</span>
        </button>
        <button className="bg-[#FFFFFF] hover:bg-[#F3F4F6] active:scale-[0.98] rounded-2xl p-3.5 flex flex-col items-center justify-center border border-[#F3F4F6] transition-all text-left shadow-sm group">
          <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1 group-hover:text-[#F26A00]">
            Fatigue <ChevronRight size={10} />
          </span>
          <span className="text-xl font-extrabold text-[#111111]">{todayPmc.atl.toFixed(1)}</span>
          <span className="text-[9px] text-[#F26A00] font-mono mt-0.5">ATL 7j</span>
        </button>
        <button className="bg-[#FFFFFF] hover:bg-[#F3F4F6] active:scale-[0.98] rounded-2xl p-3.5 flex flex-col items-center justify-center border border-[#F3F4F6] transition-all text-left shadow-sm group">
          <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1 group-hover:text-[#22A06B]">
            Forme <ChevronRight size={10} />
          </span>
          <span className={`text-xl font-extrabold ${formColor}`}>
            {todayPmc.tsb > 0 ? '+' : ''}{todayPmc.tsb.toFixed(1)}
          </span>
          <span className="text-[9px] text-slate-500 font-mono mt-0.5">TSB</span>
        </button>
      </div>

      {/* 3. CONSEIL DU COACH ADAPTATIF */}
      <div className="bg-[#FFFFFF] rounded-3xl p-4 border border-[#F3F4F6] relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-4 -translate-y-4 pointer-events-none text-[#EAB308]">
          <Zap size={110} />
        </div>
        <div className="flex items-center gap-3 mb-2.5">
          <div className="w-8 h-8 rounded-xl bg-yellow-50 flex items-center justify-center border border-[#EAB308]/20">
            <Zap className="text-[#EAB308] w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[#111111] text-sm tracking-wide">Conseil du Coach</h3>
            <span className="text-[10px] text-slate-500">Adapté à votre balance de charge</span>
          </div>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed relative z-10 font-medium pt-1">
          {tip}
        </p>
      </div>

      {/* ENTRAÎNEMENTS DU JOUR */}
      {todayActivities.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Entraînements du jour
          </h3>
          <div className="space-y-2">
            {todayActivities.map(activity => (
              <div 
                key={activity.id}
                className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#F3F4F6] flex flex-col gap-2 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F3F4F6] border border-[#F3F4F6] flex items-center justify-center text-[#F26A00] shrink-0">
                      {getTypeIcon(activity.sport, 16)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#111111]">{activity.title}</h4>
                      <p className="text-[10px] text-slate-500 capitalize">
                        {activity.status === 'completed' ? 'Terminé' : 'Prévu'}
                        {activity.timeOfDay && ` • ${activity.timeOfDay === 'morning' ? 'Matin' : activity.timeOfDay === 'afternoon' ? 'Après-midi' : 'Soir'}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-[#F26A00]">
                      {activity.tss} <span className="text-[9px] text-slate-500">TSS</span>
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500">
                      {Math.floor((activity.durationMin || 0) / 60)}h{String((activity.durationMin || 0) % 60).padStart(2, '0')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    {/* 4. CHARGE JOURNALIÈRE (TSS DU JOUR) */}
      <button className="w-full bg-[#FFFFFF] hover:bg-[#F3F4F6] active:scale-[0.99] rounded-3xl p-4 border border-[#F3F4F6] flex items-center justify-between transition-all text-left shadow-sm group">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-[#F26A00]/30 flex items-center justify-center text-[#F26A00]">
            <Flame size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Charge Journalière</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#F26A00] font-mono">Aujourd'hui</span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-[#111111]">{Math.round(todayTss)}</span>
              <span className="text-xs font-semibold text-slate-500">TSS</span>
              {todayDurationMin > 0 && (
                <span className="text-xs text-slate-500 ml-2">
                  • {Math.floor(todayDurationMin / 60)}h{String(todayDurationMin % 60).padStart(2, '0')}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-slate-500 group-hover:text-amber-400 transition-colors">
          <ChevronRight size={18} />
        </div>
      </button>

      {/* 5. SOMMEIL */}
      <button className="w-full bg-[#FFFFFF] hover:bg-[#F3F4F6] active:scale-[0.99] rounded-3xl p-4 border border-[#F3F4F6] flex flex-col transition-all text-left shadow-sm group">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6]">
              <Moon size={20} />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Sommeil & Nuit</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-[#111111]">
                  {sleepHours}h{sleepMinutes > 0 ? String(sleepMinutes).padStart(2, '0') : ''}
                </span>
                <span className="text-xs font-semibold text-[#22A06B]">
                  Score 85/100
                </span>
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:text-[#8B5CF6] transition-colors" />
        </div>
      </button>

      {/* 6. FC AU REPOS & 7. VFC (HRV) */}
      <div className="grid grid-cols-2 gap-3">
        <button className="bg-[#FFFFFF] hover:bg-[#F3F4F6] active:scale-[0.99] rounded-3xl p-4 border border-[#F3F4F6] flex flex-col justify-between transition-all text-left shadow-sm group relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444]">
              <Heart size={18} />
            </div>
            <ChevronRight size={16} className="text-slate-500 group-hover:text-[#EF4444] transition-colors" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">FC Repos</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-[#111111]">{todayMetrics.rhr}</span>
              <span className="text-xs font-semibold text-slate-500">bpm</span>
            </div>
            <span className="text-[10px] text-[#22A06B] font-semibold mt-1 block">Optimal</span>
          </div>
        </button>

        <button className="bg-[#FFFFFF] hover:bg-[#F3F4F6] active:scale-[0.99] rounded-3xl p-4 border border-[#F3F4F6] flex flex-col justify-between transition-all text-left shadow-sm group relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6]">
              <ActivityIcon size={18} />
            </div>
            <ChevronRight size={16} className="text-slate-500 group-hover:text-[#3B82F6] transition-colors" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">VFC (HRV)</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-[#111111]">{todayMetrics.hrv}</span>
              <span className="text-xs font-semibold text-slate-500">ms</span>
            </div>
            <span className="text-[10px] text-[#22A06B] font-semibold mt-1 block">Équilibrée</span>
          </div>
        </button>
      </div>

      {/* DEFIS MENSUELS */}
      <div className="space-y-3 pt-4 border-t border-[#F3F4F6]">
        <div className="flex justify-between items-end px-1">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Défis du Mois
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Motivations et objectifs</p>
          </div>
          <Sparkles size={14} className="text-amber-400 mb-1" />
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {/* Defi Distance */}
          <div className="bg-[#FFFFFF] p-4 rounded-3xl border border-[#F3F4F6] shadow-sm relative overflow-hidden group hover:border-[#F26A00]/30 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#F26A00]/5 to-[#F26A00]/0 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#F26A00] flex items-center justify-center">
                  <MapPin size={16} />
                </div>
                <span className="text-xs font-bold text-[#111111]">Distance Totale</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500">{Math.round(monthlyDistance)} / {challengeDistance} km</span>
            </div>
            <div className="w-full bg-[#F3F4F6] rounded-full h-2 mb-1 overflow-hidden">
              <div className="bg-[#F26A00] h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, (monthlyDistance / challengeDistance) * 100)}%` }}></div>
            </div>
          </div>

          {/* Defi Temps */}
          <div className="bg-[#FFFFFF] p-4 rounded-3xl border border-[#F3F4F6] shadow-sm relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-indigo-500/0 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <span className="text-xs font-bold text-[#111111]">Heures de Selle</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500">{monthlyDuration.toFixed(1)} / {challengeDuration} h</span>
            </div>
            <div className="w-full bg-[#F3F4F6] rounded-full h-2 mb-1 overflow-hidden">
              <div className="bg-indigo-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, (monthlyDuration / challengeDuration) * 100)}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Objectif Principal (Mini Widget) */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#F3F4F6] shadow-sm relative overflow-hidden group p-3">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-indigo-500/0 rounded-bl-full -z-10" />
        
        {mainEvent ? (
          <div className="flex justify-between items-center cursor-pointer" onClick={() => setEditingEvent(mainEvent)}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
                <Flag size={16} />
              </div>
              <h3 className="font-bold text-sm text-[#111111] leading-tight">{mainEvent.name}</h3>
            </div>
            <div className="bg-indigo-500 text-white rounded-lg px-2.5 py-1 flex items-center shrink-0">
              <span className="text-[10px] font-black">J-{differenceInDays(parseISO(mainEvent.date), parseISO(todayStr))}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setEditingEvent('new')}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                <Target size={16} />
              </div>
              <h3 className="text-sm font-bold text-[#111111]">Aucun objectif</h3>
            </div>
            <button className="bg-[#111111] text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg">
              Ajouter
            </button>
          </div>
        )}
      </div>

      </motion.div>
  );
}
