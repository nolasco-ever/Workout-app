import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from '../../../../components/layout/SafeAreaView';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { formatDuration, formatRecordValue, toDisplayWeight } from '../../../../data/engine/units';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { useComfortableColumn } from '../../../../components/layout/useComfortableColumn';
import { useTheme } from '../../../../theme';
import { AppStackParams } from '../../../../appNavigators/AppStack';
import { SurfaceCard as Card } from '../../../../components/cards/SurfaceCard';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { useSessionOrientation } from '../../../../navigation/useSessionOrientation';
import { onWatchMetrics, watchMetricsFor } from '../../../../data/liveActivity/watchMetrics';
import { liveActivity } from '../../../../data/liveActivity/liveActivity';
import { WatchMetrics } from '../../../../data/models';
import { recordGain } from '../../../../data/engine/stats';
import { CardioDone, soleCardioSet } from '../components/CardioDone';
import { RecordPages } from '../components/RecordPages';

/**
 * Workout done (v1 #8, option A on the canvas): a page per new record first,
 * then the summary in the cardio done screen's style: the time large, a
 * table, the records with what each gained, and Done. Cardio has its own
 * done screen; a strength workout never holds cardio (owner, 2026-11-13).
 */
export const SessionCompleteScreen = () => {
  useSessionOrientation();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const { params } = useRoute<RouteProp<AppStackParams, 'SessionCompleteScreen'>>();
  const { result } = params;
  const { colors, spacing, fonts } = useTheme();
  const column = useComfortableColumn();
  const { profile } = useAuth();
  const unit = profile?.weightUnit ?? 'lb';
  const dist = profile?.distanceUnit ?? 'mi';
  const records = result.personalRecords;
  const [showingRecords, setShowingRecords] = useState(records.length > 0);
  // The Watch's calories and heart rate land a moment after Finish (v1 #6); they show as soon as they do.
  const sessionId = result.session.id;
  const [watch, setWatch] = useState<WatchMetrics | null>(() => result.session.watch ?? watchMetricsFor(sessionId));
  useEffect(() => onWatchMetrics((id, metrics) => { if (id === sessionId) setWatch(metrics); }), [sessionId]);
  // Done on the Watch's summary closes this one too.
  useEffect(() => liveActivity.onCommand(command => { if (command.kind === 'closeSummary') navigation.popToTop(); }), [navigation]);

  // A session that is one cardio entry has its own done screen (v1 #10.7).
  if (soleCardioSet(result.session)) return <CardioDone result={result} onDone={() => navigation.popToTop()} />;
  if (showingRecords) return <RecordPages records={records} weightUnit={unit} distanceUnit={dist} onDone={() => setShowingRecords(false)} />;

  const volume = toDisplayWeight(result.volumeKg, unit) ?? 0;
  const rows = [
    { label: 'Sets', value: String(result.setsCompleted) },
    // A bodyweight-only workout moved no weight; it has no volume to show.
    ...(volume > 0 ? [{ label: 'Volume', value: `${Math.round(volume).toLocaleString()} ${unit}` }] : []),
    // From the Watch, when one was used: heart rate and calories, as on the board.
    ...(watch?.avgBpm != null ? [{ label: 'Avg heart rate', value: `${watch.avgBpm} bpm` }] : []),
    ...(watch && watch.kcal > 0 ? [{ label: 'Calories', value: `${watch.kcal.toLocaleString()} kcal` }] : []),
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[{ padding: spacing.xl, paddingBottom: spacing.lg, gap: spacing.lg, flexGrow: 1 }, column]}>
        <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.successTint, alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon={generalIcons.check} color={colors.success} size={36} strokeWidth={3} />
          </View>
          <CustomText variant="title" centered accessibilityRole="header">{result.session.workoutName} done</CustomText>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <CustomText variant="overline" color={colors.inkMuted}>Time</CustomText>
            <CustomText style={{ fontFamily: fonts.display.bold, fontSize: 52, lineHeight: 58, letterSpacing: -1, fontVariant: ['tabular-nums'] }}>{formatDuration(result.durationSec)}</CustomText>
          </View>
        </View>

        <Card style={{ paddingVertical: 0, paddingHorizontal: spacing.md }}>
          {rows.map((row, i) => (
            <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.line }}>
              <CustomText variant="body" style={{ flex: 1 }}>{row.label}</CustomText>
              <CustomText variant="bodyStrong">{row.value}</CustomText>
            </View>
          ))}
        </Card>

        {records.length > 0 && (
          <View style={{ gap: spacing.sm }}>
            <CustomText variant="overline" color={colors.inkMuted}>{records.length === 1 ? 'New record' : `${records.length} new records`}</CustomText>
            <Card style={{ paddingVertical: 0, paddingHorizontal: spacing.md }}>
              {records.map((pr, i) => {
                const value = formatRecordValue(pr.kind, pr.value, unit, dist);
                const gain = recordGain(pr, unit, dist);
                return (
                  <View
                    key={`${pr.exerciseId}-${pr.kind}`}
                    accessible
                    accessibilityLabel={`${pr.exerciseName}, ${value}${gain ? `, up ${gain.gain.slice(1)}` : ''}`}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 52, paddingVertical: spacing.xs, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.line }}
                  >
                    <Icon icon={generalIcons.trophy} color={colors.accent} size={18} weight="fill" />
                    <CustomText variant="body" style={{ flex: 1 }}>{pr.exerciseName}</CustomText>
                    <View style={{ alignItems: 'flex-end' }}>
                      <CustomText variant="bodyStrong">{value}</CustomText>
                      {gain && <CustomText variant="caption" color={colors.success} style={{ fontFamily: fonts.body.bold }}>{gain.gain}</CustomText>}
                    </View>
                  </View>
                );
              })}
            </Card>
          </View>
        )}
      </ScrollView>
      <View style={[{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }, column]}>
        <PrimaryButton label="Done" onPress={() => navigation.popToTop()} />
      </View>
    </SafeAreaView>
  );
};
