import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { LoggedSet } from '../../../../data/models';
import { formatDuration } from '../../../../data/engine/units';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { SelectAllTextInput } from '../../../../components/inputs/SelectAllTextInput';
import { useTheme } from '../../../../theme';
import { SetDraft } from './SetRow';
import { useTick } from './SessionHeader';

/** A running stopwatch: when it was started and the seconds it already had. */
export interface CardioTimer {
  startedAt: number;
  baseSec: number;
}

/** Seconds on the clock right now. */
export const timerElapsed = (timer: CardioTimer, now: number = Date.now()): number => timer.baseSec + Math.max(0, Math.round((now - timer.startedAt) / 1000));

interface Props {
  set: LoggedSet;
  /** Distance for cardio, weight for a timed hold; the text the user types. */
  draft: SetDraft;
  /** Unit under the small field: mi, km, lb, kg. */
  unitLabel: string;
  /** The stopwatch while it runs for this set, else null. */
  timer: CardioTimer | null;
  /** The plan's time for this effort. With one the clock counts down to it; without, it counts up. */
  targetSec: number | null;
  onChange: (draft: SetDraft) => void;
  onStart: () => void;
  onStop: () => void;
  onToggleDone: () => void;
}

/**
 * A timed or cardio exercise as one card, no sets: a big stopwatch that
 * only the timer can fill, the distance (or added weight) typed
 * underneath, and Start / Stop / Resume with a check to log it. The
 * exercise's single set holds the numbers.
 */
export const CardioSetCard = ({ set, draft, unitLabel, timer, targetSec, onChange, onStart, onStop, onToggleDone }: Props) => {
  const { colors, radius, spacing, fonts } = useTheme();
  const running = timer !== null;
  useTick(running ? 1000 : 0);
  const done = set.completed;
  const seconds = running ? timerElapsed(timer) : Math.max(0, Math.round(Number(draft.b) || 0));
  const started = running || seconds > 0;
  // Counting down: the big clock is what is left, elapsed sits underneath.
  // Once the target is reached (or logged) the big clock is the elapsed time.
  const countdown = targetSec !== null && !done && seconds < targetSec;
  const reached = targetSec !== null && !done && seconds >= targetSec;
  const clock = countdown ? targetSec - seconds : seconds;
  const clockColor = done || reached ? colors.success : started ? colors.ink : colors.inactive;
  const caption = countdown ? `Elapsed ${formatDuration(seconds)}` : reached ? `Target ${formatDuration(targetSec)} reached` : null;
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: spacing.lg, gap: spacing.lg, opacity: done ? 0.85 : 1 }}>
      <CustomText
        accessibilityLabel={`${countdown ? 'Time left' : 'Time'} ${formatDuration(clock)}${running ? ', running' : ''}`}
        color={clockColor}
        centered
        style={{ fontFamily: fonts.display.bold, fontSize: 64, lineHeight: 72, letterSpacing: -1, fontVariant: ['tabular-nums'] }}
      >
        {formatDuration(clock)}
      </CustomText>
      {caption && (
        <CustomText variant="caption" color={reached ? colors.success : colors.inkMuted} centered style={{ marginTop: -spacing.md, fontVariant: ['tabular-nums'] }}>
          {caption}
        </CustomText>
      )}
      <View style={{ alignItems: 'center' }}>
        <SelectAllTextInput
          id={`set-${set.id}-a`}
          value={draft.a}
          onChangeText={a => onChange({ ...draft, a })}
          keyboardType="decimal-pad"
          editable={!done}
          placeholder="—"
          placeholderTextColor={colors.inactive}
          accessibilityLabel={unitLabel}
          style={{
            fontFamily: fonts.body.semibold,
            fontSize: 22,
            color: colors.ink,
            backgroundColor: done ? colors.transparent : colors.surfaceRaised,
            borderRadius: radius.sm,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.lg,
            minWidth: 120,
            textAlign: 'center',
          }}
        />
        <CustomText variant="caption" color={colors.inkMuted} centered style={{ marginTop: spacing.xs }}>
          {unitLabel}
        </CustomText>
      </View>
      {done ? (
        <TouchableOpacity
          onPress={onToggleDone}
          accessibilityRole="button"
          accessibilityLabel="Logged, tap to undo"
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.md, paddingVertical: spacing.md + 2, backgroundColor: colors.success }}
        >
          <Icon icon={generalIcons.check} color={colors.onAccent} size={18} strokeWidth={3} />
          <CustomText variant="label" color={colors.onAccent}>Logged</CustomText>
        </TouchableOpacity>
      ) : (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            {running ? (
              <PrimaryButton label="Stop" icon={generalIcons.square} variant="outline" onPress={onStop} />
            ) : (
              <PrimaryButton label={seconds > 0 ? 'Resume' : 'Start timer'} icon={generalIcons.play} variant={seconds > 0 ? 'outline' : 'filled'} onPress={onStart} />
            )}
          </View>
          <TouchableOpacity
            onPress={onToggleDone}
            accessibilityRole="button"
            accessibilityLabel="Log set"
            style={{ width: 56, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surfaceRaised }}
          >
            <Icon icon={generalIcons.check} color={colors.inkMuted} size={22} strokeWidth={3} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
