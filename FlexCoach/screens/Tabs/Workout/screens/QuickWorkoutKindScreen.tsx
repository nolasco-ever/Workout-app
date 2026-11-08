import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from '../../../../components/layout/SafeAreaView';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { ExerciseKind } from '../../../../data/models';
import { startQuickSession } from '../../../../data/services/workoutService';
import { CustomText } from '../../../../components/text/customText';
import { Icon, IconSource } from '../../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../../components/icons/icon-library';
import { useComfortableColumn } from '../../../../components/layout/useComfortableColumn';
import { useTheme } from '../../../../theme';
import { AppStackParams } from '../../../../appNavigators/AppStack';

const KINDS: { kind: ExerciseKind; icon: IconSource; title: string; detail: string | null }[] = [
  { kind: 'strength', icon: generalIcons.dumbbell, title: 'Strength workout', detail: 'Lifts, plyometrics and timed drills' },
  { kind: 'stretching', icon: generalIcons.stretching, title: 'Stretching workout', detail: 'Mobility and stretches' },
  { kind: 'cardio', icon: generalIcons.cardio, title: 'Cardio', detail: null },
];

/**
 * Quick workout's first step (v1 #10, on the canvas): what kind it is. The pick
 * starts an empty quick workout of that kind, so its picker only offers that
 * kind, and this screen gives way to the session.
 */
export const QuickWorkoutKindScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const { params } = useRoute<RouteProp<AppStackParams, 'QuickWorkoutKindScreen'>>();
  const { uid } = useAuth();
  const { colors, spacing, radius } = useTheme();
  const column = useComfortableColumn();
  const [busy, setBusy] = useState<ExerciseKind | null>(null);

  const start = async (kind: ExerciseKind) => {
    if (!uid || busy) return;
    setBusy(kind);
    try {
      const session = await startQuickSession(uid, kind);
      navigation.replace('SessionScreen', { plan: null, cycle: null, session, activePlan: params?.activePlan });
    } catch (err) {
      console.warn('quick workout failed', err);
      setBusy(null);
    }
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[{ padding: spacing.lg, gap: spacing.lg }, column]}>
        <CustomText variant="title" accessibilityRole="header">What kind of workout are you doing?</CustomText>
        <View style={{ gap: spacing.sm }}>
          {KINDS.map(k => (
            <TouchableOpacity
              key={k.kind}
              onPress={() => start(k.kind)}
              disabled={!!busy}
              accessibilityRole="button"
              accessibilityLabel={k.detail ? `${k.title}, ${k.detail}` : k.title}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 76, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' }}>
                <Icon icon={k.icon} size={24} color={colors.accent} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <CustomText variant="bodyStrong">{k.title}</CustomText>
                {k.detail && <CustomText variant="caption" color={colors.inkMuted}>{k.detail}</CustomText>}
              </View>
              {busy === k.kind ? <ActivityIndicator color={colors.inkMuted} /> : <Icon icon={directionIcons.angleRight} size={18} color={colors.inkMuted} />}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
