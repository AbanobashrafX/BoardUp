import React, { createContext, useContext, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from '../styles/muiTheme';
import { useTheme } from './ThemeContext';

const MUIThemeContext = createContext(null);

export function useMUITheme() {
    const context = useContext(MUIThemeContext);
    if (!context) {
        throw new Error('useMUITheme must be used within a MUIThemeProvider');
    }
    return context;
}

export function MUIThemeProvider({ children }) {
    const { theme, isDark } = useTheme();

    // Select the appropriate MUI theme based on our custom theme
    const muiTheme = useMemo(() => isDark ? darkTheme : lightTheme, [isDark]);

    // Force theme update by using theme as dependency
    const stableMuiTheme = useMemo(() => muiTheme, [isDark]); // Only depend on isDark

    const value = useMemo(() => ({
        muiTheme: stableMuiTheme,
        isDark,
    }), [stableMuiTheme, isDark]);

    return (
        <MUIThemeContext.Provider value={value}>
            <MuiThemeProvider theme={stableMuiTheme}>
                {children}
            </MuiThemeProvider>
        </MUIThemeContext.Provider>
    );
}