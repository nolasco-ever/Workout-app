import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { SharingPrefs } from '../../../../data/models';
import { withSharingDefaults } from '../../../../data/engine/sharing';
import { applySharingPrefs } from '../../../../data/services/buddyService';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { SwitchRow } from '../../../../components/inputs/SwitchRow';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';
import { useTabScrollInset } from '../../../../navigation/useTabBarInset';

/**
 * What buddies see: the owner decides, section by section. Switches take
 * effect at once on the profile; the lines already in the feed are
 * brought in step when the screen is left, in one pass.
 */
export const SharingScreen = () => {
  const { colors, spacing } = useTheme();
  const bottomInset = useTabScrollInset();
  const { uid, profile } = useAuth();
  const [prefs, setPrefs] = useState<SharingPrefs>(() => withSharingDefaults(profile?.sharing));
  const latest = useRef({ uid, profile, prefs, changed: false });
  latest.current = { ...latest.current, uid, profile, prefs };

  const set = (patch: Partial<SharingPrefs>) => {
    setPrefs(p => ({ ...p, ...patch }));
    latest.current.changed = true;
  };

  // One rewrite of the feed on the way out, not one per switch.
  useEffect(
    () => () => {
      const { uid: id, profile: prof, prefs: final, changed } = latest.current;
      if (!id || !changed) return;
      applySharingPrefs(id, prof, final).catch(err => console.warn('sharing save failed', err));
    },
    [],
  );

  const detailsOff = !prefs.workouts;

  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl + bottomInset }}>
        <SurfaceCard tone="accent">
          <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
            <Icon icon={generalIcons.eye} size={22} color={colors.accent} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <CustomText variant="bodyStrong">Only your buddies see any of this</CustomText>
              <CustomText variant="caption" color={colors.inkMuted}>
                Everything here is on to begin with. Turn off what you'd rather keep to yourself; it applies to what you've already shared too.
              </CustomText>
            </View>
          </View>
        </SurfaceCard>

        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Workouts</CustomText>
          <SurfaceCard style={{ padding: 0 }}>
            <SwitchRow icon={generalIcons.check} title="Finished workouts" description="Buddies see when you finish a workout and which exercises you did. Off, nothing about a workout is shared." value={prefs.workouts} onChange={workouts => set({ workouts })} />
            <SwitchRow title="Sets" description="How many sets you did of each exercise, set by set. Off, buddies see each exercise's best set at most." value={prefs.sets} onChange={sets => set({ sets })} disabled={detailsOff} divider />
            <SwitchRow title="Reps" description="The reps, time or distance of each set." value={prefs.reps} onChange={reps => set({ reps })} disabled={detailsOff} divider />
            <SwitchRow title="Weight" description="The weight you lifted on each set." value={prefs.weight} onChange={weight => set({ weight })} disabled={detailsOff} divider />
          </SurfaceCard>
          <CustomText variant="caption" color={colors.inkMuted}>
            With sets, reps and weight all off, buddies only see that you finished and the list of exercises.
          </CustomText>
        </View>

        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Records</CustomText>
          <SurfaceCard style={{ padding: 0 }}>
            <SwitchRow icon={generalIcons.trophy} title="New records" description="A line in the feed when you set a record, the records on a workout, and a graph of that exercise over time." value={prefs.records} onChange={records => set({ records })} />
          </SurfaceCard>
        </View>

        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Totals</CustomText>
          <SurfaceCard style={{ padding: 0 }}>
            <SwitchRow icon={generalIcons.dumbbell} title="Sets and weight moved" description="The totals under a finished workout, and the best lift and weight moved on your Iron Card." value={prefs.totals} onChange={totals => set({ totals })} />
          </SurfaceCard>
        </View>

        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Skipped and moved</CustomText>
          <SurfaceCard style={{ padding: 0 }}>
            <SwitchRow icon={generalIcons.calendarDay} title="Skipped and moved workouts" description="A line in the feed when you skip a workout or move it to another day." value={prefs.skips} onChange={skips => set({ skips })} />
          </SurfaceCard>
        </View>

        <CustomText variant="caption" color={colors.inkMuted} centered>
          Streaks, workouts done and your card stay visible to buddies either way.
        </CustomText>
      </ScrollView>
    </SafeAreaView>
  );
};
