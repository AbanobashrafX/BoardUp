import React from 'react';
import './KeyboardShortcutsModal.css';

const shortcuts = [
    { key: 'N', description: 'Create new task' },
    { key: 'F', description: 'Focus search' },
    { key: 'T', description: 'Toggle theme' },
    { key: 'C', description: 'Clear filters' },
    { key: '1', description: 'Filter by TODO status' },
    { key: '2', description: 'Filter by IN_PROGRESS status' },
    { key: '3', description: 'Filter by DONE status' },
    { key: 'Esc', description: 'Close modal' },
];

function KeyboardShortcutsModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="shortcuts-modal-overlay" onClick={onClose}>
            <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
                <div className="shortcuts-modal-header">
                    <h2>Keyboard Shortcuts</h2>
                    <button className="shortcuts-modal-close" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div className="shortcuts-modal-content">
                    <div className="shortcuts-list">
                        {shortcuts.map((shortcut, index) => (
                            <div key={index} className="shortcut-item">
                                <kbd className="shortcut-key">{shortcut.key}</kbd>
                                <span className="shortcut-description">{shortcut.description}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default KeyboardShortcutsModal;
