import {
  isHealthDataAvailable,
  queryQuantitySamples,
  queryStatisticsCollectionForQuantity,
  requestAuthorization,
  saveQuantitySample,
} from '@kingstinct/react-native-healthkit';
import { addDays, fromLocalDate, toLocalDate, today } from '../engine/dates';
import { HealthService } from './types';

const STEPS = 'HKQuantityTypeIdentifierStepCount' as const;
const BODY_MASS = 'HKQuantityTypeIdentifierBodyMass' as const;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Apple Health via HealthKit. Works on the simulator's Health app too. */
export const healthService: HealthService = {
  platformName: 'Apple Health',

  isAvailable: async () => {
    try {
      return isHealthDataAvailable();
    } catch {
      return false;
    }
  },

  requestAccess: async () => {
    try {
      return await requestAuthorization({ toRead: [STEPS, BODY_MASS], toShare: [BODY_MASS] });
    } catch (err) {
      console.warn('HealthKit authorization failed', err);
      return false;
    }
  },

  getDailySteps: async days => {
    const todayDate = today();
    const from = startOfDay(fromLocalDate(addDays(todayDate, -(days - 1))));
    const to = new Date();
    try {
      const buckets = await queryStatisticsCollectionForQuantity(STEPS, ['cumulativeSum'], from, { day: 1 }, {
        filter: { date: { startDate: from, endDate: to } },
        unit: 'count',
      });
      const byDate = new Map<string, number>();
      for (const b of buckets) {
        if (!b.startDate) continue;
        byDate.set(toLocalDate(new Date(b.startDate)), Math.round(b.sumQuantity?.quantity ?? 0));
      }
      return Array.from({ length: days }, (_, i) => {
        const date = addDays(todayDate, -(days - 1 - i));
        return { date, steps: byDate.get(date) ?? 0 };
      });
    } catch (err) {
      console.warn('HealthKit steps query failed', err);
      return [];
    }
  },

  getWeightSamples: async sinceDate => {
    try {
      const samples = await queryQuantitySamples(BODY_MASS, {
        filter: { date: { startDate: startOfDay(fromLocalDate(sinceDate)) } },
        unit: 'kg',
        limit: 0,
        ascending: true,
      });
      return samples.map(s => ({
        externalId: s.uuid,
        date: toLocalDate(new Date(s.startDate)),
        weightKg: s.quantity,
        at: new Date(s.startDate).getTime(),
      }));
    } catch (err) {
      console.warn('HealthKit weight query failed', err);
      return [];
    }
  },

  saveWeight: async (weightKg, at) => {
    try {
      const sample = await saveQuantitySample(BODY_MASS, 'kg', weightKg, at, at);
      return sample?.uuid ?? null;
    } catch (err) {
      console.warn('HealthKit weight save failed', err);
      return null;
    }
  },
};
