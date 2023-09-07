import { generalIcons } from "../components/icons/icon-library";

export const settingsListMocks = [
    {
        id: 'appTheme',
        icon: generalIcons.moon,
        title: 'App Theme',
        description: 'Switch between a light theme or a dark theme',
        navigateTo: 'appThemeScreen'
    },
    {
        id: 'notificationPreferences',
        icon: generalIcons.bell,
        title: 'Notification Preferences',
        description: `Choose what notifications you'd like to receive`,
        navigateTo: 'placeholderScreen'
    },
    {
        id: 'privacyAndPermissions',
        icon: generalIcons.key,
        title: 'Privacy and Permissions',
        description: 'Access our Terms of Use and Privacy Policy',
        navigateTo: 'placeholderScreen'
    },
    {
        id: 'account',
        icon: generalIcons.user,
        title: 'Account',
        description: 'Update, set, or remove information from your account',
        navigateTo: 'placeholderScreen'
    },
    {
        id: 'contactUs',
        icon: generalIcons.envelope,
        title: 'Contact Us',
        description: 'Reach out with any questions, comments, or concerns',
        navigateTo: 'placeholderScreen'
    }
];

export const profileListMocks = [
    {
      id: 'setYourGoals',
      icon: generalIcons.plus,
      title: 'Set Your Goals',
      description: `Create a new training or nutrition plan`,
      navigateTo: 'createYourCustomTrainingProgram'
    },
    {
        id: 'history',
        icon: generalIcons.clock,
        title: 'History',
        description: 'View your previous workout programs',
        navigateTo: 'placeholderScreen'
    },
];

export const statsScreenActivityLogListMock = [
    {
        id: 'todaysWorkout',
        icon: generalIcons.dumbbell,
        title: `Workouts`,
        description: 'Log your sets, reps, and weights for your exercises',
        navigateTo: 'workoutHub',
        color: '#001f54'
    },
    {
        id: 'trainingProgress',
        icon: generalIcons.simpleChart,
        title: 'Progress',
        description: `View the progress you've made so far`,
        navigateTo: 'placeholderScreen',
        color: '#134162'
    },
    {
        id: 'todaysNutritionLog',
        icon: generalIcons.apple,
        title: `Nutrition`,
        description: `View, add, or remove items`,
        navigateTo: 'dietLogScreen',
        color: '#D04242'
    },
];

export const mockNotificationMessages = [
    {
      id: 0,
      title: 'New personal record',
      message: "Congratulations! You hit a new personal record on bench press.",
      type: "pr",
      date: 'Today',
      timePassed: '2h'
    },
    {
      id: 1,
      title: 'Almost there',
      message: "You have consumed 100g of protein today. You have 50g remaining before the end of the day.",
      type: "diet",
      date: 'Today',
      timePassed: '9h'
    },
    {
      id: 2,
      title: 'Stay hydrated',
      message: "Don't forget to drink enough water today!",
      type: "health",
      date: 'Yesterday',
      timePassed: '1d'
    },
    {
      id: 3,
      title: 'Workout complete',
      message: "You have completed your scheduled workout for today. Great job!",
      type: "workout",
      date: 'Yesterday',
      timePassed: '1d'
    },
    {
      id: 4,
      title: 'Calorie limit exceeded',
      message: "You have exceeded your daily calorie limit. Try to stick to your diet plan.",
      type: "diet",
      date: 'Yesterday',
      timePassed: '1d'
    },
    {
      id: 5,
      title: 'The Benefits of Weight Training',
      message: "Tap to read more on why weight training is important for both our physical and mental health.",
      type: "news",
      date: 'Last Week',
      timePassed: '3d'
    },
    {
      id: 6,
      title: 'Body weight log overdue',
      message: "You haven't logged your body weight in a week. Please update your progress.",
      type: "health",
      date: 'Last Week',
      timePassed: '3d'
    },
    {
      id: 7,
      title: 'New workout plan available',
      message: "Your workout plan for this week has been updated. Please check it out!",
      type: "workout",
      date: 'Last Week',
      timePassed: '4d'
    }
  ];
  