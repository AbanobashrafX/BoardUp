import React, { useState, useEffect, useRef, useCallback } from 'react';
import { taskAPI } from '../../services/api';
import TaskCard from '../TaskCard/TaskCard';
import TaskModal from '../TaskModal/TaskModal';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import './TableBoard.css';

const SAMPLE_TASKS = [];

function TableBoard({
    selectedProject = null,
    searchQuery = '',
    filter = { categories: [], priorities: [] },
    sortBy = '',
    categories: propCategories = [],
    projects: propProjects = [],
    onProjectsRefresh = null
}) {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    const isInitialized = useRef(false);

    useKeyboardShortcuts({
        onNewTask: useCallback(() => setShowTaskModal(true), []),
        onClearFilters: useCallback(() => { }, []),
        onStatusFilter: useCallback((status) => { }, []),
    });

    useEffect(() => {
        if (!isInitialized.current) {
            isInitialized.current = true;
            fetchData(true);
            return;
        }

        const timer = setTimeout(() => {
            fetchData(false);
        }, searchQuery ? 300 : 0);

        return () => clearTimeout(timer);
    }, [searchQuery, filter, sortBy, selectedProject]);

    const fetchData = async (showLoader = true) => {
        try {
            if (showLoader) setIsFetching(true);

            const params = {};
            if (searchQuery) params.search = searchQuery;
            if (filter.categories?.length > 0) params.category = filter.categories.join(',');
            if (filter.priorities?.length > 0) params.priority = filter.priorities.join(',');
            if (selectedProject) params.project = selectedProject.id;

            const tasksData = await taskAPI.getAll(params);
            setTasks(tasksData || []);
        } catch (error) {
            console.log('API error, using empty data');
            setTasks([]);
        } finally {
            setIsLoading(false);
            setIsFetching(false);
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await taskAPI.delete(taskId);
            fetchData();
            onProjectsRefresh?.();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const handleTaskClick = (task) => setSelectedTask(task);

    const handleCloseModal = () => {
        setShowTaskModal(false);
        setSelectedTask(null);
        fetchData();
        onProjectsRefresh?.();
    };

    const sortTasks = (tasksArray) => {
        if (!sortBy) return tasksArray;
        const priorityOrder = { 'URGENT': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };

        switch (sortBy) {
            case 'oldest':
                return [...tasksArray].sort((a, b) => (a.id || 0) - (b.id || 0));
            case 'priority-high':
                return [...tasksArray].sort((a, b) =>
                    (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
                );
            case 'priority-low':
                return [...tasksArray].sort((a, b) =>
                    (priorityOrder[b.priority] ?? 4) - (priorityOrder[a.priority] ?? 4)
                );
            case 'alphabetical':
                return [...tasksArray].sort((a, b) =>
                    (a.title || '').localeCompare(b.title || '')
                );
            case 'newest':
            default:
                return [...tasksArray].sort((a, b) => (b.id || 0) - (a.id || 0));
        }
    };

    const filteredTasks = sortTasks(tasks);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getPriorityClass = (priority) => {
        return `priority-badge priority-${(priority || 'MEDIUM').toLowerCase()}`;
    };

    const getStatusLabel = (status) => {
        const statusMap = {
            'TODO': 'To Do',
            'IN_PROGRESS': 'In Progress',
            'DONE': 'Done'
        };
        return statusMap[status] || status;
    };

    if (isLoading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="table-board">
            <div className="table-container">
                <table className="tasks-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Category</th>
                            <th>Project</th>
                            <th>Due Date</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTasks.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="empty-row">No tasks found</td>
                            </tr>
                        ) : (
                            filteredTasks.map((task) => (
                                <tr key={task.id} onClick={() => handleTaskClick(task)} className="task-row">
                                    <td className="task-title-cell">
                                        <span className="task-title-text">{task.title}</span>
                                        {task.description && (
                                            <span className="task-description-preview">
                                                {task.description.length > 50
                                                    ? `${task.description.substring(0, 50)}...`
                                                    : task.description}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${task.status?.toLowerCase()}`}>
                                            {getStatusLabel(task.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={getPriorityClass(task.priority)}>
                                            {task.priority || 'MEDIUM'}
                                        </span>
                                    </td>
                                    <td>
                                        {task.category && (
                                            <span
                                                className="category-tag"
                                                style={{ backgroundColor: task.category_color || '#6366f1' }}
                                            >
                                                {task.category_name || task.category}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {task.project && (
                                            <span
                                                className="project-tag"
                                                style={{ backgroundColor: task.project_color || '#8b5cf6' }}
                                            >
                                                {task.project_name || task.project}
                                            </span>
                                        )}
                                    </td>
                                    <td className="date-cell">
                                        {task.due_date ? formatDate(task.due_date) : '-'}
                                    </td>
                                    <td className="date-cell">
                                        {task.created_at ? formatDate(task.created_at) : '-'}
                                    </td>
                                    <td className="actions-cell">
                                        <button
                                            className="table-action-btn delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTask(task.id);
                                            }}
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showTaskModal && <TaskModal mode="create" categories={propCategories} projects={propProjects} preselectedProject={selectedProject} onClose={handleCloseModal} />}
            {selectedTask && <TaskModal task={selectedTask} categories={propCategories} projects={propProjects} onClose={handleCloseModal} onDelete={(id) => { handleDeleteTask(id); handleCloseModal(); }} />}
        </div>
    );
}

export default TableBoard;