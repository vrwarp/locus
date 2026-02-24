import { parseISO, getDay, getHours, getMinutes, format } from 'date-fns';
import type { PcoCheckIn } from './pco';

export interface VelocityDataPoint {
  time: string; // HH:mm
  minute: number; // minutes from midnight
  average: number; // check-ins per minute
  latest: number; // check-ins per minute
}

export const calculateCheckInVelocity = (checkIns: PcoCheckIn[]): VelocityDataPoint[] => {
  // 1. Filter for Sundays
  const sundayCheckIns = checkIns.filter(c => {
    const date = parseISO(c.attributes.created_at);
    return getDay(date) === 0; // 0 is Sunday
  });

  if (sundayCheckIns.length === 0) return [];

  // 2. Group by Date to identify unique Sundays and count them
  const sundays = new Set<string>();
  sundayCheckIns.forEach(c => {
    const dateStr = format(parseISO(c.attributes.created_at), 'yyyy-MM-dd');
    sundays.add(dateStr);
  });

  // 3. Identify Latest Sunday
  const sortedDates = Array.from(sundays).sort();
  const latestDateStr = sortedDates[sortedDates.length - 1];

  // Filter check-ins for latest Sunday
  const latestSundayCheckIns = sundayCheckIns.filter(c =>
    format(parseISO(c.attributes.created_at), 'yyyy-MM-dd') === latestDateStr
  );

  const totalSundays = sundays.size;

  // 4. Bucketing (5-minute intervals)
  const bucketSize = 5; // minutes
  // Define Time Range: 7:00 AM (420) to 1:00 PM (780)
  const startMin = 420;
  const endMin = 780;

  const buckets = new Map<number, { total: number, latest: number }>();

  // Initialize buckets
  for (let m = startMin; m <= endMin; m += bucketSize) {
      buckets.set(m, { total: 0, latest: 0 });
  }

  // Helper to get bucket start time
  const getBucket = (date: Date) => {
      const minutes = getHours(date) * 60 + getMinutes(date);
      // Round down to nearest bucketSize
      return Math.floor(minutes / bucketSize) * bucketSize;
  };

  // Process Average (All Sundays)
  sundayCheckIns.forEach(c => {
      const date = parseISO(c.attributes.created_at);
      const bucketTime = getBucket(date);
      if (buckets.has(bucketTime)) {
          buckets.get(bucketTime)!.total += 1;
      }
  });

  // Process Latest
  latestSundayCheckIns.forEach(c => {
      const date = parseISO(c.attributes.created_at);
      const bucketTime = getBucket(date);
      if (buckets.has(bucketTime)) {
          buckets.get(bucketTime)!.latest += 1;
      }
  });

  // 5. Format Output
  const data: VelocityDataPoint[] = [];
  const sortedBuckets = Array.from(buckets.keys()).sort((a, b) => a - b);

  sortedBuckets.forEach(minute => {
      const b = buckets.get(minute)!;

      // Calculate Rate: Check-ins per Minute
      // Average Volume in this bucket = b.total / totalSundays
      // Rate = Average Volume / bucketSize
      const averageRate = (b.total / totalSundays) / bucketSize;

      // Latest Volume in this bucket = b.latest
      // Rate = Latest Volume / bucketSize
      const latestRate = b.latest / bucketSize;

      // Format time HH:mm
      const h = Math.floor(minute / 60);
      const m = minute % 60;
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

      data.push({
          time: timeStr,
          minute,
          average: parseFloat(averageRate.toFixed(2)),
          latest: parseFloat(latestRate.toFixed(2))
      });
  });

  return data;
};
