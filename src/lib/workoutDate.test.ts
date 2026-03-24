import { describe, expect, it } from 'vitest';

import {
  formatWorkoutDate,
  getCurrentSaoPauloDateKey,
  parseWorkoutDate,
} from '@/lib/workoutDate';

describe('workoutDate helpers', () => {
  it('preserves the day when parsing a date-only workout_date', () => {
    const parsed = parseWorkoutDate('2026-03-21');

    expect(formatWorkoutDate('2026-03-21', 'yyyy-MM-dd')).toBe('2026-03-21');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(2);
    expect(parsed.getDate()).toBe(21);
  });

  it('uses Sao Paulo current date instead of UTC rollover', () => {
    const utcAfterMidnight = new Date('2026-03-22T02:30:00.000Z');

    expect(getCurrentSaoPauloDateKey(utcAfterMidnight)).toBe('2026-03-21');
  });
});
