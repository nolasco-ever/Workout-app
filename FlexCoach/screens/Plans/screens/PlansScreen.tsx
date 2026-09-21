import React from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../../data/auth/AuthProvider';
import { usePlans } from '../../../data/hooks/usePlans';
import { newPlan } from '../../../data/services/planService';
import { Plan } from '../../../data/models';
import { CustomText } from '../../../components/text/customText';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { SurfaceCard } from '../../../components/cards/SurfaceCard';
import { Icon } from '../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../components/icons/icon-library';
import { useTheme } from '../../../theme';
import { PlansStackParams } from '../PlansStack';
import { usePlanEditor } from '../PlanEditorContext';
import { describeSchedule } from '../components/planSummary';

const PlanRow = ({ plan, onPress }: { plan: Plan; onPress: () => void }) => {
  const { colors, spacing } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }}>
      <View style={{ flex: 1 }}>
        <CustomText variant="bodyStrong">{plan.name || 'Untitled plan'}</CustomText>
        <CustomText variant="caption" color={colors.inkMuted}>
          {plan.workouts.length} workout{plan.workouts.length === 1 ? '' : 's'} · {describeSchedule(plan)}
        </CustomText>
      </View>
      <Icon icon={directionIcons.angleRight} color={colors.inactive} size={20} />
    </TouchableOpacity>
  );
};

export const PlansScreen = () => {
  const navigation = useNavigation<StackNavigationProp<PlansStackParams>>();
  const { colors, spacing } = useTheme();
  const { uid } = useAuth();
  const { plans, loading } = usePlans();
  const editor = usePlanEditor();

  const active = plans.filter(p => p.status === 'active');
  const inactive = plans.filter(p => p.status === 'draft');
  const archived = plans.filter(p => p.status === 'archived');

  const create = () => {
    if (!uid) return;
    editor.begin(newPlan(uid), null);
    navigation.navigate('PlanBasicsScreen', { mode: 'create' });
  };

  const section = (title: string, items: Plan[]) =>
    items.length > 0 && (
      <View style={{ gap: spacing.sm }}>
        <CustomText variant="heading">{title}</CustomText>
        <SurfaceCard style={{ padding: 0 }}>
          {items.map((p, i) => (
            <View key={p.id} style={{ borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
              <PlanRow plan={p} onPress={() => navigation.navigate('PlanOverviewScreen', { planId: p.id })} />
            </View>
          ))}
        </SurfaceCard>
      </View>
    );

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}>
          {plans.length === 0 && (
            <View style={{ gap: spacing.md, paddingVertical: spacing.xl }}>
              <Icon icon={generalIcons.dumbbell} color={colors.accent} size={36} />
              <CustomText variant="title">No plans yet</CustomText>
              <CustomText variant="body" color={colors.inkMuted}>A plan is your workouts plus a schedule. Build one and the Workout tab takes it from there.</CustomText>
            </View>
          )}
          {section('Active', active)}
          {section('Inactive', inactive)}
          {section('Archived', archived)}
        </ScrollView>
      )}
      <View style={{ padding: spacing.lg }}>
        <PrimaryButton label="New plan" icon={generalIcons.plus} onPress={create} />
      </View>
    </SafeAreaView>
  );
};
