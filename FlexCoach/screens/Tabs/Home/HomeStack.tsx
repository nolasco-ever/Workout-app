import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { useTheme } from '../../../theme';
import { Icon } from '../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../components/icons/icon-library';
import { NavigationHeader } from '../../../components/headers/NavigationHeader';
import { NotificationButton } from '../../../components/headers/HeaderActionButtons/NotificationButton';
import { fromLocalDate, today } from '../../../data/engine/dates';
import { HomeScreen } from './screens/HomeScreen';
import { LogWeightScreen } from './screens/LogWeightScreen';
import { WeightHistoryScreen } from './screens/WeightHistoryScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { ExerciseProgressScreen } from './screens/ExerciseProgressScreen';
import { MusclesScreen } from './screens/MusclesScreen';
import { MuscleDetailScreen } from './screens/MuscleDetailScreen';

export type HomeStackParams = {
  HomeScreen: undefined;
  LogWeightScreen: undefined;
  WeightHistoryScreen: undefined;
  ProgressScreen: undefined;
  ExerciseProgressScreen: { exerciseId: string; exerciseName: string };
  MusclesScreen: undefined;
  MuscleDetailScreen: { muscle: string };
};

const Stack = createStackNavigator<HomeStackParams>();

export const HomeStack = () => {
  const { colors, fonts } = useTheme();
  const back = () => <Icon icon={directionIcons.angleLeft} color={colors.ink} size={26} style={{ marginLeft: 10 }} />;
  const close = () => <Icon icon={generalIcons.xMark} color={colors.ink} size={24} style={{ marginLeft: 10 }} />;
  const header = (title: string) => ({
    headerShown: true,
    headerStyle: { backgroundColor: colors.ground, shadowColor: colors.transparent },
    headerTitleStyle: { color: colors.ink, fontFamily: fonts.display.semibold, fontSize: 17 },
    headerTitle: title,
    headerBackTitle: '',
    headerTintColor: colors.ink,
    headerBackImage: back,
  });
  const subtitle = fromLocalDate(today()).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' });

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ header: () => <NavigationHeader title="Home" subtitle={subtitle} navigationButtons={[<NotificationButton key="notificationsButton" />]} /> }}
      />
      <Stack.Screen name="LogWeightScreen" component={LogWeightScreen} options={{ ...header('Log weight'), headerBackImage: close, ...TransitionPresets.ModalSlideFromBottomIOS }} />
      <Stack.Screen name="WeightHistoryScreen" component={WeightHistoryScreen} options={header('Body weight')} />
      <Stack.Screen name="ProgressScreen" component={ProgressScreen} options={header('Progress')} />
      <Stack.Screen name="ExerciseProgressScreen" component={ExerciseProgressScreen} options={({ route }) => header(route.params.exerciseName)} />
      <Stack.Screen name="MusclesScreen" component={MusclesScreen} options={header('Muscles, last 30 days')} />
      <Stack.Screen name="MuscleDetailScreen" component={MuscleDetailScreen} options={({ route }) => header(route.params.muscle.charAt(0).toUpperCase() + route.params.muscle.slice(1))} />
    </Stack.Navigator>
  );
};
