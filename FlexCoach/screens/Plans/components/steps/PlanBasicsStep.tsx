import React from 'react';
import { ScrollView, View } from 'react-native';
import { KeyboardAvoiding } from '../../../../components/layout/KeyboardAvoiding';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GOAL_DEFAULTS, PlanGoal } from '../../../../data/models';
import { CustomText } from '../../../../components/text/customText';
import { TextField } from '../../../../components/inputs/TextField';
import { ChoiceChips } from '../../../../components/inputs/ChoiceChips';
import { useTheme } from '../../../../theme';
import { EditorMode, PlansStackParams } from '../../PlansStack';
import { StepRoot } from '../StepRoot';
import { usePlanEditor } from '../../PlanEditorContext';
import { StepFooter } from '../StepFooter';
import { GOAL_LABEL } from '../planSummary';

/** The step itself: its own screen on a phone, a pane of the workspace on a wide window. */
export const PlanBasicsStep = ({ mode, embedded = false }: { mode: EditorMode; embedded?: boolean }) => {
  const navigation = useNavigation<NativeStackNavigationProp<PlansStackParams>>();
  const { colors, spacing } = useTheme();
  const { draft, update } = usePlanEditor();
  if (!draft) return null;

  const goal = draft.goal ?? 'hypertrophy';
  const d = GOAL_DEFAULTS[goal];

  return (
    <StepRoot embedded={embedded}>
      <KeyboardAvoiding>
        <ScrollView showsVerticalScrollIndicator={!embedded} contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <TextField
            id="plan-name"
            label="Plan name"
            placeholder="Push Pull Legs"
            value={draft.name}
            onChangeText={name => update(p => ({ ...p, name }))}
            autoFocus={mode === 'create' && !embedded}
            returnKeyType="done"
          />
          <TextField
            id="plan-description"
            label="Description (optional)"
            placeholder="What this plan is for"
            value={draft.description ?? ''}
            onChangeText={description => update(p => ({ ...p, description: description || null }))}
            multiline
          />
          <View style={{ gap: spacing.sm }}>
            <CustomText variant="overline" color={colors.inkMuted}>Training goal</CustomText>
            <ChoiceChips<PlanGoal>
              options={(['strength', 'hypertrophy', 'endurance'] as PlanGoal[]).map(g => ({ value: g, label: GOAL_LABEL[g] }))}
              value={goal}
              onChange={g => update(p => ({ ...p, goal: g }))}
            />
            <CustomText variant="caption" color={colors.inkMuted}>
              Sets the defaults for exercises you add: {d.sets} sets of {d.repRangeMin} to {d.repRangeMax} reps with {d.restSec}s rest. Every exercise stays editable.
            </CustomText>
          </View>
        </ScrollView>
        {!embedded && (mode === 'edit' ? (
          <StepFooter label="Done" problem={draft.name.trim() ? null : 'Give the plan a name.'} onPress={() => navigation.goBack()} />
        ) : (
          <StepFooter label="Next: Workouts" problem={draft.name.trim() ? null : 'Give the plan a name.'} onPress={() => navigation.navigate('PlanWorkoutsScreen', { mode })} />
        ))}
      </KeyboardAvoiding>
    </StepRoot>
  );
};
