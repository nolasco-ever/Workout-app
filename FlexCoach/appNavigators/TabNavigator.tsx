import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../colors';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { appTabs } from '../config/appTabsConfig';

const Tab = createBottomTabNavigator();
const appColors = colors();

export const TabNavigator = () => (
    <Tab.Navigator
        screenOptions={() => ({
            headerShown: false,
            tabBarStyle: {backgroundColor: appColors.background},
            tabBarShowLabel: false
        })}
    >
        {appTabs.map((tab, index) => (
            <Tab.Screen
                key={index}
                name={tab.name}
                component={tab.component}
                options={{
                    tabBarIcon: ({focused}) => (
                        <FontAwesomeIcon 
                            icon={tab.icon as IconProp}
                            color={focused ? appColors.accent : appColors.inactive}
                            size={25}
                        />
                    )
                }}
            />
        ))}
    </Tab.Navigator>
)