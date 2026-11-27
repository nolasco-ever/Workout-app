import React from 'react';
import { View } from 'react-native';
import { LoggedSet, SessionExercise, SetTarget } from '../../../../data/models';
import { targetRepsLabel, targetWeightRange } from '../../../../data/engine/progression';
import { isCardio } from '../../../../data/engine/stats';
import { isWorkingSet } from '../../../../data/engine/sets';
import { formatDistance, formatDuration, formatWeight, toDisplayDistance, toDisplayWeight } from '../../../../data/engine/units';
import { getCatalogExercise } from '../../../../data/catalog/exerciseCatalog';
import { decodeRoute } from '../../../../data/engine/route';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard as Card } from '../../../../components/cards/SurfaceCard';
import { MuscleMap } from '../../../../components/anatomy/MuscleMap';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { RouteMap } from '../../../../components/maps/RouteMap';
import { useTheme } from '../../../../theme';
import { setLabel } from './SetRow';
import { Units, unitLabels } from './setDrafts';

/** The two logged values of a set as display text, by measurement. */
const setValues = (ex: SessionExercise, s: LoggedSet, u: Units): [string, string] => {
  switch (ex.measurement) {
    case 'weight_reps':
      return [s.weightKg === null ? '—' : String(toDisplayWeight(s.weightKg, u.weight)), s.reps === null ? '—' : String(s.reps)];
    case 'reps':
      return [s.weightKg ? `+${toDisplayWeight(s.weightKg, u.weight)}` : 'BW', s.reps === null ? '—' : String(s.reps)];
    case 'time':
      return [s.weightKg === null ? '—' : String(toDisplayWeight(s.weightKg, u.weight)), formatDuration(s.durationSec)];
    case 'distance_time':
      return [s.distanceM === null ? '—' : String(toDisplayDistance(s.distanceM, u.distance)), formatDuration(s.durationSec)];
  }
};

const weightLabel = (t: SetTarget, unit: 'kg' | 'lb'): string => {
  const range = targetWeightRange(t);
  if (!range) return formatWeight(null, unit);
  return range.min === range.max ? formatWeight(range.max, unit) : `${formatWeight(range.min, unit).replace(` ${unit}`, '')}–${formatWeight(range.max, unit)}`;
};

const describeTarget = (ex: SessionExercise, u: Units): string => {
  const t = ex.target;
  switch (ex.measurement) {
    case 'weight_reps':
      return `${t.sets} × ${targetRepsLabel(t)} @ ${weightLabel(t, u.weight)}`;
    case 'reps':
      return `${t.sets} × ${targetRepsLabel(t)}${targetWeightRange(t)?.max ? ` +${weightLabel(t, u.weight)}` : ''}`;
    case 'time':
      return `${t.sets} × ${formatDuration(t.durationSec)}`;
    case 'distance_time':
      return `${formatDistance(t.distanceM, u.distance)} in ${formatDuration(t.durationSec)}`;
  }
};

interface Props {
  ex: SessionExercise;
  units: Units;
  /** The sets that first broke a record; each gets a trophy. */
  recordSetIds?: ReadonlySet<string>;
  /** Route maps are on: say buddies see the map too. */
  routesShared?: boolean;
  /** In place of the logged sets: the edit table on the workout's page. */
  children?: React.ReactNode;
}

/**
 * One logged exercise, as the workout's page and the Workout done screen
 * show it (B22-15): its muscles, target, and only the sets that were done,
 * with a trophy on the set that broke a record. A skipped exercise says so.
 */
export const LoggedExerciseCard = ({ ex, units, recordSetIds, routesShared = false, children }: Props) => {
  const { colors, spacing, radius } = useTheme();
  const catalog = getCatalogExercise(ex.exerciseId);
  const labels = unitLabels(ex, units);
  const done = ex.sets.filter(s => s.completed);
  return (
    <Card style={{ padding: spacing.md, gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        {catalog && <MuscleMap primary={catalog.primaryMuscles} secondary={catalog.secondaryMuscles} height={56} views="auto" />}
        <View style={{ flex: 1 }}>
          <CustomText variant="bodyStrong">{ex.exerciseName}</CustomText>
          <CustomText variant="caption" color={colors.inkMuted}>
            {catalog?.primaryMuscles.join(', ')}{catalog?.primaryMuscles.length ? ' · ' : ''}target {describeTarget(ex, units)}
          </CustomText>
        </View>
      </View>
      {ex.skipped ? (
        <CustomText variant="label" color={colors.inkMuted}>Skipped · target stays for next time</CustomText>
      ) : children ?? (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs }}>
            <View style={{ width: 28 }} />
            <CustomText variant="overline" color={colors.inkMuted} style={{ flex: 1, textAlign: 'center' }}>{labels.a}</CustomText>
            <CustomText variant="overline" color={colors.inkMuted} style={{ flex: 1, textAlign: 'center' }}>{labels.b}</CustomText>
            <View style={{ width: 24 }} />
          </View>
          {/* Only what was done: an unlogged set has nothing to show (owner, 2026-11-27). */}
          {done.map(set => {
            const [a, b] = setValues(ex, set, units);
            const record = isWorkingSet(set) && !!recordSetIds?.has(set.id);
            return (
              <View
                key={set.id}
                accessible
                accessibilityLabel={`${isCardio(ex) ? '' : `Set ${setLabel(set)}, `}${a} ${labels.a}, ${b} ${labels.b}${record ? ', new record' : ''}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line }}
              >
                <View style={{ width: 28 }}>
                  {/* Cardio is one entry, not a numbered set. */}
                  {!isCardio(ex) && <CustomText variant="label" color={colors.inkMuted}>{setLabel(set)}</CustomText>}
                </View>
                <CustomText variant="bodyStrong" style={{ flex: 1, textAlign: 'center' }}>{a}</CustomText>
                <CustomText variant="bodyStrong" style={{ flex: 1, textAlign: 'center' }}>{b}</CustomText>
                <View style={{ width: 24, alignItems: 'center' }}>
                  {record && <Icon icon={generalIcons.trophy} color={colors.accent} size={18} weight="fill" />}
                </View>
              </View>
            );
          })}
        </View>
      )}
      {/* An outdoor run, walk or ride: the line marking the path taken (v1 #10.8). */}
      {isCardio(ex) && ex.sets[0]?.route && (
        <View style={{ height: 240, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, marginTop: spacing.xs }}>
          <RouteMap points={decodeRoute(ex.sets[0].route.line)} style={{ flex: 1 }} />
        </View>
      )}
      {/* Only while Route maps is on (v1 #10.9). */}
      {isCardio(ex) && ex.sets[0]?.route && routesShared && (
        <CustomText variant="caption" color={colors.inkMuted}>Buddies see this map too</CustomText>
      )}
    </Card>
  );
};
