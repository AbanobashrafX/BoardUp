import { useEffect, useCallback } from 'react';

/**
 * Custom hook for keyboard shortcuts
 * @param {Object} options
 * @param {Function} options.onNewTask - Callback for new task shortcut
 * @param {Function} options.onSearch - Callback for search focus
 * @param {Function} options.onToggleTheme - Callback for theme toggle
 * @param {Function} options.onClearFilters - Callback for clear filters
 * @param {Function} options.onStatusFilter - Callback for priority filter (param: priority)
 * @param {Function} options.onShowHelp - Callback for showing keyboard shortcuts help
 * @param {boolean} options.enabled - Whether shortcuts are enabled
 */
export function useKeyboardShortcuts({
    onNewTask,
    onSearch,
    onToggleTheme,
    onClearFilters,
    onStatusFilter,
    onShowHelp,
    enabled = true,
}) {
    const handleKeyDown = useCallback((event) => {
        // Don't trigger shortcuts when typing in inputs
        const target = event.target;
        const isInput = target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable;

        const key = event.key;

        // Global shortcuts that work even in inputs (with modifier)
        if (event.metaKey || event.ctrlKey) {
            return;
        }

        // Only trigger non-input shortcuts
        if (!isInput) {
            // Handle ? key (Shift + /) - check before converting to lowercase
            if (key === '?' || (event.shiftKey && key === '/')) {
                event.preventDefault();
                onShowHelp?.();
                return;
            }

            const keyLower = key.toLowerCase();

            switch (keyLower) {
                case 'n':
                    event.preventDefault();
                    onNewTask?.();
                    break;
                case 'f':
                    event.preventDefault();
                    onSearch?.();
                    break;
                case 't':
                    event.preventDefault();
                    onToggleTheme?.();
                    break;
                case 'c':
                    event.preventDefault();
                    onClearFilters?.();
                    break;
                case '1':
                    event.preventDefault();
                    onStatusFilter?.('LOW');
                    break;
                case '2':
                    event.preventDefault();
                    onStatusFilter?.('MEDIUM');
                    break;
                case '3':
                    event.preventDefault();
                    onStatusFilter?.('HIGH');
                    break;
                case '4':
                    event.preventDefault();
                    onStatusFilter?.('URGENT');
                    break;
                default:
                    break;
            }
        }

        // Escape always closes modals (works from anywhere)
        if (key === 'Escape') {
            const modals = document.querySelectorAll('.modal-overlay, .shortcuts-modal-overlay');
            if (modals.length > 0) {
                event.preventDefault();
                // Trigger click on the last modal's close button or dispatch event
                modals[modals.length - 1].click();
            }
        }
    }, [onNewTask, onSearch, onToggleTheme, onClearFilters, onStatusFilter, onShowHelp]);

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown, enabled]);
}

export default useKeyboardShortcuts;
