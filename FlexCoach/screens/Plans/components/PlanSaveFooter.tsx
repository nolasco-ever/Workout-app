import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { useAuth } from '../../../data/auth/AuthProvider';
import { usePlans } from '../../../data/hooks/usePlans';
import { useWorkoutHome } from '../../../data/hooks/useWorkoutHome';
import { activatePlan, cycleNeedsRestart, saveActivePlan, savePlan, validatePlan } from '../../../data/services/planService';
import { LocalDate } from '../../../data/models';
import { CustomText } from '../../../components/text/customText';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { useTheme } from '../../../theme';
import { usePlanEditor } from '../PlanEditorContext';
import { StartDateSheet } from './StartDateSheet';

/**
 * The bottom bar that commits the editor's draft: Activate and Save as
 * draft while creating, Activate and Save changes for an inactive plan,
 * Save changes for the active one (a schedule change lays out the rest of
 * its cycle again). Shared by
 * the creator's last step and the edit hub, so both save the same way.
 * `onDone` runs after a successful save, once the editor is cleared.
 */
export const PlanSaveFooter = ({ mode, onDone }: { mode: 'create' | 'edit'; onDone: () => void }) => {
  const { colors, spacing } = useTheme();
  const { uid } = useAuth();
  const { plans } = usePlans();
  const home = useWorkoutHome();
  const { draft, original, clear, stopAutosave } = usePlanEditor();
  const [busy, setBusy] = useState<string | null>(null);
  const [pickingStart, setPickingStart] = useState(false);
  if (!draft || !uid) return null;

  const problems = validatePlan(draft);
  const isActive = original?.status === 'active';
  const restart = isActive && original ? cycleNeedsRestart(original, draft) : false;
  const otherActive = plans.find(p => p.status === 'active' && p.id !== draft.id);

  const run = (key: string, fn: () => Promise<void>) => async () => {
    setBusy(key);
    stopAutosave();
    try {
      await fn();
      clear();
      onDone();
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


  return (
    <>
      <View style={{ padding: spacing.lg, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.ground }}>
        {isActive && (
          <CustomText variant="caption" color={restart ? colors.warning : colors.inkMuted} centered>
            {restart ? 'Schedule or workouts changed: the rest of this cycle follows the new plan.' : 'Exercise changes apply from your next session. The current cycle keeps going.'}
          </CustomText>
        )}
        {mode === 'create' || !isActive ? (
          <>
            <PrimaryButton label="Activate plan" disabled={problems.length > 0} busy={busy === 'activate'} onPress={() => setPickingStart(true)} />
            <PrimaryButton label={mode === 'create' ? 'Save as draft' : 'Save changes'} variant="outline" disabled={problems.length > 0} busy={busy === 'draft' || busy === 'save'} onPress={mode === 'create' ? saveDraft : saveChanges} />
          </>
        ) : (
          <PrimaryButton label="Save changes" disabled={problems.length > 0} busy={busy === 'save'} onPress={saveChanges} />
        )}
      </View>
      <StartDateSheet open={pickingStart} plan={draft} busy={busy === 'activate'} onClose={() => setPickingStart(false)} onConfirm={confirmActivate} />
    </>
  );
};
