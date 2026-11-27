import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { LoggedSet, MeasurementType } from '../../../../data/models';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';
import { DurationInput } from '../../../../components/inputs/DurationInput';
import { SelectAllTextInput } from '../../../../components/inputs/SelectAllTextInput';

/** Row label: the set number, or W1, W2 for warm-ups. */
export const setLabel = (set: Pick<LoggedSet, 'setNumber' | 'warmup'>): string => (set.warmup ? `W${set.setNumber}` : String(set.setNumber));

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
  /** Horizontal padding, for rows that sit edge to edge in a card (so a swipe action can reach the card's edge). */
  inset?: number;
  /**
   * The table look (build 22, B22-14): no unit under each number, since a
   * SetHeader above the rows names the columns once, and a line between rows.
   */
  table?: boolean;
  /** In the table, the first row has no line above it. */
  first?: boolean;
}

/** The table's column names over the set rows: SET, then the two units, centred over their fields. */
export const SetHeader = ({ unitLabels, inset = 0 }: { unitLabels: { a: string; b: string }; inset?: number }) => {
  const { colors, spacing } = useTheme();
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: inset, paddingBottom: spacing.sm }}>
      <CustomText variant="overline" color={colors.inkMuted} style={{ width: 32 }}>Set</CustomText>
      <CustomText variant="overline" color={colors.inkMuted} style={{ flex: 1, textAlign: 'center' }}>{unitLabels.a}</CustomText>
      <CustomText variant="overline" color={colors.inkMuted} style={{ flex: 1, textAlign: 'center' }}>{unitLabels.b}</CustomText>
      <View style={{ width: CHECK_HIT }} />
    </View>
  );
};

/** The done check: a square, a little smaller in the table so the row stays slim; tappable across 44 points either way. */
const CHECK_HIT = 44;

/**
 * One editable set. Field A and B mean different things by measurement:
 * weight/reps, added weight/reps, weight/seconds, or distance/seconds.
 */
export const SetRow = ({ set, measurement, draft, unitLabels, onChange, onToggleDone, alwaysEditable = false, inset = 0, table = false, first = false }: Props) => {
  const { colors, radius, spacing, fonts } = useTheme();
  const done = set.completed;
  const editable = alwaysEditable || !done;
  // Each input has a unit caption under it, so the input's centre sits half a
  // caption above the row's. The set number and the check take the same
  // offset so they line up with the boxes rather than the column.
  // The table names the columns once, in its header.
  const captionHeight = table ? 0 : 16;
  const checkSize = table ? 40 : CHECK_HIT;
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
        paddingHorizontal: inset,
        borderTopWidth: table && !first ? 1 : 0,
        borderTopColor: colors.line,
        opacity: done && !alwaysEditable && !table ? 0.75 : 1,
      }}
    >
      <View style={{ width: table ? 32 : 28, marginBottom: captionHeight }}>
        {/* Cardio is one entry, not a numbered set. */}
        {measurement !== 'distance_time' && (
          <CustomText variant="label" color={colors.inkMuted}>
            {setLabel(set)}
          </CustomText>
        )}
      </View>
      {showA && (
        <View style={{ flex: 1 }}>
          <SelectAllTextInput
            id={`set-${set.id}-a`}
            value={draft.a}
            onChangeText={a => onChange({ ...draft, a })}
            accessibilityLabel={`Set ${setLabel(set)}, ${unitLabels.a}`}
            keyboardType="decimal-pad"
            editable={editable}
            placeholder={measurement === 'reps' ? '+0' : '—'}
            placeholderTextColor={colors.inactive}
            style={inputStyle}
          />
          {!table && (
            <CustomText variant="caption" color={colors.inkMuted} centered>
              {unitLabels.a}
            </CustomText>
          )}
        </View>
      )}
      {timed ? (
        <View style={{ flex: 1.5 }}>
          <DurationInput id={`set-${set.id}-b`} seconds={draft.b} onChange={b => onChange({ ...draft, b })} editable={editable} inputStyle={{ ...inputStyle, minWidth: 0, paddingHorizontal: spacing.sm }} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <SelectAllTextInput
            id={`set-${set.id}-b`}
            value={draft.b}
            onChangeText={b => onChange({ ...draft, b })}
            accessibilityLabel={`Set ${setLabel(set)}, ${unitLabels.b}`}
            keyboardType="number-pad"
            editable={editable}
            placeholder="—"
            placeholderTextColor={colors.inactive}
            style={inputStyle}
          />
          {!table && (
            <CustomText variant="caption" color={colors.inkMuted} centered>
              {unitLabels.b}
            </CustomText>
          )}
        </View>
      )}
      <TouchableOpacity
        onPress={onToggleDone}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={`Set ${setLabel(set)} done`}
        style={{ width: CHECK_HIT, height: CHECK_HIT, marginBottom: captionHeight, alignItems: 'center', justifyContent: 'center' }}
      >
        <View style={{ width: checkSize, height: checkSize, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? colors.success : colors.surfaceRaised }}>
          <Icon icon={generalIcons.check} color={done ? colors.onAccent : colors.inkMuted} size={table ? 20 : 22} strokeWidth={3} />
        </View>
      </TouchableOpacity>
    </View>
  );
};
