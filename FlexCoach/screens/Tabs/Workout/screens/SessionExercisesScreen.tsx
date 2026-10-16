import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from '../../../../components/layout/SafeAreaView';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Session, SessionExercise } from '../../../../data/models';
import { HeaderButton } from '../../../../components/headers/HeaderButton';
import { generalIcons } from '../../../../components/icons/icon-library';
import { useComfortableColumn } from '../../../../components/layout/useComfortableColumn';
import { useTheme } from '../../../../theme';
import { AppStackParams } from '../../../../appNavigators/AppStack';
import { currentSession, sendSessionCommand, subscribeSession } from '../components/sessionChannel';
import { SessionExerciseList } from '../components/SessionExerciseList';

/**
 * The running workout at a glance, opened from the session's title: the
 * progress strip, then every exercise with how many sets are done, the
 * current one marked. Tap one to
 * jump to it; the plus in the header adds an extra exercise (the picker
 * opens above this screen and comes back to it); extras swipe away.
 */
export const SessionExercisesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const { params } = useRoute<RouteProp<AppStackParams, 'SessionExercisesScreen'>>();
  const { colors, spacing } = useTheme();
  const column = useComfortableColumn();
  const [session, setSession] = useState<Session | null>(currentSession);
  useEffect(() => subscribeSession(setSession), []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderButton
          icon={generalIcons.plus}
          accessibilityLabel="Add exercise"
          onPress={() => navigation.navigate('ExercisePickerScreen', { mode: 'session', excludeIds: (currentSession()?.exercises ?? []).map(e => e.exerciseId) })}
        />
      ),
    });
  }, [navigation]);

  if (!session) return null;
  const jump = (index: number) => {
    sendSessionCommand({ kind: 'jump', index });
    navigation.goBack();
  };
  const remove = (ex: SessionExercise) => sendSessionCommand({ kind: 'remove', sessionExerciseId: ex.id });

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl}, column]}>
        <SessionExerciseList session={session} currentIndex={params.currentIndex} onJump={jump} onRemove={remove} />
      </ScrollView>
    </SafeAreaView>
  );
};
