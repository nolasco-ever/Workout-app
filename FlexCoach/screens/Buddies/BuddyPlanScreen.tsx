import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../data/auth/AuthProvider';
import { Plan } from '../../data/models';
import { readDoc } from '../../data/repositories/base';
import { paths } from '../../data/firebase/paths';
import { copyBuddyPlan } from '../../data/services/buddyService';
import { usePlans } from '../../data/hooks/usePlans';
import { CustomText } from '../../components/text/customText';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { PlanSummaryCard } from '../Plans/components/PlanSummaryCard';
import { AppStackParams } from '../../appNavigators/AppStack';
import { useTheme } from '../../theme';
import { BuddyRoutes } from './routes';

/**
 * A buddy's shared plan, read-only, with two ways to take it: use it and
 * keep it in sync with the buddy's edits, or save an independent copy.
 * Either way, activating or editing it changes nothing of theirs.
 */
export const BuddyPlanScreen = () => {
  const navigation = useNavigation<NavigationProp<BuddyRoutes & AppStackParams>>();
  const { params } = useRoute<RouteProp<BuddyRoutes, 'BuddyPlanScreen'>>();
  const { colors, spacing } = useTheme();
  const { uid } = useAuth();
  const { plans } = usePlans();
  const [plan, setPlan] = useState<Plan | null | undefined>(undefined);
  const [busy, setBusy] = useState<'sync' | 'copy' | null>(null);
  const mine = plans.filter(p => p.sharedFrom?.planId === params.planId && p.sharedFrom.userId === params.ownerUid && p.status !== 'archived');
  const alreadySynced = mine.find(p => p.sharedFrom?.synced);
  const alreadyCopied = mine.find(p => !p.sharedFrom?.synced);
  const first = params.ownerName?.split(' ')[0] ?? 'they';

  useEffect(() => {
    readDoc<Plan>(paths.plan(params.ownerUid, params.planId))
      .then(setPlan)
      .catch(() => setPlan(null));
  }, [params.ownerUid, params.planId]);

  useLayoutEffect(() => {
    (navigation as any).setOptions({ title: plan?.name ?? 'Plan' });
  }, [navigation, plan?.name]);

  const save = async (synced: boolean) => {
    if (!uid || !plan) return;
    setBusy(synced ? 'sync' : 'copy');
    try {
      const copy = await copyBuddyPlan(uid, plan, { uid: params.ownerUid, displayName: params.ownerName }, synced);
      Alert.alert(
        'Saved to My plans',
        synced
          ? `${copy.name} is under "From buddies" and follows ${first}'s edits. Activate it whenever you like.`
          : `${copy.name} is under "From buddies". Edit it or activate it whenever you like.`,
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Open it', onPress: () => navigation.navigate('PlansStack', { screen: 'PlanOverviewScreen', initial: false, params: { planId: copy.id } }) },
        ],
      );
    } catch (err) {
      console.warn(err);
      Alert.alert('Something went wrong', 'The plan was not saved. Try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        {plan === undefined ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />
        ) : plan === null ? (
          <CustomText variant="body" color={colors.inkMuted} centered>This plan isn't shared any more.</CustomText>
        ) : (
          <>
            <View>
              <CustomText variant="overline" color={colors.accent}>Created by {params.ownerName ?? 'a buddy'}</CustomText>
              <CustomText variant="title">{plan.name}</CustomText>
              {plan.description ? <CustomText variant="body" color={colors.inkMuted}>{plan.description}</CustomText> : null}
            </View>
            <PlanSummaryCard plan={plan} />
          </>
        )}
      </ScrollView>
      {plan && (
        <View style={{ padding: spacing.lg, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line }}>
          {alreadySynced && <CustomText variant="caption" color={colors.inkMuted} centered>You're already using this plan in sync: "{alreadySynced.name}" in My plans.</CustomText>}
          {!alreadySynced && alreadyCopied && <CustomText variant="caption" color={colors.inkMuted} centered>You already have a copy: "{alreadyCopied.name}" in My plans.</CustomText>}
          {!alreadySynced && <PrimaryButton label="Use it and keep in sync" busy={busy === 'sync'} disabled={busy === 'copy'} onPress={() => save(true)} />}
          <PrimaryButton label={alreadyCopied ? 'Save another copy' : 'Save a copy'} variant={alreadySynced ? 'filled' : 'outline'} busy={busy === 'copy'} disabled={busy === 'sync'} onPress={() => save(false)} />
          <CustomText variant="caption" color={colors.inkMuted} centered>
            In sync: any edits {first} makes to this workout will reflect for you as well. Skipping or moving a workout is always independent and will never affect either buddy's schedule.
          </CustomText>
          <CustomText variant="caption" color={colors.inkMuted} centered>
            Copy: a copy is yours to edit. Any changes your buddy makes will not reflect on your plan.
          </CustomText>
        </View>
      )}
    </SafeAreaView>
  );
};
