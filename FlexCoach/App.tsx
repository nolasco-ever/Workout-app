import React from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { AppStack } from './appNavigators/AppStack';
import { ThemeProvider } from './packages/core-contexts/theme-context';
import { ModalProvider } from './packages/core-contexts/modal-context';
import { CustomModal } from './packages/core-components/Modal/CustomModal';
import { AuthProvider } from './data/auth/AuthProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from './theme';

/** Sits inside ThemeProvider so the navigation container can read the tokens. */
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
    <SafeAreaProvider>
      <AuthProvider>
      <ThemeProvider appTheme='system'>
        <ModalProvider>
          <Navigation/>
          <CustomModal/>
        </ModalProvider>
      </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;
