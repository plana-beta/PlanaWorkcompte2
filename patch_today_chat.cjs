const fs = require('fs');
let code = fs.readFileSync('src/views/TodayView.tsx', 'utf8');

code = code.replace(
  "import { Play, Zap, Droplets, Bike, Footprints, Target, Info, Activity, AlertTriangle } from 'lucide-react';",
  "import { Play, Zap, Droplets, Bike, Footprints, Target, Info, Activity, AlertTriangle } from 'lucide-react';\nimport { CoachChat } from '../components/CoachChat';"
);

// We want to add it to the bottom of the view.
// Let's find the closing `</motion.div>` and inject it right before
code = code.replace(
  "    </motion.div>\n  );\n}",
  "      <CoachChat />\n    </motion.div>\n  );\n}"
);

fs.writeFileSync('src/views/TodayView.tsx', code);
