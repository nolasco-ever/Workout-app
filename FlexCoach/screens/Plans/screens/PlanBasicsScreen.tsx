import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { GOAL_DEFAULTS, PlanGoal } from '../../../data/models';
import { CustomText } from '../../../components/text/customText';
import { TextField } from '../../../components/inputs/TextField';
import { ChoiceChips } from '../../../components/inputs/ChoiceChips';
import { useTheme } from '../../../theme';
import { PlansStackParams } from '../PlansStack';
import { usePlanEditor } from '../PlanEditorContext';
import { StepFooter } from '../components/StepFooter';
import { GOAL_LABEL } from '../components/planSummary';

export const PlanBasicsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<PlansStackParams>>();
  const { params } = useRoute<RouteProp<PlansStackParams, 'PlanBasicsScreen'>>();
  const { colors, spacing } = useTheme();
  const { draft, update } = usePlanEditor();
  if (!draft) return null;

  const goal = draft.goal ?? 'hypertrophy';
  const d = GOAL_DEFAULTS[goal];

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={100}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }} keyboardShouldPersistTaps="handled">
          <TextField
            id="plan-name"
            label="Plan name"
            placeholder="Push Pull Legs"
            value={draft.name}
            onChangeText={name => update(p => ({ ...p, name }))}
            autoFocus={params.mode === 'create'}
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
        <StepFooter label="Next: Workouts" problem={draft.name.trim() ? null : 'Give the plan a name.'} onPress={() => navigation.navigate('PlanWorkoutsScreen', { mode: params.mode })} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
