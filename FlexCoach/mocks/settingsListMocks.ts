import { generalIcons } from "../components/icons/icon-library";

export const settingsListMocks = [
    {
        id: 'appTheme',
        icon: generalIcons.moon,
        title: 'App Theme',
        description: 'Switch between a light theme or a dark theme',
    },
    {
        id: 'notifications',
        icon: generalIcons.bell,
        title: 'Notifications',
        description: `Choose what notifications you'd like to receive`,
    },
    {
        id: 'privacyAndPermissions',
        icon: generalIcons.key,
        title: 'Privacy and Permissions',
        description: 'Access our Terms of Use and Privacy Policy',
    },
    {
        id: 'account',
        icon: generalIcons.user,
        title: 'Account',
        description: 'Update, set, or remove information from your account',
    },
    {
        id: 'contactUs',
        icon: generalIcons.envelope,
        title: 'Contact Us',
        description: 'Reach out with any questions, comments, or concerns',
    }
]