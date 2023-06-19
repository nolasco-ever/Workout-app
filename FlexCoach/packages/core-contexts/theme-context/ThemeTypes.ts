import React from "react";

export interface ThemeContextValue {
    appTheme: string;
    setAppTheme: React.Dispatch<React.SetStateAction<string>>;
}