import React from 'react';
import { View } from 'react-native';
import { MuscleGroup } from '../../../../data/models';
import { MuscleMap } from '../../../../components/anatomy/MuscleMap';
import { useTheme } from '../../../../theme';
import { MuscleRow } from './MuscleRow';

interface Props {
  /** Muscles with their working sets, most first. */
  muscles: { muscle: string; sets: number }[];
  /** Rows to list; all of them when left out. */
  limit?: number;
  /** Rows beside the body rather than under it, on a wider window. */
  beside?: boolean;
  /** Opens a muscle's detail; without it the rows are plain, with no chevron (the Workout done screen). */
  onPressMuscle?: (muscle: string) => void;
}

/**
 * The body with the muscles worked, then each muscle and its sets: Home's
 * last 30 days and one workout on the Workout done screen (B22-15). The
 * busiest six fill the body, the rest show lighter.
 */
export const MusclesBody = ({ muscles, limit, beside = false, onPressMuscle }: Props) => {
  const { colors, spacing } = useTheme();
  const coverage = muscles.map(m => m.muscle as MuscleGroup);
  return (
    <View style={beside ? { flexDirection: 'row', alignItems: 'center', gap: spacing.lg } : undefined}>
      <View style={{ alignItems: 'center', marginBottom: beside ? 0 : spacing.sm }}>
        <MuscleMap primary={coverage.slice(0, 6)} secondary={coverage.slice(6)} height={170} />
      </View>
      <View style={beside ? { flex: 1 } : undefined}>
        {muscles.slice(0, limit ?? muscles.length).map((m, i) => (
          <View key={m.muscle} style={{ borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
            <MuscleRow muscle={m.muscle} sets={m.sets} onPress={onPressMuscle ? () => onPressMuscle(m.muscle) : undefined} />
          </View>
        ))}
      </View>
    </View>
  );
};
