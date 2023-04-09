import { SetFitnessGoalScreen } from "../Flows/create-custom-training-program/screens/setFitnessGoalScreen";
import { generalIcons } from "../components/icons/icon-library";

export const customTrainingProgramStack = [
    {
        id: 'setFitnessGoalsScreen',
        name: 'Set Your Fitness Goals',
        component: SetFitnessGoalScreen,
        icon: generalIcons.dumbbell,
    }
]