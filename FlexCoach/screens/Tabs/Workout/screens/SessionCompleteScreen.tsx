import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { formatDistance, formatDuration, formatWeight, toDisplayWeight } from '../../../../data/engine/units';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';
import { WorkoutStackParams } from '../WorkoutStack';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';

const Stat = ({ label, value }: { label: string; value: string }) => {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <CustomText variant="overline" color={colors.inkMuted}>{label}</CustomText>
      <CustomText variant="display">{value}</CustomText>
    </View>
  );
};

export const SessionCompleteScreen = () => {
  const navigation = useNavigation<NavigationProp<WorkoutStackParams>>();
  const { params } = useRoute<RouteProp<WorkoutStackParams, 'SessionCompleteScreen'>>();
  const { result } = params;
  const { colors, spacing } = useTheme();
  const { profile } = useAuth();
  const unit = profile?.weightUnit ?? 'lb';
  const dist = profile?.distanceUnit ?? 'mi';
  const volume = toDisplayWeight(result.volumeKg, unit) ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl, flexGrow: 1, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', gap: spacing.md }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.successTint, alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon={generalIcons.check} color={colors.success} size={36} strokeWidth={3} />
          </View>
          <CustomText variant="title" centered>{result.session.workoutName} done</CustomText>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.lg }}>
          <Stat label="Time" value={formatDuration(result.durationSec)} />
          <Stat label="Sets" value={String(result.setsCompleted)} />
          <Stat label={`Volume ${unit}`} value={Math.round(volume).toLocaleString()} />
        </View>

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
                  {pr.kind === 'weight' ? formatWeight(pr.value, unit) : pr.kind === 'reps' ? `${pr.value} reps` : pr.kind === 'duration' ? formatDuration(pr.value) : formatDistance(pr.value, dist)}
                </CustomText>
              </View>
            ))}
          </Card>
        )}

        <PrimaryButton label="Done" onPress={() => navigation.navigate('WorkoutHomeScreen')} />
      </ScrollView>
    </SafeAreaView>
  );
};
