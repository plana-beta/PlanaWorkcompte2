const fs = require('fs');
let code = fs.readFileSync('src/services/sync/SyncService.test.ts', 'utf8');

code = code.replace(
  "await syncService.initializeAdapter('demo');",
  "await syncService.initializeAdapter('demo');\n    await syncService.getAdapter()!.requestPermissions();"
);

// We need to replace it globally, so let's do it everywhere it appears.
let newCode = code.replace(/await syncService\.initializeAdapter\('demo'\);/g, "await syncService.initializeAdapter('demo');\n    await syncService.getAdapter()!.requestPermissions();");

fs.writeFileSync('src/services/sync/SyncService.test.ts', newCode);
