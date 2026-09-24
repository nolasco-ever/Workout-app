import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { LocalDate } from '../../data/models';
import { addDays, fromLocalDate, toLocalDate } from '../../data/engine/dates';
import { CustomText } from '../text/customText';
import { Icon } from '../icons/Icon';
import { directionIcons } from '../icons/icon-library';
import { useTheme } from '../../theme';

interface Props {
  value: LocalDate;
  onChange: (date: LocalDate) => void;
  /** Earliest selectable day, inclusive. Earlier days are shown greyed out. */
  minDate?: LocalDate;
  /** Latest selectable day, inclusive. */
  maxDate?: LocalDate;
  /** Marked with a ring so it stands out even when another day is selected. */
  today?: LocalDate;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const firstOfMonth = (d: LocalDate): LocalDate => `${d.slice(0, 7)}-01`;
const shiftMonth = (first: LocalDate, by: number): LocalDate => {
  const d = fromLocalDate(first);
  d.setMonth(d.getMonth() + by);
  return toLocalDate(d);
};

/**
 * A month calendar in the app's own style. Shows one month at a time with
 * arrows to move between months; taps pick a single day.
 */
export const CalendarPicker = ({ value, onChange, minDate, maxDate, today }: Props) => {
  const { colors, spacing, radius, fonts } = useTheme();
  const [month, setMonth] = useState<LocalDate>(firstOfMonth(value));
  const monthDate = fromLocalDate(month);
  const title = monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const leading = monthDate.getDay();

  // Six rows of seven keeps the grid's height stable across months.
  const cells: (LocalDate | null)[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 0; d < daysInMonth; d++) cells.push(addDays(month, d));
  while (cells.length % 7 !== 0 || cells.length < 42) cells.push(null);

  const canGoBack = !minDate || month > firstOfMonth(minDate);
  const canGoForward = !maxDate || month < firstOfMonth(maxDate);
  const selectable = (d: LocalDate) => (!minDate || d >= minDate) && (!maxDate || d <= maxDate);

  const arrow = (icon: typeof directionIcons.angleLeft, enabled: boolean, onPress: () => void, label: string) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!enabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center', opacity: enabled ? 1 : 0.4 }}
    >
      <Icon icon={icon} size={18} color={colors.ink} strokeWidth={2.5} />
    </TouchableOpacity>
  );

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {arrow(directionIcons.angleLeft, canGoBack, () => setMonth(m => shiftMonth(m, -1)), 'Previous month')}
        <CustomText variant="heading">{title}</CustomText>
        {arrow(directionIcons.angleRight, canGoForward, () => setMonth(m => shiftMonth(m, 1)), 'Next month')}
      </View>
      <View style={{ flexDirection: 'row' }}>
        {WEEKDAYS.map((w, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.xs }}>
            <CustomText variant="overline" color={colors.inkMuted}>{w}</CustomText>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((d, i) => {
          if (!d) return <View key={`empty-${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
          const selected = d === value;
          const isToday = d === today;
          const enabled = selectable(d);
          return (
            <View key={d} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}>
              <TouchableOpacity
                onPress={() => onChange(d)}
                disabled={!enabled}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: !enabled }}
                accessibilityLabel={fromLocalDate(d).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                style={{
                  flex: 1,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selected ? colors.accent : colors.transparent,
                  borderWidth: isToday && !selected ? 1.5 : 0,
                  borderColor: colors.accent,
                }}
              >
                <CustomText
                  variant="body"
                  color={selected ? colors.onAccent : enabled ? colors.ink : colors.inactive}
                  style={{ fontFamily: selected || isToday ? fonts.body.semibold : fonts.body.regular }}
                >
                  {fromLocalDate(d).getDate()}
                </CustomText>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
};
