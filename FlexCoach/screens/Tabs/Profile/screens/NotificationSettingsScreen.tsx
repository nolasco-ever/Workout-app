import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { ClockTime, NotificationPrefs, Weekday } from '../../../../data/models';
import { withPrefDefaults } from '../../../../data/engine/notifications';
import { userRepository } from '../../../../data/repositories/userRepository';
import { exactAlarmsAllowed, getPermission, openExactAlarmSettings, openSystemSettings, PermissionState, requestPermission } from '../../../../data/notifications/notificationService';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { Row } from '../../../../components/list-items/Row';
import { SwitchRow } from '../../../../components/inputs/SwitchRow';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { BottomSheet } from '../../../../components/overlays/BottomSheet';
import { WheelPicker } from '../../../../components/inputs/WheelPicker';
import { ChoiceChips } from '../../../../components/inputs/ChoiceChips';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';
import { useTabScrollInset } from '../../../../navigation/useTabBarInset';

const formatTime = ({ hour, minute }: ClockTime): string => {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
};

const weekdays: { value: `${Weekday}`; label: string }[] = [
  { value: '1', label: 'Mon' },
  { value: '2', label: 'Tue' },
  { value: '3', label: 'Wed' },
  { value: '4', label: 'Thu' },
  { value: '5', label: 'Fri' },
  { value: '6', label: 'Sat' },
  { value: '0', label: 'Sun' },
];

const hourOptions = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
const minuteOptions = Array.from({ length: 12 }, (_, i) => ({ value: i * 5, label: String(i * 5).padStart(2, '0') }));
const periodOptions = [
  { value: 'AM' as const, label: 'AM' },
  { value: 'PM' as const, label: 'PM' },
];

/** Picks an hour and a minute in five-minute steps on scroll wheels. */
const TimeSheet = ({ open, title, value, onClose, onChange }: { open: boolean; title: string; value: ClockTime; onClose: () => void; onChange: (t: ClockTime) => void }) => {
  const { spacing } = useTheme();
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);
  const hour12 = draft.hour % 12 === 0 ? 12 : draft.hour % 12;
  const period = draft.hour < 12 ? 'AM' : 'PM';
  const setHour = (h12: number, p: 'AM' | 'PM') => setDraft(d => ({ ...d, hour: (h12 % 12) + (p === 'PM' ? 12 : 0) }));
  return (
    <BottomSheet
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <PrimaryButton
          label={`Set to ${formatTime(draft)}`}
          onPress={() => {
            onChange(draft);
            onClose();
          }}
        />
      }
    >
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <WheelPicker options={hourOptions} value={hour12} onChange={h => setHour(h, period)} accessibilityLabel="Hour" />
        <WheelPicker options={minuteOptions} value={draft.minute} onChange={minute => setDraft(d => ({ ...d, minute }))} accessibilityLabel="Minute" />
        <WheelPicker options={periodOptions} value={period} onChange={p => setHour(hour12, p)} accessibilityLabel="AM or PM" />
      </View>
    </BottomSheet>
  );
};

export const NotificationSettingsScreen = () => {
  const { colors, spacing } = useTheme();
  const bottomInset = useTabScrollInset();
  const { uid, profile } = useAuth();
  const prefs = withPrefDefaults(profile?.notifications);
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const [exactAlarms, setExactAlarms] = useState(true);
  const [editing, setEditing] = useState<'morning' | 'evening' | null>(null);

  const refresh = useCallback(() => {
    getPermission().then(setPermission).catch(() => undefined);
    exactAlarmsAllowed().then(setExactAlarms).catch(() => undefined);
  }, []);

  // Re-check when returning from the system settings app.
  useFocusEffect(refresh);
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const save = (patch: Partial<NotificationPrefs>) => {
    if (!uid) return;
    userRepository.update(uid, { notifications: { ...prefs, ...patch } }).catch(err => console.warn('prefs save failed', err));
  };

  /** Turning the master switch on is the natural moment for the OS prompt. */
  const setEnabled = async (enabled: boolean) => {
    save({ enabled });
    if (enabled && permission === 'undetermined') setPermission(await requestPermission());
  };

  const blocked = permission === 'denied';
  const off = !prefs.enabled || blocked;

  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl + bottomInset }}>
        {blocked && (
          <SurfaceCard tone="accent">
            <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
              <Icon icon={generalIcons.bellSlash} size={22} color={colors.accent} />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <CustomText variant="bodyStrong">Notifications are off for FlexCoach</CustomText>
                <CustomText variant="caption" color={colors.inkMuted}>Turn them on in your phone's settings to get reminders and the rest timer.</CustomText>
              </View>
            </View>
            <View style={{ marginTop: spacing.md }}>
              <PrimaryButton label="Open settings" variant="outline" onPress={() => openSystemSettings()} />
            </View>
          </SurfaceCard>
        )}

        {permission === 'undetermined' && prefs.enabled && (
          <SurfaceCard tone="accent">
            <CustomText variant="bodyStrong">Allow notifications</CustomText>
            <CustomText variant="caption" color={colors.inkMuted} style={{ marginBottom: spacing.md }}>
              FlexCoach can remind you on workout days and buzz when your rest is over. Nothing is sent until you allow it.
            </CustomText>
            <PrimaryButton label="Allow notifications" onPress={() => requestPermission().then(setPermission)} />
          </SurfaceCard>
        )}

        <SurfaceCard style={{ padding: 0 }}>
          <SwitchRow icon={generalIcons.bell} title="Notifications" description={off ? 'All reminders are paused.' : 'Reminders, rest timer and buddy activity.'} value={prefs.enabled} onChange={setEnabled} disabled={blocked} />
        </SurfaceCard>

        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Workout days</CustomText>
          <SurfaceCard style={{ padding: 0 }}>
            <SwitchRow title="Morning reminder" description="On days with a workout, if it isn't done yet." value={prefs.workoutToday} onChange={workoutToday => save({ workoutToday })} disabled={off} />
            <Row title="Morning time" right={formatTime(prefs.morningTime)} divider onPress={off ? undefined : () => setEditing('morning')} chevron={!off} />
            <SwitchRow title="Evening nudge" description="If the day's workout is still waiting." value={prefs.eveningNudge} onChange={eveningNudge => save({ eveningNudge })} disabled={off} divider />
            <SwitchRow title="Streak at risk" description="Replaces the evening nudge when a streak is on the line." value={prefs.streakRisk} onChange={streakRisk => save({ streakRisk })} disabled={off} divider />
            <Row title="Evening time" right={formatTime(prefs.eveningTime)} divider onPress={off ? undefined : () => setEditing('evening')} chevron={!off} />
          </SurfaceCard>
        </View>

        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>During a workout</CustomText>
          <SurfaceCard style={{ padding: 0 }}>
            <SwitchRow icon={generalIcons.timer} title="Rest over" description="Sound and vibration when your rest ends, even with the app in the background." value={prefs.restOver} onChange={restOver => save({ restOver })} disabled={off} />
            {Platform.OS === 'android' && !exactAlarms && !off && (
              <Row title="Allow exact timing" description="Android delays timers unless FlexCoach may set exact alarms." divider onPress={() => openExactAlarmSettings()} />
            )}
          </SurfaceCard>
        </View>

        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Plan and progress</CustomText>
          <SurfaceCard style={{ padding: 0 }}>
            <SwitchRow title="Missed workout" description="The morning after a workout day passes without one." value={prefs.missedWorkout} onChange={missedWorkout => save({ missedWorkout })} disabled={off} />
            <SwitchRow title="Plan starts tomorrow" description="The evening before a new plan begins." value={prefs.planStarts} onChange={planStarts => save({ planStarts })} disabled={off} divider />
            <SwitchRow title="Cycle finished" description="A summary when a cycle wraps up." value={prefs.cycleFinished} onChange={cycleFinished => save({ cycleFinished })} disabled={off} divider />
            <SwitchRow title="Buddy activity" description="Requests, and when a buddy finishes or skips a workout." value={prefs.buddies} onChange={buddies => save({ buddies })} disabled={off} divider />
          </SurfaceCard>
        </View>

        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Body weight</CustomText>
          <SurfaceCard style={{ padding: 0 }}>
            <SwitchRow icon={generalIcons.scale} title="Weekly weigh-in" description={`${weekdays.find(w => w.value === String(prefs.weighInWeekday))?.label ?? 'Mon'} at ${formatTime(prefs.morningTime)}.`} value={prefs.weighIn} onChange={weighIn => save({ weighIn })} disabled={off} />
            {prefs.weighIn && !off && (
              <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
                <ChoiceChips options={weekdays} value={`${prefs.weighInWeekday}`} onChange={v => save({ weighInWeekday: Number(v) as Weekday })} />
              </View>
            )}
          </SurfaceCard>
        </View>

        <CustomText variant="caption" color={colors.inkMuted} centered>
          Reminders only fire while a workout is still waiting. Finish early and the day's reminders disappear.
        </CustomText>
      </ScrollView>

      <TimeSheet open={editing === 'morning'} title="Morning reminder" value={prefs.morningTime} onClose={() => setEditing(null)} onChange={morningTime => save({ morningTime })} />
      <TimeSheet open={editing === 'evening'} title="Evening nudge" value={prefs.eveningTime} onClose={() => setEditing(null)} onChange={eveningTime => save({ eveningTime })} />
    </SafeAreaView>
  );
};
