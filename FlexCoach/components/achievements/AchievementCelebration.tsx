import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, SharedValue, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useAuth } from '../../data/auth/AuthProvider';
import { AchievementUnlock } from '../../data/models';
import { ACHIEVEMENT_FAMILIES, familyOf, thresholdsFor, tierLabel } from '../../data/engine/achievements';
import { achievementRepository } from '../../data/repositories/achievementRepository';
import { judgeAchievements, markAchievementsCelebrated } from '../../data/services/achievementService';
import { navigationRef } from '../../navigation/navigationRef';
import { CustomText } from '../text/customText';
import { PrimaryButton } from '../buttons/PrimaryButton';
import { Icon } from '../icons/Icon';
import { useTheme } from '../../theme';
import { Badge, SHIELD, artFor } from './Badge';
import { FAMILY_MARKS } from './badgeArt';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** Screens where a celebration would interrupt something: it waits until they're left. */
const HOLD_ON = new Set(['SessionScreen', 'SessionCompleteScreen', 'SessionExercisesScreen', 'CycleReviewScreen', 'ScanCardScreen', 'AuthStack', 'OnboardingStack']);

const BADGE = 200;
const PARTICLES = 18;
const GROUND = '#141416';

/** A spark that flies out from behind the badge and fades. */
const Particle = ({ index, color, burst }: { index: number; color: string; burst: SharedValue<number> }) => {
  const angle = (index / PARTICLES) * Math.PI * 2 + (index % 2 ? 0.17 : 0);
  const distance = 110 + (index % 3) * 28;
  const size = 6 + (index % 3) * 3;
  const style = useAnimatedStyle(() => {
    const p = burst.value;
    return {
      opacity: p < 0.1 ? p * 10 : 1 - (p - 0.1) / 0.9,
      transform: [{ translateX: Math.cos(angle) * distance * p }, { translateY: Math.sin(angle) * distance * p }, { scale: 1 - p * 0.6 }],
    };
  });
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />;
};

/**
 * One badge's moment: the badge springs in, a shine sweeps across it,
 * sparks fly, then the words. Mounted fresh per page so every tier gets
 * its own run.
 */
const CelebrationPage = ({ unlock, unit }: { unlock: AchievementUnlock; unit: 'lb' | 'kg' }) => {
  const { colors, spacing } = useTheme();
  const family = familyOf(unlock.family);
  const art = artFor(unlock.tier);
  const label = tierLabel(unlock.family, unlock.threshold, unit);
  const next = thresholdsFor(family, unit)[unlock.tier] ?? null;
  const upgrade = unlock.tier > 1;

  const scale = useSharedValue(0.2);
  const tilt = useSharedValue(-14);
  const glow = useSharedValue(0);
  const shine = useSharedValue(-60);
  const burst = useSharedValue(0);
  const words = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(120, withSpring(1, { damping: 9, stiffness: 150, mass: 0.9 }));
    tilt.value = withDelay(120, withSpring(0, { damping: 11, stiffness: 110 }));
    glow.value = withDelay(260, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
    burst.value = withDelay(300, withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }));
    shine.value = withDelay(700, withSequence(withTiming(150, { duration: 750, easing: Easing.inOut(Easing.cubic) }), withDelay(1800, withTiming(-60, { duration: 0 })), withTiming(150, { duration: 750, easing: Easing.inOut(Easing.cubic) })));
    words.value = withDelay(560, withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }));
    // Shared values are stable refs; this runs once per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { rotate: `${tilt.value}deg` }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value * 0.55, transform: [{ scale: 0.6 + glow.value * 0.6 }] }));
  const wordsStyle = useAnimatedStyle(() => ({ opacity: words.value, transform: [{ translateY: (1 - words.value) * 18 }] }));
  const shineProps = useAnimatedProps(() => ({ x: shine.value }));

  const sparkColors = [art.light, art.mid, colors.accent, '#FFFFFF'];

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl, paddingHorizontal: spacing.xl }}>
      <View style={{ width: BADGE, height: BADGE, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: BADGE * 1.9, height: BADGE * 1.9, borderRadius: BADGE, backgroundColor: art.glow }, glowStyle]} />
        {Array.from({ length: PARTICLES }, (_, i) => (
          <Particle key={i} index={i} color={sparkColors[i % sparkColors.length]} burst={burst} />
        ))}
        <Animated.View style={[{ width: BADGE, height: BADGE, alignItems: 'center', justifyContent: 'center' }, badgeStyle]}>
          <Badge family={unlock.family} tier={unlock.tier} size={BADGE} markless />
          {/* The shine, clipped to the shield so it never spills outside it. */}
          <Svg width={BADGE} height={BADGE} viewBox="0 0 100 100" style={{ position: 'absolute' }} pointerEvents="none">
            <Defs>
              <ClipPath id="celebrate-shield">
                <Path d={SHIELD} />
              </ClipPath>
              <LinearGradient id="celebrate-shine" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
                <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.8" />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <G clipPath="url(#celebrate-shield)">
              <AnimatedRect animatedProps={shineProps} y="-30" width="34" height="160" fill="url(#celebrate-shine)" transform="skewX(-22)" />
            </G>
          </Svg>
          <View style={{ position: 'absolute' }}>
            <Icon icon={FAMILY_MARKS[unlock.family]} size={BADGE * 0.4} color={art.ink} strokeWidth={2.25} />
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[{ alignItems: 'center', gap: spacing.sm }, wordsStyle]}>
        <CustomText variant="overline" color={art.light}>{upgrade ? 'Badge upgraded' : 'Badge unlocked'}</CustomText>
        <CustomText variant="display" color="#FFFFFF" centered>{label}</CustomText>
        <CustomText variant="bodyStrong" color="rgba(255,255,255,0.78)" centered>{family.name} · {art.name}</CustomText>
        <CustomText variant="body" color="rgba(255,255,255,0.6)" centered style={{ marginTop: spacing.xs }}>
          {next !== null ? `Next up: ${tierLabel(unlock.family, next, unit)}.` : 'Top of the ladder. Nothing above this one, yet.'}
        </CustomText>
      </Animated.View>
    </View>
  );
};

const familyOrder = new Map(ACHIEVEMENT_FAMILIES.map((f, i) => [f.id, i]));
const byMoment = (a: AchievementUnlock, b: AchievementUnlock): number => a.unlockedAt - b.unlockedAt || (familyOrder.get(a.family) ?? 0) - (familyOrder.get(b.family) ?? 0) || a.tier - b.tier;

/**
 * Shows the celebration for every badge the owner hasn't seen yet, one
 * page per tier, as a full-screen modal over whatever is open. Waits
 * while a workout, its summary, or a report is on screen. Also runs the
 * one-time catch-up that grants badges already earned. Mount once at the
 * app root for signed-in, onboarded accounts.
 */
export const AchievementCelebration = () => {
  const { uid, profile } = useAuth();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const unit = profile?.weightUnit ?? 'lb';
  const [unlocks, setUnlocks] = useState<AchievementUnlock[]>([]);
  const [queue, setQueue] = useState<AchievementUnlock[] | null>(null);
  const [index, setIndex] = useState(0);
  const [route, setRoute] = useState<string | undefined>(() => navigationRef.getCurrentRoute()?.name);
  const caughtUp = useRef<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    return achievementRepository.watch(uid, setUnlocks);
  }, [uid]);

  // The catch-up: once per account, everything already earned, quietly.
  const backfilled = profile?.achievementsBackfilledAt ?? null;
  useEffect(() => {
    if (!uid || !profile || backfilled || caughtUp.current === uid) return;
    caughtUp.current = uid;
    judgeAchievements(uid, profile).catch(err => console.warn('achievement catch-up failed', err));
    // Only the account and whether it was caught up matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, backfilled]);

  useEffect(() => navigationRef.addListener('state', () => setRoute(navigationRef.getCurrentRoute()?.name)), []);

  const pending = useMemo(() => unlocks.filter(u => !u.celebratedAt).sort(byMoment), [unlocks]);
  const held = !!route && HOLD_ON.has(route);
  useEffect(() => {
    if (queue || pending.length === 0 || held) return;
    setQueue(pending);
    setIndex(0);
  }, [pending, held, queue]);

  const finish = () => {
    if (!queue || !uid) return;
    const ids = queue.map(u => u.achievementId);
    setQueue(null);
    markAchievementsCelebrated(uid, ids).catch(err => console.warn('celebration stamp failed', err));
  };

  if (!queue) return null;
  const current = queue[Math.min(index, queue.length - 1)];
  const last = index >= queue.length - 1;
  return (
    <Modal visible animationType="fade" presentationStyle="fullScreen" statusBarTranslucent onRequestClose={finish}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, backgroundColor: GROUND, paddingTop: insets.top, paddingBottom: insets.bottom + spacing.lg }}>
        <View style={{ alignItems: 'center', paddingTop: spacing.lg, minHeight: 40 }}>
          {queue.length > 1 && (
            <CustomText variant="label" color="rgba(255,255,255,0.5)">{index + 1} of {queue.length}</CustomText>
          )}
        </View>
        <CelebrationPage key={current.achievementId} unlock={current} unit={unit} />
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {queue.length > 1 && (
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm }}>
              {queue.map((u, i) => (
                <View key={u.achievementId} style={{ width: i === index ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i === index ? colors.accent : 'rgba(255,255,255,0.3)' }} />
              ))}
            </View>
          )}
          <PrimaryButton label={last ? 'Done' : 'Next'} onPress={last ? finish : () => setIndex(i => i + 1)} />
        </View>
      </View>
    </Modal>
  );
};
