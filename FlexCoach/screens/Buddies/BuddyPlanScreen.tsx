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
 * A buddy's shared plan, read-only, with a button to save your own copy.
 * The copy is yours: editing or activating it changes nothing of theirs.
 */
export const BuddyPlanScreen = () => {
  const navigation = useNavigation<NavigationProp<BuddyRoutes & AppStackParams>>();
  const { params } = useRoute<RouteProp<BuddyRoutes, 'BuddyPlanScreen'>>();
  const { colors, spacing } = useTheme();
  const { uid } = useAuth();
  const { plans } = usePlans();
  const [plan, setPlan] = useState<Plan | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const alreadyCopied = plans.find(p => p.sharedFrom?.planId === params.planId && p.sharedFrom.userId === params.ownerUid && p.status !== 'archived');

  useEffect(() => {
    readDoc<Plan>(paths.plan(params.ownerUid, params.planId))
      .then(setPlan)
      .catch(() => setPlan(null));
  }, [params.ownerUid, params.planId]);

  useLayoutEffect(() => {
    (navigation as any).setOptions({ title: plan?.name ?? 'Plan' });
  }, [navigation, plan?.name]);

  const save = async () => {
    if (!uid || !plan) return;
    setBusy(true);
    try {
      const copy = await copyBuddyPlan(uid, plan, { uid: params.ownerUid, displayName: params.ownerName });
      Alert.alert('Saved to My plans', `${copy.name} is under "From buddies". Edit it or activate it whenever you like.`, [
        { text: 'Later', style: 'cancel' },
        { text: 'Open it', onPress: () => navigation.navigate('PlansStack', { screen: 'PlanOverviewScreen', initial: false, params: { planId: copy.id } }) },
      ]);
    } catch (err) {
      console.warn(err);
      Alert.alert('Something went wrong', 'The plan was not saved. Try again.');
    } finally {
      setBusy(false);
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
          {alreadyCopied && <CustomText variant="caption" color={colors.inkMuted} centered>You already have a copy: "{alreadyCopied.name}" in My plans.</CustomText>}
          <PrimaryButton label={alreadyCopied ? 'Save another copy' : 'Save to my plans'} variant={alreadyCopied ? 'outline' : 'filled'} busy={busy} onPress={save} />
          <CustomText variant="caption" color={colors.inkMuted} centered>Your copy is yours to edit. Changes {params.ownerName?.split(' ')[0] ?? 'they'} make later don't carry over.</CustomText>
        </View>
      )}
    </SafeAreaView>
  );
};
