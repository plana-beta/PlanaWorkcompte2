const fs = require('fs');
let code = fs.readFileSync('src/views/OnboardingView.tsx', 'utf8');

code = code.replace(
  "const [levels, setLevels] = useState<{ [key: string]: string | null }>({ Natation: null, Vélo: null, Course: null });",
  "const [levels, setLevels] = useState<{ [key: string]: string | null }>({ Natation: null, Vélo: null, Course: null });\n  const [dataConnection, setDataConnection] = useState<'none' | 'apple_health' | 'google_health_connect' | 'demo'>('none');"
);

fs.writeFileSync('src/views/OnboardingView.tsx', code);
