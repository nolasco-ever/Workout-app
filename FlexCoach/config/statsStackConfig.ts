import { tabIcons } from "../components/icons/icon-library";
import { DietLogScreen } from "../screens/Tabs/Stats/screens/DietLogScreen";
import { StatsScreen } from "../screens/Tabs/Stats/screens/StatsScreen";

export const statsStack = [
    {
        id: 'statsScreen',
        name: 'Stats',
        component: StatsScreen,
        icon: tabIcons.stats
    },
    {
        id: 'dietLogScreen',
        name: 'Diet Log',
        component: DietLogScreen
    }
]