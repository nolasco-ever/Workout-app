import { HealthService } from './types';

/** Fallback for platforms without a health store (web, tests). */
export const healthService: HealthService = {
  platformName: 'none',
  isAvailable: async () => false,
  requestAccess: async () => false,
  needsAccessRequest: async () => false,
  getDailySteps: async () => [],
  getWeightSamples: async () => [],
  saveWeight: async () => null,
};
