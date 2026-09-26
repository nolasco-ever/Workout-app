import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../data/auth/AuthProvider';
import { useBuddies, BuddyWithCard } from '../../data/hooks/useBuddies';
import { Buddy } from '../../data/models';
import { acceptBuddyRequest, refreshPublicProfile } from '../../data/services/buddyService';
import { dateLabel } from '../../components/charts/scale';
import { CustomText } from '../../components/text/customText';
import { SurfaceCard } from '../../components/cards/SurfaceCard';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { Icon } from '../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../components/icons/icon-library';
import { Avatar } from '../../components/buddies/Avatar';
import { useTheme } from '../../theme';
import { BuddyRoutes } from './routes';

/** One line of what a buddy's card says: streak, last workout, last cycle. */
export const buddySummary = (b: BuddyWithCard): string => {
  const c = b.card;
  if (!c) return 'No workouts logged yet';
  const parts: string[] = [];
  if (c.currentStreakDays > 0) parts.push(`${c.currentStreakDays}-day streak`);
  parts.push(c.lastWorkoutDate ? `Last workout ${dateLabel(c.lastWorkoutDate)}` : 'No workouts yet');
  if (c.lastCycleCompletionRate !== null) parts.push(`${Math.round(c.lastCycleCompletionRate * 100)}% last cycle`);
  return parts.join(' · ');
};

/**
 * Your buddies: requests to answer, the people you train alongside, and
 * the two ways to add someone (show your Iron Card, or scan theirs).
 */
export const BuddiesScreen = () => {
  const navigation = useNavigation<NavigationProp<BuddyRoutes>>();
  const { colors, spacing, radius } = useTheme();
  const { uid, profile } = useAuth();
  const { loading, buddies, incoming, outgoing } = useBuddies();
  const [busy, setBusy] = useState<string | null>(null);

  // Keep my own card current so buddies see today's numbers.
  useEffect(() => {
    if (uid) refreshPublicProfile(uid, profile).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      console.warn(err);
      Alert.alert('Something went wrong', 'Try again in a moment.');
    } finally {
      setBusy(null);
    }
  };

  const accept = (b: Buddy) => run(`accept-${b.userId}`, () => acceptBuddyRequest(uid!, profile, b));
  const openCard = (b: Buddy) => navigation.navigate('BuddyCardScreen', { uid: b.userId, displayName: b.displayName ?? null });

  const empty = !loading && buddies.length === 0 && incoming.length === 0 && outgoing.length === 0;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}>
        {/* Add */}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton label="My Iron Card" icon={generalIcons.qrCode} variant="outline" onPress={() => navigation.navigate('MyCardScreen')} />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton label="Scan a card" icon={generalIcons.scan} onPress={() => navigation.navigate('ScanCardScreen')} />
          </View>
        </View>

        {loading && <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />}

        {empty && (
          <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' }}>
              <Icon icon={generalIcons.users} size={32} color={colors.accent} />
            </View>
            <CustomText variant="heading" centered>Train with people you know</CustomText>
            <CustomText variant="body" color={colors.inkMuted} centered>
              Buddies see each other's streaks, finished workouts and shared plans. Never your sets or your weight. Show your Iron Card or scan a buddy's to get started.
            </CustomText>
          </View>
        )}

        {incoming.length > 0 && (
          <View style={{ gap: spacing.sm }}>
            <CustomText variant="overline" color={colors.inkMuted}>Requests</CustomText>
            <SurfaceCard style={{ padding: 0 }}>
              {incoming.map((b, i) => (
                <TouchableOpacity key={b.userId} onPress={() => openCard(b)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
                  <Avatar uri={b.photoUrl} name={b.displayName} />
                  <View style={{ flex: 1 }}>
                    <CustomText variant="bodyStrong">{b.displayName ?? 'Someone'}</CustomText>
                    <CustomText variant="caption" color={colors.inkMuted}>wants to be buddies · tap to see their card</CustomText>
                  </View>
                  <TouchableOpacity
                    onPress={() => accept(b)}
                    disabled={busy !== null}
                    style={{ paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.accent, opacity: busy && busy !== `accept-${b.userId}` ? 0.5 : 1 }}
                  >
                    {busy === `accept-${b.userId}` ? <ActivityIndicator color={colors.onAccent} /> : <CustomText variant="label" color={colors.onAccent}>Accept</CustomText>}
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </SurfaceCard>
          </View>
        )}

        {buddies.length > 0 && (
          <View style={{ gap: spacing.sm }}>
            <CustomText variant="overline" color={colors.inkMuted}>Buddies · {buddies.length}</CustomText>
            <SurfaceCard style={{ padding: 0 }}>
              {buddies.map((b, i) => (
                <TouchableOpacity
                  key={b.userId}
                  onPress={() => navigation.navigate('BuddyCardScreen', { uid: b.userId, displayName: b.card?.displayName ?? b.displayName ?? null })}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}
                >
                  <Avatar uri={b.card?.photoUrl ?? b.photoUrl} name={b.card?.displayName ?? b.displayName} />
                  <View style={{ flex: 1 }}>
                    <CustomText variant="bodyStrong">{b.card?.displayName ?? b.displayName ?? 'Buddy'}</CustomText>
                    <CustomText variant="caption" color={colors.inkMuted}>{buddySummary(b)}</CustomText>
                  </View>
                  {b.card?.currentStreakDays ? <Icon icon={generalIcons.flame} size={18} color={colors.accent} /> : null}
                  <Icon icon={directionIcons.angleRight} size={20} color={colors.inactive} />
                </TouchableOpacity>
              ))}
            </SurfaceCard>
          </View>
        )}

        {outgoing.length > 0 && (
          <View style={{ gap: spacing.sm }}>
            <CustomText variant="overline" color={colors.inkMuted}>Waiting on</CustomText>
            <SurfaceCard style={{ padding: 0 }}>
              {outgoing.map((b, i) => (
                <TouchableOpacity key={b.userId} onPress={() => openCard(b)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
                  <Avatar uri={b.photoUrl} name={b.displayName} />
                  <View style={{ flex: 1 }}>
                    <CustomText variant="bodyStrong">{b.displayName ?? 'Someone'}</CustomText>
                    <CustomText variant="caption" color={colors.inkMuted}>Request sent</CustomText>
                  </View>
                  <Icon icon={directionIcons.angleRight} size={20} color={colors.inactive} />
                </TouchableOpacity>
              ))}
            </SurfaceCard>
          </View>
        )}

        {buddies.length > 0 && (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Activity" icon={generalIcons.flame} variant="quiet" onPress={() => navigation.navigate('BuddyActivityScreen')} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Shared plans" icon={generalIcons.dumbbell} variant="quiet" onPress={() => navigation.navigate('BuddyPlansScreen')} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
