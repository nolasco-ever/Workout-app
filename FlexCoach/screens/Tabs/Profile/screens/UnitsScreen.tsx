import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from '../../../../components/layout/SafeAreaView';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { DistanceUnit, WeightUnit } from '../../../../data/models';
import { userRepository } from '../../../../data/repositories/userRepository';
import { sessionRepository } from '../../../../data/repositories/sessionRepository';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { ChoiceChips } from '../../../../components/inputs/ChoiceChips';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { useComfortableColumn } from '../../../../components/layout/useComfortableColumn';
import { useTheme } from '../../../../theme';

/**
 * Weight and distance units after onboarding (v1 #11). Each tap saves at
 * once. Stored values are always kg and metres, so a change only alters how
 * they're shown. Locked while a workout runs (owner, 2026-11-14): a weight
 * typed but not yet saved is plain text and would be read in the new unit.
 */
export const UnitsScreen = () => {
  const { colors, spacing } = useTheme();
  const column = useComfortableColumn();
  const { uid, profile } = useAuth();
  const [running, setRunning] = useState(false);
  // What was tapped, shown before the profile catches up with the save.
  const [weight, setWeight] = useState<WeightUnit>(profile?.weightUnit ?? 'lb');
  const [distance, setDistance] = useState<DistanceUnit>(profile?.distanceUnit ?? 'mi');

  useEffect(() => {
    if (!uid) return;
    return sessionRepository.watchInProgress(uid, sessions => setRunning(sessions.length > 0));
  }, [uid]);

  const save = (patch: { weightUnit?: WeightUnit; distanceUnit?: DistanceUnit }, undo: () => void) => {
    if (!uid) return;
    userRepository.update(uid, patch).catch(err => {
      console.warn(err);
      undo();
      Alert.alert('Something went wrong', 'That change was not saved. Try again.');
    });
  };
  const pickWeight = (next: WeightUnit) => {
    const was = weight;
    setWeight(next);
    save({ weightUnit: next }, () => setWeight(was));
  };
  const pickDistance = (next: DistanceUnit) => {
    const was = distance;
    setDistance(next);
    save({ distanceUnit: next }, () => setDistance(was));
  };

  const locked = { opacity: running ? 0.45 : 1 };
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[{ padding: spacing.lg, gap: spacing.lg }, column]}>
        {running && (
          <SurfaceCard style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
            <Icon icon={generalIcons.lock} size={18} color={colors.warning} />
            <CustomText variant="body" style={{ flex: 1 }}>Finish your workout to change units.</CustomText>
          </SurfaceCard>
        )}
        <SurfaceCard style={{ gap: spacing.lg }}>
          <View style={[{ gap: spacing.sm }, locked]} pointerEvents={running ? 'none' : 'auto'} accessibilityState={{ disabled: running }}>
            <CustomText variant="overline" color={colors.inkMuted}>Weight</CustomText>
            <ChoiceChips<WeightUnit> options={[{ value: 'lb', label: 'Pounds' }, { value: 'kg', label: 'Kilograms' }]} value={weight} onChange={pickWeight} />
          </View>
          <View style={{ height: 1, backgroundColor: colors.line }} />
          <View style={[{ gap: spacing.sm }, locked]} pointerEvents={running ? 'none' : 'auto'} accessibilityState={{ disabled: running }}>
            <CustomText variant="overline" color={colors.inkMuted}>Distance</CustomText>
            <ChoiceChips<DistanceUnit> options={[{ value: 'mi', label: 'Miles' }, { value: 'km', label: 'Kilometres' }]} value={distance} onChange={pickDistance} />
          </View>
        </SurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
};
