import React, { useEffect } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from '../../../components/layout/SafeAreaView';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePlans } from '../../../data/hooks/usePlans';
import { validatePlan } from '../../../data/services/planService';
import { SurfaceCard } from '../../../components/cards/SurfaceCard';
import { CustomText } from '../../../components/text/customText';
import { Icon } from '../../../components/icons/Icon';
import { directionIcons } from '../../../components/icons/icon-library';
import { useTheme } from '../../../theme';
import { PlansStackParams } from '../PlansStack';
import { usePlanEditor } from '../PlanEditorContext';
import { PlanSaveFooter } from '../components/PlanSaveFooter';
import { describeSchedule, GOAL_LABEL } from '../components/planSummary';

/** One section of the plan: what it holds now, and a tap into its editor. */
const Section = ({ title, detail, warn, onPress }: { title: string; detail: string; warn?: boolean; onPress: () => void }) => {
  const { colors, spacing } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel={`Edit ${title.toLowerCase()}`}>
      <SurfaceCard style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ flex: 1, gap: 2 }}>
          <CustomText variant="bodyStrong">{title}</CustomText>
          <CustomText variant="caption" color={warn ? colors.warning : colors.inkMuted}>{detail}</CustomText>
        </View>
        <Icon icon={directionIcons.angleRight} size={18} color={colors.inactive} />
      </SurfaceCard>
    </TouchableOpacity>
  );
};

/**
 * Editing a plan starts here, not at step one: the plan's three parts as
 * tappable sections (basics, workouts, schedule), each opening its own
 * editor and coming straight back, and Save changes at the bottom. So a
 * single exercise swap is a tap into Workouts, a tap on the workout, the
 * swap, and back. Creating a plan still walks the four steps.
 *
 * Opened from the plan page or the cycle review with a `planId`; the
 * editor is started here if it isn't already on this plan.
 */
export const PlanEditScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PlansStackParams>>();
  const { params } = useRoute<RouteProp<PlansStackParams, 'PlanEditScreen'>>();
  const { colors, spacing } = useTheme();
  const { plans } = usePlans();
  const { draft, begin } = usePlanEditor();
  const plan = plans.find(p => p.id === params.planId);

  // Start the editor on this plan unless it is already editing it (coming back from a section).
  const editingThis = draft?.id === params.planId;
  useEffect(() => {
    if (plan && !editingThis) begin(plan, plan);
  }, [plan, editingThis, begin]);

  // The hub can be the modal's first screen (from the cycle review): saving then closes the modal, otherwise it returns to the plan page.
  const first = navigation.getState().routes[0]?.name === 'PlanEditScreen';
  const done = () => (first ? navigation.getParent()?.goBack() : navigation.popToTop());

  if (!draft || !editingThis) return <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }} />;

  const problems = validatePlan(draft);
  const exercises = draft.workouts.reduce((n, w) => n + w.exercises.length, 0);
  const empty = draft.workouts.filter(w => w.exercises.length === 0);
  const workoutsDetail = draft.workouts.length === 0 ? 'No workouts yet' : `${draft.workouts.map(w => w.name).join(', ')} · ${exercises} exercise${exercises === 1 ? '' : 's'}${empty.length ? ` · ${empty.map(w => w.name).join(', ')} empty` : ''}`;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <CustomText variant="body" color={colors.inkMuted} style={{ marginBottom: spacing.xs }}>Tap a part of the plan to change it. Nothing is saved until you save.</CustomText>
        <Section title="Basics" detail={`${draft.name.trim() || 'No name yet'} · ${GOAL_LABEL[draft.goal ?? 'hypertrophy']}${draft.description ? ` · ${draft.description}` : ''}`} warn={!draft.name.trim()} onPress={() => navigation.navigate('PlanBasicsScreen', { mode: 'edit' })} />
        <Section title="Workouts" detail={workoutsDetail} warn={draft.workouts.length === 0 || empty.length > 0} onPress={() => navigation.navigate('PlanWorkoutsScreen', { mode: 'edit' })} />
        <Section title="Schedule" detail={describeSchedule(draft)} onPress={() => navigation.navigate('PlanScheduleScreen', { mode: 'edit' })} />
        {problems.length > 0 && (
          <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
            {problems.map(p => (
              <CustomText key={p.message} variant="caption" color={colors.error}>• {p.message}</CustomText>
            ))}
          </View>
        )}
      </ScrollView>
      <PlanSaveFooter mode="edit" onDone={done} />
    </SafeAreaView>
  );
};
