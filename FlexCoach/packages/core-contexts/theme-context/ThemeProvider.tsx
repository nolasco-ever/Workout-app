import React, { ReactNode, useMemo, useState } from "react"
import { ThemeContext } from "./ThemeContext";

interface ThemeProviderProps {
    children: ReactNode;
    appTheme: string;
}

export const ThemeProvider = ({children, appTheme}: ThemeProviderProps) => {
    const [theme, setTheme] = useState<string>(appTheme);

    const value = useMemo(() => {
        return { appTheme: theme, setAppTheme: setTheme }
    }, [theme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}