import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { taskAPI } from '../../services/api';
import TaskCard from '../TaskCard/TaskCard';
import TaskModal from '../TaskModal/TaskModal';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import './KanbanBoard.css';

const COLUMNS = [
    { id: 'TODO', title: 'To Do', color: '#f59e0b' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: '#3b82f6' },
    { id: 'DONE', title: 'Done', color: '#10b981' },
];

const SAMPLE_TASKS = {
    TODO: [
    ],
    IN_PROGRESS: [
    ],
    DONE: [
    ],
};

const SAMPLE_CATEGORIES = [];
const SAMPLE_PROJECTS = [];

function KanbanBoard({
    selectedProject = null,
    searchQuery = '',
    filter = { categories: [], priorities: [] },
    sortBy = '',
    categories: propCategories = [],
    projects: propProjects = [],
    onProjectsRefresh = null
}) {
    const [tasks, setTasks] = useState({ TODO: [], IN_PROGRESS: [], DONE: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    // Track initialization to avoid duplicate fetches on mount
    const isInitialized = useRef(false);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onNewTask: useCallback(() => setShowTaskModal(true), []),
        onClearFilters: useCallback(() => { }, []),
        onStatusFilter: useCallback((status) => { }, []),
    });

    // Single effect for initial load and all changes (with proper initialization)
    useEffect(() => {
        // Skip if not yet initialized (first render)
        if (!isInitialized.current) {
            isInitialized.current = true;
            fetchData(true);
            return;
        }

        // Debounce search queries for subsequent updates
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

            let tasksData;

            if (params.search || params.category || params.priority || params.project) {
                const flatTasks = await taskAPI.getAll(params);
                tasksData = {
                    TODO: (flatTasks || []).filter(t => t.status === 'TODO'),
                    IN_PROGRESS: (flatTasks || []).filter(t => t.status === 'IN_PROGRESS'),
                    DONE: (flatTasks || []).filter(t => t.status === 'DONE'),
                };
            } else {
                tasksData = await taskAPI.getByStatus();
            }

            const hasTasks = tasksData && (
                (tasksData.TODO && tasksData.TODO.length > 0) ||
                (tasksData.IN_PROGRESS && tasksData.IN_PROGRESS.length > 0) ||
                (tasksData.DONE && tasksData.DONE.length > 0)
            );

            if (!hasTasks) {
                setTasks(SAMPLE_TASKS);
            } else {
                setTasks(tasksData);
            }
        } catch (error) {
            console.log('API error, using sample data');
            setTasks(SAMPLE_TASKS);
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
            onProjectsRefresh?.();
        } catch (error) {
            console.error('Error moving task:', error);
            fetchData();
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

    const handleAddTask = (columnId) => {
        // Open modal in create mode with preselected status
        setSelectedTask(null);
        setShowTaskModal(true);
        // Store the preselected status for the modal
        window.__preselectedStatus = columnId;
    };

    const handleCloseModal = () => {
        setShowTaskModal(false);
        setSelectedTask(null);
        fetchData();
        onProjectsRefresh?.();
    };

    // Sort function
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

    // Show loading
    if (isLoading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    // Render only the columns - no header
    return (
        <div className="kanban-board">
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="kanban-columns">
                    {COLUMNS.map((column) => (
                        <div key={column.id} className="kanban-column">
                            <div className="column-header" style={{ borderTopColor: column.color }}>
                                <div className="column-header-left">
                                    <span className="column-icon" style={{ color: column.color }}>▶</span>
                                    <h3>{column.title}</h3>
                                    <span className="task-count">{filteredTasks(column.id).length}</span>
                                </div>
                                <button
                                    className="column-add-btn"
                                    onClick={() => handleAddTask(column.id)}
                                    title={`Add task to ${column.title}`}
                                >
                                    +
                                </button>
                            </div>

                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div className={`column-content ${snapshot.isDraggingOver ? 'dragging-over' : ''}`} ref={provided.innerRef} {...provided.droppableProps}>
                                        {filteredTasks(column.id).map((task, index) => (
                                            <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                                                {(provided, snapshot) => (
                                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ ...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.8 : 1 }}>
                                                        <TaskCard task={task} columnColor={column.color} onEdit={handleTaskClick} onDelete={handleDeleteTask} onView={handleTaskClick} />
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

            {showTaskModal && <TaskModal mode="create" categories={propCategories} projects={propProjects} preselectedProject={selectedProject} onClose={handleCloseModal} />}
            {selectedTask && <TaskModal task={selectedTask} categories={propCategories} projects={propProjects} onClose={handleCloseModal} onDelete={(id) => { handleDeleteTask(id); handleCloseModal(); }} />}
        </div>
    );
}

export default KanbanBoard;
