import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Activity, TrendingUp, Zap, Info } from 'lucide-react';
import { useAppStore } from '../store';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ProgressionView() {
  const { pmc, recommendations } = useAppStore();

  const displayPmc = useMemo(() => {
    // Only return data up to today for display (or future if planned, but pmc generation handles upToDate)
    return pmc;
  }, [pmc]);

  const hasEnoughData = displayPmc.length > 7; // Require at least 7 days of history to show something meaningful
  
  const latest = displayPmc.length > 0 ? displayPmc[displayPmc.length - 1] : { ctl: 0, atl: 0, tsb: 0 };
  const ctl = Math.round(latest.ctl);
  const atl = Math.round(latest.atl);
  const tsb = Math.round(latest.tsb);

  let formStatus = "Optimal";
  let formColor = "text-emerald-500";
  let formDesc = "Ton équilibre fatigue / forme est stable.";

  if (tsb > 10) {
    formStatus = "Très Frais";
    formColor = "text-blue-500";
    formDesc = "Tu es frais. C'est généralement favorable pour une séance importante ou une compétition.";
  } else if (tsb < -20) {
    formStatus = "Fatigue Élevée";
    formColor = "text-red-500";
    formDesc = "Ta fatigue est élevée. Une récupération supplémentaire peut être pertinente.";
  } else if (tsb < -10) {
    formStatus = "Fatigue Modérée";
    formColor = "text-amber-500";
    formDesc = "Tes indicateurs de charge suggèrent un cycle de développement normal.";
  }

  if (!hasEnoughData) {
    formStatus = "Évaluation en cours";
    formColor = "text-slate-500";
    formDesc = "Historique insuffisant. Continue à synchroniser tes entraînements pour établir ton profil de charge.";
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-2xl text-xs font-bold text-plana-black">
          <p className="text-slate-500 mb-2 capitalize">{format(parseISO(label), 'd MMM yyyy', { locale: fr })}</p>
          <div className="space-y-1">
            <p className="text-blue-500">Fitness (CTL) : {Math.round(payload[0].value)}</p>
            <p className="text-red-500">Fatigue (ATL) : {Math.round(payload[1].value)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 pb-24 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-plana-black tracking-wide">Progression</h2>
        <p className="text-sm text-slate-500 font-medium mt-1">
          L'équilibre charge et récupération
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm flex flex-col items-center text-center">
          <TrendingUp size={20} className="text-blue-500 mb-2" />
          <div className="text-2xl font-black text-plana-black">{hasEnoughData ? ctl : '--'}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Fitness</div>
        </div>
        
        <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm flex flex-col items-center text-center">
          <Activity size={20} className="text-red-500 mb-2" />
          <div className="text-2xl font-black text-plana-black">{hasEnoughData ? atl : '--'}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Fatigue</div>
        </div>
        
        <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm flex flex-col items-center text-center">
          <Zap size={20} className={formColor + " mb-2"} />
          <div className={"text-2xl font-black " + formColor}>{hasEnoughData ? (tsb > 0 ? '+' : '') + tsb : '--'}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Forme</div>
        </div>
      </div>

      {/* Human Synthesis (from Recommendations) */}
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
      <div className="bg-orange-50 border border-plana-orange/20 rounded-3xl p-5 flex gap-4 items-start">
        <div className="shrink-0 w-8 h-8 rounded-full bg-plana-orange text-white flex items-center justify-center mt-0.5">
          <Info size={16} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-plana-orange uppercase tracking-wider mb-1">
            Statut : {formStatus}
          </h4>
          <p className="text-sm font-medium text-plana-black leading-relaxed">
            {formDesc}
          </p>
          <div className="mt-3 space-y-1">
            <p className="text-[10px] text-slate-600 font-medium"><strong className="text-plana-black">Fitness (CTL)</strong> : Une estimation de ta charge d'entraînement chronique.</p>
            <p className="text-[10px] text-slate-600 font-medium"><strong className="text-plana-black">Fatigue (ATL)</strong> : Une estimation de ta charge récente.</p>
            <p className="text-[10px] text-slate-600 font-medium"><strong className="text-plana-black">Forme (TSB)</strong> : La différence entre ta forme chronique et ta fatigue récente.</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm opacity-100">
         <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-6">Performance Management Chart</h4>
         <div className="h-64 w-full relative">
            {!hasEnoughData && (
               <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
                 <p className="text-sm font-bold text-slate-600">Données insuffisantes</p>
               </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayPmc} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCtl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => { try { return format(parseISO(val), 'd MMM', { locale: fr }) } catch (e) { return val } }}
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={30}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="ctl" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCtl)" />
                <Line type="monotone" dataKey="atl" stroke="#ef4444" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
         </div>
      </div>

    </motion.div>
  );
}
