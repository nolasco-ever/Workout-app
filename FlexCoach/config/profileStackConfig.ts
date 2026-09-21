import { generalIcons } from "../components/icons/icon-library";
import { AppThemeScreen } from "../screens/Tabs/Profile/screens/AppThemeScreen";
import { ProfileScreen } from "../screens/Tabs/Profile/screens/ProfileScreen";

export const profileStack = [
    {
        id: 'AppThemeScreen',
        name: 'App Theme',
        component: AppThemeScreen,
        icon: generalIcons.moon
    },
]