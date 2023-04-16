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
        id: 'notifications',
        icon: generalIcons.bell,
        title: 'Notifications',
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
        id: 'history',
        icon: generalIcons.clock,
        title: 'History',
        description: 'View your previous workout programs',
        navigateTo: 'placeholderScreen'
    },
    {
        id: 'createANewWorkoutPlan',
        icon: generalIcons.plus,
        title: 'Create a New Workout Plan',
        description: `Customize and start a new training program`,
        navigateTo: 'createYourCustomTrainingProgram'
    },
    {
        id: 'createANewDietPlan',
        icon: generalIcons.plus,
        title: 'Create a New Diet Plan',
        description: 'Make a plan for your body goals',
        navigateTo: 'placeholderScreen'
    },
];

export const statsScreenDietListMock = [
    {
        id: 'todaysLog',
        icon: generalIcons.list,
        title: `Today's Log`,
        description: 'View, add, or remove items',
        navigateTo: 'dietLogScreen'
    },
    {
        id: 'foodRecommendations',
        icon: generalIcons.lightbulb,
        title: 'Food Recommendations',
        description: `Discover foods to eat and avoid based on your current diet plan`,
        navigateTo: 'placeholderScreen'
    },
];

export const statsScreenWorkoutListMock = [
    {
        id: 'todaysWorkout',
        icon: generalIcons.list,
        title: `Today's Workout`,
        description: 'Log your sets, reps, and weights for your exercises',
        navigateTo: 'workoutHub'
    },
    {
        id: 'trainingProgress',
        icon: generalIcons.simpleChart,
        title: 'Training Progress',
        description: `View the progress you've made so far`,
        navigateTo: 'placeholderScreen'
    },
    {
        id: 'yourTrainingProgram',
        icon: generalIcons.personRunning,
        title: 'Your Training Program',
        description: `Read through your current workout plan`,
        navigateTo: 'placeholderScreen'
    },
];

export const mockNotificationMessages = [
    {
      id: 0,
      message: "Congratulations! You hit a new personal record on bench press.",
      type: "pr",
      date: 'Today',
      timePassed: '2h'
    },
    {
      id: 1,
      message: "You have consumed 100g of protein today. You have 50g remaining before the end of the day.",
      type: "diet",
      date: 'Today',
      timePassed: '9h'
    },
    {
      id: 2,
      message: "Don't forget to drink enough water today!",
      type: "health",
      date: 'Yesterday',
      timePassed: '1d'
    },
    {
      id: 3,
      message: "You have completed your scheduled workout for today. Great job!",
      type: "workout",
      date: 'Yesterday',
      timePassed: '1d'
    },
    {
      id: 4,
      message: "You have exceeded your daily calorie limit. Try to stick to your diet plan.",
      type: "diet",
      date: 'Yesterday',
      timePassed: '1d'
    },
    {
      id: 5,
      message: "A new article about the benefits of stretching has been published in the app.",
      type: "news",
      date: 'Last Week',
      timePassed: '3d'
    },
    {
      id: 6,
      message: "You haven't logged your body weight in a week. Please update your progress.",
      type: "health",
      date: 'Last Week',
      timePassed: '3d'
    },
    {
      id: 7,
      message: "Your workout plan for this week has been updated. Please check it out!",
      type: "workout",
      date: 'Last Week',
      timePassed: '4d'
    }
  ];
  