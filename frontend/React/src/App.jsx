import React from 'react';
import KanbanBoard from './components/KanbanBoard/KanbanBoard';
import './App.css';

function App() {
    return (
        <div className="app">
            <header className="header">
                <h1>📋 BoardUp</h1>
                <div className="header-actions">
                    <span className="version">v1.2.0</span>
                </div>
            </header>

            <main className="main-content">
                <KanbanBoard />
            </main>
        </div>
    );
}

export default App;
