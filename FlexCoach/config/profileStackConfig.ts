import { generalIcons, tabIcons } from "../components/icons/icon-library";
import { AppThemeScreen } from "../screens/Tabs/Profile/screens/AppThemeScreen";
import { ProfileScreen } from "../screens/Tabs/Profile/screens/ProfileScreen";
import { SettingsScreen } from "../screens/Tabs/Profile/screens/SettingsScreen";

export interface ProfileTabParams {
    Profile: undefined;
    Settings: undefined;
    AppTheme: undefined;
}

export const profileStack = [
    {
        id: 'Settings',
        name: 'Settings',
        component: SettingsScreen,
        icon: generalIcons.gear,
    },
    {
        id: 'AppTheme',
        name: 'App Theme',
        component: AppThemeScreen,
        icon: generalIcons.moon
    },
]