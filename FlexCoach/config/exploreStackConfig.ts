import { generalIcons, tabIcons } from "../components/icons/icon-library";
import { ExploreScreen } from "../screens/Tabs/Explore/screens/ExploreScreen";
import { TutorialScreen } from "../shared-screens/tutorialScreen";

export const exploreStack = [
    {
        id: 'exploreScreen',
        name: 'Explore',
        component: ExploreScreen,
        icon: tabIcons.explore
    },
    {
        id: 'tutorialScreen',
        name: 'Tutorial',
        component: TutorialScreen,
        icon: generalIcons.personTeaching
    }
]