import { createContext } from "react"
import { ThemeContextValue } from "./ThemeTypes";

export const initialAppTheme = ''

export const ThemeContext = createContext<ThemeContextValue>({appTheme: initialAppTheme, setAppTheme: () => null});