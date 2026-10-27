import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Session, SessionExercise } from '../../../../data/models';
import { getCatalogExercise } from '../../../../data/catalog/exerciseCatalog';
import { isCardio } from '../../../../data/engine/stats';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons } from '../../../../components/icons/icon-library';
import { MuscleMap } from '../../../../components/anatomy/MuscleMap';
import { SwipeToDelete } from '../../../../components/list-items/SwipeToDelete';
import { useTheme } from '../../../../theme';

/**
 * The running workout at a glance: the progress strip, then every exercise
 * with how many sets are done, the current one marked. Tap one to jump to
 * it; extras swipe away. The sheet behind the session's title shows this on
 * a phone; on a wide window the session keeps it standing beside the
 * current exercise.
 */
/** Progress at a glance: one segment per exercise, green when all its sets are in, the current one in accent; the count beneath. */
export const SessionProgressStrip = ({ session, currentIndex }: { session: Session; currentIndex: number }) => {
  const { colors, spacing } = useTheme();
  // Cardio is not a set: the count is the lifting's alone.
  const lifting = session.exercises.filter(ex => !isCardio(ex));
  const completedSets = lifting.reduce((n, ex) => n + ex.sets.filter(s => s.completed).length, 0);
  const totalSets = lifting.reduce((n, ex) => n + ex.sets.length, 0);
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {session.exercises.map((ex, i) => {
          const done = ex.sets.length > 0 && ex.sets.every(s => s.completed);
          return <View key={ex.id} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: done ? colors.success : i === currentIndex ? colors.accent : colors.surfaceRaised }} />;
        })}
      </View>
      <CustomText variant="caption" color={colors.inkMuted}>
        {session.exercises.length === 0 ? 'No exercises yet' : `Exercise ${currentIndex + 1} of ${session.exercises.length}${totalSets > 0 ? ` · ${completedSets}/${totalSets} sets` : ''}`}
      </CustomText>
    </View>
  );
};

export const SessionExerciseList = ({ session, currentIndex, onJump, onRemove }: { session: Session; currentIndex: number; onJump: (index: number) => void; onRemove: (ex: SessionExercise) => void }) => {
  const { colors, spacing } = useTheme();
  const groups = [
    { key: 'planned', label: null as string | null, items: session.exercises.map((ex, i) => ({ ex, i })).filter(({ ex }) => ex.workoutExerciseId !== null) },
    { key: 'added', label: 'Additional exercises' as string | null, items: session.exercises.map((ex, i) => ({ ex, i })).filter(({ ex }) => ex.workoutExerciseId === null) },
  ].filter(g => g.items.length > 0);

  return (
    <>
      <SessionProgressStrip session={session} currentIndex={currentIndex} />
      {groups.map(group => (
        <View key={group.key} style={{ gap: spacing.sm }}>
          {group.label && <CustomText variant="overline" color={colors.inkMuted}>{group.label}</CustomText>}
          <SurfaceCard style={{ padding: 0, overflow: 'hidden' }}>
            {group.items.map(({ ex, i }, rowIndex) => {
              const cat = getCatalogExercise(ex.exerciseId);
              const done = ex.sets.filter(s => s.completed).length;
              const complete = ex.sets.length > 0 && done === ex.sets.length;
              const current = i === currentIndex;
              const row = (
                <TouchableOpacity
                  onPress={() => onJump(i)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${ex.exerciseName}, ${isCardio(ex) ? (complete ? 'logged' : 'not logged') : `${done} of ${ex.sets.length} sets`}${current ? ', current' : ''}`}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md, borderTopWidth: rowIndex ? 1 : 0, borderTopColor: colors.line, backgroundColor: current ? colors.accentTint : colors.surface }}
                >
                  {cat && <MuscleMap primary={cat.primaryMuscles} secondary={cat.secondaryMuscles} height={56} views="auto" />}
                  <View style={{ flex: 1 }}>
                    <CustomText variant="bodyStrong">{ex.exerciseName}</CustomText>
                    {cat?.primaryMuscles.length ? <CustomText variant="caption" color={colors.inkMuted}>{cat.primaryMuscles.join(', ')}</CustomText> : null}
                    <CustomText variant="label" color={complete ? colors.success : current ? colors.accent : colors.inkMuted} style={{ marginTop: spacing.xs }}>
                      {isCardio(ex) ? (complete ? 'Logged' : 'Not logged yet') : `${done} of ${ex.sets.length} sets completed`}
                    </CustomText>
                  </View>
                  <Icon icon={directionIcons.angleRight} color={colors.inactive} size={18} />
                </TouchableOpacity>
              );
              // Only extras can be swiped away; the plan's own exercises stay.
              return group.key === 'added' && session.exercises.length > 1 ? (
                <SwipeToDelete key={ex.id} label="Remove" onDelete={() => onRemove(ex)}>
                  {row}
                </SwipeToDelete>
              ) : (
                <View key={ex.id}>{row}</View>
              );
            })}
          </SurfaceCard>
        </View>
      ))}
    </>
  );
};
