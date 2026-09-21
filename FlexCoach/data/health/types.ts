import { LocalDate } from '../models';

export interface DailySteps {
  date: LocalDate;
  steps: number;
}

export interface HealthWeightSample {
  /** Stable id from the health store, used to avoid importing twice. */
  externalId: string;
  date: LocalDate;
  weightKg: number;
  /** Epoch ms of the sample. */
  at: number;
}

/**
 * Platform-neutral view of the phone's health store. iOS is HealthKit,
 * Android is Health Connect. Every call is best-effort: when the store is
 * unavailable or access was declined the reads return empty and the write
 * resolves false, so the app keeps working without it.
 */
export interface HealthService {
  readonly platformName: 'Apple Health' | 'Health Connect' | 'none';
  /** The store exists on this device and is usable. */
  isAvailable(): Promise<boolean>;
  /** Show the system permission sheet. Resolves true when the sheet completed. */
  requestAccess(): Promise<boolean>;
  /** Step totals per day for the last `days` days, oldest first, today last. */
  getDailySteps(days: number): Promise<DailySteps[]>;
  /** Body weight samples on or after `sinceDate`. */
  getWeightSamples(sinceDate: LocalDate): Promise<HealthWeightSample[]>;
  /** Write a weigh-in. Resolves the created sample's id, or null if not written. */
  saveWeight(weightKg: number, at: Date): Promise<string | null>;
}
