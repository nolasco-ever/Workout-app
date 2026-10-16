import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from '../../../components/layout/SafeAreaView';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { validatePlan } from '../../../data/services/planService';
import { CustomText } from '../../../components/text/customText';
import { useTheme } from '../../../theme';
import { PlansStackParams } from '../PlansStack';
import { usePlanEditor } from '../PlanEditorContext';
import { PlanSummaryCard } from '../components/PlanSummaryCard';
import { PlanSaveFooter } from '../components/PlanSaveFooter';
import { PlanWorkspace } from '../components/PlanWorkspace';
import { useLayoutFamily } from '../../../components/layout/useLayoutFamily';

/** The creator's last step: the whole plan as it will be saved, and the buttons that save it. */
export const PlanReviewScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PlansStackParams>>();
  const { params } = useRoute<RouteProp<PlansStackParams, 'PlanReviewScreen'>>();
  const { colors, spacing } = useTheme();
  const { draft } = usePlanEditor();
  const wide = useLayoutFamily() === 'wide';
  if (!draft) return null;
  if (wide) return <PlanWorkspace mode={params.mode} initial="review" onDone={() => navigation.popToTop()} />;

  const problems = validatePlan(draft);

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
      </ScrollView>
      <PlanSaveFooter mode={params.mode} onDone={() => navigation.popToTop()} />
    </SafeAreaView>
  );
};
