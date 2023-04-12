import { buildMuscleAnimation, cardiovascularHealthAnimation, increaseFlexibilityAnimation, loseWeightAnimation } from "../../animations/custom-training-program-flow";

export const setFitnessGoalsOptions = [
    {
        id: 'buildMuscle',
        name: 'Build Muscle',
        image: buildMuscleAnimation
    },
    {
        id: 'loseWeight',
        name: 'Lose Weight',
        image: loseWeightAnimation
    },
    {
        id: 'increaseFlexibility',
        name: 'Increase Flexibility',
        image: increaseFlexibilityAnimation
    },
    {
        id: 'cardiovascularHealth',
        name: 'Cardiovascular Health',
        image: cardiovascularHealthAnimation
    }
]