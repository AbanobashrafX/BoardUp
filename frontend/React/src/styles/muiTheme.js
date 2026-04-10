import { createTheme } from '@mui/material/styles';

// Base theme configuration
const createAppTheme = (mode) => createTheme({
    palette: {
        mode,
        ...(mode === 'light'
            ? {
                // Light theme colors matching CSS variables
                primary: {
                    main: '#8b63f1',
                    light: '#bf81f8',
                    dark: '#4338ca',
                    contrastText: '#ffffff',
                },
                secondary: {
                    main: '#8b5cf6',
                    light: '#a78bfa',
                    dark: '#6d28d9',
                    contrastText: '#ffffff',
                },
                background: {
                    default: '#f8fafc',
                    paper: '#ffffff',
                },
                text: {
                    primary: '#1e293b',
                    secondary: '#475569',
                },
                error: {
                    main: '#ef4444',
                },
                warning: {
                    main: '#f59e0b',
                },
                success: {
                    main: '#10b981',
                },
                info: {
                    main: '#3b82f6',
                },
            }
            : {
                // Dark theme colors matching CSS variables
                primary: {
                    main: '#8b63f1',
                    light: '#bf81f8',
                    dark: '#4338ca',
                    contrastText: '#282c34',
                },
                secondary: {
                    main: '#c678dd',
                    light: '#d49be6',
                    dark: '#b06bbe',
                    contrastText: '#282c34',
                },
                background: {
                    default: '#1e2127',
                    paper: '#282c34',
                },
                text: {
                    primary: '#abb2bf',
                    secondary: '#9da5b4',
                },
                error: {
                    main: '#f87171',
                },
                warning: {
                    main: '#fbbf24',
                },
                success: {
                    main: '#98c379',
                },
                info: {
                    main: '#60a5fa',
                },
            }),
    },
    typography: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        h1: {
            fontSize: '2rem',
            fontWeight: 700,
            lineHeight: 1.2,
        },
        h2: {
            fontSize: '1.75rem',
            fontWeight: 700,
            lineHeight: 1.2,
        },
        h3: {
            fontSize: '1.5rem',
            fontWeight: 700,
            lineHeight: 1.2,
        },
        h4: {
            fontSize: '1.25rem',
            fontWeight: 700,
            lineHeight: 1.2,
        },
        body1: {
            fontSize: '0.875rem',
            lineHeight: 1.6,
        },
        body2: {
            fontSize: '0.8125rem',
            lineHeight: 1.6,
        },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: mode === 'light' ? '#ffffff' : '#282c34',
                        '& fieldset': {
                            borderColor: mode === 'light' ? '#e2e8f0' : '#3b4048',
                        },
                        '&:hover fieldset': {
                            borderColor: mode === 'light' ? '#cbd5e1' : '#4b5060',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#8b63f1',
                            borderWidth: 2,
                        },
                    },
                    '& .MuiInputLabel-root': {
                        color: mode === 'light' ? '#475569' : '#9da5b4',
                        '&.Mui-focused': {
                            color: '#8b63f1',
                        },
                    },
                    '& .MuiInputBase-input': {
                        color: mode === 'light' ? '#1e293b' : '#abb2bf',
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 'var(--radius-md)',
                    textTransform: 'none',
                    fontWeight: 600,
                    padding: 'var(--space-md) var(--space-xl)',
                    minHeight: '2.75rem',
                    fontSize: '0.875rem',
                    '&:hover': {
                        backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
                    },
                },
                containedPrimary: {
                    backgroundColor: '#8b63f1',
                    color: '#ffffff',
                    '&:hover': {
                        backgroundColor: '#8046e5',
                    },
                },
                outlined: {
                    borderColor: mode === 'light' ? '#e2e8f0' : '#3b4048',
                    color: mode === 'light' ? '#1e293b' : '#abb2bf',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundColor: mode === 'light' ? '#ffffff' : '#282c34',
                    border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#3b4048'}`,
                },
            },
        },
        MuiPopover: {
            styleOverrides: {
                paper: {
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: mode === 'light' ? '#ffffff' : '#282c34',
                    border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#3b4048'}`,
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    color: mode === 'light' ? '#1e293b' : '#abb2bf',
                    '&:hover': {
                        backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
                    },
                    '&.Mui-selected': {
                        backgroundColor: mode === 'light' ? 'rgba(139, 99, 241, 0.12)' : 'rgba(129, 140, 248, 0.2)',
                    },
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundColor: mode === 'light' ? '#ffffff' : '#282c34',
                    border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#3b4048'}`,
                },
            },
        },
    },
});

// Export both light and dark themes
export const lightTheme = createAppTheme('light');
export const darkTheme = createAppTheme('dark');

// Legacy export for backward compatibility
export const muiTheme = lightTheme;