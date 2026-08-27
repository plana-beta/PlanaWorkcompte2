const fs = require('fs');
let code = fs.readFileSync('src/views/HealthView.tsx', 'utf8');

code = code.replace(
  "import { healthService, HealthProvider } from '../services/healthService';",
  "import { syncService } from '../services/sync/SyncService';"
);

code = code.replace(
  "const { metrics, pmc, ftp, setFtp } = useAppStore();",
  "const { metrics, pmc, ftp, setFtp, syncStatus, triggerSync } = useAppStore();"
);

code = code.replace(
  "const [isSyncing, setIsSyncing] = useState(false);",
  "const isSyncing = syncStatus.state === 'syncing';"
);
code = code.replace(
  "const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');",
  "// syncStatus is now coming from the store"
);

// We need to find handleSync and rewrite it.
// Just replace everything from `const handleSync` to its closing brace
code = code.replace(
  /const handleSync = async \(\) => \{[\s\S]*?setIsSyncing\(false\);\n  \};/,
  `const handleSync = async () => {
    triggerSync();
  };`
);

fs.writeFileSync('src/views/HealthView.tsx', code);
