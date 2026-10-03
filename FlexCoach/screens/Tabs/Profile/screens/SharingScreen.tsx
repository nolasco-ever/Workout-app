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
        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Workouts</CustomText>
          <SurfaceCard style={{ padding: 0 }}>
            <SwitchRow icon={generalIcons.check} title="Finished workouts" description="Allow buddies to see when you finish a workout." value={prefs.workouts} onChange={workouts => set({ workouts })} />
            <SwitchRow title="Sets" description="How many sets you did of each exercise." value={prefs.sets} onChange={sets => set({ sets })} disabled={detailsOff} divider />
            <SwitchRow title="Reps" description="The reps, time or distance of each set." value={prefs.reps} onChange={reps => set({ reps })} disabled={detailsOff} divider />
            <SwitchRow title="Weight" description="The weight you lifted on each set." value={prefs.weight} onChange={weight => set({ weight })} disabled={detailsOff} divider />
          </SurfaceCard>
          <CustomText variant="caption" color={colors.inkMuted}>
            With sets, reps, and weight all off, buddies only see the list of exercises.
          </CustomText>
        </View>

        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Records</CustomText>
          <SurfaceCard style={{ padding: 0 }}>
            <SwitchRow icon={generalIcons.trophy} title="New records" description="Allow buddies to see when you set a record." value={prefs.records} onChange={records => set({ records })} />
          </SurfaceCard>
        </View>

        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Totals</CustomText>
          <SurfaceCard style={{ padding: 0 }}>
            <SwitchRow icon={generalIcons.dumbbell} title="Volume" description="Allow buddies to see the total volume moved on a finished workout and the best lift and weight moved on your Iron Card." value={prefs.totals} onChange={totals => set({ totals })} />
          </SurfaceCard>
        </View>

        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Skipped and moved</CustomText>
          <SurfaceCard style={{ padding: 0 }}>
            <SwitchRow icon={generalIcons.calendarDay} title="Skipped and moved workouts" description="Allow buddies to see when you skipped a workout or moved it to another day." value={prefs.skips} onChange={skips => set({ skips })} />
          </SurfaceCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
