import { BodyWeightEntry, Id } from '../models';
import { addDays, today } from '../engine/dates';
import { newId } from '../engine/ids';
import { healthService } from '../health';
import { bodyWeightRepository } from '../repositories/bodyWeightRepository';
import { userRepository } from '../repositories/userRepository';

const SOURCE = healthService.platformName === 'Apple Health' ? 'healthkit' : 'health_connect';

/** Ask for access and remember the answer on the profile. */
export const connectHealth = async (uid: Id): Promise<boolean> => {
  if (!(await healthService.isAvailable())) return false;
  const ok = await healthService.requestAccess();
  if (ok) await userRepository.update(uid, { healthConnectedAt: Date.now() });
  return ok;
};

export const disconnectHealth = (uid: Id) => userRepository.update(uid, { healthConnectedAt: null });

/**
 * Pull weigh-ins from the health store that the app hasn't seen. Entries are
 * matched by the store's sample id, so re-running is safe. Samples the app
 * itself wrote are skipped because their ids are already on our entries.
 */
export const importHealthWeights = async (uid: Id, existing: BodyWeightEntry[], daysBack = 365): Promise<number> => {
  const samples = await healthService.getWeightSamples(addDays(today(), -daysBack));
  const known = new Set(existing.map(e => e.externalId).filter(Boolean));
  const entries: BodyWeightEntry[] = samples
    .filter(s => !known.has(s.externalId))
    .map(s => ({
      id: newId(),
      ownerId: uid,
      date: s.date,
      weightKg: s.weightKg,
      source: SOURCE,
      externalId: s.externalId,
      createdAt: s.at,
      updatedAt: s.at,
    }));
  // A single batched write: saving one entry at a time made every live
  // listener (the Home tile, the history list) re-render per sample.
  if (entries.length) await bodyWeightRepository.saveMany(uid, entries);
  return entries.length;
};

/** Write an app weigh-in to the health store and record the sample id on the entry. */
export const pushWeightToHealth = async (uid: Id, entry: BodyWeightEntry): Promise<void> => {
  const at = new Date(entry.createdAt);
  const id = await healthService.saveWeight(entry.weightKg, at);
  if (id) await bodyWeightRepository.save(uid, { ...entry, externalId: id });
};
