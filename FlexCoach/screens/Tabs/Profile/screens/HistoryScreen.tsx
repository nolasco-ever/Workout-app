import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { Cycle, CycleSummary, Plan, Session } from '../../../../data/models';
import { sessionRepository } from '../../../../data/repositories/sessionRepository';
import { cycleRepository } from '../../../../data/repositories/cycleRepository';
import { planRepository } from '../../../../data/repositories/planRepository';
import { countWorkingSets, summarizeCycle, totalVolumeKg } from '../../../../data/engine/stats';
import { formatDuration, toDisplayWeight } from '../../../../data/engine/units';
import { fromLocalDate } from '../../../../data/engine/dates';
import { dateLabel } from '../../../../components/charts/scale';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { SegmentedControl } from '../../../../components/inputs/SegmentedControl';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';
import { useTabScrollInset } from '../../../../navigation/useTabBarInset';
import { ProfileStackParams } from '../ProfileStack';

const monthOf = (d: string) => fromLocalDate(d).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

type Tab = 'workouts' | 'cycles';

interface CycleRow {
  cycle: Cycle;
  planName: string;
  summary: CycleSummary;
}

/**
 * History in two views: every completed workout, newest first, grouped by
 * month (tap one to see its sets), or every finished cycle with its
 * numbers (tap one for its review).
 */
export const HistoryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParams>>();
  const { colors, spacing } = useTheme();
  const bottomInset = useTabScrollInset();
  const { uid, profile } = useAuth();
  const unit = profile?.weightUnit ?? 'lb';
  const [tab, setTab] = useState<Tab>('workouts');
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [cycles, setCycles] = useState<CycleRow[] | null>(null);

  // Re-read on every focus so edits made on the detail screen show up.
  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      let cancelled = false;
      sessionRepository.listCompleted(uid).then(list => {
        if (cancelled) return;
        setSessions([...list].sort((a, b) => b.startedAt - a.startedAt));
        // Finished cycles only: the active one's review lives on the Workout tab.
        Promise.all([cycleRepository.listAll(uid), planRepository.list(uid)])
          .then(([all, plans]) => {
            if (cancelled) return;
            const planName = (c: Cycle) => plans.find((p: Plan) => p.id === c.planId)?.name ?? 'Plan';
            const rows = all
              .filter(c => c.status === 'completed')
              .map(c => ({ cycle: c, planName: planName(c), summary: summarizeCycle(c, list.filter(s => s.cycleId === c.id), []) }))
              .sort((a, b) => (a.cycle.endDate < b.cycle.endDate ? 1 : -1));
            setCycles(rows);
          })
          .catch(err => console.warn('cycle history failed', err));
      });
      return () => {
        cancelled = true;
      };
    }, [uid]),
  );

  const groups: { month: string; sessions: Session[] }[] = [];
  for (const s of sessions ?? []) {
    const month = monthOf(s.date);
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.sessions.push(s);
    else groups.push({ month, sessions: [s] });
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl + bottomInset }}>
        <SegmentedControl<Tab> options={[{ value: 'workouts', label: 'Workouts' }, { value: 'cycles', label: 'Cycles' }]} value={tab} onChange={setTab} />
        {tab === 'cycles' && (
          <>
            {cycles === null && <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />}
            {cycles !== null && cycles.length === 0 && (
              <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl }}>
                <Icon icon={generalIcons.medal} size={36} color={colors.inactive} />
                <CustomText variant="heading" centered>No finished cycles yet</CustomText>
                <CustomText variant="body" color={colors.inkMuted} centered>When a cycle wraps up, its review lands here.</CustomText>
              </View>
            )}
            {cycles !== null && cycles.length > 0 && (
              <SurfaceCard style={{ padding: 0 }}>
                {cycles.map((row, i) => {
                  const { cycle, summary } = row;
                  const rate = Math.round(summary.completionRate * 100);
                  const tone = rate >= 80 ? colors.success : rate >= 50 ? colors.warning : colors.error;
                  return (
                    <TouchableOpacity
                      key={cycle.id}
                      onPress={() => navigation.navigate('CycleReviewScreen', { cycleId: cycle.id })}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}
                    >
                      <View style={{ flex: 1 }}>
                        <CustomText variant="bodyStrong">{row.planName} · Cycle {cycle.number}</CustomText>
                        <CustomText variant="caption" color={colors.inkMuted}>
                          {dateLabel(cycle.startDate)} to {dateLabel(cycle.endDate)} · {summary.completed}/{summary.totalWorkouts} done{summary.personalRecords.length ? ` · ${summary.personalRecords.length} record${summary.personalRecords.length === 1 ? '' : 's'}` : ''}
                        </CustomText>
                      </View>
                      <CustomText variant="bodyStrong" color={tone}>{rate}%</CustomText>
                      <Icon icon={directionIcons.angleRight} size={18} color={colors.inactive} />
                    </TouchableOpacity>
                  );
                })}
              </SurfaceCard>
            )}
          </>
        )}
        {tab === 'workouts' && sessions === null && <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />}
        {tab === 'workouts' && sessions !== null && sessions.length === 0 && (
          <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl }}>
            <Icon icon={generalIcons.clock} size={36} color={colors.inactive} />
            <CustomText variant="heading" centered>No workouts yet</CustomText>
            <CustomText variant="body" color={colors.inkMuted} centered>Finish a workout and it shows up here with every set you logged.</CustomText>
          </View>
        )}
        {tab === 'workouts' && groups.map(group => (
          <View key={group.month} style={{ gap: spacing.sm }}>
            <CustomText variant="overline" color={colors.inkMuted}>{group.month}</CustomText>
            <SurfaceCard style={{ padding: 0 }}>
              {group.sessions.map((s, i) => {
                const sets = countWorkingSets([s]);
                const volume = Math.round(toDisplayWeight(totalVolumeKg([s]), unit) ?? 0);
                const duration = s.finishedAt ? formatDuration(Math.round((s.finishedAt - s.startedAt) / 1000)) : null;
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => navigation.navigate('SessionDetailScreen', { sessionId: s.id, workoutName: s.workoutName })}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}
                  >
                    <View style={{ flex: 1 }}>
                      <CustomText variant="bodyStrong">{s.workoutName}</CustomText>
                      <CustomText variant="caption" color={colors.inkMuted}>
                        {dateLabel(s.date)} · {sets} set{sets === 1 ? '' : 's'}{volume ? ` · ${volume.toLocaleString()} ${unit}` : ''}{duration ? ` · ${duration}` : ''}
                      </CustomText>
                    </View>
                    <Icon icon={directionIcons.angleRight} size={18} color={colors.inactive} />
                  </TouchableOpacity>
                );
              })}
            </SurfaceCard>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};
