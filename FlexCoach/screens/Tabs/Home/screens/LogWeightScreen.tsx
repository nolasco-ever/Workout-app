import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { KeyboardAvoiding } from '../../../../components/layout/KeyboardAvoiding';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { fromDisplayWeight, parseNumber, toDisplayWeight } from '../../../../data/engine/units';
import { addDays, today } from '../../../../data/engine/dates';
import { newId } from '../../../../data/engine/ids';
import { bodyWeightRepository } from '../../../../data/repositories/bodyWeightRepository';
import { userRepository } from '../../../../data/repositories/userRepository';
import { pushWeightToHealth } from '../../../../data/services/healthSync';
import { CustomText } from '../../../../components/text/customText';
import { TextField } from '../../../../components/inputs/TextField';
import { ChoiceChips } from '../../../../components/inputs/ChoiceChips';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { useTheme } from '../../../../theme';
import { HomeStackParams } from '../HomeStack';
import { shortDate } from '../../../../components/charts/scale';

export const LogWeightScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParams>>();
  const { colors, spacing } = useTheme();
  const { uid, profile } = useAuth();
  const unit = profile?.weightUnit ?? 'lb';
  const todayDate = today();
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(todayDate);
  const [target, setTarget] = useState(profile?.targetWeightKg !== null && profile?.targetWeightKg !== undefined ? String(toDisplayWeight(profile.targetWeightKg, unit)) : '');
  const [busy, setBusy] = useState(false);

  const value = parseNumber(weight);
  const days = [0, 1, 2, 3, 4, 5, 6].map(n => addDays(todayDate, -n));

  const save = async () => {
    if (!uid || value === null) return;
    setBusy(true);
    try {
      const now = Date.now();
      // Timestamp the entry on the chosen day so the health store files it there.
      const at = date === todayDate ? now : new Date(`${date}T12:00:00`).getTime();
      const entry = { id: newId(), ownerId: uid, date, weightKg: fromDisplayWeight(value, unit)!, source: 'manual' as const, externalId: null, createdAt: at, updatedAt: now };
      await bodyWeightRepository.save(uid, entry);
      if (profile?.healthConnectedAt) pushWeightToHealth(uid, entry).catch(err => console.warn(err));
      const t = parseNumber(target);
      const targetKg = t === null ? null : fromDisplayWeight(t, unit);
      if (targetKg !== (profile?.targetWeightKg ?? null)) await userRepository.update(uid, { targetWeightKg: targetKg });
      navigation.goBack();
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <KeyboardAvoiding>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <TextField id="weight" label="Weight" placeholder={unit === 'lb' ? '178.4' : '81.2'} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" suffix={unit} autoFocus />
          <View style={{ gap: spacing.sm }}>
            <CustomText variant="overline" color={colors.inkMuted}>Day</CustomText>
            <ChoiceChips scroll options={days.map(d => ({ value: d, label: d === todayDate ? 'Today' : d === days[1] ? 'Yesterday' : shortDate(d) }))} value={date} onChange={setDate} />
          </View>
          <SurfaceCard>
            <TextField id="target-weight" label="Goal weight (optional)" placeholder="Leave blank for none" value={target} onChangeText={setTarget} keyboardType="decimal-pad" suffix={unit} hint="Shown as a line on the chart." />
          </SurfaceCard>
        </ScrollView>
        <View style={{ padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.line }}>
          <PrimaryButton label="Save" disabled={value === null || value <= 0} busy={busy} onPress={save} />
        </View>
      </KeyboardAvoiding>
    </SafeAreaView>
  );
};
