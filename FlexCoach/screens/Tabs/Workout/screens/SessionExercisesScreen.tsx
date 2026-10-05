import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Session, SessionExercise } from '../../../../data/models';
import { getCatalogExercise } from '../../../../data/catalog/exerciseCatalog';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { HeaderButton } from '../../../../components/headers/HeaderButton';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../../components/icons/icon-library';
import { MuscleMap } from '../../../../components/anatomy/MuscleMap';
import { SwipeToDelete } from '../../../../components/list-items/SwipeToDelete';
import { useTheme } from '../../../../theme';
import { WorkoutStackParams } from '../WorkoutStack';
import { currentSession, sendSessionCommand, subscribeSession } from '../components/sessionChannel';

/**
 * The running workout at a glance, opened from the session's title: the
 * progress strip, then every exercise with how many sets are done, the
 * current one marked. Tap one to
 * jump to it; the plus in the header adds an extra exercise (the picker
 * opens above this screen and comes back to it); extras swipe away.
 */
export const SessionExercisesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<WorkoutStackParams>>();
  const { params } = useRoute<RouteProp<WorkoutStackParams, 'SessionExercisesScreen'>>();
  const { colors, spacing } = useTheme();
  const [session, setSession] = useState<Session | null>(currentSession);
  useEffect(() => subscribeSession(setSession), []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderButton
          icon={generalIcons.plus}
          accessibilityLabel="Add exercise"
          onPress={() => navigation.navigate('ExercisePickerScreen', { mode: 'session', excludeIds: (currentSession()?.exercises ?? []).map(e => e.exerciseId) })}
        />
      ),
    });
  }, [navigation]);

  if (!session) return null;
  const completedSets = session.exercises.reduce((n, ex) => n + ex.sets.filter(s => s.completed).length, 0);
  const totalSets = session.exercises.reduce((n, ex) => n + ex.sets.length, 0);
  const jump = (index: number) => {
    sendSessionCommand({ kind: 'jump', index });
    navigation.goBack();
  };
  const remove = (ex: SessionExercise) => sendSessionCommand({ kind: 'remove', sessionExerciseId: ex.id });

  const groups = [
    { key: 'planned', label: null as string | null, items: session.exercises.map((ex, i) => ({ ex, i })).filter(({ ex }) => ex.workoutExerciseId !== null) },
    { key: 'added', label: 'Additional exercises' as string | null, items: session.exercises.map((ex, i) => ({ ex, i })).filter(({ ex }) => ex.workoutExerciseId === null) },
  ].filter(g => g.items.length > 0);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl }}>
        {/* Progress at a glance: one segment per exercise, green when all its sets are in, the current one in accent. */}
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {session.exercises.map((ex, i) => {
              const done = ex.sets.length > 0 && ex.sets.every(s => s.completed);
              return <View key={ex.id} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: done ? colors.success : i === params.currentIndex ? colors.accent : colors.surfaceRaised }} />;
            })}
          </View>
          <CustomText variant="caption" color={colors.inkMuted}>
            {session.exercises.length === 0 ? 'No exercises yet' : `Exercise ${params.currentIndex + 1} of ${session.exercises.length} · ${completedSets}/${totalSets} sets`}
          </CustomText>
        </View>
        {groups.map(group => (
          <View key={group.key} style={{ gap: spacing.sm }}>
            {group.label && <CustomText variant="overline" color={colors.inkMuted}>{group.label}</CustomText>}
            <SurfaceCard style={{ padding: 0, overflow: 'hidden' }}>
              {group.items.map(({ ex, i }, rowIndex) => {
                const cat = getCatalogExercise(ex.exerciseId);
                const done = ex.sets.filter(s => s.completed).length;
                const complete = ex.sets.length > 0 && done === ex.sets.length;
                const current = i === params.currentIndex;
                const row = (
                  <TouchableOpacity
                    onPress={() => jump(i)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`${ex.exerciseName}, ${done} of ${ex.sets.length} sets${current ? ', current' : ''}`}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md, borderTopWidth: rowIndex ? 1 : 0, borderTopColor: colors.line, backgroundColor: current ? colors.accentTint : colors.surface }}
                  >
                    {cat && <MuscleMap primary={cat.primaryMuscles} secondary={cat.secondaryMuscles} height={56} views="auto" />}
                    <View style={{ flex: 1 }}>
                      <CustomText variant="bodyStrong">{ex.exerciseName}</CustomText>
                      {cat?.primaryMuscles.length ? <CustomText variant="caption" color={colors.inkMuted}>{cat.primaryMuscles.join(', ')}</CustomText> : null}
                      <CustomText variant="label" color={complete ? colors.success : current ? colors.accent : colors.inkMuted} style={{ marginTop: spacing.xs }}>
                        {done} of {ex.sets.length} sets completed
                      </CustomText>
                    </View>
                    <Icon icon={directionIcons.angleRight} color={colors.inactive} size={18} />
                  </TouchableOpacity>
                );
                // Only extras can be swiped away; the plan's own exercises stay.
                return group.key === 'added' && session.exercises.length > 1 ? (
                  <SwipeToDelete key={ex.id} label="Remove" onDelete={() => remove(ex)}>
                    {row}
                  </SwipeToDelete>
                ) : (
                  <View key={ex.id}>{row}</View>
                );
              })}
            </SurfaceCard>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};
