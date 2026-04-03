import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { taskAPI } from '../../services/api';
import TaskModal from '../TaskModal/TaskModal';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import './TableBoard.css';

const SAMPLE_TASKS = [];
const ITEMS_PER_PAGE = 15;

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

    // Sorting state
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);

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

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filter, selectedProject]);

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

    // Sorting handler
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Sort tasks
    const sortTasks = useCallback((tasksArray) => {
        // First apply external sortBy from props
        let sorted = [...tasksArray];
        if (sortBy) {
            const priorityOrder = { 'URGENT': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
            switch (sortBy) {
                case 'oldest':
                    sorted.sort((a, b) => (a.id || 0) - (b.id || 0));
                    break;
                case 'priority-high':
                    sorted.sort((a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4));
                    break;
                case 'priority-low':
                    sorted.sort((a, b) => (priorityOrder[b.priority] ?? 4) - (priorityOrder[a.priority] ?? 4));
                    break;
                case 'alphabetical':
                    sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                    break;
                case 'newest':
                default:
                    sorted.sort((a, b) => (b.id || 0) - (a.id || 0));
            }
        }

        // Then apply column sorting
        if (sortConfig.key) {
            sorted.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                // Handle null/undefined
                if (aVal == null) aVal = '';
                if (bVal == null) bVal = '';

                // Numeric sorting for IDs
                if (sortConfig.key === 'id') {
                    aVal = Number(aVal) || 0;
                    bVal = Number(bVal) || 0;
                }

                // String comparison
                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return sorted;
    }, [sortBy, sortConfig]);

    // Pagination
    const paginatedTasks = useMemo(() => {
        const sorted = sortTasks(tasks);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [tasks, sortTasks, currentPage]);

    const totalPages = Math.ceil(tasks.length / ITEMS_PER_PAGE);

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

    const getStatusClass = (status) => {
        // Convert status to CSS-friendly class name (e.g., IN_PROGRESS -> in-progress)
        return `status-badge status-${(status || 'TODO').replace('_', '-').toLowerCase()}`;
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return '⇅';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    return (
        <div className="table-board">
            <div className="table-container">
                <table className="tasks-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('title')} className="sortable-header">
                                Title <span className="sort-icon">{getSortIcon('title')}</span>
                            </th>
                            <th onClick={() => handleSort('status')} className="sortable-header">
                                Status <span className="sort-icon">{getSortIcon('status')}</span>
                            </th>
                            <th onClick={() => handleSort('priority')} className="sortable-header">
                                Priority <span className="sort-icon">{getSortIcon('priority')}</span>
                            </th>
                            <th onClick={() => handleSort('category_name')} className="sortable-header">
                                Category <span className="sort-icon">{getSortIcon('category_name')}</span>
                            </th>
                            <th onClick={() => handleSort('project_name')} className="sortable-header">
                                Project <span className="sort-icon">{getSortIcon('project_name')}</span>
                            </th>
                            <th>Subtasks</th>
                            <th onClick={() => handleSort('due_date')} className="sortable-header">
                                Due Date <span className="sort-icon">{getSortIcon('due_date')}</span>
                            </th>
                            <th onClick={() => handleSort('created_at')} className="sortable-header">
                                Created <span className="sort-icon">{getSortIcon('created_at')}</span>
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedTasks.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="empty-row">No tasks found</td>
                            </tr>
                        ) : (
                            paginatedTasks.map((task) => (
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
                                        <span className={getStatusClass(task.status)}>
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
                                    <td className="subtasks-cell">
                                        {task.subtasks_count > 0 ? (
                                            <div className="subtasks-progress">
                                                <div className="subtasks-progress-bar">
                                                    <div
                                                        className={`subtasks-progress-fill ${task.completed_subtasks_count === task.subtasks_count ? 'complete' : ''}`}
                                                        style={{ width: `${(task.completed_subtasks_count / task.subtasks_count) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="subtasks-count">
                                                    {task.completed_subtasks_count}/{task.subtasks_count}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="no-subtasks">-</span>
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="table-pagination">
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        title="First page"
                    >
                        ««
                    </button>
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        title="Previous page"
                    >
                        «
                    </button>
                    <span className="pagination-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        title="Next page"
                    >
                        »
                    </button>
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        title="Last page"
                    >
                        »»
                    </button>
                    <span className="pagination-count">
                        ({tasks.length} tasks)
                    </span>
                </div>
            )}

            {showTaskModal && <TaskModal mode="create" categories={propCategories} projects={propProjects} preselectedProject={selectedProject} onClose={handleCloseModal} />}
            {selectedTask && <TaskModal task={selectedTask} categories={propCategories} projects={propProjects} onClose={handleCloseModal} onDelete={(id) => { handleDeleteTask(id); handleCloseModal(); }} />}
        </div>
    );
}

export default TableBoard;