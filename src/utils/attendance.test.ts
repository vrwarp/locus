import { aggregateCheckInsByWeek } from './attendance';
import type { PcoCheckIn } from './pco';
import { describe, it, expect } from 'vitest';

describe('aggregateCheckInsByWeek', () => {
  it('should aggregate check-ins by week (Sunday)', () => {
    const mockCheckIns: PcoCheckIn[] = [
      {
        id: '1',
        type: 'CheckIn',
        attributes: { created_at: '2024-01-01T10:00:00Z', kind: 'Regular' }, // Monday
        relationships: { person: { data: { type: 'Person', id: '1' } }, event: { data: { type: 'Event', id: '1' } } }
      },
      {
        id: '2',
        type: 'CheckIn',
        attributes: { created_at: '2024-01-02T10:00:00Z', kind: 'Regular' }, // Tuesday
        relationships: { person: { data: { type: 'Person', id: '2' } }, event: { data: { type: 'Event', id: '1' } } }
      },
      {
        id: '3',
        type: 'CheckIn',
        attributes: { created_at: '2024-01-07T10:00:00Z', kind: 'Regular' }, // Next Sunday
        relationships: { person: { data: { type: 'Person', id: '3' } }, event: { data: { type: 'Event', id: '1' } } }
      },
      {
        id: '4',
        type: 'CheckIn',
        attributes: { created_at: '2023-12-31T10:00:00Z', kind: 'Regular' }, // Previous Sunday
        relationships: { person: { data: { type: 'Person', id: '4' } }, event: { data: { type: 'Event', id: '1' } } }
      }
    ];

    const result = aggregateCheckInsByWeek(mockCheckIns);

    // 2023-12-31 is a Sunday. 2024-01-01 is Monday (same week as Dec 31).
    // Week of Dec 31: Dec 31, Jan 1, Jan 2 -> 3 check-ins
    // 2024-01-07 is the next Sunday. -> 1 check-in

    // Week 1: Dec 31 start. Check-in 1 (Jan 1), Check-in 2 (Jan 2), Check-in 4 (Dec 31)
    // Week 2: Jan 7 start. Check-in 3 (Jan 7)

    expect(result).toHaveLength(2);
    expect(result[0].week).toBe('Dec 31');
    expect(result[0].count).toBe(3);
    expect(result[1].week).toBe('Jan 7');
    expect(result[1].count).toBe(1);
  });

  it('should handle empty check-ins', () => {
    const result = aggregateCheckInsByWeek([]);
    expect(result).toEqual([]);
  });

  it('should sort results by date', () => {
    const mockCheckIns: PcoCheckIn[] = [
      {
        id: '1',
        type: 'CheckIn',
        attributes: { created_at: '2024-02-01T10:00:00Z', kind: 'Regular' },
        relationships: { person: { data: { type: 'Person', id: '1' } }, event: { data: { type: 'Event', id: '1' } } }
      },
      {
        id: '2',
        type: 'CheckIn',
        attributes: { created_at: '2024-01-01T10:00:00Z', kind: 'Regular' },
        relationships: { person: { data: { type: 'Person', id: '2' } }, event: { data: { type: 'Event', id: '1' } } }
      }
    ];

    const result = aggregateCheckInsByWeek(mockCheckIns);

    expect(result).toHaveLength(2);
    // Jan 1 should be first
    expect(result[0].week).toContain('Dec 31'); // Depending on start of week logic, 2024-01-01 (Monday) -> Dec 31 (Sunday)
    expect(result[1].week).toContain('Jan 28'); // Feb 1 (Thursday) -> Jan 28 (Sunday)
  });
});
