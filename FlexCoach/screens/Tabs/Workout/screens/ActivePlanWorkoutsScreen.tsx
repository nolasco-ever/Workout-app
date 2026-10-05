import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';
import { WorkoutStackParams } from '../WorkoutStack';
import { pickCopyWorkout } from '../components/swapChannel';

/**
 * The active plan's workouts, opened from the exercise picker while a quick
 * workout is still empty. Tap one and a copy of it fills the session: the
 * choice goes back through swapChannel and both modals close.
 */
export const ActivePlanWorkoutsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<WorkoutStackParams>>();
  const { params } = useRoute<RouteProp<WorkoutStackParams, 'ActivePlanWorkoutsScreen'>>();
  const { colors, spacing } = useTheme();
  const workouts = [...params.workouts].sort((a, b) => a.order - b.order);

  const choose = (workoutId: string) => {
    pickCopyWorkout(workoutId);
    // This screen and the picker beneath it.
    navigation.pop(2);
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
        <SurfaceCard style={{ padding: 0, overflow: 'hidden' }}>
          {workouts.map((w, i) => {
            const names = [...w.exercises].sort((a, b) => a.order - b.order).map(e => e.exerciseName);
            return (
              <TouchableOpacity
                key={w.id}
                onPress={() => choose(w.id)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${w.name}, ${w.exercises.length} exercises`}
                style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <CustomText variant="bodyStrong">{w.name}</CustomText>
                  <CustomText variant="caption" color={colors.inkMuted}>
                    {w.exercises.length} exercise{w.exercises.length === 1 ? '' : 's'}
                  </CustomText>
                  <CustomText variant="caption" color={colors.inkMuted} numberOfLines={2}>
                    {names.join(' · ')}
                  </CustomText>
                </View>
                <Icon icon={directionIcons.angleRight} color={colors.inactive} size={18} />
              </TouchableOpacity>
            );
          })}
        </SurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
};
