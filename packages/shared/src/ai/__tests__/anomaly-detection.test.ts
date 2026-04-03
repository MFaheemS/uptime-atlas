import { describe, it, expect } from 'vitest';
import { detectAnomaly } from '../anomaly-detection.js';

function makeResults(values: number[]) {
  return values.map((v) => ({ responseTimeMs: v }));
}

describe('detectAnomaly', () => {
  it('returns isAnomaly=false when fewer than 10 data points', () => {
    const result = detectAnomaly(500, makeResults([100, 110, 120]));
    expect(result.isAnomaly).toBe(false);
    expect(result.zScore).toBe(0);
    expect(result.message).toBeNull();
  });

  it('returns isAnomaly=false when stdDev is 0 (all results identical)', () => {
    const result = detectAnomaly(200, makeResults(new Array(15).fill(200)));
    expect(result.isAnomaly).toBe(false);
  });

  it('returns isAnomaly=true when current value is more than 2 standard deviations above mean', () => {
    // mean=100, stdDev=10, current=125 → zScore=2.5
    const values = [90, 95, 100, 100, 105, 110, 95, 100, 105, 100]; // mean=100
    const result = detectAnomaly(125, makeResults(values));
    expect(result.isAnomaly).toBe(true);
    expect(result.zScore).toBeGreaterThan(2.0);
    expect(result.message).not.toBeNull();
  });

  it('returns isAnomaly=false for a normal value within 2 standard deviations', () => {
    const values = [90, 95, 100, 100, 105, 110, 95, 100, 105, 100];
    const result = detectAnomaly(108, makeResults(values));
    expect(result.isAnomaly).toBe(false);
  });

  it('calculates zScore correctly for a known set of numbers', () => {
    // values: [100]*10, mean=100, stdDev=0 → falls into stdDev=0 guard
    // Use values with known stdDev
    // values: 10 items all 100 except we need variance
    // mean = 100, variance = sum((x-100)^2)/10
    // Let's use: [80,90,100,100,100,100,100,110,120,100]
    // mean = 1000/10 = 100
    // deviations^2: 400,100,0,0,0,0,0,100,400,0 → sum=1000, variance=100, stdDev=10
    const values = [80, 90, 100, 100, 100, 100, 100, 110, 120, 100];
    const current = 130; // zScore = (130-100)/10 = 3.0
    const result = detectAnomaly(current, makeResults(values));
    expect(result.zScore).toBeCloseTo(3.0, 1);
    expect(result.isAnomaly).toBe(true);
  });
});
