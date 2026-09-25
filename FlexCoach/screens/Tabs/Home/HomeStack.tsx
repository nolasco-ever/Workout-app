import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { generalIcons } from '../../../components/icons/icon-library';
import { HeaderButton } from '../../../components/headers/HeaderButton';
import { useStackOptions } from '../../../navigation/stackOptions';
import { AppStackParams } from '../../../appNavigators/AppStack';
import { HomeScreen } from './screens/HomeScreen';
import { LogWeightScreen } from './screens/LogWeightScreen';
import { WeightHistoryScreen } from './screens/WeightHistoryScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { ExerciseProgressScreen } from './screens/ExerciseProgressScreen';
import { MusclesScreen } from './screens/MusclesScreen';
import { MuscleDetailScreen } from './screens/MuscleDetailScreen';
import { useNotificationFeed } from '../../../data/notifications/useNotificationFeed';

export type HomeStackParams = {
  HomeScreen: undefined;
  LogWeightScreen: undefined;
  WeightHistoryScreen: undefined;
  ProgressScreen: undefined;
  ExerciseProgressScreen: { exerciseId: string; exerciseName: string };
  MusclesScreen: undefined;
  MuscleDetailScreen: { muscle: string };
};

const Stack = createNativeStackNavigator<HomeStackParams>();

const NotificationsButton = () => {
  const navigation = useNavigation<NavigationProp<AppStackParams>>();
  const { unreadCount } = useNotificationFeed();
  return <HeaderButton icon={generalIcons.bell} badge={unreadCount > 0} accessibilityLabel="Notifications" onPress={() => navigation.navigate('NotificationsScreen')} />;
};

export const HomeStack = () => {
  const opts = useStackOptions();
  return (
    <Stack.Navigator screenOptions={opts.base}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ ...opts.root('Home'), headerRight: () => <NotificationsButton /> }} />
      <Stack.Screen name="LogWeightScreen" component={LogWeightScreen} options={({ navigation }) => opts.modal('Log weight', () => <HeaderButton icon={generalIcons.xMark} accessibilityLabel="Close" onPress={() => navigation.goBack()} />)} />
      <Stack.Screen name="WeightHistoryScreen" component={WeightHistoryScreen} options={opts.screen('Body weight')} />
      <Stack.Screen name="ProgressScreen" component={ProgressScreen} options={opts.screen('Progress')} />
      <Stack.Screen name="ExerciseProgressScreen" component={ExerciseProgressScreen} options={({ route }) => opts.screen(route.params.exerciseName)} />
      <Stack.Screen name="MusclesScreen" component={MusclesScreen} options={opts.screen('Muscles, last 30 days')} />
      <Stack.Screen name="MuscleDetailScreen" component={MuscleDetailScreen} options={({ route }) => opts.screen(route.params.muscle.charAt(0).toUpperCase() + route.params.muscle.slice(1))} />
    </Stack.Navigator>
  );
};
