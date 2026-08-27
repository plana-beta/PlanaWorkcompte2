import { describe, it, expect } from 'vitest';
import { calculateNP, calculateIF, calculateTSS, estimateHrTss, estimateDurationTss, generatePMC, calculateTrainingLoad } from './trainingEngine';
import { ActualWorkout } from '../domain/models';

describe('Training Engine Calculations', () => {
  it('calculates NP correctly for a constant power', () => {
    // 60 seconds at exactly 200W
    const powerData = Array(60).fill(200);
    const np = calculateNP(powerData);
    expect(Math.round(np)).toBe(200);
  });

  it('calculates IF correctly', () => {
    const np = 200;
    const ftp = 250;
    expect(calculateIF(np, ftp)).toBe(0.8);
  });

  it('calculates TSS correctly (example from prompt)', () => {
    // FTP = 250 W, NP = 200 W, Durée = 60 minutes, IF = 0.80 -> TSS = 64
    const tss = calculateTSS(60 * 60, 200, 250);
    expect(Math.round(tss)).toBe(64);
  });
  
  it('estimates HR TSS correctly', () => {
    const tss = estimateHrTss(60, 150, 190);
    expect(tss).toBeGreaterThan(0);
    // thr = 161.5, IF = 150/161.5 = 0.928. IF^2 = 0.86. 1h * 0.86 * 100 = 86
    expect(Math.round(tss)).toBe(86);
  });
  
  it('estimates Duration TSS correctly (fallback)', () => {
    expect(estimateDurationTss(60, 'Run')).toBe(60);
    expect(estimateDurationTss(90, 'Swim')).toBe(75); // 1.5 * 50
    expect(estimateDurationTss(120, 'Ride')).toBe(80); // 2 * 40
  });

  it('generates PMC correctly for multiple days', () => {
    const activities: Partial<ActualWorkout>[] = [
      { id: '1', sport: 'Ride', date: '2024-01-01', tss: 50 },
      { id: '2', sport: 'Ride', date: '2024-01-01', tss: 30 }, // Same day, total TSS = 80
      { id: '3', sport: 'Ride', date: '2024-01-02', tss: 0 },  // Rest day
      { id: '4', sport: 'Ride', date: '2024-01-03', tss: 100 }
    ];

    const pmc = generatePMC(activities, 250, new Date('2024-01-03'));
    
    // Day 1: 2024-01-01 -> TSS = 80
    // ATL = 0 + (80 - 0) / 7 = 11.42
    // CTL = 0 + (80 - 0) / 42 = 1.90
    // TSB = CTL - ATL = 1.90 - 11.42 = -9.52
    expect(pmc[0].date).toBe('2024-01-01');
    expect(pmc[0].tss).toBe(80);
    expect(pmc[0].atl).toBeCloseTo(11.428, 2);
    expect(pmc[0].ctl).toBeCloseTo(1.904, 2);
    expect(pmc[0].tsb).toBeCloseTo(-9.523, 2);

    // Day 2: 2024-01-02 -> TSS = 0
    // ATL = 11.428 + (0 - 11.428) / 7 = 9.79
    // CTL = 1.904 + (0 - 1.904) / 42 = 1.85
    expect(pmc[1].date).toBe('2024-01-02');
    expect(pmc[1].tss).toBe(0);
    expect(pmc[1].atl).toBeCloseTo(9.795, 2);
    expect(pmc[1].ctl).toBeCloseTo(1.859, 2);

    // Day 3: 2024-01-03 -> TSS = 100
    expect(pmc[2].date).toBe('2024-01-03');
    expect(pmc[2].tss).toBe(100);
  });
  
  it('calculates a realistic triathlon week (Test 21)', () => {
    const workouts: Partial<ActualWorkout>[] = [
      { date: '2026-08-24', sport: 'Run', durationMin: 50 }, // Tuesday, avg 60 tss/hr = 50
      { date: '2026-08-25', sport: 'Swim', durationMin: 45 }, // Wednesday, avg 50 tss/hr = 37.5
      { date: '2026-08-26', sport: 'Ride', durationMin: 90 }, // Thursday, avg 40 tss/hr = 60
      { date: '2026-08-28', sport: 'Ride', durationMin: 180 }, // Saturday, avg 40 tss/hr = 120
      { date: '2026-08-29', sport: 'Run', durationMin: 60 } // Sunday, avg 60 tss/hr = 60
    ];
    
    // We add ftp=250 and maxHr=190
    const pmc = generatePMC(workouts, 250, new Date('2026-08-29'));
    expect(pmc.length).toBeGreaterThan(0);
    
    const tuesday = pmc.find(p => p.date === '2026-08-24');
    expect(tuesday?.tss).toBe(50);
    
    const wednesday = pmc.find(p => p.date === '2026-08-25');
    expect(wednesday?.tss).toBe(37.5);
    
    // TSB should decrease over the heavy weekend
    const saturday = pmc.find(p => p.date === '2026-08-28');
    const sunday = pmc.find(p => p.date === '2026-08-29');
    
    expect(sunday!.atl).toBeGreaterThan(saturday!.atl);
  });
  
  it('handles missing data robustly (Test 7)', () => {
     // Missing FC, power, just duration
     const load = calculateTrainingLoad({ durationMin: 30, sport: 'Run' }, 250);
     expect(load).toBe(30);
     
     // Missing duration entirely
     const loadZero = calculateTrainingLoad({ sport: 'Run', averageHeartRate: 150 }, 250);
     expect(loadZero).toBe(0);
  });
});
