import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HeaderButton } from '../../components/headers/HeaderButton';
import { generalIcons } from '../../components/icons/icon-library';
import { useStackOptions } from '../../navigation/stackOptions';
import { MyCardScreen } from './MyCardScreen';
import { ScanCardScreen } from './ScanCardScreen';
import { BuddyCardScreen } from './BuddyCardScreen';
import { BuddyPlanScreen } from './BuddyPlanScreen';
import { CardStackParams } from './routes';

const Stack = createNativeStackNavigator<CardStackParams>();

/**
 * The Iron Card sheet. Presented as a modal by the root stack; inside it,
 * the scanner (and the card a scan lands on) push sideways like any other
 * screen, so the sheet stays one sheet. X or a swipe down closes it.
 */
export const CardStack = () => {
  const opts = useStackOptions();
  return (
    <Stack.Navigator screenOptions={opts.base}>
      <Stack.Screen
        name="MyCardScreen"
        component={MyCardScreen}
        options={({ navigation }) => ({
          ...opts.screen('My Iron Card'),
          headerLeft: () => <HeaderButton icon={generalIcons.xMark} accessibilityLabel="Close" onPress={() => navigation.getParent()?.goBack()} />,
          headerRight: () => <HeaderButton icon={generalIcons.scanQr} accessibilityLabel="Scan a buddy's card" onPress={() => navigation.navigate('ScanCardScreen')} />,
        })}
      />
      <Stack.Screen name="ScanCardScreen" component={ScanCardScreen} options={opts.screen('Scan a card')} />
      <Stack.Screen name="BuddyCardScreen" component={BuddyCardScreen} options={({ route }) => opts.screen(route.params.displayName ?? 'Iron Card')} />
      <Stack.Screen name="BuddyPlanScreen" component={BuddyPlanScreen} options={opts.screen('Plan')} />
    </Stack.Navigator>
  );
};
