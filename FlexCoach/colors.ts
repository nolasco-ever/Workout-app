import { useColorScheme } from "react-native";

const isLightMode = false;

const darkModeColors = {
    background: '#1a1a1a',
    text: '#ffffff',
    onPrimaryText: '#ffffff',
    subtext: '#a2a2a2',
    primary: '#0e4c92',
    secondary: '#87cefa',
    accent: '#ff5733',
    inactive: '#a2a2a2',
    icon: '#ffffff'
}

const lightModeColors = {
    background: '#f4f4f4',
    text: '#262626',
    onPrimaryText: '#ffffff',
    subtext: '#6f6f6f',
    primary: '#001f54',
    secondary: '#87cefa',
    accent: '#ff5733',
    inactive: '#a2a2a2',
    icon: '#001f54'
}

export const colors = () => {
    const colorScheme = useColorScheme();
    const isLightMode = colorScheme === 'light';

    return {
        background: isLightMode ? lightModeColors.background : darkModeColors.background,
        text: isLightMode ? lightModeColors.text : darkModeColors.text,
        onPrimaryText: isLightMode ? lightModeColors.onPrimaryText : darkModeColors.onPrimaryText,
        subtext: isLightMode ? lightModeColors.subtext : darkModeColors.subtext,
        primary: isLightMode ? lightModeColors.primary : darkModeColors.primary,
        secondary: isLightMode ? lightModeColors.secondary : darkModeColors.secondary,
        accent: isLightMode ? lightModeColors.accent : darkModeColors.accent,
        inactive: isLightMode ? lightModeColors.inactive : darkModeColors.inactive,
        icon: isLightMode ? lightModeColors.icon : darkModeColors.icon,
      };
}