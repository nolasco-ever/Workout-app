import React, { useState } from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LocalDate } from '../../data/models';
import { addDays, fromLocalDate, toLocalDate, today } from '../../data/engine/dates';
import { CustomText } from '../text/customText';
import { Icon } from '../icons/Icon';
import { generalIcons } from '../icons/icon-library';
import { useTheme } from '../../theme';

/** "Today", "Yesterday", else "Tue, Nov 24, 2026". */
const dayLabel = (date: LocalDate): string => {
  const now = today();
  if (date === now) return 'Today';
  if (date === addDays(now, -1)) return 'Yesterday';
  return fromLocalDate(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * A field that shows the chosen day; tapping it brings up the system's own
 * date picker (build 22 feedback: pick any date, not one of the last seven).
 * Android opens its date dialog. iOS has no picker dialog, so the system
 * calendar opens under the field and closes once a day is picked.
 */
export const DateField = ({ label, value, onChange, maximumDate, minimumDate }: { label?: string; value: LocalDate; onChange: (date: LocalDate) => void; maximumDate?: LocalDate; minimumDate?: LocalDate }) => {
  const { colors, radius, spacing, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const max = maximumDate ? fromLocalDate(maximumDate) : undefined;
  const min = minimumDate ? fromLocalDate(minimumDate) : undefined;

  const picked = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'set' && date) onChange(toLocalDate(date));
    if (Platform.OS === 'ios' && event.type === 'set') setOpen(false);
  };

  const press = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: fromLocalDate(value), mode: 'date', maximumDate: max, minimumDate: min, onChange: picked });
      return;
    }
    setOpen(o => !o);
  };

  return (
    <View style={{ gap: spacing.xs }}>
      {label && <CustomText variant="overline" color={colors.inkMuted}>{label}</CustomText>}
      <TouchableOpacity
        onPress={press}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${label ? `${label}, ` : ''}${dayLabel(value)}`}
        accessibilityHint="Opens a date picker"
        accessibilityState={Platform.OS === 'ios' ? { expanded: open } : undefined}
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: open ? colors.accent : colors.line, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md }}
      >
        <CustomText variant="body" style={{ flex: 1 }}>{dayLabel(value)}</CustomText>
        <Icon icon={generalIcons.calendarDay} size={20} color={colors.inkMuted} />
      </TouchableOpacity>
      {open && Platform.OS === 'ios' && (
        <DateTimePicker
          value={fromLocalDate(value)}
          mode="date"
          display="inline"
          maximumDate={max}
          minimumDate={min}
          onChange={picked}
          accentColor={colors.accent}
          themeVariant={isDark ? 'dark' : 'light'}
        />
      )}
    </View>
  );
};
