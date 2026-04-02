import React, { useEffect, useRef } from 'react';
import './KeyboardShortcutsModal.css';

const shortcutSections = [
    {
        title: 'Actions',
        shortcuts: [
            { key: 'N', description: 'Create new task', modifier: null },
            { key: 'F', description: 'Focus search', modifier: null },
            { key: 'T', description: 'Toggle theme', modifier: null },
            { key: 'C', description: 'Clear filters', modifier: null },
            { key: 'shift + ?', description: 'Show keyboard shortcuts', modifier: null },
        ]
    },
    {
        title: 'Filters',
        shortcuts: [
            { key: '1', description: 'Filter by LOW priority', modifier: null },
            { key: '2', description: 'Filter by MEDIUM priority', modifier: null },
            { key: '3', description: 'Filter by HIGH priority', modifier: null },
            { key: '4', description: 'Filter by URGENT priority', modifier: null },
        ]
    },
    {
        title: 'Navigation',
        shortcuts: [
            { key: 'Esc', description: 'Close modal', modifier: null },
        ]
    }
];

function KeyboardShortcutsModal({ isOpen, onClose }) {
    const modalRef = useRef(null);
    const firstFocusableRef = useRef(null);

    useEffect(() => {
        if (isOpen && firstFocusableRef.current) {
            firstFocusableRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                onClose();
            }

            // Trap focus within modal
            if (e.key === 'Tab') {
                const focusableElements = modalRef.current?.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (!focusableElements || focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="shortcuts-modal-overlay" onClick={onClose}>
            <div
                className="shortcuts-modal"
                onClick={(e) => e.stopPropagation()}
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="shortcuts-modal-title"
            >
                <div className="shortcuts-modal-header">
                    <div className="shortcuts-modal-title-wrapper">
                        <svg className="shortcuts-modal-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                            <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M6 16h8"></path>
                        </svg>
                        <h2 id="shortcuts-modal-title">Keyboard Shortcuts</h2>
                    </div>
                    <button
                        className="shortcuts-modal-close"
                        onClick={onClose}
                        ref={firstFocusableRef}
                        aria-label="Close keyboard shortcuts modal"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="shortcuts-modal-content">
                    {shortcutSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="shortcut-section">
                            <h3 className="shortcut-section-title">{section.title}</h3>
                            <div className="shortcut-list">
                                {section.shortcuts.map((shortcut, index) => (
                                    <div key={index} className="shortcut-item">
                                        <div className="shortcut-keys">
                                            {shortcut.modifier && (
                                                <kbd className="shortcut-key modifier">{shortcut.modifier}</kbd>
                                            )}
                                            <kbd className="shortcut-key">{shortcut.key}</kbd>
                                        </div>
                                        <span className="shortcut-description">{shortcut.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="shortcuts-modal-footer">
                    <div className="shortcuts-modal-tip">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <span>Press <kbd className="shortcut-key small">?</kbd> anytime to show this dialog</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default KeyboardShortcutsModal;
