import { useColorScheme } from "react-native";
import { useThemeContext } from "./packages/core-contexts/theme-context";

const darkModeColors = {
    background: '#121212',
    onBackground: '#2c2c2c',
    iconButton: '#2c2c2c',
    text: '#ffffff',
    onPrimaryText: '#ffffff',
    subtext: '#a2a2a2',
    primary: '#326789',
    secondary: '#e65c4f',
    accent: '#ff5733',
    inactive: '#a2a2a2',
    icon: '#ffffff',
    transparent: 'rgba(0, 0, 0, 0)',
    onBanner: '#000000',
    info: '#b1edef',
    onInfo: '#42bdd1',
    success: '#c5efdd',
    onSuccess: '#6ad0a1',
    warning: '#f9efd7',
    onWarning: '#f4ba45',
    error: '#f4d9d9',
    onError: '#de5965',
    lightGrey: '#DDDDDD',
    googleRed: '#DB4437'
}

const lightModeColors = {
    background: '#fafafa',
    onBackground: '#ffffff',
    iconButton: '#F2F2F2',
    text: '#262626',
    onPrimaryText: '#ffffff',
    subtext: '#6f6f6f',
    primary: '#326789',
    secondary: '#e65c4f',
    accent: '#ff5733',
    inactive: '#a2a2a2',
    icon: '#001f54',
    transparent: 'rgba(0, 0, 0, 0)',
    onBanner: '#000000',
    info: '#b1edef',
    onInfo: '#42bdd1',
    success: '#c5efdd',
    onSuccess: '#6ad0a1',
    warning: '#f9efd7',
    onWarning: '#f4ba45',
    error: '#f4d9d9',
    onError: '#de5965',
    lightGrey: '#DDDDDD',
    googleRed: '#DB4437'
}

const getSystemTheme = () => {
    return useColorScheme();
}

const getColors = (theme: string | null | undefined) => {
    if (theme === 'light') {
        return lightModeColors;
    } else {
        return darkModeColors;
    }
}

export const colors = () => {
    const { appTheme } = useThemeContext();
    const systemTheme = getSystemTheme();

    const chosenTheme = appTheme === 'system' ? systemTheme : appTheme
    
    return getColors(chosenTheme);
}