import { ReviewYourProgram } from "../Flows/create-custom-training-program/screens/reviewYourProgram";
import { ScheduleTrainingProgramScreen } from "../Flows/create-custom-training-program/screens/scheduleTrainingProgramScreen";
import { SelectYourWorkoutsScreen } from "../Flows/create-custom-training-program/screens/selectYourWorkoutsScreen";
import { SetFitnessGoalScreen } from "../Flows/create-custom-training-program/screens/setFitnessGoalScreen";
import { generalIcons } from "../components/icons/icon-library";

export const customTrainingProgramStack = [
    {
        id: 'setFitnessGoalsScreen',
        name: 'Set Your Fitness Goals',
        component: SetFitnessGoalScreen,
        icon: generalIcons.dumbbell,
    },
    {
        id: 'selectYourWorkoutsScreen',
        name: 'Select Your Workout',
        component: SelectYourWorkoutsScreen,
        icon: generalIcons.dumbbell,
    },
    {
        id: 'scheduleTrainingProgramScreen',
        name: 'Schedule Your Week',
        component: ScheduleTrainingProgramScreen,
        icon: generalIcons.dumbbell,
    },
    {
        id: 'reviewYourProgram',
        name: 'Review Your Program',
        component: ReviewYourProgram,
        icon: generalIcons.dumbbell
    }
]