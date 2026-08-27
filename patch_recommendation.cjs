const fs = require('fs');
let code = fs.readFileSync('src/lib/recommendationEngine.ts', 'utf8');

const goalLogic = `
  // 5. Goal Proximity
  if (goal && goal.date) {
    const daysToGoal = differenceInDays(parseISO(goal.date), currentDate);
    if (daysToGoal > 0 && daysToGoal <= 14) {
      recommendations.push({
        id: genId('GOAL_TAPER'),
        type: 'GOAL',
        priority: 'MEDIUM',
        title: 'Ton objectif approche',
        message: \`Ta course est dans \${daysToGoal} jours.\`,
        reason: 'Ton affûtage approche. La priorité est désormais la fraîcheur et la spécificité.',
        createdAt: currentDate.toISOString()
      });
    } else if (daysToGoal > 14 && daysToGoal <= 60) {
      recommendations.push({
        id: genId('GOAL_BUILD'),
        type: 'GOAL',
        priority: 'LOW',
        title: 'En route vers ton objectif',
        message: \`Ta course est dans \${Math.floor(daysToGoal/7)} semaines.\`,
        reason: 'Tu es actuellement dans une phase clé de développement pour ton objectif.',
        createdAt: currentDate.toISOString()
      });
    }
  }

  // 6. Progress
`;

code = code.replace('  // 6. Progress (Only if we have some data)', goalLogic);
fs.writeFileSync('src/lib/recommendationEngine.ts', code);
