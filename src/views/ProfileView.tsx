import React from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store';
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ProfileView() {
  const { athleteProfile, recommendations, syncStatus, triggerSync, setAthleteProfile } = useAppStore();
  const syncRec = recommendations.find(r => r.type === 'HEALTH_SYNC');
  
  if (!athleteProfile) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 pb-24 space-y-6">
      <div>
        <h2 className="text-3xl font-black text-plana-black tracking-wide">Profil</h2>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Paramètres et données
        </p>
      </div>

      
      <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Connexion Santé</h3>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-slate-600">
            <Activity size={20} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-plana-black uppercase tracking-wider">
              {athleteProfile.dataConnection === 'apple_health' ? 'Apple Health' : 
               athleteProfile.dataConnection === 'google_health_connect' ? 'Health Connect' : 
               athleteProfile.dataConnection === 'demo' ? 'Mode Démo' : 'Aucune source'}
            </div>
            <div className="text-xs font-medium text-slate-500">
              Source des données d'entraînement
            </div>
          </div>
        </div>

        {athleteProfile.dataConnection !== 'none' && (
          <div className="mb-4">
            {syncStatus.state === 'syncing' && <div className="text-xs font-bold text-blue-500">Synchronisation en cours...</div>}
            {syncStatus.state === 'success' && <div className="text-xs font-bold text-emerald-500">Synchronisé {syncStatus.lastSyncAt ? new Date(syncStatus.lastSyncAt).toLocaleTimeString() : ''}. {syncStatus.importedCount} importés, {syncStatus.updatedCount} mis à jour.</div>}
            {syncStatus.state === 'error' && <div className="text-xs font-bold text-red-500">Erreur de synchronisation: {syncStatus.error}</div>}
            {syncStatus.state === 'permission_denied' && <div className="text-xs font-bold text-amber-500">Permission refusée. Tu peux reconnecter plus tard.</div>}
            {syncStatus.state === 'unavailable' && <div className="text-xs font-bold text-amber-500">Source indisponible (Mode Web/PWA).</div>}
            
            <button 
              onClick={() => triggerSync()} 
              disabled={syncStatus.state === 'syncing'}
              className="mt-3 px-4 py-2 bg-plana-black text-white text-xs font-bold uppercase tracking-wider rounded-xl disabled:opacity-50"
            >
              Synchroniser maintenant
            </button>
            <button 
              onClick={() => setAthleteProfile({ ...athleteProfile, dataConnection: 'none' })} 
              className="mt-3 ml-2 px-4 py-2 bg-gray-100 text-slate-500 text-xs font-bold uppercase tracking-wider rounded-xl"
            >
              Déconnecter
            </button>
          </div>
        )}
        
        {athleteProfile.dataConnection === 'none' && (
           <div className="flex flex-col gap-2">
             <button onClick={() => setAthleteProfile({ ...athleteProfile, dataConnection: 'demo' })} className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider rounded-xl">Utiliser Mode Démo</button>
             <button onClick={() => setAthleteProfile({ ...athleteProfile, dataConnection: 'apple_health' })} className="px-4 py-2 bg-gray-50 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl">Connecter Apple Health</button>
             <button onClick={() => setAthleteProfile({ ...athleteProfile, dataConnection: 'google_health_connect' })} className="px-4 py-2 bg-gray-50 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl">Connecter Health Connect</button>
           </div>
        )}
      </div>

    </motion.div>
  );
}
