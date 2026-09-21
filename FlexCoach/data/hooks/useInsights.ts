import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { BodyWeightEntry, PersonalRecord, Session } from '../models';
import { addDays, today } from '../engine/dates';
import { currentStreakDays, findPersonalRecords } from '../engine/stats';
import { muscleBreakdown, MuscleBreakdown, thisWeekSummary, weeklySeries, weightChangeSince, weightSeries, WeekPoint, WeekSummary, WeightPoint } from '../engine/insights';
import { getCatalogExercise } from '../catalog/exerciseCatalog';
import { sessionRepository } from '../repositories/sessionRepository';
import { bodyWeightRepository } from '../repositories/bodyWeightRepository';
import { useWorkoutHome } from './useWorkoutHome';

export interface Insights {
  loading: boolean;
  todayDate: string;
  sessions: Session[];
  streakDays: number;
  week: WeekSummary;
  weeks: WeekPoint[];
  muscles30d: MuscleBreakdown[];
  /** Scheduled workouts still to come this week. */
  weekRemaining: number;
  /** Completed session dated today, if any. */
  todaySession: Session | null;
  recentRecords: PersonalRecord[];
  weightEntries: BodyWeightEntry[];
  weight: WeightPoint[];
  weightChangeCycle: number | null;
  weightChange30d: number | null;
}

/** Everything the Home tab shows, derived live from sessions and body weight. */
export const useInsights = (): Insights => {
  const { uid } = useAuth();
  const home = useWorkoutHome();
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [weightEntries, setWeightEntries] = useState<BodyWeightEntry[] | null>(null);

  useEffect(() => {
    if (!uid) return;
    // Sessions are read once per mount and refreshed when an in-progress
    // session changes, which is when new data appears.
    let cancelled = false;
    sessionRepository.listAll(uid).then(list => {
      if (!cancelled) setSessions(list);
    });
    return () => {
      cancelled = true;
    };
  }, [uid, home.inProgressSession?.id, home.cycle?.updatedAt]);

  useEffect(() => {
    if (!uid) return;
    return bodyWeightRepository.watch(uid, setWeightEntries);
  }, [uid]);

  const todayDate = today();

  return useMemo(() => {
    const all = sessions ?? [];
    const completed = all.filter(s => s.status === 'completed');
    const weekStartDate = addDays(todayDate, -((new Date(todayDate).getDay() + 6) % 7));
    const weekOcc = home.cycle ? home.cycle.occurrences.filter(o => o.status !== 'rest' && o.date >= weekStartDate && o.date <= addDays(weekStartDate, 6)) : [];
    const scheduledThisWeek = weekOcc.length;
    const weekRemaining = weekOcc.filter(o => o.status === 'scheduled' && o.date >= todayDate).length;
    const since30 = addDays(todayDate, -30);
    const last30 = completed.filter(s => s.date >= since30);
    const muscles30d = muscleBreakdown(last30, id => getCatalogExercise(id)?.primaryMuscles ?? []);
    const todaySession = completed.filter(s => s.date === todayDate).sort((a, b) => b.startedAt - a.startedAt)[0] ?? null;
    const since60 = addDays(todayDate, -60);
    const recent = completed.filter(s => s.date >= since60);
    const older = completed.filter(s => s.date < since60);
    const recentRecords = findPersonalRecords(recent, older).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);
    const weight = weightSeries(weightEntries ?? []);
    return {
      loading: sessions === null || weightEntries === null || home.loading,
      todayDate,
      sessions: all,
      streakDays: currentStreakDays(completed, todayDate, addDays),
      week: thisWeekSummary(completed, scheduledThisWeek, todayDate),
      weeks: weeklySeries(completed, todayDate, 8),
      muscles30d,
      weekRemaining,
      todaySession,
      recentRecords,
      weightEntries: weightEntries ?? [],
      weight,
      weightChangeCycle: home.cycle ? weightChangeSince(weight, home.cycle.startDate) : null,
      weightChange30d: weightChangeSince(weight, since30),
    };
  }, [sessions, weightEntries, todayDate, home.cycle, home.loading]);
};
