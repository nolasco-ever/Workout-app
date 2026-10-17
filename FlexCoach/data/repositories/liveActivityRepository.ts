import { paths } from '../firebase/paths';
import { Id } from '../models';
import { LiveActivityState } from '../liveActivity/liveActivity';
import { removeDoc, writeDoc } from './base';

/**
 * What the server needs to update the workout's Live Activity while the app
 * sleeps: the activity's push token, the device's push token, and the state
 * to show when the rest runs out. A rest in progress sets `restEndsAt`; a
 * rest skipped or over clears it, and the workout's end removes the record.
 * Read by the restOverPush function.
 */
export interface LiveActivitySchedule {
  sessionId: Id;
  /** The Live Activity's push token, hex. */
  token: string;
  /** This phone's FCM registration token, which the push is addressed to. */
  deviceToken: string | null;
  /** The rest that is running, as its start time, so a late push for an earlier rest is ignored. */
  restId: string | null;
  restEndsAt: number | null;
  /** The state to show when the rest runs out: the next set, announced as rest over. */
  state: LiveActivityState | null;
  updatedAt: number;
}

export const liveActivityRepository = {
  // Firestore refuses `undefined`; the state's optional fields go in as absent.
  save: (uid: Id, schedule: LiveActivitySchedule): Promise<void> => writeDoc(paths.liveActivity(uid, schedule.sessionId), JSON.parse(JSON.stringify(schedule)) as LiveActivitySchedule),
  remove: (uid: Id, sessionId: Id): Promise<void> => removeDoc(paths.liveActivity(uid, sessionId)),
};
