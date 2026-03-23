import React, { useState } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ThemeProvider as CustomThemeProvider, useTheme } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import BoardContainer from './components/BoardContainer/BoardContainer';
import ProjectSidebar from './components/ProjectSidebar/ProjectSidebar';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';

function AppContent() {
    const [selectedProject, setSelectedProject] = useState(null);

    return (
        <div className="app">
            <header className="header">
                <h1>📋 BoardUp</h1>
                <div className="header-actions">
                    <ThemeToggle />
                    <span className="version">v1.9.0</span>
                </div>
            </header>

            <div className="app-layout">
                <ProjectSidebar
                    selectedProject={selectedProject}
                    onSelectProject={setSelectedProject}
                />
                <main className="main-content">
                    <BoardContainer selectedProject={selectedProject} />
                </main>
            </div>
        </div>
    );
}

function ThemedApp() {
    const { isDark } = useTheme();

    const muiTheme = createTheme({
        palette: {
            mode: isDark ? 'dark' : 'light',
            primary: {
                main: isDark ? '#61afef' : '#6366f1',
            },
            secondary: {
                main: isDark ? '#c678dd' : '#a78bfa',
            },
            background: {
                default: isDark ? '#1e2127' : '#f8fafc',
                paper: isDark ? '#282c34' : '#ffffff',
            },
        },
        components: {
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                        },
                    },
                },
            },
        },
    });

    return (
        <MuiThemeProvider theme={muiTheme}>
            <CssBaseline />
            <DataProvider>
                <AppContent />
            </DataProvider>
        </MuiThemeProvider>
    );
}

function App() {
    return (
        <CustomThemeProvider>
            <ThemedApp />
        </CustomThemeProvider>
    );
}

export default App;
