import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { taskAPI } from '../../services/api';
import TaskCard from '../TaskCard/TaskCard';
import './KanbanBoard.css';

// Lazy load TaskModal for better bundle splitting
const TaskModal = lazy(() => import('../TaskModal/TaskModal'));

const COLUMNS = [
    { id: 'TODO', title: 'To Do', color: '#f59e0b' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: '#3b82f6' },
    { id: 'DONE', title: 'Done', color: '#10b981' },
];

const SAMPLE_TASKS = {
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
};

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
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [preselectedStatus, setPreselectedStatus] = useState('TODO');
    const [selectedTask, setSelectedTask] = useState(null);

    // Track initialization to avoid duplicate fetches on mount
    const isInitialized = useRef(false);

    // Single effect for initial load and all changes (with proper initialization)
    useEffect(() => {
        // Skip if not yet initialized (first render)
        if (!isInitialized.current) {
            isInitialized.current = true;
            fetchData();
            return;
        }

        // Debounce search queries for subsequent updates
        const timer = setTimeout(() => {
            fetchData();
        }, searchQuery ? 300 : 0);

        return () => clearTimeout(timer);
    }, [searchQuery, filter, sortBy, selectedProject]);

    const fetchData = async () => {
        try {

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
        }
    };

    const handleDragEnd = async (result) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const sourceColumn = source.droppableId;
        const destColumn = destination.droppableId;
        const destIndex = destination.index;

        // Move the task
        const newTasks = {
            ...tasks,
            [sourceColumn]: [...tasks[sourceColumn]],
            [destColumn]: [...tasks[destColumn]],
        };

        const [movedTask] = newTasks[sourceColumn].splice(source.index, 1);
        newTasks[destColumn].splice(destIndex, 0, movedTask);

        // Update position values locally for immediate consistency
        newTasks[destColumn].forEach((task, idx) => {
            task.position = idx;
        });

        // If moving across columns, also update positions in source column
        if (sourceColumn !== destColumn) {
            newTasks[sourceColumn].forEach((task, idx) => {
                task.position = idx;
            });
        }

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
        setSelectedTask(null);
        setPreselectedStatus(columnId);
        setShowTaskModal(true);
    };

    const handleCloseModal = (newTask = null) => {
        setShowTaskModal(false);
        setSelectedTask(null);

        if (newTask && newTask.status) {
            // Optimistically add new task immediately to correct column
            setTasks(prevTasks => {
                const updatedTasks = { ...prevTasks };
                // Ensure the status column exists
                if (updatedTasks[newTask.status]) {
                    updatedTasks[newTask.status] = [
                        ...updatedTasks[newTask.status],
                        newTask
                    ];
                }
                return updatedTasks;
            });
            // Still refetch in background to get correct ordering and sync with server
            fetchData();
        } else {
            // No new task, do full refetch
            fetchData();
        }

        onProjectsRefresh?.();
    };

    // Sort function
    const sortTasks = (tasksArray) => {
        // Always sort by position first as base ordering, then apply user sort
        const positionSorted = [...tasksArray].sort((a, b) => {
            // Use position if available, fallback to id for backwards compatibility
            const posA = a.position !== undefined ? a.position : (a.id || 0);
            const posB = b.position !== undefined ? b.position : (b.id || 0);
            return posA - posB;
        });

        if (!sortBy) return positionSorted;

        const priorityOrder = { 'URGENT': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };

        switch (sortBy) {
            case 'oldest':
                return [...positionSorted].sort((a, b) => (a.id || 0) - (b.id || 0));
            case 'priority-high':
                return [...positionSorted].sort((a, b) =>
                    (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
                );
            case 'priority-low':
                return [...positionSorted].sort((a, b) =>
                    (priorityOrder[b.priority] ?? 4) - (priorityOrder[a.priority] ?? 4)
                );
            case 'alphabetical':
                return [...positionSorted].sort((a, b) =>
                    (a.title || '').localeCompare(b.title || '')
                );
            case 'newest':
                return [...positionSorted].sort((a, b) => (b.id || 0) - (a.id || 0));
            default:
                return positionSorted;
        }
    };

    // Memoize sorted tasks per column to prevent recalculation on every render
    const sortedTasks = useMemo(() => ({
        TODO: sortTasks(tasks.TODO || []),
        IN_PROGRESS: sortTasks(tasks.IN_PROGRESS || []),
        DONE: sortTasks(tasks.DONE || []),
    }), [tasks, sortBy]);

    const filteredTasks = (columnId) => sortedTasks[columnId];

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
                                                        <TaskCard task={task} columnColor={column.color} isDragging={snapshot.isDragging} onEdit={() => handleTaskClick(task)} onDelete={handleDeleteTask} onView={handleTaskClick} />
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

            <Suspense fallback={<div className="loading">Loading...</div>}>
                {showTaskModal && !selectedTask && <TaskModal mode="create" categories={propCategories} projects={propProjects} preselectedProject={selectedProject} preselectedStatus={preselectedStatus} onClose={handleCloseModal} />}
                {selectedTask && <TaskModal task={selectedTask} categories={propCategories} projects={propProjects} onClose={handleCloseModal} onDelete={(id) => { handleDeleteTask(id); handleCloseModal(); }} />}
            </Suspense>
        </div>
    );
}

export default KanbanBoard;

