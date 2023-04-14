import { tabIcons } from "../components/icons/icon-library";
import { DietLogScreen } from "../screens/Tabs/Stats/screens/DietLogScreen";
import { StatsScreen } from "../screens/Tabs/Stats/screens/StatsScreen";
import { WorkoutHub } from "../screens/Tabs/Stats/screens/WorkoutHub";
import WorkoutLoggerScreen from "../screens/Tabs/Stats/screens/WorkoutLoggerScreen";

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
    },
    {
        id: 'workoutHub',
        name: `Today's Workout`,
        component: WorkoutHub
    },
    {
        id: 'workoutLogger',
        name: 'Workout Logger',
        component: WorkoutLoggerScreen
    }
]