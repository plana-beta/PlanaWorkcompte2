const fs = require('fs');

function fix(file) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/\\`/g, '`');
  code = code.replace(/\\\$/g, '$');
  fs.writeFileSync(file, code);
}

fix('src/services/coach/mockCoachProvider.ts');
fix('src/services/coach/coachService.ts');
