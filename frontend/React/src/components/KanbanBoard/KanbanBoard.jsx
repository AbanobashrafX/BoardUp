import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
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
    const [activeId, setActiveId] = useState(null);
    const [activeTask, setActiveTask] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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

    const handleDragStart = (event) => {
        const { active } = event;
        setActiveId(active.id);
        // Find the active task
        const allTasks = [...tasks.TODO, ...tasks.IN_PROGRESS, ...tasks.DONE];
        const task = allTasks.find(t => t.id === active.id);
        setActiveTask(task);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveTask(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find source and destination
        let sourceColumn = null;
        let destColumn = null;
        let sourceIndex = -1;
        let destIndex = -1;

        // Find source
        for (const column of COLUMNS) {
            const index = tasks[column.id].findIndex(task => task.id === activeId);
            if (index !== -1) {
                sourceColumn = column.id;
                sourceIndex = index;
                break;
            }
        }

        // Find destination
        for (const column of COLUMNS) {
            const index = tasks[column.id].findIndex(task => task.id === overId);
            if (index !== -1) {
                destColumn = column.id;
                destIndex = index;
                break;
            }
        }

        if (!sourceColumn || !destColumn) return;

        // If same position, do nothing
        if (sourceColumn === destColumn && sourceIndex === destIndex) return;

        // Move the task
        const newTasks = {
            ...tasks,
            [sourceColumn]: [...tasks[sourceColumn]],
            [destColumn]: [...tasks[destColumn]],
        };

        const [movedTask] = newTasks[sourceColumn].splice(sourceIndex, 1);
        newTasks[destColumn].splice(destIndex, 0, movedTask);
        setTasks(newTasks);

        try {
            await taskAPI.move(activeId, destColumn, destIndex);
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
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
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

                            <SortableContext items={filteredTasks(column.id).map(t => t.id)} strategy={verticalListSortingStrategy}>
                                <div className="column-content">
                                    {filteredTasks(column.id).map((task, index) => (
                                        <TaskCard key={task.id} task={task} columnColor={column.color} onEdit={() => handleTaskClick(task)} onDelete={handleDeleteTask} onView={handleTaskClick} />
                                    ))}
                                    {filteredTasks(column.id).length === 0 && (
                                        <div className="empty-column"><p>No tasks</p></div>
                                    )}
                                </div>
                            </SortableContext>
                        </div>
                    ))}
                </div>

                <DragOverlay>
                    {activeId && activeTask ? (
                        <TaskCard task={activeTask} columnColor={COLUMNS.find(c => c.id === activeTask.status)?.color} isDragging={true} />
                    ) : null}
                </DragOverlay>
            </DndContext>

            <Suspense fallback={<div className="loading">Loading...</div>}>
                {showTaskModal && <TaskModal mode="create" categories={propCategories} projects={propProjects} preselectedProject={selectedProject} preselectedStatus={preselectedStatus} onClose={handleCloseModal} />}
                {selectedTask && <TaskModal task={selectedTask} categories={propCategories} projects={propProjects} onClose={handleCloseModal} onDelete={(id) => { handleDeleteTask(id); handleCloseModal(); }} />}
            </Suspense>
        </div>
    );
}

export default KanbanBoard;

