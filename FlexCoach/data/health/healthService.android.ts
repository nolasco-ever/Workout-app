import { aggregateGroupByPeriod, getSdkStatus, initialize, insertRecords, readRecords, requestPermission, SdkAvailabilityStatus } from 'react-native-health-connect';
import { addDays, fromLocalDate, toLocalDate, today } from '../engine/dates';
import { HealthService } from './types';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

let initialised: Promise<boolean> | null = null;
const ready = () => (initialised ??= initialize().catch(() => false));

/**
 * Health Connect on Android 8+. Untested until an API 34 emulator or
 * device is available; every call degrades to empty results on failure.
 */
export const healthService: HealthService = {
  platformName: 'Health Connect',

  isAvailable: async () => {
    try {
      return (await getSdkStatus()) === SdkAvailabilityStatus.SDK_AVAILABLE && (await ready());
    } catch {
      return false;
    }
  },

  requestAccess: async () => {
    try {
      if (!(await ready())) return false;
      const granted = await requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'Weight' },
        { accessType: 'write', recordType: 'Weight' },
      ]);
      return granted.length > 0;
    } catch (err) {
      console.warn('Health Connect permission failed', err);
      return false;
    }
  },

  getDailySteps: async days => {
    const todayDate = today();
    const from = startOfDay(fromLocalDate(addDays(todayDate, -(days - 1))));
    try {
      if (!(await ready())) return [];
      const groups = await aggregateGroupByPeriod({
        recordType: 'Steps',
        timeRangeFilter: { operator: 'between', startTime: from.toISOString(), endTime: new Date().toISOString() },
        timeRangeSlicer: { period: 'DAYS', length: 1 },
      });
      const byDate = new Map<string, number>();
      for (const g of groups) byDate.set(toLocalDate(new Date(g.startTime)), Math.round(g.result.COUNT_TOTAL ?? 0));
      return Array.from({ length: days }, (_, i) => {
        const date = addDays(todayDate, -(days - 1 - i));
        return { date, steps: byDate.get(date) ?? 0 };
      });
    } catch (err) {
      console.warn('Health Connect steps query failed', err);
      return [];
    }
  },

  getWeightSamples: async sinceDate => {
    try {
      if (!(await ready())) return [];
      const { records } = await readRecords('Weight', {
        timeRangeFilter: { operator: 'after', startTime: startOfDay(fromLocalDate(sinceDate)).toISOString() },
        ascendingOrder: true,
      });
      return records.map(r => ({
        externalId: r.metadata?.id ?? `${r.time}`,
        date: toLocalDate(new Date(r.time)),
        weightKg: r.weight.inKilograms,
        at: new Date(r.time).getTime(),
      }));
    } catch (err) {
      console.warn('Health Connect weight query failed', err);
      return [];
    }
  },

  saveWeight: async (weightKg, at) => {
    try {
      if (!(await ready())) return null;
      const ids = await insertRecords([{ recordType: 'Weight', time: at.toISOString(), weight: { value: weightKg, unit: 'kilograms' } }]);
      return ids[0] ?? null;
    } catch (err) {
      console.warn('Health Connect weight save failed', err);
      return null;
    }
  },
};
