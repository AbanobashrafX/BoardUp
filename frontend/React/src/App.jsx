import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import KanbanBoard from './components/KanbanBoard/KanbanBoard';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';

function App() {
    return (
        <ThemeProvider>
            <div className="app">
                <header className="header">
                    <h1>📋 BoardUp</h1>
                    <div className="header-actions">
                        <ThemeToggle />
                        <span className="version">v1.5.0</span>
                    </div>
                </header>

                <main className="main-content">
                    <KanbanBoard />
                </main>
            </div>
        </ThemeProvider>
    );
}

export default App;
