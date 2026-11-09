import { useEffect, useRef } from 'react';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { useWorkoutHome } from '../../../../data/hooks/useWorkoutHome';
import { beginMissedPrompt } from '../../../../data/services/workoutService';
import { navigationRef } from '../../../../navigation/navigationRef';

/**
 * Watches for a missed workout day and opens the Workout missed modal
 * (MissedWorkoutScreen, v1 #7) on the first open after it went by. The day
 * is handled as a whole. Only the most recent missed day is asked about;
 * older ones are skipped first. Shown once per missed day (flagged on its
 * occurrences). Mount once at the app root for signed-in accounts.
 */
export const MissedWorkoutPrompt = () => {
  const { uid } = useAuth();
  const home = useWorkoutHome();
  // One attempt per missed workout per launch, whatever the live cycle does meanwhile.
  const attempted = useRef<string | null>(null);

  const latest = home.overdue[home.overdue.length - 1];
  const candidateId = !home.loading && home.plan && home.cycle && !home.inProgressSession && !home.cycleFinished && latest && !latest.missedPromptedAt ? latest.id : null;

  useEffect(() => {
    if (!uid || !candidateId || !home.plan || !home.cycle || attempted.current === candidateId) return;
    attempted.current = candidateId;
    const plan = home.plan;
    const todayLeft = home.todayOccurrences.filter(o => o.status === 'scheduled').map(o => o.workoutName ?? 'a workout');
    const todayDate = home.todayDate;
    beginMissedPrompt(uid, home.cycle, todayDate)
      .then(result => {
        if (!result || !navigationRef.isReady()) return;
        navigationRef.navigate('MissedWorkoutScreen', { plan, cycle: result.cycle, ask: result.ask, skipped: result.skipped, todayDate, todaysNames: todayLeft.length ? todayLeft : null });
      })
      .catch(err => console.warn('missed prompt failed', err));
    // Only the candidate matters; the rest is read when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, candidateId]);

  return null;
};
