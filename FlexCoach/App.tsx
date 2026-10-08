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
import { navigationRef } from './navigation/navigationRef';
import { NotificationBridge } from './data/notifications/NotificationBridge';
import { PlanSyncBridge } from './data/notifications/PlanSyncBridge';
import { SharingPrompt } from './components/buddies/SharingPrompt';
import { MissedWorkoutPrompt } from './screens/Tabs/Workout/components/MissedWorkoutPrompt';
import { AchievementCelebration } from './components/achievements/AchievementCelebration';
import { features } from './config/features';
import { useAuth } from './data/auth/AuthProvider';
import { startInviteLinkListener } from './data/links/inviteLinks';
import { InAppBannerHost } from './components/overlays/InAppBanner';

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
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <AppStack/>
    </NavigationContainer>
  );
};

/** Notification and plan sync only run for a signed-in, onboarded account. */
const Notifications = () => {
  const { uid, profile } = useAuth();
  return uid && profile?.onboardingCompletedAt ? (
    <>
      <NotificationBridge />
      <PlanSyncBridge />
      <SharingPrompt />
      <MissedWorkoutPrompt />
      {features.achievements && <AchievementCelebration />}
    </>
  ) : null;
};

const App = () => {
  // Buddy links (QR, share sheet, landing page) open the person's card.
  React.useEffect(startInviteLinkListener, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <AuthProvider>
        <ModalProvider>
          <Navigation/>
          <Notifications/>
          <CustomModal/>
          <InAppBannerHost/>
        </ModalProvider>
      </AuthProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
