import { generalIcons, tabIcons } from "../components/icons/icon-library";
import { HomeScreen } from "../screens/Tabs/Home/HomeScreen";
import { LogScreen } from "../screens/Tabs/Log/LogScreen";
import { ProfileStack } from "../screens/Tabs/Profile/ProfileStack";
import { AppThemeScreen } from "../screens/Tabs/Profile/screens/AppThemeScreen";
import { ProfileScreen } from "../screens/Tabs/Profile/screens/ProfileScreen";
import { SettingsScreen } from "../screens/Tabs/Profile/screens/SettingsScreen";
import { SocialScreen } from "../screens/Tabs/Social/SocialScreen";
import { StatsScreen } from "../screens/Tabs/Stats/screens/StatsScreen";
import { PlaceholderScreen } from "../screens/placeholderScreen";

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