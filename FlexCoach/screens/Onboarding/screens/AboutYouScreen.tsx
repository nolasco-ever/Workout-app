import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { updateProfile } from '@react-native-firebase/auth';
import { useAuth } from '../../../data/auth/AuthProvider';
import { auth } from '../../../data/firebase/firebase';
import { userRepository } from '../../../data/repositories/userRepository';
import { bodyWeightRepository } from '../../../data/repositories/bodyWeightRepository';
import { fromDisplayWeight, parseNumber } from '../../../data/engine/units';
import { today } from '../../../data/engine/dates';
import { newId } from '../../../data/engine/ids';
import { DistanceUnit, WeightUnit } from '../../../data/models';
import { CustomText } from '../../../components/text/customText';
import { TextField } from '../../../components/inputs/TextField';
import { ChoiceChips } from '../../../components/inputs/ChoiceChips';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { SurfaceCard } from '../../../components/cards/SurfaceCard';
import { useTheme } from '../../../theme';
import { OnboardingStackParams } from '../OnboardingStack';

export const AboutYouScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParams>>();
  const { colors, spacing } = useTheme();
  const { uid, profile, user } = useAuth();
  const [name, setName] = useState(profile?.displayName ?? user?.displayName ?? '');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(profile?.weightUnit ?? 'lb');
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(profile?.distanceUnit ?? 'mi');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!uid) return;
    setBusy(true);
    try {
      const displayName = name.trim();
      const goalKg = fromDisplayWeight(parseNumber(goal), weightUnit);
      await userRepository.update(uid, { displayName, weightUnit, distanceUnit, targetWeightKg: goalKg });
      if (auth.currentUser && displayName) await updateProfile(auth.currentUser, { displayName }).catch(() => undefined);
      const w = fromDisplayWeight(parseNumber(weight), weightUnit);
      if (w) {
        const now = Date.now();
        await bodyWeightRepository.save(uid, { id: newId(), ownerId: uid, date: today(), weightKg: w, source: 'manual', externalId: null, createdAt: now, updatedAt: now });
      }
      navigation.navigate('ProfilePhotoScreen');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={100}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
          <CustomText variant="body" color={colors.inkMuted}>A few basics so the app speaks your units. You can change any of this later.</CustomText>
          <TextField id="ob-name" label="Your name" placeholder="How you'd like to be addressed" value={name} onChangeText={setName} autoCapitalize="words" autoFocus />
          <SurfaceCard style={{ gap: spacing.md }}>
            <View style={{ gap: spacing.sm }}>
              <CustomText variant="overline" color={colors.inkMuted}>Weight in</CustomText>
              <ChoiceChips<WeightUnit> options={[{ value: 'lb', label: 'Pounds' }, { value: 'kg', label: 'Kilograms' }]} value={weightUnit} onChange={setWeightUnit} />
            </View>
            <View style={{ gap: spacing.sm }}>
              <CustomText variant="overline" color={colors.inkMuted}>Distance in</CustomText>
              <ChoiceChips<DistanceUnit> options={[{ value: 'mi', label: 'Miles' }, { value: 'km', label: 'Kilometres' }]} value={distanceUnit} onChange={setDistanceUnit} />
            </View>
          </SurfaceCard>
          <SurfaceCard style={{ gap: spacing.md }}>
            <TextField id="ob-weight" label="Current weight (optional)" placeholder={weightUnit === 'lb' ? '178' : '81'} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" suffix={weightUnit} hint="Logged as your first weigh-in." />
            <TextField id="ob-goal" label="Goal weight (optional)" placeholder="Leave blank for none" value={goal} onChangeText={setGoal} keyboardType="decimal-pad" suffix={weightUnit} />
          </SurfaceCard>
        </ScrollView>
        <View style={{ padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.line }}>
          <PrimaryButton label="Next" disabled={!name.trim()} busy={busy} onPress={save} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
