import { StackNavigationOptions } from "@react-navigation/stack"
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { ParamListBase, RouteProp } from "@react-navigation/native";

export const getScreenHeaderOptions = ({...props}): StackNavigationOptions | ((props: {
    route: RouteProp<ParamListBase, string>;
    navigation: any;
}) => StackNavigationOptions) => {
    return {
        headerShown: true,
        headerStyle: {backgroundColor:  props.appColors.background},
        headerTitleStyle: {color: props.appColors.text},
        headerTitle: props.screen.name,
        headerBackTitleVisible: false,
    }
}