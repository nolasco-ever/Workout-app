import { createStackNavigator } from '@react-navigation/stack';
import { SignInScreen } from '../screens/Auth/SignInScreen';
import { TabNavigator } from './TabNavigator';

const Stack = createStackNavigator();

export const AppStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false
        }}
    >
        <Stack.Screen
            name="SignIn"
            component={SignInScreen}
        />
        <Stack.Screen
            name="Tabs"
            component={TabNavigator}
        />
    </Stack.Navigator>
)