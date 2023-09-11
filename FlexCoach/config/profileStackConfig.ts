import { generalIcons, tabIcons } from "../components/icons/icon-library";
import { AppThemeScreen } from "../screens/Tabs/Profile/screens/AppThemeScreen";
import { ProfileScreen } from "../screens/Tabs/Profile/screens/ProfileScreen";
import { SettingsScreen } from "../screens/Tabs/Profile/screens/SettingsScreen";

export const profileStack = [
    {
        id: 'SettingsScreen',
        name: 'Settings',
        component: SettingsScreen,
        icon: generalIcons.gear,
    },
    {
        id: 'AppThemeScreen',
        name: 'App Theme',
        component: AppThemeScreen,
        icon: generalIcons.moon
    },
]