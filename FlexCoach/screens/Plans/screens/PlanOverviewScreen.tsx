import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../data/auth/AuthProvider';
import { usePlans } from '../../../data/hooks/usePlans';
import { useWorkoutHome } from '../../../data/hooks/useWorkoutHome';
import { activatePlan, archivePlan, deactivatePlan, duplicatePlan } from '../../../data/services/planService';
import { planRepository } from '../../../data/repositories/planRepository';
import { CustomText } from '../../../components/text/customText';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { useTheme } from '../../../theme';
import { PlansStackParams } from '../PlansStack';
import { usePlanEditor } from '../PlanEditorContext';
import { PlanSummaryCard } from '../components/PlanSummaryCard';
import { StartDateSheet } from '../components/StartDateSheet';

export const PlanOverviewScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PlansStackParams>>();
  const { params } = useRoute<RouteProp<PlansStackParams, 'PlanOverviewScreen'>>();
  const { colors, spacing } = useTheme();
  const { uid } = useAuth();
  const { plans } = usePlans();
  const home = useWorkoutHome();
  const editor = usePlanEditor();
  const [busy, setBusy] = useState<string | null>(null);
  const [pickingStart, setPickingStart] = useState(false);
  const plan = plans.find(p => p.id === params.planId);

  if (!plan || !uid) return <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.ground }} />;

  const run = (key: string, fn: () => Promise<void>) => async () => {
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      console.warn(err);
    } finally {
      setBusy(null);
    }
  };

  const edit = () => {
    editor.begin(plan, plan);
    navigation.navigate('PlanBasicsScreen', { mode: 'edit' });
  };

  const confirm = (title: string, message: string, label: string, fn: () => Promise<void>, destructive = false) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: label, style: destructive ? 'destructive' : 'default', onPress: run(label, fn) },
    ]);

  const isActive = plan.status === 'active';
  const activeCycle = home.plan?.id === plan.id ? home.cycle : null;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View>
          <CustomText variant="overline" color={isActive ? colors.accent : colors.inkMuted}>
            {isActive ? 'Active plan' : plan.status === 'archived' ? 'Archived' : 'Inactive'}
          </CustomText>
          <CustomText variant="title">{plan.name}</CustomText>
          {plan.description ? <CustomText variant="body" color={colors.inkMuted}>{plan.description}</CustomText> : null}
        </View>
        <PlanSummaryCard plan={plan} />
        <View style={{ gap: spacing.sm }}>
          {!isActive && plan.status !== 'archived' && (
            <PrimaryButton label="Activate" busy={busy === 'Activate'} onPress={() => setPickingStart(true)} />
          )}
          {plan.status !== 'archived' && <PrimaryButton label="Edit" variant="outline" onPress={edit} />}
          {isActive && (
            <PrimaryButton
              label="Deactivate"
              variant="quiet"
              busy={busy === 'Deactivate'}
              onPress={() => confirm('Deactivate plan?', 'The current cycle closes and the Workout tab empties until you activate a plan.', 'Deactivate', () => deactivatePlan(uid, plan, activeCycle))}
            />
          )}
          <PrimaryButton label="Duplicate" variant="quiet" busy={busy === 'Duplicate'} onPress={run('Duplicate', async () => { await duplicatePlan(uid, plan); navigation.goBack(); })} />
          {plan.status === 'archived' ? (
            <PrimaryButton label="Unarchive" variant="quiet" busy={busy === 'Unarchive'} onPress={run('Unarchive', () => planRepository.unarchive(uid, plan.id))} />
          ) : (
            <PrimaryButton
              label="Archive"
              variant="quiet"
              busy={busy === 'Archive'}
              onPress={() => confirm('Archive plan?', isActive ? 'This also deactivates it and closes the current cycle.' : 'You can unarchive it later.', 'Archive', async () => { await archivePlan(uid, plan, activeCycle); navigation.goBack(); })}
            />
          )}
          {!isActive && (
            <PrimaryButton
              label="Delete"
              variant="quiet"
              busy={busy === 'Delete'}
              onPress={() => confirm('Delete plan?', 'This cannot be undone. Logged sessions are kept.', 'Delete', async () => { await planRepository.remove(uid, plan.id); navigation.goBack(); }, true)}
            />
          )}
        </View>
      </ScrollView>
      <StartDateSheet
        open={pickingStart}
        plan={plan}
        busy={busy === 'Activate'}
        onClose={() => setPickingStart(false)}
        onConfirm={startDate => {
          setPickingStart(false);
          const activate = async () => {
            await activatePlan(uid, plan, startDate);
            navigation.popToTop();
          };
          const other = plans.find(p => p.status === 'active');
          if (other) {
            confirm('Switch plans?', `${other.name} will become inactive and its current cycle will close. You can reactivate it any time.`, 'Activate', activate);
          } else {
            run('Activate', activate)();
          }
        }}
      />
    </SafeAreaView>
  );
};
