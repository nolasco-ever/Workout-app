import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../data/auth/AuthProvider';
import { usePlans } from '../../../data/hooks/usePlans';
import { useWorkoutHome } from '../../../data/hooks/useWorkoutHome';
import { activatePlan, cycleNeedsRestart, saveActivePlan, savePlan, validatePlan } from '../../../data/services/planService';
import { CustomText } from '../../../components/text/customText';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { useTheme } from '../../../theme';
import { PlansStackParams } from '../PlansStack';
import { usePlanEditor } from '../PlanEditorContext';
import { PlanSummaryCard } from '../components/PlanSummaryCard';
import { StartDateSheet } from '../components/StartDateSheet';
import { LocalDate } from '../../../data/models';

export const PlanReviewScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PlansStackParams>>();
  const { params } = useRoute<RouteProp<PlansStackParams, 'PlanReviewScreen'>>();
  const { colors, spacing } = useTheme();
  const { uid } = useAuth();
  const { plans } = usePlans();
  const home = useWorkoutHome();
  const { draft, original, clear } = usePlanEditor();
  const [busy, setBusy] = useState<string | null>(null);
  const [pickingStart, setPickingStart] = useState(false);
  if (!draft || !uid) return null;

  const problems = validatePlan(draft);
  const isActive = original?.status === 'active';
  const restart = isActive && original ? cycleNeedsRestart(original, draft) : false;
  const otherActive = plans.find(p => p.status === 'active' && p.id !== draft.id);

  const finish = () => {
    clear();
    navigation.popToTop();
  };

  const run = (key: string, fn: () => Promise<void>) => async () => {
    setBusy(key);
    try {
      await fn();
      finish();
    } catch (err) {
      console.warn(err);
      Alert.alert('Something went wrong', 'The plan was not saved. Try again.');
    } finally {
      setBusy(null);
    }
  };

  const saveDraft = run('draft', () => savePlan(uid, draft));
  const activate = (startDate: LocalDate) => run('activate', async () => { await activatePlan(uid, draft, startDate); });
  const saveChanges = run('save', async () => {
    if (isActive && original) {
      await saveActivePlan(uid, original, draft, home.cycle);
    } else {
      await savePlan(uid, draft);
    }
  });

  const confirmActivate = (startDate: LocalDate) => {
    setPickingStart(false);
    if (otherActive) {
      Alert.alert('Switch plans?', `${otherActive.name} will become inactive and its current cycle will close.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Activate', onPress: activate(startDate) },
      ]);
    } else {
      activate(startDate)();
    }
  };

  const confirmSave = () =>
    restart
      ? Alert.alert('Restart the cycle?', 'You changed the schedule or the set of workouts. The current cycle will close and a new one starts today.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save and restart', onPress: saveChanges },
        ])
      : saveChanges();

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View>
          <CustomText variant="title">{draft.name}</CustomText>
          {draft.description ? <CustomText variant="body" color={colors.inkMuted}>{draft.description}</CustomText> : null}
        </View>
        {problems.length > 0 && (
          <View style={{ gap: spacing.xs }}>
            {problems.map(p => (
              <CustomText key={p.message} variant="caption" color={colors.error}>• {p.message}</CustomText>
            ))}
          </View>
        )}
        <PlanSummaryCard plan={draft} />
        {isActive && (
          <CustomText variant="caption" color={restart ? colors.warning : colors.inkMuted}>
            {restart
              ? 'Schedule or workouts changed: saving restarts the current cycle.'
              : 'Exercise changes apply from your next session. The current cycle keeps going.'}
          </CustomText>
        )}
      </ScrollView>
      <View style={{ padding: spacing.lg, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line }}>
        {params.mode === 'create' || !isActive ? (
          <>
            <PrimaryButton label="Activate plan" disabled={problems.length > 0} busy={busy === 'activate'} onPress={() => setPickingStart(true)} />
            <PrimaryButton label={params.mode === 'create' ? 'Save as draft' : 'Save changes'} variant="outline" disabled={problems.length > 0} busy={busy === 'draft' || busy === 'save'} onPress={params.mode === 'create' ? saveDraft : saveChanges} />
          </>
        ) : (
          <PrimaryButton label={restart ? 'Save and restart cycle' : 'Save changes'} disabled={problems.length > 0} busy={busy === 'save'} onPress={confirmSave} />
        )}
      </View>
      <StartDateSheet open={pickingStart} plan={draft} busy={busy === 'activate'} onClose={() => setPickingStart(false)} onConfirm={confirmActivate} />
    </SafeAreaView>
  );
};
