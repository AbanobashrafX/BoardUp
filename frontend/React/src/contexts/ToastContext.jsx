import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ToastContext = createContext(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timeoutIds = useRef(new Set());

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            timeoutIds.current.forEach(id => clearTimeout(id));
            timeoutIds.current.clear();
        };
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();
        const toast = { id, message, type };

        setToasts(prev => [...prev, toast]);

        if (duration > 0) {
            const timeoutId = setTimeout(() => {
                removeToast(id);
                timeoutIds.current.delete(timeoutId);
            }, duration);
            timeoutIds.current.add(timeoutId);
        }

        return id;
    }, [removeToast]); // Added removeToast to dependencies

    const showSuccess = useCallback((message, duration) => {
        return addToast(message, 'success', duration);
    }, [addToast]);

    const showError = useCallback((message, duration) => {
        return addToast(message, 'error', duration);
    }, [addToast]);

    const showWarning = useCallback((message, duration) => {
        return addToast(message, 'warning', duration);
    }, [addToast]);

    const showInfo = useCallback((message, duration) => {
        return addToast(message, 'info', duration);
    }, [addToast]);

    const value = {
        toasts,
        addToast,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
        </ToastContext.Provider>
    );
}
