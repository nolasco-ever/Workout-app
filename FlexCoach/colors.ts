import { useColorScheme } from "react-native";

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