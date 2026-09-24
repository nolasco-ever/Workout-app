import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { LocalDate, Plan } from '../../../data/models';
import { addDays, fromLocalDate, nextWeekday, today, weekdayOf } from '../../../data/engine/dates';
import { BottomSheet } from '../../../components/overlays/BottomSheet';
import { CalendarPicker } from '../../../components/inputs/CalendarPicker';
import { ChoiceChips } from '../../../components/inputs/ChoiceChips';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { CustomText } from '../../../components/text/customText';
import { useTheme } from '../../../theme';

const DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const longDate = (d: LocalDate) => fromLocalDate(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

interface Props {
  open: boolean;
  plan: Plan;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (startDate: LocalDate) => void;
}

/**
 * Asks when a plan should start before it is activated. Quick picks for the
 * common answers and a calendar for anything else. Weekly plans begin on
 * their start weekday, so the sheet says which day that will actually be.
 */
export const StartDateSheet = ({ open, plan, busy = false, onClose, onConfirm }: Props) => {
  const { colors, spacing } = useTheme();
  const todayDate = today();
  const [date, setDate] = useState<LocalDate>(todayDate);
  useEffect(() => {
    if (open) setDate(todayDate);
  }, [open, todayDate]);

  const tomorrow = addDays(todayDate, 1);
  const nextMonday = nextWeekday(addDays(todayDate, 1), 1);
  const quick = [
    { value: todayDate, label: 'Today' },
    { value: tomorrow, label: 'Tomorrow' },
    { value: nextMonday, label: 'Next Monday' },
  ];

  const weekly = plan.schedule.mode === 'weekly' ? plan.schedule : null;
  const actualStart = weekly ? nextWeekday(date, weekly.startWeekday) : date;
  const shifted = actualStart !== date;

  return (
    <BottomSheet
      open={open}
      title="When do you want to start?"
      onClose={onClose}
      footer={<PrimaryButton label={`Start ${actualStart === todayDate ? 'today' : longDate(actualStart)}`} busy={busy} onPress={() => onConfirm(date)} />}
    >
      <ChoiceChips<LocalDate> options={quick} value={quick.some(q => q.value === date) ? date : null} onChange={setDate} />
      <CalendarPicker value={date} onChange={setDate} minDate={todayDate} today={todayDate} />
      <CustomText variant="caption" color={colors.inkMuted}>
        {weekly
          ? shifted
            ? `This plan runs on fixed weekdays and its week starts on ${DAY[weekly.startWeekday]}, so it begins ${longDate(actualStart)}, the first ${DAY[weekly.startWeekday]} from the day you picked.`
            : `This plan runs on fixed weekdays and its week starts on ${DAY[weekly.startWeekday]}.`
          : `Day 1 of the rotation lands on ${DAY[weekdayOf(date)]}. Until then the Workout tab shows when the plan begins.`}
      </CustomText>
      <View style={{ height: spacing.xs }} />
    </BottomSheet>
  );
};
