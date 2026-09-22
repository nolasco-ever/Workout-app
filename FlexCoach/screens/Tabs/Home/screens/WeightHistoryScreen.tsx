import React, { useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { useInsights } from '../../../../data/hooks/useInsights';
import { formatWeight, kgToLb, toDisplayWeight } from '../../../../data/engine/units';
import { addDays } from '../../../../data/engine/dates';
import { bodyWeightRepository } from '../../../../data/repositories/bodyWeightRepository';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { ChoiceChips } from '../../../../components/inputs/ChoiceChips';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { LineChart } from '../../../../components/charts/LineChart';
import { dateLabel } from '../../../../components/charts/scale';
import { useTheme } from '../../../../theme';
import { HomeStackParams } from '../HomeStack';

type Range = '30' | '90' | 'all';

export const WeightHistoryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParams>>();
  const { colors, spacing } = useTheme();
  const { uid, profile } = useAuth();
  const unit = profile?.weightUnit ?? 'lb';
  const ins = useInsights();
  const [range, setRange] = useState<Range>('90');
  const disp = (kg: number) => (unit === 'lb' ? kgToLb(kg) : kg);
  const target = profile?.targetWeightKg ?? null;
  const latest = ins.weight[ins.weight.length - 1] ?? null;
  const since = range === 'all' ? '0000-00-00' : addDays(ins.todayDate, -Number(range));
  const points = ins.weight.filter(p => p.date >= since).map(p => ({ date: p.date, value: disp(p.weightKg), secondary: disp(p.trendKg) }));
  const delta = range === 'all' ? null : ins.weightChange30d;
  const entries = [...ins.weightEntries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));

  const remove = (id: string, label: string) =>
    Alert.alert('Delete entry?', label, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => uid && bodyWeightRepository.remove(uid, id) },
    ]);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        {latest && (
          <SurfaceCard>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginBottom: spacing.sm, flexWrap: 'wrap' }}>
              <CustomText variant="display">{formatWeight(latest.weightKg, unit)}</CustomText>
              {delta !== null && (
                <CustomText variant="label" color={delta <= 0 ? colors.success : colors.warning}>{delta > 0 ? '+' : ''}{toDisplayWeight(delta, unit)} {unit} in 30 days</CustomText>
              )}
              {target !== null && <CustomText variant="caption" color={colors.inkMuted}>{formatWeight(Math.abs(latest.trendKg - target), unit)} to go</CustomText>}
            </View>
            <View style={{ marginBottom: spacing.md }}>
              <ChoiceChips<Range> options={[{ value: '30', label: '30 days' }, { value: '90', label: '90 days' }, { value: 'all', label: 'All time' }]} value={range} onChange={setRange} />
            </View>
            {points.length >= 2 ? (
              <LineChart points={points} format={v => `${Math.round(v * 10) / 10}`} reference={target !== null ? { value: disp(target), label: `Goal ${formatWeight(target, unit)}` } : null} height={220} />
            ) : (
              <CustomText variant="caption" color={colors.inkMuted}>Not enough entries in this range.</CustomText>
            )}
            <CustomText variant="caption" color={colors.inkMuted} style={{ marginTop: spacing.xs }}>Drag across the chart to read a day. The grey line is the smoothed trend.</CustomText>
          </SurfaceCard>
        )}
        <PrimaryButton label="Log weight" icon={generalIcons.scale} onPress={() => navigation.navigate('LogWeightScreen')} />
        <SurfaceCard style={{ padding: 0 }}>
          {entries.map((e, i) => (
            <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
              <View style={{ flex: 1 }}>
                <CustomText variant="bodyStrong">{formatWeight(e.weightKg, unit)}</CustomText>
                <CustomText variant="caption" color={colors.inkMuted}>{dateLabel(e.date)} · {e.source === 'manual' ? 'logged' : 'from Health'}</CustomText>
              </View>
              <TouchableOpacity onPress={() => remove(e.id, `${formatWeight(e.weightKg, unit)} on ${dateLabel(e.date)}`)} hitSlop={8}>
                <Icon icon={generalIcons.xMark} size={20} color={colors.inkMuted} />
              </TouchableOpacity>
            </View>
          ))}
          {entries.length === 0 && <CustomText variant="body" color={colors.inkMuted} style={{ padding: spacing.lg }}>No entries yet.</CustomText>}
        </SurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
};
