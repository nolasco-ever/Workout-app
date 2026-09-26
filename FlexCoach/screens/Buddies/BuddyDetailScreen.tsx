import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../data/auth/AuthProvider';
import { Plan, PublicProfile } from '../../data/models';
import { buddyRepository } from '../../data/repositories/buddyRepository';
import { planRepository } from '../../data/repositories/planRepository';
import { removeBuddy } from '../../data/services/buddyService';
import { describeSchedule } from '../Plans/components/planSummary';
import { CustomText } from '../../components/text/customText';
import { SurfaceCard } from '../../components/cards/SurfaceCard';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { Icon } from '../../components/icons/Icon';
import { directionIcons } from '../../components/icons/icon-library';
import { IronCard } from '../../components/buddies/IronCard';
import { useTheme } from '../../theme';
import { BuddyRoutes } from './routes';

/** One buddy: their live Iron Card, the plans they share, and the way out. */
export const BuddyDetailScreen = () => {
  const navigation = useNavigation<NavigationProp<BuddyRoutes>>();
  const { params } = useRoute<RouteProp<BuddyRoutes, 'BuddyDetailScreen'>>();
  const { colors, spacing } = useTheme();
  const { uid, profile } = useAuth();
  const unit = profile?.weightUnit ?? 'lb';
  const [card, setCard] = useState<PublicProfile | null | undefined>(undefined);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => buddyRepository.watchPublicProfile(params.uid, setCard), [params.uid]);
  useEffect(() => {
    planRepository
      .listSharedBy(params.uid)
      .then(list => setPlans(list.filter(p => p.status !== 'archived')))
      .catch(() => setPlans([]));
  }, [params.uid, card?.sharedPlanCount]);

  useLayoutEffect(() => {
    (navigation as any).setOptions({ title: card?.displayName ?? params.displayName ?? 'Buddy' });
  }, [navigation, card?.displayName, params.displayName]);

  const name = card?.displayName ?? params.displayName ?? 'this buddy';
  const remove = () =>
    Alert.alert(`Remove ${name}?`, "You'll stop seeing each other's activity and plans. Either of you can add the other again.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          if (!uid) return;
          setBusy(true);
          try {
            await removeBuddy(uid, params.uid);
            navigation.goBack();
          } finally {
            setBusy(false);
          }
        },
      },
    ]);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}>
        {card === undefined ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />
        ) : card === null ? (
          <CustomText variant="body" color={colors.inkMuted} centered>{name} hasn't logged a workout yet, so there's no card to show.</CustomText>
        ) : (
          <IronCard card={card} unit={unit} />
        )}

        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Shared plans</CustomText>
          {plans === null ? (
            <ActivityIndicator color={colors.accent} />
          ) : plans.length === 0 ? (
            <SurfaceCard>
              <CustomText variant="body" color={colors.inkMuted}>{name} hasn't shared any plans with buddies.</CustomText>
            </SurfaceCard>
          ) : (
            <SurfaceCard style={{ padding: 0 }}>
              {plans.map((p, i) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => navigation.navigate('BuddyPlanScreen', { ownerUid: params.uid, planId: p.id, ownerName: card?.displayName ?? params.displayName ?? null })}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}
                >
                  <View style={{ flex: 1 }}>
                    <CustomText variant="bodyStrong">{p.name}</CustomText>
                    <CustomText variant="caption" color={colors.inkMuted}>{p.workouts.length} workout{p.workouts.length === 1 ? '' : 's'} · {describeSchedule(p)}</CustomText>
                  </View>
                  <Icon icon={directionIcons.angleRight} size={20} color={colors.inactive} />
                </TouchableOpacity>
              ))}
            </SurfaceCard>
          )}
        </View>

        <PrimaryButton label="Remove buddy" variant="quiet" busy={busy} onPress={remove} />
      </ScrollView>
    </SafeAreaView>
  );
};
