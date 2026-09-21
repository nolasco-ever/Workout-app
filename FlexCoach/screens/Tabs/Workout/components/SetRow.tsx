import React from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { LoggedSet, MeasurementType } from '../../../../data/models';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';

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
}

/**
 * One editable set. Field A and B mean different things by measurement:
 * weight/reps, added weight/reps, weight/seconds, or distance/seconds.
 */
export const SetRow = ({ set, measurement, draft, unitLabels, onChange, onToggleDone }: Props) => {
  const { colors, radius, spacing, fonts } = useTheme();
  const done = set.completed;
  const showA = measurement !== 'reps' || true; // reps-only still allows added weight
  const inputStyle = {
    fontFamily: fonts.body.semibold,
    fontSize: 18,
    color: colors.ink,
    backgroundColor: done ? colors.transparent : colors.surfaceRaised,
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
        opacity: done ? 0.75 : 1,
      }}
    >
      <View style={{ width: 28 }}>
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
            editable={!done}
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
      <View style={{ flex: 1 }}>
        <TextInput
          id={`set-${set.id}-b`}
          value={draft.b}
          onChangeText={b => onChange({ ...draft, b })}
          keyboardType="number-pad"
          editable={!done}
          placeholder="—"
          placeholderTextColor={colors.inactive}
          style={inputStyle}
          selectTextOnFocus
        />
        <CustomText variant="caption" color={colors.inkMuted} centered>
          {unitLabels.b}
        </CustomText>
      </View>
      <TouchableOpacity
        onPress={onToggleDone}
        hitSlop={8}
        style={{
          width: 44,
          height: 44,
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
