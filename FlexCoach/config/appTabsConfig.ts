import { tabIcons } from "../components/icons/icon-library";
import { HomeScreen } from "../screens/Tabs/Home/HomeScreen";
import { LogScreen } from "../screens/Tabs/Log/LogScreen";
import { ProfileStack } from "../screens/Tabs/Profile/ProfileStack";
import { SocialScreen } from "../screens/Tabs/Social/SocialScreen";
import { StatsStack } from "../screens/Tabs/Stats/StatsStack";

export const appTabs = [
    {
        name: 'Home',
        component: HomeScreen,
        icon: tabIcons.home
    },
    {
        name: 'Stats',
        component: StatsStack,
        icon: tabIcons.stats
    },
    // {
    //     name: 'Log',
    //     component: LogScreen,
    //     icon: tabIcons.log
    // },
    // {
    //     name: 'Social',
    //     component: SocialScreen,
    //     icon: tabIcons.social
    // },
    {
        name: 'Profile',
        component: ProfileStack,
        icon: tabIcons.profile
    }
]