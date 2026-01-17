import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { darkTheme, lightTheme, terminalTheme } from './theme';
import { loadThemePreference } from './sync/persistence';
import { Appearance } from 'react-native';
import * as SystemUI from 'expo-system-ui';

//
// Theme
//

const appThemes = {
    light: lightTheme,
    dark: darkTheme,
    terminal: terminalTheme
};

const breakpoints = {
    xs: 0, // <-- make sure to register one breakpoint with value 0
    sm: 300,
    md: 500,
    lg: 800,
    xl: 1200
    // use as many breakpoints as you need
};

// Load theme preference from storage
const themePreference = loadThemePreference();

// Determine initial theme and adaptive settings
const getInitialTheme = (): 'light' | 'dark' | 'terminal' => {
    if (themePreference === 'adaptive') {
        const systemTheme = Appearance.getColorScheme();
        return systemTheme === 'dark' ? 'dark' : 'light';
    }
    if (themePreference === 'terminal') {
        return 'terminal';
    }
    return themePreference;
};

const settings = themePreference === 'adaptive'
    ? {
        // When adaptive, let Unistyles handle theme switching automatically
        adaptiveThemes: true,
        CSSVars: true, // Enable CSS variables for web
    }
    : {
        // When fixed theme, set the initial theme explicitly
        initialTheme: getInitialTheme(),
        CSSVars: true, // Enable CSS variables for web
    };

//
// Bootstrap
//

type AppThemes = typeof appThemes
type AppBreakpoints = typeof breakpoints

declare module 'react-native-unistyles' {
    export interface UnistylesThemes extends AppThemes { }
    export interface UnistylesBreakpoints extends AppBreakpoints { }
}

StyleSheet.configure({
    settings,
    breakpoints,
    themes: appThemes,
})

// Set initial root view background color based on theme
const setRootBackgroundColor = () => {
    if (themePreference === 'adaptive') {
        const systemTheme = Appearance.getColorScheme();
        const color = systemTheme === 'dark' ? appThemes.dark.colors.groupped.background : appThemes.light.colors.groupped.background;
        UnistylesRuntime.setRootViewBackgroundColor(color);
        SystemUI.setBackgroundColorAsync(color);
    } else if (themePreference === 'terminal') {
        const color = appThemes.terminal.colors.groupped.background;
        UnistylesRuntime.setRootViewBackgroundColor(color);
        SystemUI.setBackgroundColorAsync(color);
    } else {
        const color = themePreference === 'dark' ? appThemes.dark.colors.groupped.background : appThemes.light.colors.groupped.background;
        UnistylesRuntime.setRootViewBackgroundColor(color);
        SystemUI.setBackgroundColorAsync(color);
    }
};

// Set initial background color
setRootBackgroundColor();