const fs = require('fs');
let code = fs.readFileSync('src/views/HealthView.tsx', 'utf8');

// The original handleSync is like:
/*
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    
    try {
      const provider: HealthProvider = /iPhone|iPad|iPod/.test(navigator.userAgent) 
        ? 'apple_health' 
        : 'google_health_connect';
      
      const connected = await healthService.connect(provider);
      if (connected) {
        const result = await healthService.syncTodayData();
        if (result.success) {
          setSyncStatus('success');
          // In a real app we'd dispatch to Zustand here
        } else {
          setSyncStatus('error');
        }
      }
    } catch (e) {
      setSyncStatus('error');
    }
    
    setIsSyncing(false);
  };
*/

const oldHandleSync = `  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    
    try {
      const provider: HealthProvider = /iPhone|iPad|iPod/.test(navigator.userAgent) 
        ? 'apple_health' 
        : 'google_health_connect';
      
      const connected = await healthService.connect(provider);
      if (connected) {
        const result = await healthService.syncTodayData();
        if (result.success) {
          setSyncStatus('success');
          // In a real app we'd dispatch to Zustand here
        } else {
          setSyncStatus('error');
        }
      }
    } catch (e) {
      setSyncStatus('error');
    }
    
    setIsSyncing(false);
  };`;

const newHandleSync = `  const handleSync = async () => {
    triggerSync();
  };`;

code = code.replace(oldHandleSync, newHandleSync);

// Fix UI states for syncStatus since syncStatus is now an object from the store
code = code.replace(
  "syncStatus === 'success' ? 'bg-[#22A06B]/10 text-[#22A06B] border border-[#22A06B]/20' :",
  "syncStatus.state === 'success' ? 'bg-[#22A06B]/10 text-[#22A06B] border border-[#22A06B]/20' :"
);
code = code.replace(
  "syncStatus === 'error' ? 'bg-rose-50 text-rose-500 border border-rose-200' :",
  "(syncStatus.state === 'error' || syncStatus.state === 'permission_denied') ? 'bg-rose-50 text-rose-500 border border-rose-200' :"
);

fs.writeFileSync('src/views/HealthView.tsx', code);
