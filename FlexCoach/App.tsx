import React from 'react';
import { LogBox } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { AppStack } from './appNavigators/AppStack';
import { ModalProvider } from './packages/core-contexts/modal-context';
import { CustomModal } from './packages/core-components/Modal/CustomModal';
import { AuthProvider } from './data/auth/AuthProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from './theme';

// react-native-sortables passes dependency arrays to Reanimated hooks (meant
// for web); Reanimated 4.7 warns about it on native. Harmless, and not ours.
LogBox.ignoreLogs(['[Reanimated] Dependencies should only be used on the web']);

/** Builds the navigation theme from the design tokens so every navigator paints the ground colour. */
const Navigation = () => {
  const { colors, isDark } = useTheme();
  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.ground,
      card: colors.ground,
      text: colors.ink,
      border: colors.line,
      notification: colors.accent,
    },
  };
  return (
    <NavigationContainer theme={navTheme}>
      <AppStack/>
    </NavigationContainer>
  );
};

const App = () => {

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <AuthProvider>
        <ModalProvider>
          <Navigation/>
          <CustomModal/>
        </ModalProvider>
      </AuthProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
