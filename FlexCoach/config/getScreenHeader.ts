import { StackNavigationOptions } from "@react-navigation/stack"
import { Icon } from '../components/icons/Icon';
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
        headerBackTitle: '',
        ...props
    }
}