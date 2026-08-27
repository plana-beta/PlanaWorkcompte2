const fs = require('fs');
let code = fs.readFileSync('src/domain/models.ts', 'utf8');
const newTypes = `

export interface Recommendation {
  id: string;
  type: 'TODAY_WORKOUT' | 'RECOVERY' | 'PLAN_ADAPTED' | 'MISSED_WORKOUT' | 'PROGRESS' | 'GOAL' | 'HEALTH_SYNC' | 'WARNING' | 'INFO';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  reason?: string;
  relatedWorkoutId?: string;
  action?: 'start_workout' | 'sync_health' | 'view_plan';
  createdAt: string;
}
`;
if(!code.includes('export interface Recommendation')) {
  fs.writeFileSync('src/domain/models.ts', code + newTypes);
}
