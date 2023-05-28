import { CustomTrainingProgramStack } from "../Flows/create-custom-training-program/CustomTrainingProgramStack";
import { DesignYourPlanScreen } from "../screens/Onboarding/screens/DesignYourPlanScreen";
import { SetProfilePhotoScreen } from "../screens/Onboarding/screens/SetProfilePhotoScreen";
import { UserProfileInfoScreen } from "../screens/Onboarding/screens/UserProfileInfoScreen";

export const onboardingStack = [
    {
        id: 'userProfileInfoScreen',
        name: 'Create Your Profile',
        component: UserProfileInfoScreen
    },
    {
        id: 'setProfilePhotoScreen',
        name: 'Set Your Photo',
        component: SetProfilePhotoScreen
    },
    {
        id: 'designYourPlan',
        name: 'Design Your Plan',
        component: DesignYourPlanScreen
    }
]