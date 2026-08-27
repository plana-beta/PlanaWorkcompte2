import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Bar, Line, ReferenceLine } from 'recharts';
import { Filter } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function StatsView() {
  const { pmc, activities } = useAppStore();
  const [timeframe, setTimeframe] = useState<'7d' | '1m' | '3m' | '6m' | '1y'>('1m');
  
  const todayStr = new Date().toISOString().split('T')[0];

  const days = useMemo(() => {
    if (timeframe === '7d') return 7;
    if (timeframe === '1m') return 30;
    if (timeframe === '3m') return 90;
    if (timeframe === '6m') return 180;
    return 365; // 1y
  }, [timeframe]);

  const filteredLoads = useMemo(() => {
    const start = subDays(new Date(todayStr), days);
    return pmc.filter(l => new Date(l.date) >= start && new Date(l.date) <= new Date(todayStr));
  }, [pmc, days, todayStr]);

  const chartData = useMemo(() => {
    return filteredLoads.map(l => ({
      ...l,
      formattedDate: format(new Date(l.date), 'dd/MM')
    }));
  }, [filteredLoads]);

  // Calculate volume
  const calculateVolume = (daysCount: number) => {
    const start = subDays(new Date(todayStr), daysCount);
    const recentActs = activities.filter(a => new Date(a.date) >= start && new Date(a.date) <= new Date(todayStr) && a.status === 'completed');
    
    const hours = recentActs.reduce((acc, a) => acc + ((a.durationMin || 0) / 60), 0);
    const distance = recentActs.reduce((acc, a) => acc + (a.distanceKm || 0), 0);
    const tss = recentActs.reduce((acc, a) => acc + (a.tss || 0), 0);
    
    return { hours, distance, tss };
  };

  const vol = calculateVolume(days);
  const timeframeLabel = timeframe === '7d' ? '7 Jours' : timeframe === '1m' ? '1 Mois' : timeframe === '3m' ? '3 Mois' : timeframe === '6m' ? '6 Mois' : '1 An';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="pb-24 animate-in fade-in duration-300"
    >
      <div className="px-5 py-4 bg-[#FFFFFF] z-10 shrink-0 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-[#111111] tracking-wide">Statistiques</h2>
          <p className="text-xs text-slate-500 mt-0.5">Charge sportive et volume</p>
        </div>
        
        {/* Global Filter Menu */}
        <div className="relative">
          <div className="bg-[#F3F4F6] w-9 h-9 rounded-xl border border-[#F3F4F6] flex items-center justify-center text-slate-600 shadow-sm pointer-events-none">
            <Filter size={16} />
          </div>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          >
            <option value="7d">7 Jours</option>
            <option value="1m">1 Mois</option>
            <option value="3m">3 Mois</option>
            <option value="6m">6 Mois</option>
            <option value="1y">1 An</option>
          </select>
        </div>
      </div>

      <div className="p-5 space-y-6">
        
        {/* Volume Stats */}
        <div className="bg-[#FFFFFF] border border-[#F3F4F6] p-5 rounded-3xl shadow-sm">
          <h3 className="text-sm font-bold text-[#111111] mb-4">Volume ({timeframeLabel})</h3>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center bg-[#F3F4F6] p-3 rounded-2xl border border-[#F3F4F6]">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Heures</div>
              <div className="text-lg font-black text-[#F26A00]">{Math.round(vol.hours)}<span className="text-[10px] text-slate-500 font-semibold ml-0.5">h</span></div>
            </div>
            <div className="text-center bg-[#F3F4F6] p-3 rounded-2xl border border-[#F3F4F6]">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Distance</div>
              <div className="text-lg font-black text-[#22A06B]">{Math.round(vol.distance)}<span className="text-[10px] text-slate-500 font-semibold ml-0.5">km</span></div>
            </div>
            <div className="text-center bg-[#F3F4F6] p-3 rounded-2xl border border-[#F3F4F6]">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Charge</div>
              <div className="text-lg font-black text-amber-400">{Math.round(vol.tss)}<span className="text-[10px] text-slate-500 font-semibold ml-0.5">TSS</span></div>
            </div>
          </div>
        </div>

        {/* PMC Chart */}
        <div className="bg-[#FFFFFF] border border-[#F3F4F6] p-4 rounded-3xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#111111]">
              Évolution de la charge
            </h3>
          </div>

          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="chartGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#8B5CF6"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor="#8B5CF6"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  vertical={false}
                  opacity={0.8}
                />

                <XAxis
                  dataKey="formattedDate"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  yAxisId="load"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  yAxisId="tss" 
                  orientation="right" 
                  stroke="#64748b" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false} 
                  hide 
                />

                <ReferenceLine
                  yAxisId="load"
                  y={0}
                  stroke="#cbd5e1"
                  strokeDasharray="3 3"
                />

                <Tooltip
                  cursor={false}
                  position={{ y: 0 }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "12px",
                    color: "#0f172a",
                    padding: "4px 8px",
                    fontSize: "11px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  labelFormatter={(label) => label}
                  formatter={(value: any) => [Math.round(Number(value)), '']}
                />

                {/* TSS */}
                <Bar
                  yAxisId="tss"
                  dataKey="tss"
                  name="TSS"
                  fill="#F26A00"
                  opacity={0.25}
                  radius={[4, 4, 0, 0]}
                />

                {/* CTL */}
                <Area
                  yAxisId="load"
                  type="monotone"
                  dataKey="ctl"
                  name="Fitness (CTL)"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#chartGradient)"
                />

                {/* ATL */}
                <Line
                  yAxisId="load"
                  type="monotone"
                  dataKey="atl"
                  name="Fatigue (ATL)"
                  stroke="#f43f5e"
                  strokeWidth={1.5}
                  dot={false}
                />

                {/* TSB */}
                <Line
                  yAxisId="load"
                  type="monotone"
                  dataKey="tsb"
                  name="Forme (TSB)"
                  stroke="#22A06B"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Légende */}
          <div className="grid grid-cols-4 gap-1 pt-4 border-t border-[#F3F4F6] text-[10px] text-center font-medium mt-2">
            <div className="flex items-center justify-center gap-1 text-[#8B5CF6]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
              CTL
            </div>

            <div className="flex items-center justify-center gap-1 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              ATL
            </div>

            <div className="flex items-center justify-center gap-1 text-[#22A06B]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22A06B]" />
              TSB
            </div>

            <div className="flex items-center justify-center gap-1 text-[#F26A00]">
              <span className="w-2.5 h-2.5 rounded bg-[#F26A00]/40" />
              TSS
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
