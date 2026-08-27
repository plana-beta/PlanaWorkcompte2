const fs = require('fs');
let code = fs.readFileSync('src/lib/recommendationEngine.test.ts', 'utf8');

code = code.replace(/\\`pw_\\\${daysOffset}\\`/g, "`pw_${daysOffset}`");
code = code.replace(/id: \\`pw_\\\\\${daysOffset}\\\\`/, "id: `pw_${daysOffset}`");
code = code.replace("id: \\`pw_\\${daysOffset}\\`,", "id: `pw_${daysOffset}`,");

fs.writeFileSync('src/lib/recommendationEngine.test.ts', code);
