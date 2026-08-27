import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BikeComponent } from '../types';
import { useAppStore } from '../store';
import { Wrench, Disc, Settings, AlertCircle, Plus, Bike, ChevronRight, X, Save } from 'lucide-react';

export default function GarageView() {
  const { components, activities, addComponent, updateComponent, removeComponent } = useAppStore();
  const [editingComp, setEditingComp] = useState<BikeComponent | null | 'new'>(null);
  
  // Calculate total distance from activities to automate component mileage
  const totalDurationMin = activities.reduce((acc, act) => acc + (act.durationMin || 0), 0);
  const totalKmFromActivities = activities.reduce((acc, act) => acc + (act.distanceKm || 0), 0);
  const totalKm = totalKmFromActivities > 0 ? totalKmFromActivities : Math.round((totalDurationMin / 60) * 30);
  
  // Sort components so bike is at the top if present
  const sortedComponents = [...components].sort((a, b) => {
    if (a.type === 'bike' && b.type !== 'bike') return -1;
    if (b.type === 'bike' && a.type !== 'bike') return 1;
    return 0;
  });

  const bikeComponent = components.find(c => c.type === 'bike');
  const bikeName = bikeComponent ? bikeComponent.name : 'Mon Vélo';

  if (editingComp) {
     return <ComponentForm 
       component={editingComp}
       totalKm={totalKm}
       onClose={() => setEditingComp(null)}
       onSave={(comp) => {
          if (editingComp === 'new') {
             addComponent(comp);
          } else {
             updateComponent(comp);
          }
          setEditingComp(null);
       }}
       onDelete={(id) => {
          removeComponent(id);
          setEditingComp(null);
       }}
     />
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-5 space-y-6 pb-24"
    >
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-[#111111] tracking-wide">Garage</h2>
          <p className="text-xs text-slate-500 mt-0.5">Gérez vos équipements</p>
        </div>
      </div>

      {/* Main Bike Status - Kept as requested */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden mt-4">
        <div className="absolute right-0 top-0 opacity-10 transform scale-150 translate-x-4 translate-y-4 pointer-events-none">
          <Bike size={120} />
        </div>
        <div className="relative z-10">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1 block">Vélo Principal</span>
          <h3 className="text-xl font-bold mb-4 text-white">{bikeName}</h3>
          
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-black">{totalKm.toLocaleString('fr-FR')}</span>
            <span className="text-xs font-semibold text-slate-400">km totaux</span>
          </div>
        </div>
      </section>
      
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Composants & Usure
          </h3>
        </div>

        {sortedComponents.filter(c => c.type !== 'bike').map(comp => {
          const currentDistance = Math.max(0, totalKm - comp.installedAtKm);
          const wearPercent = Math.min(100, Math.max(0, (currentDistance / comp.maxLifespanKm) * 100));
          
          let statusColor = "bg-[#22A06B]";
          let textColor = "text-[#22A06B]";
          if (wearPercent > 70) { statusColor = "bg-[#F26A00]"; textColor = "text-[#F26A00]"; }
          if (wearPercent > 90) { statusColor = "bg-rose-500"; textColor = "text-rose-500"; }

          let Icon = Wrench;
          if (comp.type === 'chain' || comp.type === 'cassette') Icon = Settings;
          if (comp.type === 'pads' || comp.type === 'tires') Icon = Disc;

          return (
            <button 
              key={comp.id} 
              onClick={() => setEditingComp(comp)}
              className="w-full bg-[#FFFFFF] p-4 rounded-3xl border border-[#F3F4F6] shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all text-left block"
            >
              <div className="flex items-start justify-between mb-4 relative z-10">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                     <Icon className="text-slate-600 w-4 h-4" />
                   </div>
                   <div>
                     <h3 className="text-sm font-bold text-[#111111]">{comp.name}</h3>
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                       {comp.type === 'other' ? (comp.customType || 'Autre') : comp.type === 'shoes' ? 'Chaussures' : comp.type}
                     </p>
                   </div>
                 </div>
                 {wearPercent > 90 ? (
                    <AlertCircle className="text-rose-500 w-5 h-5 animate-pulse mt-2 mr-1" />
                 ) : (
                    <ChevronRight className="text-slate-400 w-5 h-5 group-hover:translate-x-1 transition-transform mt-2" />
                 )}
              </div>
              
              <div className="space-y-2 relative z-10">
                 <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-500">Usure <span className={textColor}>({Math.round(wearPercent)}%)</span></span>
                    <span className="text-slate-600">{Math.round(currentDistance)} / {comp.maxLifespanKm} <span className="text-slate-400">km</span></span>
                 </div>
                 <div className="w-full bg-[#F3F4F6] rounded-full h-2 overflow-hidden">
                   <div className={`${statusColor} h-full rounded-full transition-all duration-1000 ease-out`} style={{ width: `${wearPercent}%` }}></div>
                 </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setEditingComp('new')}
        className="w-full mt-4 py-4 rounded-3xl bg-[#FFFFFF] border border-[#F3F4F6] text-[#F26A00] flex items-center justify-center gap-2 font-bold text-sm hover:bg-orange-50 transition-all shadow-sm"
      >
        <Plus size={18} />
        Ajouter un équipement
      </button>
    </motion.div>
  );
}

function ComponentForm({ 
  component, 
  totalKm,
  onClose, 
  onSave, 
  onDelete 
}: { 
  component: BikeComponent | 'new', 
  totalKm: number,
  onClose: () => void, 
  onSave: (c: BikeComponent) => void,
  onDelete: (id: string) => void 
}) {
  const isNew = component === 'new';
  const initialDistance = isNew ? 0 : Math.max(0, totalKm - component.installedAtKm);
  
  const [name, setName] = useState(isNew ? '' : component.name);
  const [type, setType] = useState<BikeComponent['type']>(isNew ? 'other' : component.type);
  const [customType, setCustomType] = useState(isNew ? '' : (component.customType || ''));
  const [distance, setDistance] = useState(String(Math.round(initialDistance)));
  const [maxDistance, setMaxDistance] = useState(isNew ? '' : String(component.maxLifespanKm));

  const handleSave = () => {
     if (!name.trim()) return;
     const displayDistance = parseInt(distance) || 0;
     const comp: BikeComponent = {
        id: isNew ? Math.random().toString(36).substr(2, 9) : component.id,
        name,
        type,
        customType: type === 'other' ? customType : undefined,
        installedAtKm: totalKm - displayDistance,
        maxLifespanKm: parseInt(maxDistance) || 1000
     };
     onSave(comp);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-5 space-y-6 pb-24"
    >
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="w-10 h-10 bg-[#FFFFFF] rounded-full text-slate-500 hover:text-[#111111] border border-[#F3F4F6] shadow-sm flex items-center justify-center transition-colors">
           <X size={20} />
        </button>
        <h2 className="text-xl font-black text-[#111111] tracking-wide">
          {isNew ? 'Nouvel équipement' : 'Modifier l\'équipement'}
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1.5">Nom de l'équipement</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Pneus GP5000"
            className="w-full bg-[#FFFFFF] border border-[#F3F4F6] rounded-2xl px-4 py-3 text-[#111111] text-sm focus:outline-none focus:border-[#F26A00] transition-colors shadow-sm"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1.5">Type</label>
          <select 
            value={type} 
            onChange={e => setType(e.target.value as any)}
            className="w-full bg-[#FFFFFF] border border-[#F3F4F6] rounded-2xl px-4 py-3 text-[#111111] text-sm focus:outline-none focus:border-[#F26A00] transition-colors appearance-none mb-3 shadow-sm"
          >
            <option value="bike">Vélo complet</option>
            <option value="chain">Chaîne</option>
            <option value="tires">Pneus</option>
            <option value="pads">Plaquettes de frein</option>
            <option value="cassette">Cassette</option>
            <option value="shoes">Chaussures</option>
            <option value="other">Autre</option>
          </select>
          
          {type === 'other' && (
            <input 
              type="text" 
              value={customType} 
              onChange={e => setCustomType(e.target.value)}
              placeholder="Type (ex: Guidoline, Pédales...)"
              className="w-full bg-[#FFFFFF] border border-[#F3F4F6] rounded-2xl px-4 py-3 text-[#111111] text-sm focus:outline-none focus:border-[#F26A00] transition-colors shadow-sm"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1.5">Déjà parcouru (km)</label>
            <input 
              type="number" 
              value={distance} 
              onChange={e => setDistance(e.target.value)}
              placeholder="0"
              className="w-full bg-[#FFFFFF] border border-[#F3F4F6] rounded-2xl px-4 py-3 text-[#111111] text-sm focus:outline-none focus:border-[#F26A00] transition-colors shadow-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-[#F26A00]/80 block mb-1.5">Limite max (km)</label>
            <input 
              type="number" 
              value={maxDistance} 
              onChange={e => setMaxDistance(e.target.value)}
              placeholder="5000"
              className="w-full bg-orange-50 border border-[#F26A00]/30 rounded-2xl px-4 py-3 text-[#111111] text-sm focus:outline-none focus:border-[#F26A00] transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 space-y-3">
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full py-4 rounded-3xl bg-[#F26A00] text-white flex items-center justify-center gap-2 font-black text-sm hover:bg-[#E85D00] transition-all disabled:opacity-50 shadow-md shadow-orange-500/20"
        >
          <Save size={18} />
          Enregistrer
        </button>
        
        {!isNew && (
          <button
            onClick={() => {
              if (window.confirm('Supprimer cet équipement ?')) {
                onDelete(component.id);
              }
            }}
            className="w-full py-4 rounded-3xl bg-transparent border border-rose-200 text-rose-500 flex items-center justify-center gap-2 font-bold text-sm hover:bg-rose-50 transition-all"
          >
            Supprimer
          </button>
        )}
      </div>
    </motion.div>
  );
}
