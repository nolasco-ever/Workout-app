import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../data/auth/AuthProvider';
import { usePlans } from '../../../data/hooks/usePlans';
import { newPlan } from '../../../data/services/planService';
import { planRepository } from '../../../data/repositories/planRepository';
import { SwipeToDelete } from '../../../components/list-items/SwipeToDelete';
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
          {plan.sharedFrom ? `${plan.sharedFrom.synced ? 'in sync with' : 'by'} ${plan.sharedFrom.displayName ?? 'a buddy'} · ` : ''}{plan.workouts.length} workout{plan.workouts.length === 1 ? '' : 's'} · {describeSchedule(plan)}{plan.visibleToBuddies ? ' · shared' : ''}
        </CustomText>
      </View>
      <Icon icon={directionIcons.angleRight} color={colors.inactive} size={20} />
    </TouchableOpacity>
  );
};

export const PlansScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PlansStackParams>>();
  const { colors, spacing } = useTheme();
  const { uid } = useAuth();
  const { plans, loading, refresh } = usePlans();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);
  const editor = usePlanEditor();

  const active = plans.filter(p => p.status === 'active');
  const inactive = plans.filter(p => p.status === 'draft' && !p.sharedFrom);
  // Copies of buddies' plans sit apart until they're activated, so it's clear which are yours from scratch.
  const fromBuddies = plans.filter(p => p.status === 'draft' && !!p.sharedFrom);
  const archived = plans.filter(p => p.status === 'archived');

  const create = () => {
    if (!uid) return;
    editor.begin(newPlan(uid), null);
    navigation.navigate('PlanBasicsScreen', { mode: 'create' });
  };

  // Only a plan that isn't running can be swiped away; the active one is
  // deactivated from its overview first. The row's own delete asks the same question.
  const confirmDelete = (p: Plan) =>
    Alert.alert('Delete plan?', `"${p.name || 'Untitled plan'}" goes for good. Logged sessions are kept.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { if (uid) planRepository.remove(uid, p.id).catch(err => console.warn('delete plan failed', err)); } },
    ]);

  const section = (title: string, items: Plan[], deletable = false) =>
    items.length > 0 && (
      <View style={{ gap: spacing.sm }}>
        <CustomText variant="heading">{title}</CustomText>
        <SurfaceCard style={{ padding: 0, overflow: 'hidden' }}>
          {items.map((p, i) => {
            const row = (
              <View style={{ borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
                <PlanRow plan={p} onPress={() => navigation.navigate('PlanOverviewScreen', { planId: p.id })} />
              </View>
            );
            return deletable ? (
              <SwipeToDelete key={p.id} label={`Delete ${p.name || 'plan'}`} onDelete={() => confirmDelete(p)}>
                {row}
              </SwipeToDelete>
            ) : (
              <View key={p.id}>{row}</View>
            );
          })}
        </SurfaceCard>
      </View>
    );

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {loading && <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />}
        {!loading && plans.length === 0 && (
          <View style={{ gap: spacing.md, paddingVertical: spacing.xl }}>
            <Icon icon={generalIcons.dumbbell} color={colors.accent} size={36} />
            <CustomText variant="title">No plans yet</CustomText>
            <CustomText variant="body" color={colors.inkMuted}>A plan is your workouts plus a schedule. Build one and the Workout tab takes it from there.</CustomText>
          </View>
        )}
        {!loading && section('Active', active)}
        {!loading && section('Inactive', inactive, true)}
        {!loading && section('From buddies', fromBuddies, true)}
        {!loading && section('Archived', archived, true)}
      </ScrollView>
      <View style={{ padding: spacing.lg }}>
        <PrimaryButton label="New plan" icon={generalIcons.plus} onPress={create} />
      </View>
    </SafeAreaView>
  );
};
