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
 * it; extras swipe away, plan exercises swipe to Skipped and back (build 22). The sheet behind the session's title shows this on
 * a phone; on a wide window the session keeps it standing beside the
 * current exercise.
 */
/**
 * Progress at a glance: one segment per exercise, green when all its sets are in, the current one in the data colour,
 * a skipped one a dashed outline; the count beneath leaves skipped ones out.
 */
export const SessionProgressStrip = ({ session, currentIndex }: { session: Session; currentIndex: number }) => {
  const { colors, spacing } = useTheme();
  const kept = session.exercises.filter(ex => !ex.skipped);
  const skippedCount = session.exercises.length - kept.length;
  const position = kept.indexOf(session.exercises[currentIndex]);
  // Cardio is not a set: the count is the lifting's alone.
  const lifting = kept.filter(ex => !isCardio(ex));
  const completedSets = lifting.reduce((n, ex) => n + ex.sets.filter(s => s.completed).length, 0);
  const totalSets = lifting.reduce((n, ex) => n + ex.sets.length, 0);
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {session.exercises.map((ex, i) => {
          if (ex.skipped) return <View key={ex.id} style={{ flex: 1, height: 4, borderRadius: 2, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.inactive }} />;
          const done = ex.sets.length > 0 && ex.sets.every(s => s.completed);
          return <View key={ex.id} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: done ? colors.success : i === currentIndex ? colors.data : colors.surfaceRaised }} />;
        })}
      </View>
      <CustomText variant="caption" color={colors.inkMuted}>
        {session.exercises.length === 0
          ? 'No exercises yet'
          : [
              ...(position === -1 ? [] : [`Exercise ${position + 1} of ${kept.length}`]),
              ...(totalSets > 0 ? [`${completedSets}/${totalSets} sets`] : []),
              ...(skippedCount > 0 ? [`${skippedCount} skipped`] : []),
            ].join(' · ')}
      </CustomText>
    </View>
  );
};

interface ListProps {
  session: Session;
  currentIndex: number;
  onJump: (index: number) => void;
  onRemove: (ex: SessionExercise) => void;
  onSkip: (ex: SessionExercise) => void;
  onUnskip: (ex: SessionExercise) => void;
}

export const SessionExerciseList = ({ session, currentIndex, onJump, onRemove, onSkip, onUnskip }: ListProps) => {
  const { colors, spacing } = useTheme();
  const all = session.exercises.map((ex, i) => ({ ex, i }));
  const groups = [
    { key: 'planned', label: null as string | null, items: all.filter(({ ex }) => ex.workoutExerciseId !== null && !ex.skipped) },
    { key: 'added', label: 'Additional exercises' as string | null, items: all.filter(({ ex }) => ex.workoutExerciseId === null && !ex.skipped) },
    { key: 'skipped', label: 'Skipped' as string | null, items: all.filter(({ ex }) => ex.skipped) },
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
              if (group.key === 'skipped') {
                // Not a way to the exercise: it was skipped. A swipe (or the screen reader's action) brings it back.
                return (
                  <SwipeToDelete key={ex.id} kind="unskip" label={`Unskip ${ex.exerciseName}`} onDelete={() => onUnskip(ex)}>
                    <View
                      accessible
                      accessibilityLabel={`${ex.exerciseName}, skipped`}
                      accessibilityActions={[{ name: 'unskip', label: 'Unskip' }]}
                      onAccessibilityAction={() => onUnskip(ex)}
                      style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md, borderTopWidth: rowIndex ? 1 : 0, borderTopColor: colors.line, backgroundColor: colors.surface }}
                    >
                      {cat && <View style={{ opacity: 0.45 }}><MuscleMap primary={cat.primaryMuscles} secondary={cat.secondaryMuscles} height={56} views="auto" /></View>}
                      <View style={{ flex: 1 }}>
                        <CustomText variant="bodyStrong" color={colors.inkMuted}>{ex.exerciseName}</CustomText>
                        {cat?.primaryMuscles.length ? <CustomText variant="caption" color={colors.inkMuted}>{cat.primaryMuscles.join(', ')}</CustomText> : null}
                        <CustomText variant="label" color={colors.inkMuted} style={{ marginTop: spacing.xs }}>Skipped · target stays for next time</CustomText>
                      </View>
                    </View>
                  </SwipeToDelete>
                );
              }
              const row = (
                <TouchableOpacity
                  onPress={() => onJump(i)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${ex.exerciseName}, ${isCardio(ex) ? (complete ? 'logged' : 'not logged') : `${done} of ${ex.sets.length} sets`}${current ? ', current' : ''}`}
                  accessibilityActions={group.key === 'planned' ? [{ name: 'skip', label: 'Skip' }] : undefined}
                  onAccessibilityAction={group.key === 'planned' ? () => onSkip(ex) : undefined}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md, borderTopWidth: rowIndex ? 1 : 0, borderTopColor: colors.line, backgroundColor: current ? colors.selectedTint : colors.surface }}
                >
                  {cat && <MuscleMap primary={cat.primaryMuscles} secondary={cat.secondaryMuscles} height={56} views="auto" />}
                  <View style={{ flex: 1 }}>
                    <CustomText variant="bodyStrong">{ex.exerciseName}</CustomText>
                    {cat?.primaryMuscles.length ? <CustomText variant="caption" color={colors.inkMuted}>{cat.primaryMuscles.join(', ')}</CustomText> : null}
                    <CustomText variant="label" color={complete ? colors.success : current ? colors.ink : colors.inkMuted} style={{ marginTop: spacing.xs }}>
                      {isCardio(ex) ? (complete ? 'Logged' : 'Not logged yet') : `${done} of ${ex.sets.length} sets completed`}
                    </CustomText>
                  </View>
                  <Icon icon={directionIcons.angleRight} color={colors.inactive} size={18} />
                </TouchableOpacity>
              );
              // Extras swipe away; the plan's own exercises swipe to Skipped, every one of them if need be (owner, 2026-11-25).
              if (group.key === 'planned') {
                return (
                  <SwipeToDelete key={ex.id} kind="skip" label={`Skip ${ex.exerciseName}`} onDelete={() => onSkip(ex)}>
                    {row}
                  </SwipeToDelete>
                );
              }
              return session.exercises.length > 1 ? (
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
