import { tabIcons } from "../components/icons/icon-library";
import { HomeScreen } from "../screens/Tabs/Home/screens/HomeScreen";
import { DietLogScreen } from "../screens/Tabs/Home/screens/DietLogScreen";
import { WorkoutHub } from "../screens/Tabs/Home/screens/WorkoutHub";
import WorkoutLoggerScreen from "../screens/Tabs/Home/screens/WorkoutLoggerScreen";

export const homeStack = [
    {
        id: 'homeScreen',
        name: 'Home',
        component: HomeScreen,
        icon: tabIcons.home
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
    },
    {
        id: 'dietLogScreen',
        name: 'Diet Log',
        component: DietLogScreen
    }
]