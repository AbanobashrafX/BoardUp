import React, { createContext, useContext, useState, useEffect } from 'react';
import { categoryAPI, projectAPI } from '../services/api';

const DataContext = createContext(null);

export function useData() {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}

export function DataProvider({ children }) {
    const [categories, setCategories] = useState([]);
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('kanban'); // 'kanban', 'table', 'calendar'

    // Fetch all data once on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                // Fetch categories and projects in parallel
                const [categoriesData, projectsData] = await Promise.all([
                    categoryAPI.getAll(),
                    projectAPI.getAll()
                ]);

                if (categoriesData) {
                    setCategories(categoriesData);
                }

                if (projectsData) {
                    setProjects(projectsData);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Refresh methods for when data needs to be updated
    const refreshCategories = async () => {
        try {
            const data = await categoryAPI.getAll();
            setCategories(data || []);
        } catch (err) {
            console.error('Error refreshing categories:', err);
        }
    };

    const refreshProjects = async () => {
        try {
            const data = await projectAPI.getAll();
            setProjects(data || []);
        } catch (err) {
            console.error('Error refreshing projects:', err);
        }
    };

    const value = {
        categories,
        projects,
        isLoading,
        error,
        refreshCategories,
        refreshProjects,
        viewMode,
        setViewMode
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}
