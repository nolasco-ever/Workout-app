import React, { useEffect, useLayoutEffect, useState } from 'react';
import { StatusBar, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { achievementIdOf, compactCount, familyOf, thresholdsFor, tierLabel } from '../../data/engine/achievements';
import { AchievementFamilyId } from '../../data/models';
import { useAchievements } from '../../data/hooks/useAchievements';
import { useAuth } from '../../data/auth/AuthProvider';
import { sessionRepository } from '../../data/repositories/sessionRepository';
import { cycleRepository } from '../../data/repositories/cycleRepository';
import { dateLabel } from '../../components/charts/scale';
import { BadgeSvg } from '../../components/achievements/BadgeSvg';
import { BadgeView, HERO_REST_YAW } from '../../components/achievements/BadgeView';
import { artFor } from '../../components/achievements/badgeArt';
import { CustomText } from '../../components/text/customText';
import { Icon } from '../../components/icons/Icon';
import { directionIcons } from '../../components/icons/icon-library';
import { useTheme } from '../../theme';
import { AppStackParams } from '../../appNavigators/AppStack';

const fmt = (n: number): string => Math.round(n).toLocaleString();

/** How far a locked badge is: "x of y <what the family counts>". */
const lockedCopy = (family: AchievementFamilyId, value: number, threshold: number, unit: 'lb' | 'kg'): string => {
  const x = family === 'volume' ? `${compactCount(value)} of ${compactCount(threshold)} ${unit}` : `${fmt(value)} of ${fmt(threshold)}`;
  const what: Record<AchievementFamilyId, string> = {
    workouts: 'workouts finished',
    streak: 'days in a row with a workout',
    volume: 'total weight lifted',
    records: 'PRs beaten',
    cycles: 'training cycles finished',
    perfect_cycles: 'training cycles finished with every workout done',
    early_bird: 'workouts finished before 9am',
    night_owl: 'workouts started after 9pm',
    buddies: 'buddies in your circle',
    plan_uses: 'buddies using your plans',
  };
  return `${x} ${what[family]}`;
};

/** The workout or cycle that pushed the badge over its line, if the unlock recorded one. */
type Origin = { kind: 'session' | 'cycle'; id: string; title: string; date: string };

/**
 * One badge on black, the family's name in the header. Earned ones spin in
 * and settle at a slight angle, ready to be turned by hand, with the unlock
 * date stamped on the back and the workout or cycle that earned it below,
 * a tap away; locked ones show the pewter drawing and how far off they are.
 */
export const BadgeScreen = () => {
  const { spacing } = useTheme();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<NavigationProp<AppStackParams>>();
  const { params } = useRoute<RouteProp<AppStackParams, 'BadgeScreen'>>();
  const { uid } = useAuth();
  const state = useAchievements();
  const [spinIn, setSpinIn] = useState(0);
  const [ready, setReady] = useState(false);
  const [origin, setOrigin] = useState<Origin | null>(null);

  const family = familyOf(params.family);
  const tier = params.tier;
  const progress = state.progress.find(p => p.family.id === family.id);
  const thresholds = thresholdsFor(family, state.unit);
  const threshold = thresholds[tier - 1];
  const unlock = state.unlocks.find(u => u.achievementId === achievementIdOf(family.id, tier));
  const earned = !!unlock || (progress ? tier <= progress.tier : false);
  const art = artFor(tier);
  const size = Math.min(width - spacing.lg * 2, 340);

  useLayoutEffect(() => {
    navigation.setOptions({ title: family.name });
  }, [navigation, family.name]);

  // The spin starts once the model reports in, or after a beat if it has not yet.
  useEffect(() => {
    if (!earned) return;
    const t = setTimeout(() => setSpinIn(1), ready ? 40 : 500);
    return () => clearTimeout(t);
  }, [earned, ready]);

  // Where it was earned: the session or the cycle the unlock recorded. Buddy badges have neither.
  const sessionId = unlock?.context?.sessionId ?? null;
  const cycleId = unlock?.context?.cycleId ?? null;
  useEffect(() => {
    if (!uid) return;
    let live = true;
    if (sessionId) {
      sessionRepository
        .get(uid, sessionId)
        .then(s => {
          if (live && s) setOrigin({ kind: 'session', id: s.id, title: s.workoutName, date: s.date });
        })
        .catch(() => undefined);
    } else if (cycleId) {
      cycleRepository
        .get(uid, cycleId)
        .then(c => {
          if (live && c) setOrigin({ kind: 'cycle', id: c.id, title: 'the cycle', date: c.endDate });
        })
        .catch(() => undefined);
    } else {
      setOrigin(null);
    }
    return () => {
      live = false;
    };
  }, [uid, sessionId, cycleId]);

  const openOrigin = () => {
    if (!origin) return;
    // History lives in the Profile tab; both screens are pushed there.
    const screen = origin.kind === 'session' ? { screen: 'SessionDetailScreen', params: { sessionId: origin.id, workoutName: origin.title } } : { screen: 'CycleReviewScreen', params: { cycleId: origin.id } };
    (navigation as NavigationProp<Record<string, object | undefined>>).navigate('TabNavigator', { screen: 'ProfileStack', params: screen });
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar barStyle="light-content" />
      {/* No scroll view here: a vertical scroller would compete with the horizontal drag that turns the badge. */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.xl }}>
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          {earned ? (
            <BadgeView family={family.id} tier={tier} restYaw={HERO_REST_YAW} spinIn={spinIn} unlockedAt={unlock?.unlockedAt ?? null} onReady={() => setReady(true)} style={{ width: size, height: size }} />
          ) : (
            <BadgeSvg family={family.id} tier={tier} locked size={size * 0.8} />
          )}
        </View>
        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <CustomText variant="overline" color={earned ? art.light : 'rgba(255,255,255,0.5)'}>{earned ? art.name : 'Locked'}</CustomText>
          <CustomText variant="display" color="#FFFFFF" centered>{tierLabel(family.id, threshold, state.unit)}</CustomText>
          {!earned && (
            <CustomText variant="body" color="rgba(255,255,255,0.6)" centered style={{ marginTop: spacing.xs }}>
              {lockedCopy(family.id, progress?.value ?? 0, threshold, state.unit)}
            </CustomText>
          )}
          {earned && origin && (
            <TouchableOpacity onPress={openOrigin} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`Open ${origin.title}`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <CustomText variant="bodyStrong" color="#FFFFFF">Earned in {origin.title}</CustomText>
              <CustomText variant="caption" color="rgba(255,255,255,0.55)">· {dateLabel(origin.date)}</CustomText>
              <Icon icon={directionIcons.angleRight} size={16} color="rgba(255,255,255,0.55)" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};
