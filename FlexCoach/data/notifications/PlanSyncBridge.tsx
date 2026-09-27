import { usePlanSync } from '../hooks/usePlanSync';

/** Renders nothing; follows the signed-in user's synced buddy plans. */
export const PlanSyncBridge = () => {
  usePlanSync();
  return null;
};
