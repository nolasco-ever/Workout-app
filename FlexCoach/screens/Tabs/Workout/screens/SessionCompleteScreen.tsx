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
import { useTabBarInset } from '../../../../navigation/useTabBarInset';
import { SurfaceCard as Card } from '../../../../components/cards/SurfaceCard';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { useSessionOrientation } from '../../../../navigation/useSessionOrientation';
import { onWatchMetrics, watchMetricsFor, watchStats } from '../../../../data/liveActivity/watchMetrics';
import { liveActivity } from '../../../../data/liveActivity/liveActivity';
import { WatchMetrics } from '../../../../data/models';
import { cardioStats } from '../../../../data/engine/stats';

const Stat = ({ label, value }: { label: string; value: string }) => {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <CustomText variant="overline" color={colors.inkMuted}>{label}</CustomText>
      {/* Shrinks rather than wraps: a five-figure volume was breaking onto a second line. */}
      <CustomText variant="display" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{value}</CustomText>
    </View>
  );
};

export const SessionCompleteScreen = () => {
  useSessionOrientation();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const { params } = useRoute<RouteProp<AppStackParams, 'SessionCompleteScreen'>>();
  const { result } = params;
  const { colors, spacing } = useTheme();
  const column = useComfortableColumn();
  const tabBarInset = useTabBarInset();
  const { profile } = useAuth();
  const unit = profile?.weightUnit ?? 'lb';
  const dist = profile?.distanceUnit ?? 'mi';
  const cardio = cardioStats(result.session, dist);
  const volume = toDisplayWeight(result.volumeKg, unit) ?? 0;
  // The Watch's calories and heart rate land a moment after Finish (v1 #6); they show as soon as they do.
  const sessionId = result.session.id;
  const [watch, setWatch] = useState<WatchMetrics | null>(() => result.session.watch ?? watchMetricsFor(sessionId));
  useEffect(() => onWatchMetrics((id, metrics) => { if (id === sessionId) setWatch(metrics); }), [sessionId]);
  // Done on the Watch's summary closes this one too.
  useEffect(() => liveActivity.onCommand(command => { if (command.kind === 'closeSummary') navigation.popToTop(); }), [navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[{ padding: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xl + tabBarInset, flexGrow: 1, justifyContent: 'center' }, column]}>
        <View style={{ alignItems: 'center', gap: spacing.md }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.successTint, alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon={generalIcons.check} color={colors.success} size={36} strokeWidth={3} />
          </View>
          <CustomText variant="title" centered>{result.session.workoutName} done</CustomText>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.lg }}>
          <Stat label="Time" value={formatDuration(result.durationSec)} />
          {(result.setsCompleted > 0 || cardio.length === 0) && <Stat label="Sets" value={String(result.setsCompleted)} />}
          {(volume > 0 || cardio.length === 0) && <Stat label={`Volume ${unit}`} value={Math.round(volume).toLocaleString()} />}
        </View>
        {/* Cardio is not a set: each exercise by its name, with its distance and time. */}
        {cardio.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }}>
            {cardio.map((s, i) => <Stat key={`${s.label}-${i}`} label={s.label} value={s.value} />)}
          </View>
        )}
        {watchStats(watch).length > 0 && (
          <View style={{ flexDirection: 'row', gap: spacing.lg }}>
            {watchStats(watch).map(s => <Stat key={s.label} label={s.label} value={s.value} />)}
          </View>
        )}

        {result.personalRecords.length > 0 && (
          <Card tone="accent">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
              <Icon icon={generalIcons.trophy} color={colors.accent} size={20} />
              <CustomText variant="heading">
                {result.personalRecords.length === 1 ? 'New personal record' : `${result.personalRecords.length} new personal records`}
              </CustomText>
            </View>
            {result.personalRecords.map(pr => (
              <View key={pr.exerciseId} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
                <CustomText variant="body">{pr.exerciseName}</CustomText>
                <CustomText variant="bodyStrong" color={colors.accent}>
                  {formatRecordValue(pr.kind, pr.value, unit, dist)}
                </CustomText>
              </View>
            ))}
          </Card>
        )}

        <PrimaryButton label="Done" onPress={() => navigation.popToTop()} />
      </ScrollView>
    </SafeAreaView>
  );
};
