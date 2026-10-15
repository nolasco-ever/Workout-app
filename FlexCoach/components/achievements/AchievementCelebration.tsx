import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../data/auth/AuthProvider';
import { AchievementUnlock } from '../../data/models';
import { ACHIEVEMENT_FAMILIES, tierLabel } from '../../data/engine/achievements';
import { achievementRepository } from '../../data/repositories/achievementRepository';
import { judgeAchievements, markAchievementsCelebrated } from '../../data/services/achievementService';
import { navigationRef } from '../../navigation/navigationRef';
import { CustomText } from '../text/customText';
import { PrimaryButton } from '../buttons/PrimaryButton';
import { useTheme } from '../../theme';
import { BadgeView, HERO_REST_YAW } from './BadgeView';
import { artFor } from './badgeArt';
import { preloadBadges } from './preloadBadges';

/** Screens where a celebration would interrupt something: it waits until they're left. */
const HOLD_ON = new Set(['BadgeScreen', 'SessionScreen', 'SessionCompleteScreen', 'SessionExercisesScreen', 'CycleReviewScreen', 'ScanCardScreen', 'AuthStack', 'OnboardingStack']);

const BADGE = 280;
const GROUND = '#000000';
/** How far a badge turns, in radians, as its page travels one screen width. */
const SWIPE_TURN = 2.4;
/** Pages this far from the current one keep their live badge; beyond that they draw nothing until swiped near. iOS keeps fewer: each live badge is a full renderer there. */
const LIVE_RADIUS = Platform.OS === 'ios' ? 1 : 2;

/**
 * One page: its own live badge over the words. The badge turns with the
 * swipe (its offset from centre drives the turn) and spins exactly once,
 * as the page first comes into view with its badge drawn.
 */
const Page = ({ unlock, unit, width, progress, live, spun, pageIndex, markSpun, onReady }: { unlock: AchievementUnlock; unit: 'lb' | 'kg'; width: number; progress: number; live: boolean; spun: boolean; pageIndex: number; markSpun: (page: number) => void; onReady?: () => void }) => {
  const { spacing } = useTheme();
  const [ready, setReady] = useState(false);
  const [spinIn, setSpinIn] = useState(0);
  // The one spin: as soon as this page is mostly in view and its badge is drawn, so it is already turning as it lands.
  const arriving = Math.abs(progress) < 0.6;
  useEffect(() => {
    if (!arriving || !ready || spun) return;
    markSpun(pageIndex);
    setSpinIn(1);
  }, [arriving, ready, spun, pageIndex, markSpun]);
  const art = artFor(unlock.tier);
  const yawOffset = Math.abs(progress) < 0.004 ? 0 : progress * SWIPE_TURN;
  return (
    <View style={{ width, alignItems: 'center', gap: spacing.xl, paddingHorizontal: spacing.xl }}>
      <View style={{ width: BADGE, height: BADGE }}>
        {live && <BadgeView family={unlock.family} tier={unlock.tier} restYaw={HERO_REST_YAW} spinIn={spinIn} yawOffset={yawOffset} unlockedAt={unlock.unlockedAt} onReady={() => { setReady(true); onReady?.(); }} style={{ width: BADGE, height: BADGE }} />}
      </View>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <CustomText variant="overline" color={art.light}>{unlock.tier > 1 ? 'Badge upgraded' : 'Badge unlocked'}</CustomText>
        <CustomText variant="display" color="#FFFFFF" centered>{tierLabel(unlock.family, unlock.threshold, unit)}</CustomText>
      </View>
    </View>
  );
};

const familyOrder = new Map(ACHIEVEMENT_FAMILIES.map((f, i) => [f.id, i]));
const byMoment = (a: AchievementUnlock, b: AchievementUnlock): number => a.unlockedAt - b.unlockedAt || (familyOrder.get(a.family) ?? 0) - (familyOrder.get(b.family) ?? 0) || a.tier - b.tier;

/**
 * Shows the celebration for every badge the owner hasn't seen yet, as a
 * full-screen modal over whatever is open. The first badge spins in; with
 * several unlocks the pages swipe, each with its own live badge that turns
 * with the swipe and gets a push as it lands. Waits while a workout, its
 * summary, a report or a badge is on screen. Also runs the one-time
 * catch-up that grants badges already earned. Mount once at the app root
 * for signed-in, onboarded accounts.
 */
export const AchievementCelebration = () => {
  const { uid, profile } = useAuth();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const unit = profile?.weightUnit ?? 'lb';
  const [unlocks, setUnlocks] = useState<AchievementUnlock[]>([]);
  const [queue, setQueue] = useState<AchievementUnlock[] | null>(null);
  const [index, setIndex] = useState(0);
  const [scrollX, setScrollX] = useState(0);
  const [spun, setSpun] = useState<Record<number, boolean>>({});
  const [shown, setShown] = useState(false); // the first badge is drawn: the modal fades in over it
  // Badges this session has already celebrated. The stamp is written to Firestore after Done, and the watch
  // reports the documents one by one; without this, the same badges came straight back as a second celebration.
  const [stamped, setStamped] = useState<ReadonlySet<string>>(() => new Set());
  const fade = useRef(new Animated.Value(0)).current;
  const preparing = useRef(false);
  const markSpun = useCallback((page: number) => setSpun(s => (s[page] ? s : { ...s, [page]: true })), []);
  const [route, setRoute] = useState<string | undefined>(() => navigationRef.getCurrentRoute()?.name);
  const caughtUp = useRef<string | null>(null);
  const pager = useRef<React.ElementRef<typeof ScrollView>>(null);

  useEffect(() => {
    if (!uid) return;
    return achievementRepository.watch(uid, setUnlocks);
  }, [uid]);

  // Every earned badge goes into the model cache as soon as it is known, so any of them opens at once.
  useEffect(() => {
    preloadBadges(unlocks.map(u => ({ family: u.family, tier: u.tier })));
  }, [unlocks]);

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

  const pending = useMemo(() => unlocks.filter(u => !u.celebratedAt && !stamped.has(u.achievementId)).sort(byMoment), [unlocks, stamped]);
  const held = !!route && HOLD_ON.has(route);
  // The celebration opens only once every badge in it is cached, so no page ever opens blank.
  useEffect(() => {
    if (queue || pending.length === 0 || held || preparing.current) return;
    preparing.current = true;
    let live = true;
    preloadBadges(pending.map(u => ({ family: u.family, tier: u.tier }))).then(() => {
      preparing.current = false;
      if (!live) return;
      setQueue(pending);
      setIndex(0);
      setScrollX(0);
      setSpun({});
      setShown(false);
      fade.setValue(0);
    });
    return () => {
      live = false;
    };
  }, [pending, held, queue]);

  // Fade in only once the first page's badge is actually drawn, so there is never a black frame.
  const reveal = () => {
    if (shown) return;
    setShown(true);
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  };
  useEffect(() => {
    if (!queue || shown) return;
    const t = setTimeout(reveal, 1500); // never wait forever on a renderer that stays quiet
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, shown]);

  const finish = () => {
    if (!queue || !uid) return;
    const ids = queue.map(u => u.achievementId);
    setStamped(s => new Set([...s, ...ids]));
    setQueue(null);
    markAchievementsCelebrated(uid, ids).catch(err => console.warn('celebration stamp failed', err));
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setScrollX(e.nativeEvent.contentOffset.x);
  // Once a page settles, it becomes current and its badge gets a push.
  const onSettle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    setScrollX(page * width);
    if (page !== index) setIndex(page);
  };
  const goTo = (page: number) => pager.current?.scrollTo({ x: page * width, animated: true });

  if (!queue) return null;
  const last = index >= queue.length - 1;
  return (
    <Modal visible animationType="none" presentationStyle="fullScreen" statusBarTranslucent onRequestClose={finish}>
      <StatusBar barStyle="light-content" />
      {/* An opaque backdrop from the first frame: the fade is of the content only, so nothing lighter ever shows through. */}
      <View style={{ flex: 1, backgroundColor: GROUND }}>
      <Animated.View style={{ flex: 1, backgroundColor: GROUND, paddingTop: insets.top, paddingBottom: insets.bottom + spacing.lg, opacity: fade }} pointerEvents={shown ? 'auto' : 'none'}>
        <View style={{ alignItems: 'center', paddingTop: spacing.lg, minHeight: 40 }}>
          {queue.length > 1 && (
            <CustomText variant="label" color="rgba(255,255,255,0.5)">{index + 1} of {queue.length}</CustomText>
          )}
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ScrollView ref={pager} horizontal pagingEnabled showsHorizontalScrollIndicator={false} scrollEnabled={queue.length > 1} onScroll={onScroll} scrollEventThrottle={16} onMomentumScrollEnd={onSettle} onScrollEndDrag={e => { if (Math.abs(e.nativeEvent.velocity?.x ?? 0) < 0.05) onSettle(e); }} style={{ flexGrow: 0 }}>
            {queue.map((u, i) => (
              <Page key={u.achievementId} unlock={u} unit={unit} width={width} progress={scrollX / width - i} live={Math.abs(i - index) <= LIVE_RADIUS} spun={!!spun[i]} pageIndex={i} markSpun={markSpun} onReady={i === 0 ? reveal : undefined} />
            ))}
          </ScrollView>
        </View>
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {queue.length > 1 && (
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm }}>
              {queue.map((u, i) => (
                <View key={u.achievementId} style={{ width: i === index ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i === index ? colors.accent : 'rgba(255,255,255,0.3)' }} />
              ))}
            </View>
          )}
          <PrimaryButton label={last ? 'Done' : 'Next'} onPress={last ? finish : () => goTo(index + 1)} />
        </View>
      </Animated.View>
      </View>
    </Modal>
  );
};
