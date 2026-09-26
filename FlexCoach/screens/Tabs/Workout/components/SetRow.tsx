import React from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { LoggedSet, MeasurementType } from '../../../../data/models';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';
import { DurationInput } from '../../../../components/inputs/DurationInput';

export interface SetDraft {
  a: string;
  b: string;
}

interface Props {
  set: LoggedSet;
  measurement: MeasurementType;
  draft: SetDraft;
  unitLabels: { a: string; b: string };
  onChange: (draft: SetDraft) => void;
  onToggleDone: () => void;
  /** Keep the fields editable even for completed sets, for fixing a logged session afterwards. */
  alwaysEditable?: boolean;
}

/**
 * One editable set. Field A and B mean different things by measurement:
 * weight/reps, added weight/reps, weight/seconds, or distance/seconds.
 */
export const SetRow = ({ set, measurement, draft, unitLabels, onChange, onToggleDone, alwaysEditable = false }: Props) => {
  const { colors, radius, spacing, fonts } = useTheme();
  const done = set.completed;
  const editable = alwaysEditable || !done;
  // Each input has a unit caption under it, so the input's centre sits half a
  // caption above the row's. The set number and the check take the same
  // offset so they line up with the boxes rather than the column.
  const captionHeight = 16;
  const showA = measurement !== 'reps' || true; // reps-only still allows added weight
  const timed = measurement === 'time' || measurement === 'distance_time';
  const inputStyle = {
    fontFamily: fonts.body.semibold,
    fontSize: 18,
    color: colors.ink,
    backgroundColor: editable ? colors.surfaceRaised : colors.transparent,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 76,
    textAlign: 'center' as const,
  };
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
        opacity: done && !alwaysEditable ? 0.75 : 1,
      }}
    >
      <View style={{ width: 28, marginBottom: captionHeight }}>
        <CustomText variant="label" color={colors.inkMuted}>
          {set.setNumber}
        </CustomText>
      </View>
      {showA && (
        <View style={{ flex: 1 }}>
          <TextInput
            id={`set-${set.id}-a`}
            value={draft.a}
            onChangeText={a => onChange({ ...draft, a })}
            keyboardType="decimal-pad"
            editable={editable}
            placeholder={measurement === 'reps' ? '+0' : '—'}
            placeholderTextColor={colors.inactive}
            style={inputStyle}
            selectTextOnFocus
          />
          <CustomText variant="caption" color={colors.inkMuted} centered>
            {unitLabels.a}
          </CustomText>
        </View>
      )}
      {timed ? (
        <View style={{ flex: 1.5 }}>
          <DurationInput id={`set-${set.id}-b`} seconds={draft.b} onChange={b => onChange({ ...draft, b })} editable={editable} inputStyle={{ ...inputStyle, minWidth: 0, paddingHorizontal: spacing.sm }} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <TextInput
            id={`set-${set.id}-b`}
            value={draft.b}
            onChangeText={b => onChange({ ...draft, b })}
            keyboardType="number-pad"
            editable={editable}
            placeholder="—"
            placeholderTextColor={colors.inactive}
            style={inputStyle}
            selectTextOnFocus
          />
          <CustomText variant="caption" color={colors.inkMuted} centered>
            {unitLabels.b}
          </CustomText>
        </View>
      )}
      <TouchableOpacity
        onPress={onToggleDone}
        hitSlop={8}
        style={{
          width: 44,
          height: 44,
          marginBottom: captionHeight,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? colors.success : colors.surfaceRaised,
        }}
      >
        <Icon icon={generalIcons.check} color={done ? colors.onAccent : colors.inkMuted} size={22} strokeWidth={3} />
      </TouchableOpacity>
    </View>
  );
};
