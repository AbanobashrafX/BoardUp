import React, { useState, useCallback } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ThemeProvider as CustomThemeProvider, useTheme } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import BoardContainer from './components/BoardContainer/BoardContainer';
import ProjectSidebar from './components/ProjectSidebar/ProjectSidebar';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal/KeyboardShortcutsModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function AppContent() {
    const [selectedProject, setSelectedProject] = useState(null);
    const [showShortcutsModal, setShowShortcutsModal] = useState(false);

    const handleNewTask = useCallback(() => {
        // This will be handled by BoardContainer
        const event = new CustomEvent('keyboard-shortcut', { detail: { action: 'newTask' } });
        window.dispatchEvent(event);
    }, []);

    const handleSearch = useCallback(() => {
        const event = new CustomEvent('keyboard-shortcut', { detail: { action: 'search' } });
        window.dispatchEvent(event);
    }, []);

    const handleToggleTheme = useCallback(() => {
        const event = new CustomEvent('keyboard-shortcut', { detail: { action: 'toggleTheme' } });
        window.dispatchEvent(event);
    }, []);

    const handleClearFilters = useCallback(() => {
        const event = new CustomEvent('keyboard-shortcut', { detail: { action: 'clearFilters' } });
        window.dispatchEvent(event);
    }, []);

    const handleStatusFilter = useCallback((status) => {
        const event = new CustomEvent('keyboard-shortcut', { detail: { action: 'statusFilter', status } });
        window.dispatchEvent(event);
    }, []);

    const handleShowHelp = useCallback(() => {
        setShowShortcutsModal(true);
    }, []);

    useKeyboardShortcuts({
        onNewTask: handleNewTask,
        onSearch: handleSearch,
        onToggleTheme: handleToggleTheme,
        onClearFilters: handleClearFilters,
        onStatusFilter: handleStatusFilter,
        onShowHelp: handleShowHelp,
    });

    return (
        <div className="app">
            <header className="header">
                <h1>📋 BoardUp</h1>
                <div className="header-actions">
                    <button
                        className="shortcuts-help-btn"
                        onClick={() => setShowShortcutsModal(true)}
                        title="Keyboard shortcuts (?)"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="M6 8h.01" />
                            <path d="M10 8h.01" />
                            <path d="M14 8h.01" />
                            <path d="M18 8h.01" />
                            <path d="M8 12h.01" />
                            <path d="M12 12h.01" />
                            <path d="M16 12h.01" />
                            <path d="M7 16h10" />
                        </svg>
                    </button>
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
            <KeyboardShortcutsModal
                isOpen={showShortcutsModal}
                onClose={() => setShowShortcutsModal(false)}
            />
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
