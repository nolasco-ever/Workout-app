import React, { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { SetTarget, WorkoutExercise, wantsWarmup } from '../../../../data/models';
import { findWorkout } from '../../../../data/engine/schedule';
import { suggestTarget, warmupRamp } from '../../../../data/engine/progression';
import { formatDistance, formatDuration, formatWeight } from '../../../../data/engine/units';
import { getCatalogExercise } from '../../../../data/catalog/exerciseCatalog';
import { today } from '../../../../data/engine/dates';
import { sessionRepository } from '../../../../data/repositories/sessionRepository';
import { startWorkoutNow } from '../../../../data/services/workoutService';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';
import { WorkoutStackParams } from '../WorkoutStack';
import { useTabScrollInset } from '../../../../navigation/useTabBarInset';
import { SurfaceCard as Card } from '../../../../components/cards/SurfaceCard';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';

const describeTarget = (entry: WorkoutExercise, t: SetTarget, unit: 'kg' | 'lb', dist: 'km' | 'mi'): string => {
  switch (entry.measurement) {
    case 'weight_reps': {
      const warmups = wantsWarmup(entry) && t.weightKg ? warmupRamp(t.weightKg).length : 0;
      return `${t.sets} × ${t.reps ?? '—'} @ ${formatWeight(t.weightKg, unit)}${warmups ? ` · ${warmups} warm-up${warmups === 1 ? '' : 's'}` : ''}`;
    }
    case 'reps':
      return `${t.sets} × ${t.reps ?? '—'}${t.weightKg ? ` +${formatWeight(t.weightKg, unit)}` : ''}`;
    case 'time':
      return `${t.sets} × ${formatDuration(t.durationSec)}`;
    case 'distance_time':
      return `${formatDistance(t.distanceM, dist)} in ${formatDuration(t.durationSec)}`;
  }
};

export const WorkoutPreviewScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<WorkoutStackParams>>();
  const { params } = useRoute<RouteProp<WorkoutStackParams, 'WorkoutPreviewScreen'>>();
  const { plan, cycle, occurrence } = params;
  const { colors, spacing } = useTheme();
  const bottomInset = useTabScrollInset();
  const { uid, profile } = useAuth();
  const workout = findWorkout(plan, occurrence.workoutId);
  const [targets, setTargets] = useState<Record<string, SetTarget>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!uid || !workout) return;
    let cancelled = false;
    sessionRepository.listCompleted(uid).then(history => {
      if (cancelled) return;
      const next: Record<string, SetTarget> = {};
      for (const entry of workout.exercises) {
        let last = null;
        for (let i = history.length - 1; i >= 0 && !last; i--) last = history[i].exercises.find(ex => ex.exerciseId === entry.exerciseId) ?? null;
        next[entry.id] = suggestTarget(entry, last);
      }
      setTargets(next);
    });
    return () => {
      cancelled = true;
    };
  }, [uid, workout]);

  if (!workout) return null;
  const unit = profile?.weightUnit ?? 'lb';
  const dist = profile?.distanceUnit ?? 'mi';
  const todayDate = today();
  const canStart = occurrence.status === 'scheduled';
  const startLabel = occurrence.date === todayDate ? 'Start workout' : occurrence.date > todayDate ? 'Do this workout today' : 'Do it today';

  const openTutorial = (entry: WorkoutExercise) => navigation.navigate('ExerciseDetailScreen', { exerciseId: entry.exerciseId });

  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: canStart ? spacing.lg : spacing.xl + bottomInset }}>
        <CustomText variant="caption" color={colors.inkMuted}>
          Suggested targets come from your last session of each exercise. You can change them as you go.
        </CustomText>
        <Card style={{ padding: 0 }}>
          {[...workout.exercises]
            .sort((a, b) => a.order - b.order)
            .map((entry, i) => {
              const ex = getCatalogExercise(entry.exerciseId);
              const t = targets[entry.id];
              return (
                <View key={entry.id} style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
                  <View style={{ flex: 1 }}>
                    <CustomText variant="bodyStrong">{entry.exerciseName}</CustomText>
                    <CustomText variant="caption" color={colors.inkMuted}>
                      {ex?.primaryMuscles.join(', ')}
                    </CustomText>
                    <CustomText variant="label" color={colors.accent} style={{ marginTop: spacing.xs }}>
                      {t ? describeTarget(entry, t, unit, dist) : `${entry.sets} sets`}
                    </CustomText>
                  </View>
                  <TouchableOpacity onPress={() => openTutorial(entry)} hitSlop={8}>
                    <Icon icon={generalIcons.info} color={colors.inkMuted} size={22} />
                  </TouchableOpacity>
                </View>
              );
            })}
        </Card>
      </ScrollView>
      {canStart && (
        <View style={{ padding: spacing.lg, paddingBottom: spacing.lg + bottomInset, gap: spacing.sm }}>
          {occurrence.date > todayDate && (
            <CustomText variant="caption" color={colors.inkMuted} centered>
              This swaps places with today's slot, so the rest of the cycle stays as planned.
            </CustomText>
          )}
          <PrimaryButton
            label={startLabel}
            icon={generalIcons.play}
            busy={busy}
            onPress={async () => {
              if (!uid) return;
              setBusy(true);
              try {
                const { session, cycle: updated } = await startWorkoutNow(uid, plan, cycle, occurrence, profile?.weightUnit ?? 'lb');
                navigation.replace('SessionScreen', { plan, cycle: updated, session });
              } finally {
                setBusy(false);
              }
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
};
