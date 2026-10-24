import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { NotificationsScreen } from '../screens/Tabs/Home/screens/NotificationsScreen';
import { type EditorMode, type PlansStackParams } from '../screens/Plans/routes';
import { PlanEditorProvider } from '../screens/Plans/PlanEditorContext';
import { PlansScreen } from '../screens/Plans/screens/PlansScreen';
import { PlanOverviewScreen } from '../screens/Plans/screens/PlanOverviewScreen';
import { PlanEditScreen } from '../screens/Plans/screens/PlanEditScreen';
import { PlanBasicsScreen } from '../screens/Plans/screens/PlanBasicsScreen';
import { PlanWorkoutsScreen } from '../screens/Plans/screens/PlanWorkoutsScreen';
import { WorkoutEditorScreen } from '../screens/Plans/screens/WorkoutEditorScreen';
import { ExerciseEntryScreen } from '../screens/Plans/screens/ExerciseEntryScreen';
import { PlanScheduleScreen } from '../screens/Plans/screens/PlanScheduleScreen';
import { PlanReviewScreen } from '../screens/Plans/screens/PlanReviewScreen';
import { AuthStack } from '../screens/Auth/AuthStack';
import { OnboardingStack } from '../screens/Onboarding/OnboardingStack';
import { AccountScreen } from '../screens/Tabs/Profile/screens/AccountScreen';
import { ExerciseDetailScreen } from '../screens/Tabs/Workout/screens/ExerciseDetailScreen';
import { SessionScreen } from '../screens/Tabs/Workout/screens/SessionScreen';
import { SessionCompleteScreen } from '../screens/Tabs/Workout/screens/SessionCompleteScreen';
import { SessionExercisesScreen } from '../screens/Tabs/Workout/screens/SessionExercisesScreen';
import { SessionDetailScreen } from '../screens/Tabs/Workout/screens/SessionDetailScreen';
import { CycleReviewScreen } from '../screens/Tabs/Workout/screens/CycleReviewScreen';
import { ActivePlanWorkoutsScreen } from '../screens/Tabs/Workout/screens/ActivePlanWorkoutsScreen';
import { ExercisePickerScreen } from '../screens/Plans/screens/ExercisePickerScreen';
import type { SessionRoutes } from '../screens/Tabs/Workout/sessionRoutes';
import { BuddiesScreen } from '../screens/Buddies/BuddiesScreen';
import { CardStack } from '../screens/Buddies/CardStack';
import { BuddyCardScreen } from '../screens/Buddies/BuddyCardScreen';
import { ReactionsParams, ReactionsScreen } from '../screens/Buddies/ReactionsScreen';
import { BuddyActivityScreen } from '../screens/Buddies/BuddyActivityScreen';
import { BuddyPlansScreen } from '../screens/Buddies/BuddyPlansScreen';
import { BuddyPlanScreen } from '../screens/Buddies/BuddyPlanScreen';
import { BuddyWorkoutScreen } from '../screens/Buddies/BuddyWorkoutScreen';
import { AchievementsScreen } from '../screens/Achievements/AchievementsScreen';
import { BadgeScreen } from '../screens/Achievements/BadgeScreen';
import { AchievementFamilyId, Plan, Cycle } from '../data/models';
import type { BuddyRoutes } from '../screens/Buddies/routes';
import { HeaderButton } from '../components/headers/HeaderButton';
import { generalIcons } from '../components/icons/icon-library';
import { devFlags } from '../dev/flags';
import { useStackOptions } from '../navigation/stackOptions';
import { useAuth } from '../data/auth/AuthProvider';
import { ensurePhotoCacheable } from '../data/services/profileService';
import { useTheme } from '../theme';

export type AppStackParams = BuddyRoutes & SessionRoutes & ReactionsParams & Omit<PlansStackParams, 'ExercisePickerScreen' | 'ExerciseDetailScreen'> & {
    AuthStack: undefined;
    OnboardingStack: undefined;
    TabNavigator: undefined;
    NotificationsScreen: undefined;
    AccountScreen: undefined;
    /** How-to for an exercise opened from a buddy's plan or the running workout's picker; the plan creator and Workout tab have their own copies. */
    ExerciseDetailScreen: { exerciseId: string; knownAs?: string; addToSession?: boolean; swapForSessionExerciseId?: string; addToWorkoutId?: string };
    /** The badge grid; `achievementId` opens that badge's family. */
    AchievementsScreen: { achievementId?: string } | undefined;
    BadgeScreen: { family: AchievementFamilyId; tier: number };
    /** A logged workout or a cycle's review, pushed over whatever is open (a badge, the notifications feed) so back returns there. The tabs have their own copies for their own lists. */
    SessionDetailScreen: { sessionId: string; workoutName?: string };
    /** The review of a finished cycle: by id, or with the plan and cycle in hand straight from the Workout tab. */
    CycleReviewScreen: { plan: Plan; cycle: Cycle; cycleId?: undefined } | { cycleId: string; plan?: undefined; cycle?: undefined };
};

const Stack = createNativeStackNavigator<AppStackParams>();

/**
 * Routes by account state. No session sees the welcome screen; a signed-in
 * user without onboarding sees onboarding; everyone else the tabs. React Navigation swaps the route set, so there's nothing to
 * navigate to manually after signing in or out.
 */
export const AppStack = () => {
    const opts = useStackOptions();
    const { colors } = useTheme();
    // The plan steps' titles: numbered while creating, plain while editing a part from the hub.
    const step = (n: number, title: string) => ({ route }: { route: { params?: { mode?: EditorMode } } }) => opts.screen(route.params?.mode === 'edit' ? title : `${title}  ·  ${n} of 4`);
    const { ready, uid, profile } = useAuth();
    const bypass = __DEV__ && devFlags.startAtTabs;
    const signedIn = bypass || !!uid;
    const onboarded = bypass || !!profile?.onboardingCompletedAt;

    // The profile photo is shown on several screens; make sure it caches and is already fetched.
    const photoUrl = profile?.photoUrl ?? null;
    useEffect(() => {
        if (uid && photoUrl) ensurePhotoCacheable(uid, photoUrl).catch(() => undefined);
    }, [uid, photoUrl]);

    if (!ready) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ground }}>
                <ActivityIndicator color={colors.accent} />
            </View>
        );
    }

    return (
        <PlanEditorProvider>
        <Stack.Navigator screenOptions={{ ...opts.base, headerShown: false }}>
            {!signedIn ? (
                <Stack.Screen name="AuthStack" component={AuthStack} options={{ animation: 'fade' }} />
            ) : !onboarded ? (
                <Stack.Screen name="OnboardingStack" component={OnboardingStack} options={{ animation: 'fade', gestureEnabled: false }} />
            ) : (
                <>
                    <Stack.Screen name="TabNavigator" component={TabNavigator} options={{ animation: 'fade', gestureEnabled: false }} />
                    <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} options={opts.screen('Notifications')} />
                    <Stack.Screen name="AccountScreen" component={AccountScreen} options={opts.screen('Account')} />
                    {/* The plan screens, pushed like any other (they were a stack of their own once). Creating walks four numbered steps; editing opens one part at a time from the hub. */}
                    <Stack.Screen name="PlansScreen" component={PlansScreen} options={opts.screen('My plans')} />
                    <Stack.Screen name="PlanOverviewScreen" component={PlanOverviewScreen} options={opts.screen('Plan')} />
                    <Stack.Screen name="PlanEditScreen" component={PlanEditScreen} options={opts.screen('Edit plan')} />
                    <Stack.Screen name="PlanBasicsScreen" component={PlanBasicsScreen} options={step(1, 'Basics')} />
                    <Stack.Screen name="PlanWorkoutsScreen" component={PlanWorkoutsScreen} options={step(2, 'Workouts')} />
                    <Stack.Screen name="WorkoutEditorScreen" component={WorkoutEditorScreen} options={opts.screen('Workout')} />
                    <Stack.Screen name="ExerciseEntryScreen" component={ExerciseEntryScreen} options={({ navigation }) => opts.modal('Exercise', () => <HeaderButton icon={generalIcons.xMark} accessibilityLabel="Close" onPress={() => navigation.goBack()} />)} />
                    <Stack.Screen name="PlanScheduleScreen" component={PlanScheduleScreen} options={step(3, 'Schedule')} />
                    <Stack.Screen name="PlanReviewScreen" component={PlanReviewScreen} options={step(4, 'Review')} />
                    <Stack.Screen name="BuddiesScreen" component={BuddiesScreen} options={opts.screen('Buddies')} />
                    {/* Your own card slides up from the Profile header; swipe it down (or X) to put it away. The scanner pushes inside the sheet. */}
                    <Stack.Screen name="CardStack" component={CardStack} options={{ presentation: 'modal', headerShown: false }} />
                    {/* A card is a sheet with an X: it can be brought up from a link, a scan, or the buddies list. */}
                    {/* A modal rather than a sheet, so filtering by emoji never resizes it (owner, 2026-10-24). */}
                    <Stack.Screen name="ReactionsScreen" component={ReactionsScreen} options={({ navigation, route }) => opts.modal(`Reactions · ${Object.keys(route.params.reactions ?? {}).length}`, () => <HeaderButton icon={generalIcons.xMark} accessibilityLabel="Close" onPress={() => navigation.goBack()} />)} />
                    <Stack.Screen name="BuddyCardScreen" component={BuddyCardScreen} options={({ navigation, route }) => opts.modal(route.params.displayName ?? 'Iron Card', () => <HeaderButton icon={generalIcons.xMark} accessibilityLabel="Close" onPress={() => navigation.goBack()} />)} />
                    <Stack.Screen name="AchievementsScreen" component={AchievementsScreen} options={opts.screen('Achievements')} />
                    {/* One badge on black, so the header goes dark with it. */}
                    <Stack.Screen name="BadgeScreen" component={BadgeScreen} options={{ ...opts.screen(''), headerStyle: { backgroundColor: '#000000' }, headerTintColor: '#FFFFFF', headerTitleStyle: { color: '#FFFFFF' }, contentStyle: { backgroundColor: '#000000' } }} />
                    {/* Reached from a badge's "Earned in" pill, a notification or an in-app banner: pushed here so back goes to where the tap was. */}
                    <Stack.Screen name="SessionDetailScreen" component={SessionDetailScreen} options={({ route }) => opts.screen(route.params.workoutName ?? 'Workout')} />
                    <Stack.Screen name="CycleReviewScreen" component={CycleReviewScreen} options={opts.screen('Cycle review')} />
                    <Stack.Screen name="BuddyActivityScreen" component={BuddyActivityScreen} options={opts.screen('Buddy activity')} />
                    <Stack.Screen name="BuddyPlansScreen" component={BuddyPlansScreen} options={opts.screen('Plans from buddies')} />
                    <Stack.Screen name="BuddyPlanScreen" component={BuddyPlanScreen} options={opts.screen('Plan')} />
                    <Stack.Screen name="BuddyWorkoutScreen" component={BuddyWorkoutScreen} options={({ route }) => opts.screen(route.params.displayName?.split(' ')[0] ?? 'Workout')} />
                    <Stack.Screen name="ExerciseDetailScreen" component={ExerciseDetailScreen} options={({ navigation }) => opts.modal('How to', () => <HeaderButton icon={generalIcons.xMark} accessibilityLabel="Close" onPress={() => navigation.goBack()} />)} />
                    {/* The running workout, over the tabs: a focus mode with no tab bar. Draws its own header row (see SessionScreen) so the title stays centred beside the rest pill. */}
                    <Stack.Screen name="SessionScreen" component={SessionScreen} options={({ route }) => ({ ...opts.screen(route.params.session.workoutName), headerShown: false, gestureEnabled: false })} />
                    <Stack.Screen name="SessionCompleteScreen" component={SessionCompleteScreen} options={{ ...opts.base, headerShown: false, animation: 'fade', gestureEnabled: false }} />
                    <Stack.Screen name="SessionExercisesScreen" component={SessionExercisesScreen} options={({ navigation, route }) => opts.modal(route.params.workoutName, () => <HeaderButton icon={generalIcons.xMark} accessibilityLabel="Close" onPress={() => navigation.goBack()} />)} />
                    <Stack.Screen name="ActivePlanWorkoutsScreen" component={ActivePlanWorkoutsScreen} options={({ navigation }) => opts.modal('Active plan workouts', () => <HeaderButton icon={generalIcons.xMark} accessibilityLabel="Close" onPress={() => navigation.goBack()} />)} />
                    <Stack.Screen name="ExercisePickerScreen" component={ExercisePickerScreen} options={({ navigation, route }) => opts.modal(route.params.mode === 'swap' ? 'Swap exercise' : 'Add exercise', () => <HeaderButton icon={generalIcons.xMark} accessibilityLabel="Close" onPress={() => navigation.goBack()} />)} />
                </>
            )}
        </Stack.Navigator>
        </PlanEditorProvider>
    );
};
