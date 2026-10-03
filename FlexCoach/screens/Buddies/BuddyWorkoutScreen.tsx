import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useAuth } from '../../data/auth/AuthProvider';
import { Activity, RecordKind, SharedExercise, SharedSet } from '../../data/models';
import { buddyRepository } from '../../data/repositories/buddyRepository';
import { getCatalogExercise } from '../../data/catalog/exerciseCatalog';
import { formatDuration, formatRecordValue, toDisplayDistance, toDisplayWeight } from '../../data/engine/units';
import { LineChart } from '../../components/charts/LineChart';
import { shortDate } from '../../components/charts/scale';
import { directionIcons } from '../../components/icons/icon-library';
import { MuscleMap } from '../../components/anatomy/MuscleMap';
import { reactToActivity } from '../../data/services/buddyService';
import { useBuddies } from '../../data/hooks/useBuddies';
import { CustomText } from '../../components/text/customText';
import { SurfaceCard } from '../../components/cards/SurfaceCard';
import { Avatar } from '../../components/buddies/Avatar';
import { Reactions } from '../../components/buddies/Reactions';
import { Icon } from '../../components/icons/Icon';
import { generalIcons } from '../../components/icons/icon-library';
import { useTheme } from '../../theme';
import { BuddyRoutes } from './routes';

const dateLine = (ts: number): string => new Date(ts).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

type Units = { weight: 'kg' | 'lb'; distance: 'km' | 'mi' };

/**
 * The columns a shared exercise can show: field A is weight (or distance
 * for cardio), field B is reps or time, each only when the owner shared
 * it. A set that carries neither still lists as a row, so the count shows.
 */
const columnsOf = (ex: SharedExercise, u: Units): { a: string | null; b: string | null } => {
  const sample = ex.sets?.find(set => !set.warmup) ?? ex.sets?.[0] ?? ex.top ?? {};
  const hasWeight = 'weightKg' in sample;
  const hasReps = 'reps' in sample;
  switch (ex.measurement) {
    case 'weight_reps':
      return { a: hasWeight ? u.weight : null, b: hasReps ? 'reps' : null };
    case 'reps':
      return { a: hasWeight ? `+${u.weight}` : null, b: hasReps ? 'reps' : null };
    case 'time':
      return { a: hasWeight ? u.weight : null, b: hasReps ? 'min : sec' : null };
    case 'distance_time':
      return { a: hasReps ? u.distance : null, b: hasReps ? 'min : sec' : null };
  }
};

/** A shared set's two values as display text, in the viewer's units; null when the owner hid that field. */
const sharedValues = (ex: SharedExercise, set: SharedSet, u: Units): [string | null, string | null] => {
  const weight = 'weightKg' in set ? (set.weightKg === null || set.weightKg === undefined ? '—' : String(toDisplayWeight(set.weightKg, u.weight))) : null;
  const reps = 'reps' in set ? (set.reps === null || set.reps === undefined ? '—' : String(set.reps)) : null;
  const time = 'durationSec' in set ? formatDuration(set.durationSec ?? null) : null;
  const distance = 'distanceM' in set ? (set.distanceM === null || set.distanceM === undefined ? '—' : String(toDisplayDistance(set.distanceM, u.distance))) : null;
  switch (ex.measurement) {
    case 'weight_reps':
      return [weight, reps];
    case 'reps':
      return ['weightKg' in set ? (set.weightKg ? `+${toDisplayWeight(set.weightKg, u.weight)}` : 'BW') : null, reps];
    case 'time':
      return [weight, time];
    case 'distance_time':
      return [distance, time];
  }
};

/** "185 lb × 8", "+25 lb × 10", "2:00", "1.2 mi in 10:30": the best set in one line. */
const topLine = (ex: SharedExercise, u: Units): string | null => {
  if (!ex.top) return null;
  const [a, b] = sharedValues(ex, ex.top, u);
  const cols = columnsOf(ex, u);
  const left = a && cols.a ? (ex.measurement === 'reps' ? a : `${a} ${cols.a}`) : null;
  const right = b && cols.b ? (cols.b === 'reps' ? `${b} reps` : b) : null;
  if (ex.measurement === 'distance_time') return left && right ? `${left} in ${right}` : left ?? right;
  return left && right ? `${left} × ${right}` : left ?? right;
};

/** Set rows numbered like the owner's own view: W1, W2 for warm-ups, then 1, 2, 3. */
const numbered = (sets: SharedSet[]): { set: SharedSet; label: string }[] => {
  let warm = 0;
  let work = 0;
  return sets.map(set => ({ set, label: set.warmup ? `W${++warm}` : String(++work) }));
};

/** Axis and tooltip text for a record graph, by kind, in the viewer's units. */
const recordFormat = (kind: RecordKind, u: Units) => (v: number): string => {
  switch (kind) {
    case 'weight':
      return String(Math.round((toDisplayWeight(v, u.weight) ?? 0) * 10) / 10);
    case 'reps':
      return String(Math.round(v));
    case 'duration':
      return formatDuration(v);
    case 'distance':
      return String(toDisplayDistance(v, u.distance));
  }
};

/**
 * One record of the workout: the exercise and the value, and on a tap the
 * exercise's history with the record ringed. A line that carries no
 * history (written before graphs existed, or the first time logged) just
 * shows the value.
 */
const RecordRow = ({ name, value, line, units, open, onToggle, divider }: { name: string; value: string; line: Activity | null; units: Units; open: boolean; onToggle: () => void; divider: boolean }) => {
  const { colors, spacing } = useTheme();
  const rec = line?.record ?? null;
  const points = rec?.history ?? [];
  const canOpen = !!rec;
  return (
    <View style={{ borderTopWidth: divider ? 1 : 0, borderTopColor: colors.line }}>
      <TouchableOpacity disabled={!canOpen} onPress={onToggle} activeOpacity={0.7} accessibilityRole={canOpen ? 'button' : undefined} accessibilityState={canOpen ? { expanded: open } : undefined} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }}>
        <Icon icon={generalIcons.trophy} size={18} color={colors.accent} />
        <CustomText variant="body" style={{ flex: 1 }} numberOfLines={1}>{name}</CustomText>
        <CustomText variant="bodyStrong" color={colors.accent}>{value}</CustomText>
        {canOpen && <Icon icon={open ? directionIcons.angleUp : directionIcons.angleDown} size={16} color={colors.inkMuted} />}
      </TouchableOpacity>
      {open && rec && (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.sm }}>
          {points.length >= 2 ? (
            <>
              <LineChart points={points} height={160} format={recordFormat(rec.kind, units)} highlight={{ date: rec.date, label: 'New record' }} />
              <CustomText variant="caption" color={colors.inkMuted}>
                Best {rec.kind === 'weight' ? 'weight' : rec.kind === 'reps' ? 'reps' : rec.kind === 'duration' ? 'time' : 'distance'} each session, {shortDate(points[0].date)} to {shortDate(points[points.length - 1].date)}.
              </CustomText>
            </>
          ) : (
            <CustomText variant="caption" color={colors.inkMuted}>First time logged, so no history to graph yet.</CustomText>
          )}
        </View>
      )}
    </View>
  );
};

/** One exercise of a buddy's workout, read-only, showing only what they shared. */
const SharedExerciseCard = ({ ex, units }: { ex: SharedExercise; units: Units }) => {
  const { colors, spacing } = useTheme();
  const catalog = ex.exerciseId ? getCatalogExercise(ex.exerciseId) : null;
  const cols = columnsOf(ex, units);
  const best = topLine(ex, units);
  return (
    <SurfaceCard style={{ padding: spacing.md, gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        {catalog && <MuscleMap primary={catalog.primaryMuscles} secondary={catalog.secondaryMuscles} height={56} views="auto" />}
        <View style={{ flex: 1 }}>
          <CustomText variant="bodyStrong">{ex.name}</CustomText>
          {catalog?.primaryMuscles.length ? <CustomText variant="caption" color={colors.inkMuted}>{catalog.primaryMuscles.join(', ')}</CustomText> : null}
          {best ? <CustomText variant="caption" color={colors.inkMuted}>Best set · {best}</CustomText> : null}
        </View>
      </View>
      {ex.sets && ex.sets.length > 0 && (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs }}>
            <View style={{ width: 28 }} />
            {cols.a && <CustomText variant="overline" color={colors.inkMuted} style={{ flex: 1, textAlign: 'center' }}>{cols.a}</CustomText>}
            {cols.b && <CustomText variant="overline" color={colors.inkMuted} style={{ flex: 1, textAlign: 'center' }}>{cols.b}</CustomText>}
            {!cols.a && !cols.b && <CustomText variant="overline" color={colors.inkMuted} style={{ flex: 1 }}>Done</CustomText>}
          </View>
          {numbered(ex.sets).map(({ set, label }, i) => {
            const [a, b] = sharedValues(ex, set, units);
            return (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line }}>
                <View style={{ width: 28 }}>
                  <CustomText variant="label" color={set.warmup ? colors.accent : colors.inkMuted}>{label}</CustomText>
                </View>
                {cols.a && <CustomText variant="bodyStrong" style={{ flex: 1, textAlign: 'center' }}>{a ?? '—'}</CustomText>}
                {cols.b && <CustomText variant="bodyStrong" style={{ flex: 1, textAlign: 'center' }}>{b ?? '—'}</CustomText>}
                {!cols.a && !cols.b && (
                  <View style={{ flex: 1 }}>
                    <Icon icon={generalIcons.check} size={16} color={colors.success} strokeWidth={3} />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </SurfaceCard>
  );
};

/**
 * One finished workout of a buddy's, opened from the feed or a push: what
 * they did (exercise by exercise, as far as they share it), the records
 * they set in it, and the reactions it has drawn. Only what the activity
 * line carries is shown; their sessions are never read.
 */
export const BuddyWorkoutScreen = () => {
  const { params } = useRoute<RouteProp<BuddyRoutes, 'BuddyWorkoutScreen'>>();
  const { colors, spacing } = useTheme();
  const { uid, profile } = useAuth();
  const { buddies } = useBuddies();
  const buddy = buddies.find(b => b.userId === params.uid) ?? null;
  const name = buddy?.card?.displayName ?? buddy?.displayName ?? params.displayName ?? 'Your buddy';
  const units: Units = { weight: profile?.weightUnit ?? 'lb', distance: profile?.distanceUnit ?? 'mi' };
  const [item, setItem] = useState<Activity | null | undefined>(undefined);
  // The record lines this workout wrote, for their graphs; a record line opened on its own is its own list.
  const [recordLines, setRecordLines] = useState<Activity[]>([]);
  const [openRecord, setOpenRecord] = useState<string | null>(params.focusRecordId ?? null);

  const load = useCallback(async () => {
    try {
      const line = await buddyRepository.getActivity(params.uid, params.activityId);
      setItem(line);
      if (line?.kind === 'record') {
        setRecordLines([line]);
        setOpenRecord(line.id);
      } else if (line?.sessionId) {
        const lines = await buddyRepository.listActivityForSession(params.uid, line.sessionId).catch(() => [] as Activity[]);
        setRecordLines(lines.filter(l => l.kind === 'record'));
      }
    } catch (err) {
      console.warn('buddy workout load failed', err);
      setItem(null);
    }
  }, [params.uid, params.activityId]);
  useEffect(() => {
    load();
  }, [load]);

  const react = (emoji: string | null) => {
    if (!uid || !item) return;
    const before = item;
    const reactions = { ...(item.reactions ?? {}) };
    if (emoji) reactions[uid] = { emoji, at: Date.now(), name: profile?.displayName ?? null };
    else delete reactions[uid];
    setItem({ ...item, reactions });
    reactToActivity({ uid, displayName: profile?.displayName ?? null }, item, emoji).catch(err => {
      console.warn('reaction failed', err);
      setItem(before);
    });
  };

  // Each record on the workout line paired with its own line (by exercise and
  // kind, falling back to the name for lines written before ids were kept).
  // A record line opened on its own is the one record.
  const records: { key: string; name: string; value: string; line: Activity | null }[] =
    item?.kind === 'record'
      ? [{ key: item.id, name: item.title.replace(/^New record: /, ''), value: item.record ? formatRecordValue(item.record.kind, item.record.value, units.weight, units.distance) : item.detail ?? '', line: item }]
      : (item?.records ?? []).map((r, i) => {
          const line =
            recordLines.find(l => l.record && r.exerciseId && l.record.exerciseId === r.exerciseId && l.record.kind === r.kind) ??
            recordLines.find(l => l.title === `New record: ${r.exerciseName}`) ??
            null;
          return { key: line?.id ?? `${r.exerciseName}-${i}`, name: r.exerciseName, value: r.value, line };
        });

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}>
        {item === undefined && <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />}
        {item === null && (
          <View style={{ marginTop: spacing.xxl, gap: spacing.sm }}>
            <CustomText variant="heading" centered>Not here any more</CustomText>
            <CustomText variant="body" color={colors.inkMuted} centered>This workout isn't in {name.split(' ')[0]}'s activity now.</CustomText>
          </View>
        )}
        {item && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Avatar uri={buddy?.card?.photoUrl ?? buddy?.photoUrl} name={name} size={48} />
              <View style={{ flex: 1 }}>
                <CustomText variant="heading">{item.title.replace(/^Finished /, '')}</CustomText>
                <CustomText variant="caption" color={colors.inkMuted}>
                  {name.split(' ')[0]} · {dateLine(item.at)}{item.detail ? ` · ${item.detail}` : ''}
                </CustomText>
              </View>
            </View>

            {/* The workout itself: as much of it as the owner shares. A private workout has no line at all; lines from before sharing existed carry nothing. */}
            {item.kind === 'workout_done' && (
            <View style={{ gap: spacing.sm }}>
              <CustomText variant="overline" color={colors.inkMuted}>Workout</CustomText>
              {item.exercises && item.exercises.length > 0 ? (
                item.exercises.map((ex, i) => <SharedExerciseCard key={`${ex.name}-${i}`} ex={ex} units={units} />)
              ) : (
                <SurfaceCard>
                  <CustomText variant="body" color={colors.inkMuted}>No details on this one.</CustomText>
                </SurfaceCard>
              )}
            </View>
            )}

            <View style={{ gap: spacing.sm }}>
              <CustomText variant="overline" color={colors.inkMuted}>Records</CustomText>
              <SurfaceCard style={{ padding: 0 }}>
                {records.length === 0 ? (
                  <View style={{ padding: spacing.lg }}>
                    <CustomText variant="body" color={colors.inkMuted}>No new records this time.</CustomText>
                  </View>
                ) : (
                  records.map((r, i) => (
                    <RecordRow key={r.key} name={r.name} value={r.value} line={r.line} units={units} open={openRecord === r.key} onToggle={() => setOpenRecord(openRecord === r.key ? null : r.key)} divider={i > 0} />
                  ))
                )}
              </SurfaceCard>
            </View>

            <View style={{ gap: spacing.sm }}>
              <CustomText variant="overline" color={colors.inkMuted}>Reactions</CustomText>
              <SurfaceCard>
                <Reactions reactions={item.reactions} myUid={uid} onReact={react} />
              </SurfaceCard>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
