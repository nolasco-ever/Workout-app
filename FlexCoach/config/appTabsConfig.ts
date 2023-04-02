import { tabIcons } from "../components/icons/icon-library";
import { HomeScreen } from "../screens/Tabs/Home/HomeScreen";
import { LogScreen } from "../screens/Tabs/Log/LogScreen";
import { ProfileScreen } from "../screens/Tabs/Profile/ProfileScreen";
import { SocialScreen } from "../screens/Tabs/Social/SocialScreen";
import { StatsScreen } from "../screens/Tabs/Stats/StatsScreen";

export const appTabs = [
    {
        name: 'Home',
        component: HomeScreen,
        icon: tabIcons.home
    },
    {
        name: 'Stats',
        component: StatsScreen,
        icon: tabIcons.stats
    },
    {
        name: 'Log',
        component: LogScreen,
        icon: tabIcons.log
    },
    {
        name: 'Social',
        component: SocialScreen,
        icon: tabIcons.social
    },
    {
        name: 'Profile',
        component: ProfileScreen,
        icon: tabIcons.profile
    }
]