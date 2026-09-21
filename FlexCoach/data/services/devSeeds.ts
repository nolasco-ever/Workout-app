import { Id } from '../models';
import { addDays, today } from '../engine/dates';
import { newId } from '../engine/ids';
import { lbToKg } from '../engine/units';
import { bodyWeightRepository } from '../repositories/bodyWeightRepository';

/** Development only: 21 days of plausible weigh-ins trending slightly down. */
export const seedSampleWeights = async (uid: Id): Promise<void> => {
  const now = Date.now();
  const start = lbToKg(181);
  for (let i = 20; i >= 0; i--) {
    const wobble = Math.sin(i * 1.7) * lbToKg(0.9);
    const weightKg = start - lbToKg((20 - i) * 0.12) + wobble;
    await bodyWeightRepository.save(uid, { id: newId(), ownerId: uid, date: addDays(today(), -i), weightKg, source: 'manual', createdAt: now - i, updatedAt: now - i });
  }
};
