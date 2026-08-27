import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Bar, Cell } from 'recharts';
import { Activity, Heart, TrendingUp, TrendingDown, Minus, Moon, ActivitySquare, Bike, Footprints, Waves, Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { syncService } from '../services/sync/SyncService';

export default function HealthView() {
  const { metrics, pmc, ftp, setFtp, syncStatus, triggerSync } = useAppStore();
  const [activeChart, setActiveChart] = useState<'health' | 'sleep' | 'zones'>('health');
  
  const isSyncing = syncStatus.state === 'syncing';
  // syncStatus is now coming from the store

  const todayStr = new Date().toISOString().split('T')[0];

  const chartData = useMemo(() => {
    const start = subDays(new Date(todayStr), 28);
    return metrics
      .filter(b => new Date(b.date) >= start)
      .map(b => ({
        ...b,
        formattedDate: format(new Date(b.date), 'dd/MM'),
        sleepHours: b.sleepHours ? parseFloat(b.sleepHours.toFixed(1)) : 0,
        sleepScore: 85 // Mock since it's missing in default store
      }));
  }, [metrics, todayStr]);

  const todayBio = metrics.find(b => b.date === todayStr) || metrics[metrics.length - 1];
  const prevBio = metrics[metrics.findIndex(b => b.date === todayBio?.date) - 1] || todayBio;

  let calculatedRhr = todayBio?.rhr;
  if (!calculatedRhr) {
    const start = subDays(new Date(todayStr), 14);
    const last14 = metrics.filter(b => new Date(b.date) >= start && b.rhr > 0);
    if (last14.length > 0) {
      calculatedRhr = Math.round(last14.reduce((acc, b) => acc + b.rhr, 0) / last14.length);
    } else {
      calculatedRhr = 50; // Fallback
    }
  }

  const hrvChange = todayBio && prevBio && prevBio.hrv > 0 ? Math.round(((todayBio.hrv - prevBio.hrv) / prevBio.hrv) * 100) : 0;
  const rhrChange = todayBio && prevBio && prevBio.rhr > 0 ? Math.round(((todayBio.rhr - prevBio.rhr) / prevBio.rhr) * 100) : 0;

  const todayLoad = pmc?.find(l => l.date === todayStr) || pmc?.[pmc?.length - 1];

  // Mock Sleep Zones data for the 'zones' tab
  const sleepZonesData = [
    { name: 'Éveillé', value: 5, color: '#f43f5e' },
    { name: 'Paradoxal (REM)', value: 20, color: '#F26A00' },
    { name: 'Léger', value: 55, color: '#8B5CF6' },
    { name: 'Profond', value: 20, color: '#3b82f6' },
  ];

  const handleSync = async () => {
    triggerSync();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="pb-24 animate-in fade-in duration-300"
    >
      <div className="px-5 py-4 bg-[#FFFFFF] z-10 shrink-0 border-b border-[#F3F4F6] flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-[#111111] tracking-wide">Santé</h2>
          <p className="text-xs text-slate-500 mt-0.5">VFC, FC et Sommeil</p>
        </div>
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className={`text-[10px] px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-colors shadow-sm ${
            syncStatus.state === 'success' ? 'bg-[#22A06B]/10 text-[#22A06B] border border-[#22A06B]/20' :
            (syncStatus.state === 'error' || syncStatus.state === 'permission_denied') ? 'bg-rose-50 text-rose-500 border border-rose-200' :
            'bg-[#F3F4F6] text-slate-600 hover:bg-slate-200 border border-transparent'
          }`}
        >
          {isSyncing ? (
            <Loader2 size={12} className="animate-spin" />
          ) : syncStatus === 'success' ? (
            <Heart size={12} className="fill-current" />
          ) : (
            <Activity size={12} />
          )}
          {isSyncing ? 'Sync...' : syncStatus === 'success' ? 'Synchronisé' : 'Santé OS'}
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-orange-50 to-[#FFFFFF] border border-[#F26A00]/20 p-4 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[#F26A00]">
                <ActivitySquare size={16} />
                <h3 className="text-[10px] uppercase font-bold tracking-wider">VFC</h3>
              </div>
              <VariationBadge change={hrvChange} isPositive={hrvChange > 0} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-[#111111]">{todayBio?.hrv || '--'}</span>
              <span className="text-[10px] text-slate-500 font-bold">ms</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-rose-50 to-[#FFFFFF] border border-rose-200 p-4 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-rose-400">
                <Heart size={16} />
                <h3 className="text-[10px] uppercase font-bold tracking-wider">FC Repos</h3>
              </div>
              <VariationBadge change={rhrChange} isPositive={rhrChange < 0} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-[#111111]">{todayBio?.rhr || '--'}</span>
              <span className="text-[10px] text-slate-500 font-bold">bpm</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-[#FFFFFF] border border-[#8B5CF6]/20 p-4 rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 text-[#8B5CF6] mb-2">
              <Activity size={16} />
              <h3 className="text-[10px] uppercase font-bold tracking-wider">Fitness (CTL)</h3>
            </div>
            <div className="text-3xl font-black text-[#111111]">{Math.round(todayLoad?.ctl || 0)}</div>
          </div>
          
          <div className="bg-gradient-to-br from-[#22A06B]/10 to-[#FFFFFF] border border-[#22A06B]/20 p-4 rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 text-[#22A06B] mb-2">
              <TrendingUp size={16} />
              <h3 className="text-[10px] uppercase font-bold tracking-wider">Forme (TSB)</h3>
            </div>
            <div className="text-3xl font-black text-[#111111]">
              {todayLoad?.tsb && todayLoad.tsb > 0 ? '+' : ''}{Math.round(todayLoad?.tsb || 0)}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="bg-[#FFFFFF] border border-[#F3F4F6] p-4 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#111111]">Analyse (28 Jours)</h3>
            
            {/* Chart toggle */}
            <div className="flex gap-1 bg-[#F3F4F6] p-1 rounded-xl">
              <button
                onClick={() => setActiveChart('health')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  activeChart === 'health'
                    ? 'bg-[#FFFFFF] text-rose-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                VFC & FC
              </button>
              <button
                onClick={() => setActiveChart('sleep')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  activeChart === 'sleep'
                    ? 'bg-[#FFFFFF] text-[#8B5CF6] shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sommeil
              </button>
              <button
                onClick={() => setActiveChart('zones')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  activeChart === 'zones'
                    ? 'bg-[#FFFFFF] text-[#F26A00] shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Zones
              </button>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              {activeChart === 'health' ? (
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.8} />
                  <XAxis dataKey="formattedDate" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', padding: '4px 8px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''}
                  />
                  <Line type="monotone" dataKey="hrv" name="VFC (ms)" stroke="#F26A00" strokeWidth={2.5} dot={{ r: 3, fill: '#F26A00' }} />
                  <Line type="monotone" dataKey="rhr" name="FC Repos (bpm)" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3, fill: '#f43f5e' }} />
                </LineChart>
              ) : activeChart === 'sleep' ? (
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.8} />
                  <XAxis dataKey="formattedDate" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="hours" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[4, 11]} />
                  <YAxis yAxisId="score" orientation="right" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} hide />
                  <Tooltip
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', padding: '4px 8px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''}
                  />
                  <Bar yAxisId="hours" dataKey="sleepHours" name="Heures de Sommeil" fill="#8B5CF6" radius={[4, 4, 0, 0]} opacity={0.8} maxBarSize={30} />
                  <Line yAxisId="score" type="monotone" dataKey="sleepScore" name="Score Qualité (/100)" stroke="#22A06B" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              ) : (
                <BarChart3D data={sleepZonesData} />
              )}
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          {activeChart === 'health' && (
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-[#F3F4F6] text-[10px] text-center font-medium mt-2">
              <div className="flex items-center justify-center gap-1.5 text-[#F26A00]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F26A00] inline-block"></span> VFC (HRV - ms)
              </div>
              <div className="flex items-center justify-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span> FC Repos (bpm)
              </div>
            </div>
          )}
          
          {activeChart === 'sleep' && (
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-[#F3F4F6] text-[10px] text-center font-medium mt-2">
              <div className="flex items-center justify-center gap-1.5 text-[#8B5CF6]">
                <span className="w-2.5 h-2.5 rounded bg-indigo-400 inline-block"></span> Durée (Heures)
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[#22A06B]">
                <span className="w-2.5 h-2.5 rounded-full bg-lime-400 inline-block"></span> Score (/100)
              </div>
            </div>
          )}
          
          {activeChart === 'zones' && (
            <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-[#F3F4F6] text-[10px] font-medium mt-2">
              {sleepZonesData.map((z, i) => (
                <div key={i} className="flex items-center gap-1" style={{ color: z.color }}>
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: z.color }}></span> {z.name} ({z.value}%)
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Training Zones Calculator */}
        <TrainingZonesCalculator rhr={calculatedRhr} ftp={ftp} setFtp={setFtp} />
      </div>
    </motion.div>
  );
}

function VariationBadge({ change, isPositive }: { change: number; isPositive: boolean }) {
  if (change === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-500">
        <Minus size={10} /> 0%
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${
        isPositive ? 'text-[#22A06B]' : 'text-rose-400'
      }`}
    >
      {change > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {change > 0 ? '+' : ''}{change}%
    </span>
  );
}

function BarChart3D({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} opacity={0.8} />
        <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} unit="%" />
        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} width={80} />
        <Tooltip
          cursor={{fill: '#f1f5f9'}}
          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', padding: '4px 8px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
        />
        <Bar dataKey="value" name="Répartition" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function TrainingZonesCalculator({ rhr = 50, ftp, setFtp }: { rhr: number, ftp: number, setFtp: (f: number) => void }) {
  const [maxHr, setMaxHr] = useState<number>(190);
  const [sport, setSport] = useState<'cycling' | 'running' | 'swimming' | null>(null);

  const calcHr = (percent: number) => Math.round(((maxHr - rhr) * (percent / 100)) + rhr);
  const calcPower = (percent: number) => Math.round(ftp * (percent / 100));

  const hrZones = [
    { name: 'Z1', color: 'bg-slate-300', text: 'text-slate-500', range: [50, 60] },
    { name: 'Z2', color: 'bg-[#3B82F6]', text: 'text-[#3B82F6]', range: [60, 70] },
    { name: 'Z3', color: 'bg-[#22A06B]', text: 'text-[#22A06B]', range: [70, 80] },
    { name: 'Z4', color: 'bg-[#EAB308]', text: 'text-[#EAB308]', range: [80, 90] },
    { name: 'Z5', color: 'bg-[#EF4444]', text: 'text-[#EF4444]', range: [90, 100] }
  ];

  const powerZones = [
    { name: 'Z1', color: 'bg-slate-300', text: 'text-slate-500', render: () => `< ${calcPower(55)}` },
    { name: 'Z2', color: 'bg-[#3B82F6]', text: 'text-[#3B82F6]', render: () => `${calcPower(55)}-${calcPower(75)}` },
    { name: 'Z3', color: 'bg-[#22A06B]', text: 'text-[#22A06B]', render: () => `${calcPower(75)}-${calcPower(90)}` },
    { name: 'Z4', color: 'bg-[#EAB308]', text: 'text-[#EAB308]', render: () => `${calcPower(90)}-${calcPower(105)}` },
    { name: 'Z5', color: 'bg-[#EF4444]', text: 'text-[#EF4444]', render: () => `${calcPower(105)}-${calcPower(120)}` },
    { name: 'Z6', color: 'bg-[#8B5CF6]', text: 'text-[#8B5CF6]', render: () => `${calcPower(120)}-${calcPower(150)}` },
  ];

  return (
    <div className="bg-[#FFFFFF] border border-[#F3F4F6] p-5 rounded-3xl mt-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-[#111111]">Zones d'Entraînement</h3>
        {sport && (
          <div className="text-[10px] text-slate-500 bg-[#F3F4F6] px-3 py-2 rounded-lg border border-[#F3F4F6]">
             FC Repos : <strong className="text-[#111111]">{rhr} bpm</strong>
          </div>
        )}
      </div>
      
      {!sport ? (
        <div>
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-3 text-center">Choisissez votre sport</label>
          <div className="flex gap-2">
            <button onClick={() => setSport('cycling')} className="flex-1 flex flex-col items-center justify-center py-4 rounded-xl border border-[#F3F4F6] bg-[#F3F4F6] hover:border-[#F26A00] hover:text-[#F26A00] text-slate-500 transition-colors">
              <Bike size={24} className="mb-2" />
              <span className="text-[10px] font-bold">Vélo</span>
            </button>
            <button onClick={() => setSport('running')} className="flex-1 flex flex-col items-center justify-center py-4 rounded-xl border border-[#F3F4F6] bg-[#F3F4F6] hover:border-[#F26A00] hover:text-[#F26A00] text-slate-500 transition-colors">
              <Footprints size={24} className="mb-2" />
              <span className="text-[10px] font-bold">Course</span>
            </button>
            <button onClick={() => setSport('swimming')} className="flex-1 flex flex-col items-center justify-center py-4 rounded-xl border border-[#F3F4F6] bg-[#F3F4F6] hover:border-[#F26A00] hover:text-[#F26A00] text-slate-500 transition-colors">
              <Waves size={24} className="mb-2" />
              <span className="text-[10px] font-bold">Natation</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
             <button onClick={() => setSport(null)} className="text-[10px] bg-[#F3F4F6] text-slate-500 px-2 py-1 rounded hover:text-[#111111] transition-colors">Retour</button>
             <span className="text-[12px] font-bold text-[#F26A00] capitalize">
               {sport === 'cycling' ? 'Vélo' : sport === 'running' ? 'Course à pied' : 'Natation'}
             </span>
          </div>
          <div className={`grid ${sport === 'cycling' ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
             {/* FC Column */}
             <div>
                <label className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block mb-1">FC Max (bpm)</label>
                <input 
                   type="number" 
                   value={maxHr} 
                   onChange={e => setMaxHr(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#F3F4F6] border border-[#F3F4F6] rounded-lg px-2 py-1.5 text-[#111111] text-xs focus:outline-none focus:border-[#F26A00] mb-3"
                />
                <div className="space-y-1">
                  {hrZones.map(z => (
                    <div key={z.name} className="flex flex-col text-[10px] bg-[#FFFFFF] px-2 py-1.5 rounded-md border border-[#F3F4F6]">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${z.color}`}></span>
                        <span className={`font-bold ${z.text}`}>{z.name}</span>
                      </div>
                      <span className="text-[#111111] font-mono pl-2.5">{calcHr(z.range[0])} - {calcHr(z.range[1])}</span>
                    </div>
                  ))}
                </div>
             </div>
             
             {/* Power Column - only for cycling */}
             {sport === 'cycling' && (
               <div>
                  <label className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block mb-1">FTP (W)</label>
                  <input 
                     type="number" 
                     value={ftp} 
                     onChange={e => setFtp(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#F3F4F6] border border-[#F3F4F6] rounded-lg px-2 py-1.5 text-[#111111] text-xs focus:outline-none focus:border-[#F26A00] mb-3"
                  />
                  <div className="space-y-1">
                    {powerZones.map(z => (
                      <div key={z.name} className="flex flex-col text-[10px] bg-[#FFFFFF] px-2 py-1.5 rounded-md border border-[#F3F4F6]">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${z.color}`}></span>
                          <span className={`font-bold ${z.text}`}>{z.name}</span>
                        </div>
                        <span className="text-[#111111] font-mono pl-2.5">{z.render()}</span>
                      </div>
                    ))}
                  </div>
               </div>
             )}
          </div>
        </>
      )}
    </div>
  );
}
