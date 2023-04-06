import { useColorScheme } from "react-native";

const darkModeColors = {
    background: '#121212',
    onBackground: '#2c2c2c',
    text: '#ffffff',
    onPrimaryText: '#ffffff',
    subtext: '#a2a2a2',
    primary: '#326789',
    secondary: '#e65c4f',
    accent: '#ff5733',
    inactive: '#a2a2a2',
    icon: '#ffffff',
    error: '#cf6679',
    onError: '#000000'
}

const lightModeColors = {
    background: '#fafafa',
    onBackground: '#ffffff',
    text: '#262626',
    onPrimaryText: '#ffffff',
    subtext: '#6f6f6f',
    primary: '#326789',
    secondary: '#e65c4f',
    accent: '#ff5733',
    inactive: '#a2a2a2',
    icon: '#001f54',
    error: '#b00020',
    onError: '#ffffff'
}

const getSystemTheme = () => {
    return useColorScheme();
}

const getColors = (systemTheme: string | null | undefined) => {
    if (systemTheme === 'light') {
        return lightModeColors;
    } else {
        return darkModeColors;
    }
}

export const colors = () => {
    const systemTheme = getSystemTheme();
    return getColors(systemTheme);
}