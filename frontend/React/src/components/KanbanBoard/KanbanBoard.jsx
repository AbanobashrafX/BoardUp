import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { taskAPI, categoryAPI } from '../../services/api';
import TaskCard from '../TaskCard/TaskCard';
import TaskModal from '../TaskModal/TaskModal';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
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
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [filter, setFilter] = useState({ category: '', priority: '' });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tasksData, categoriesData] = await Promise.all([
                taskAPI.getByStatus(),
                categoryAPI.getAll(),
            ]);

            let filteredTasks = tasksData || SAMPLE_TASKS;

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filteredTasks = {
                    TODO: (filteredTasks.TODO || []).filter(t =>
                        t.title.toLowerCase().includes(query) ||
                        (t.description && t.description.toLowerCase().includes(query))
                    ),
                    IN_PROGRESS: (filteredTasks.IN_PROGRESS || []).filter(t =>
                        t.title.toLowerCase().includes(query) ||
                        (t.description && t.description.toLowerCase().includes(query))
                    ),
                    DONE: (filteredTasks.DONE || []).filter(t =>
                        t.title.toLowerCase().includes(query) ||
                        (t.description && t.description.toLowerCase().includes(query))
                    ),
                };
            }

            if (filter.category || filter.priority) {
                filteredTasks = {
                    TODO: (filteredTasks.TODO || []).filter(t => {
                        if (filter.category && t.category !== parseInt(filter.category)) return false;
                        if (filter.priority && t.priority !== filter.priority) return false;
                        return true;
                    }),
                    IN_PROGRESS: (filteredTasks.IN_PROGRESS || []).filter(t => {
                        if (filter.category && t.category !== parseInt(filter.category)) return false;
                        if (filter.priority && t.priority !== filter.priority) return false;
                        return true;
                    }),
                    DONE: (filteredTasks.DONE || []).filter(t => {
                        if (filter.category && t.category !== parseInt(filter.category)) return false;
                        if (filter.priority && t.priority !== filter.priority) return false;
                        return true;
                    }),
                };
            }

            setTasks(filteredTasks);
            setCategories(Array.isArray(categoriesData) ? categoriesData : SAMPLE_CATEGORIES);
        } catch (error) {
            console.log('API not available, using sample data for demo');
            setTasks(SAMPLE_TASKS);
            setCategories(SAMPLE_CATEGORIES);
        } finally {
            setLoading(false);
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

    const filteredTasks = (columnId) => tasks[columnId] || [];

    if (loading) {
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
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="search-clear" onClick={() => setSearchQuery('')}>×</button>
                        )}
                    </div>

                    <div className="filter-divider"></div>

                    <select className="filter-btn" value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })}>
                        <option value="">Category</option>
                        {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                    </select>

                    <select className="filter-btn" value={filter.priority} onChange={(e) => setFilter({ ...filter, priority: e.target.value })}>
                        <option value="">Priority</option>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                    </select>

                    {(filter.category || filter.priority) && (
                        <button className="filter-btn" onClick={() => setFilter({ category: '', priority: '' })} style={{ color: '#eb5757' }}>Clear</button>
                    )}

                    <ThemeToggle />

                    <button className="new-btn" onClick={() => setShowTaskModal(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                        New
                    </button>
                </div>
            </div>

            {(filter.category || filter.priority || searchQuery) && (
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
