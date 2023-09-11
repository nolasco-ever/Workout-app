import { StackNavigationOptions } from "@react-navigation/stack"
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { ParamListBase, RouteProp } from "@react-navigation/native";

export const getScreenHeaderOptions = (appColors: any, screenName: any, ...props: any[]): StackNavigationOptions | ((props: {
    route: RouteProp<ParamListBase, string>;
    navigation: any;
}) => StackNavigationOptions) => {
    return {
        headerShown: true,
        headerStyle: {backgroundColor:  appColors.background},
        headerTitleStyle: {color: appColors.text},
        headerTitle: screenName,
        headerBackTitleVisible: false,
        ...props
    }
}