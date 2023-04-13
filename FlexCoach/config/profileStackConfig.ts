import { generalIcons, tabIcons } from "../components/icons/icon-library";
import { AppThemeScreen } from "../screens/Tabs/Profile/screens/AppThemeScreen";
import { ProfileScreen } from "../screens/Tabs/Profile/screens/ProfileScreen";
import { SettingsScreen } from "../screens/Tabs/Profile/screens/SettingsScreen";


export const profileStack = [
    {
        id: 'profileScreen',
        name: 'Profile',
        component: ProfileScreen,
        icon: tabIcons.profile
    },
    {
        id: 'settingsScreen',
        name: 'Settings',
        component: SettingsScreen,
        icon: generalIcons.gear,
    },
    {
        id: 'appThemeScreen',
        name: 'App Theme',
        component: AppThemeScreen,
        icon: generalIcons.moon
    },
]