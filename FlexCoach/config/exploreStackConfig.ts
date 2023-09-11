import { generalIcons, tabIcons } from "../components/icons/icon-library";
import { ExploreScreen } from "../screens/Tabs/Explore/screens/ExploreScreen";
import { TutorialScreen } from "../shared-screens/TutorialScreen/tutorialScreen";

export const exploreStack = [
    {
        id: 'TutorialScreen',
        name: 'Tutorial',
        component: TutorialScreen,
        icon: generalIcons.personTeaching
    }
]