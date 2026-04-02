import { useEffect, useCallback } from 'react';

/**
 * Custom hook for keyboard shortcuts
 * @param {Object} options
 * @param {Function} options.onNewTask - Callback for new task shortcut
 * @param {Function} options.onSearch - Callback for search focus
 * @param {Function} options.onToggleTheme - Callback for theme toggle
 * @param {Function} options.onClearFilters - Callback for clear filters
 * @param {Function} options.onStatusFilter - Callback for status filter (param: status)
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

        const key = event.key.toLowerCase();

        // Global shortcuts that work even in inputs (with modifier)
        if (event.metaKey || event.ctrlKey) {
            return;
        }

        // Only trigger non-input shortcuts
        if (!isInput) {
            switch (key) {
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
                    onStatusFilter?.('TODO');
                    break;
                case '2':
                    event.preventDefault();
                    onStatusFilter?.('IN_PROGRESS');
                    break;
                case '3':
                    event.preventDefault();
                    onStatusFilter?.('DONE');
                    break;
                case '?':
                    event.preventDefault();
                    onShowHelp?.();
                    break;
                default:
                    break;
            }
        }

        // Escape always closes modals (works from anywhere)
        if (key === 'escape') {
            const modals = document.querySelectorAll('.modal-overlay');
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
