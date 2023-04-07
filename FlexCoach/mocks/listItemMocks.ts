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
        description: 'View your previous workouts',
        navigateTo: 'placeholderScreen'
    },
    {
        id: 'createANewWorkoutPlan',
        icon: generalIcons.plus,
        title: 'Create a New Workout Plan',
        description: `Customize and start a new training program`,
        navigateTo: 'placeholderScreen'
    },
    {
        id: 'createANewDietPlan',
        icon: generalIcons.plus,
        title: 'Create a New Diet Plan',
        description: 'Make a plan for your body goals',
        navigateTo: 'placeholderScreen'
    },
]