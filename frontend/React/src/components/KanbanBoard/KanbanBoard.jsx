import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { taskAPI, categoryAPI } from '../../services/api';
import TaskCard from '../TaskCard/TaskCard';
import TaskModal from '../TaskModal/TaskModal';
import MultiFilter from '../MultiFilter/MultiFilter';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import './KanbanBoard.css';

const COLUMNS = [
    { id: 'TODO', title: 'To Do', color: '#f59e0b' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: '#3b82f6' },
    { id: 'DONE', title: 'Done', color: '#10b981' },
];

const SAMPLE_TASKS = {
    TODO: [
        { id: 1, title: 'Welcome to BoardUp!', description: 'This is a sample task. Start by adding your own tasks.', priority: 'MEDIUM', category: 1 },
        { id: 2, title: 'Try drag and drop', description: 'Drag tasks between columns to organize your workflow.', priority: 'LOW', category: 1 },
    ],
    IN_PROGRESS: [
        { id: 3, title: 'Explore the features', description: 'BoardUp helps you manage tasks with a Kanban board.', priority: 'HIGH', category: 2 },
    ],
    DONE: [
        { id: 4, title: 'BoardUp is ready!', description: 'Your personal Kanban task manager is set up.', priority: 'URGENT', category: 1 },
    ],
};

const SAMPLE_CATEGORIES = [
    { id: 1, name: 'Personal' },
    { id: 2, name: 'Work' },
    { id: 3, name: 'Shopping' },
];

function KanbanBoard() {
    const [tasks, setTasks] = useState({ TODO: [], IN_PROGRESS: [], DONE: [] });
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);  // Initial loading state
    const [isFetching, setIsFetching] = useState(false);  // Search/filter loading state
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [filter, setFilter] = useState({ categories: [], priorities: [] });
    const [sortBy, setSortBy] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const isInitialized = useRef(false);
    const searchInputRef = useRef(null);
    const themeToggleRef = useRef(null);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onNewTask: useCallback(() => setShowTaskModal(true), []),
        onSearch: useCallback(() => searchInputRef.current?.focus(), []),
        onToggleTheme: useCallback(() => themeToggleRef.current?.click(), []),
        onClearFilters: useCallback(() => setFilter({ categories: [], priorities: [] }), []),
        onStatusFilter: useCallback((status) => setFilter(prev => ({ ...prev, status })), []),
    });

    // Single effect that handles initial load and filter/search changes with debounce
    useEffect(() => {
        // Skip if not yet initialized (first render)
        if (!isInitialized.current) {
            isInitialized.current = true;
            fetchData(true, true);  // Initial load - show spinner, fetch categories
            return;
        }

        // Debounce search queries - no spinner for search
        const timer = setTimeout(() => {
            fetchData(false, false);
        }, searchQuery ? 300 : 0);

        return () => clearTimeout(timer);
    }, [searchQuery, filter]);

    const fetchData = async (showLoader = true, fetchCategories = false) => {
        try {
            if (showLoader) setIsFetching(true);

            // Build query params for backend filtering
            const params = {};
            if (searchQuery) params.search = searchQuery;
            if (filter.categories?.length > 0) params.category = filter.categories.join(',');
            if (filter.priorities?.length > 0) params.priority = filter.priorities.join(',');

            let tasksData;

            // Use getAll with params for backend filtering, fallback to getByStatus
            if (params.search || params.category || params.priority) {
                // API returns flat array - need to group by status
                const flatTasks = await taskAPI.getAll(params);
                tasksData = {
                    TODO: (flatTasks || []).filter(t => t.status === 'TODO'),
                    IN_PROGRESS: (flatTasks || []).filter(t => t.status === 'IN_PROGRESS'),
                    DONE: (flatTasks || []).filter(t => t.status === 'DONE'),
                };
            } else {
                // No filters - use grouped endpoint
                tasksData = await taskAPI.getByStatus();
            }

            // Only fetch categories on initial load
            if (fetchCategories) {
                const categoriesData = await categoryAPI.getAll();
                setCategories(Array.isArray(categoriesData) ? categoriesData : SAMPLE_CATEGORIES);
            }
            // Categories are cached - don't re-fetch on every search/filter

            setTasks(tasksData || { TODO: [], IN_PROGRESS: [], DONE: [] });
        } catch (error) {
            console.log('API not available, using sample data for demo');
            setTasks(SAMPLE_TASKS);
            setCategories(SAMPLE_CATEGORIES);
        } finally {
            setIsLoading(false);
            setIsFetching(false);
        }
    };

    const handleDragEnd = async (result) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const sourceColumn = source.droppableId;
        const destColumn = destination.droppableId;
        const destIndex = destination.index;

        const newTasks = {
            ...tasks,
            [sourceColumn]: [...tasks[sourceColumn]],
            [destColumn]: [...tasks[destColumn]],
        };

        const [movedTask] = newTasks[sourceColumn].splice(source.index, 1);
        newTasks[destColumn].splice(destIndex, 0, movedTask);
        setTasks(newTasks);

        try {
            await taskAPI.move(draggableId, destColumn, destIndex);
        } catch (error) {
            console.error('Error moving task:', error);
            fetchData();
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await taskAPI.delete(taskId);
            fetchData();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const handleTaskClick = (task) => setSelectedTask(task);

    const handleCloseModal = () => {
        setShowTaskModal(false);
        setSelectedTask(null);
        fetchData();
    };

    // Sort function based on sortBy state
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

    const filteredTasks = (columnId) => sortTasks(tasks[columnId] || []);

    // Show loading spinner only on initial load
    if (isLoading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="kanban-board">
            <div className="kanban-header">
                <div className="kanban-header-left">
                    <h2>Your Tasks</h2>
                </div>
                <div className="kanban-controls">
                    <div className="search">
                        <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <form onSubmit={(e) => e.preventDefault()}>
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="search-input"
                                placeholder="Search... (f)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </form>
                        {searchQuery && (
                            <button className="search-clear" onClick={() => setSearchQuery('')}>×</button>
                        )}
                    </div>

                    <div className="filter-divider"></div>

                    <MultiFilter
                        categories={categories}
                        filters={filter}
                        onFilterChange={setFilter}
                        sortBy={sortBy}
                        onSortChange={setSortBy}
                    />

                    <button className="new-btn" onClick={() => setShowTaskModal(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                        New
                    </button>
                </div>
            </div>

            {(filter.categories?.length > 0 || filter.priorities?.length > 0 || searchQuery) && (
                <div className="task-stats">
                    <span className="stat-item">Showing <strong>{filteredTasks('TODO').length + filteredTasks('IN_PROGRESS').length + filteredTasks('DONE').length}</strong> tasks</span>
                </div>
            )}

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="kanban-columns">
                    {COLUMNS.map((column) => (
                        <div key={column.id} className="kanban-column">
                            <div className="column-header" style={{ borderTopColor: column.color }}>
                                <h3>{column.title}</h3>
                                <span className="task-count">{filteredTasks(column.id).length}</span>
                            </div>

                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div className={`column-content ${snapshot.isDraggingOver ? 'dragging-over' : ''}`} ref={provided.innerRef} {...provided.droppableProps}>
                                        {filteredTasks(column.id).map((task, index) => (
                                            <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                                                {(provided, snapshot) => (
                                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ ...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.8 : 1 }}>
                                                        <TaskCard task={task} onEdit={handleTaskClick} onDelete={handleDeleteTask} onView={handleTaskClick} />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                        {filteredTasks(column.id).length === 0 && (
                                            <div className="empty-column"><p>No tasks</p></div>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            {showTaskModal && <TaskModal mode="create" categories={categories} onClose={handleCloseModal} />}
            {selectedTask && <TaskModal task={selectedTask} categories={categories} onClose={handleCloseModal} onDelete={(id) => { handleDeleteTask(id); handleCloseModal(); }} />}
        </div>
    );
}

export default KanbanBoard;
