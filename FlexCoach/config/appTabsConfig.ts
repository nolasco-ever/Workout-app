import { tabIcons } from "../components/icons/icon-library";
import { HomeStack } from "../screens/Tabs/Home/HomeStack";
import { ProfileStack } from "../screens/Tabs/Profile/ProfileStack";

export const appTabs = [
    {
        name: 'Home',
        component: HomeStack,
        icon: tabIcons.home
    },
    {
        name: 'Profile',
        component: ProfileStack,
        icon: tabIcons.profile
    }
]