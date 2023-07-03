import { tabIcons } from "../components/icons/icon-library";
import { ExploreStack } from "../screens/Tabs/Explore/ExploreStack";
import { HomeStack } from "../screens/Tabs/Home/HomeStack";
import { ProfileStack } from "../screens/Tabs/Profile/ProfileStack";

export const appTabs = [
    {
        name: 'Home',
        component: HomeStack,
        icon: tabIcons.home
    },
    {
        name: 'Explore',
        component: ExploreStack,
        icon: tabIcons.explore
    },
    {
        name: 'Profile',
        component: ProfileStack,
        icon: tabIcons.profile
    }
]