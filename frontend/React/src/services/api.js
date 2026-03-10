import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Task API
export const taskAPI = {
    // Get all tasks
    getAll: async (params = {}) => {
        const response = await api.get('/tasks/', { params });
        return response.data;
    },

    // Get tasks grouped by status (for Kanban board)
    getByStatus: async (status = "all") => {
        const response = await api.get(`/tasks/${status}/`);
        return response.data;
    },

    // Get single task
    getOne: async (id) => {
        const response = await api.get(`/tasks/${id}/`);
        return response.data;
    },

    // Create task
    create: async (taskData) => {
        const response = await api.post('/tasks/', taskData);
        return response.data;
    },

    // Update task
    update: async (id, taskData) => {
        const response = await api.put(`/tasks/${id}/`, taskData);
        return response.data;
    },

    // Delete task
    delete: async (id) => {
        const response = await api.delete(`/tasks/${id}/`);
        return response.data;
    },

    // Move task (for drag-and-drop)
    move: async (id, status, position) => {
        const response = await api.post(`/tasks/${id}/move/`, { status, position });
        return response.data;
    },
};

// Category API
export const categoryAPI = {
    // Get all categories
    getAll: async () => {
        const response = await api.get('/categories/');
        return response.data;
    },

    // Get single category
    getOne: async (id) => {
        const response = await api.get(`/categories/${id}/`);
        return response.data;
    },

    // Create category
    create: async (categoryData) => {
        const response = await api.post('/categories/', categoryData);
        return response.data;
    },

    // Update category
    update: async (id, categoryData) => {
        const response = await api.put(`/categories/${id}/`, categoryData);
        return response.data;
    },

    // Delete category
    delete: async (id) => {
        const response = await api.delete(`/categories/${id}/`);
        return response.data;
    },
};

export default api;
