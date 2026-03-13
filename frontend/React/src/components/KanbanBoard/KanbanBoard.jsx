import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { taskAPI, categoryAPI } from '../../services/api';
import TaskCard from '../TaskCard/TaskCard';
import TaskModal from '../TaskModal/TaskModal';
import './KanbanBoard.css';

const COLUMNS = [
    { id: 'TODO', title: 'To Do', color: '#f59e0b' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: '#3b82f6' },
    { id: 'DONE', title: 'Done', color: '#10b981' },
];

// Sample data for demo when backend is not running
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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tasksData, categoriesData] = await Promise.all([
                taskAPI.getByStatus(),
                categoryAPI.getAll(),
            ]);
            // Use API data directly, ensure categories is always an array
            setTasks(tasksData || SAMPLE_TASKS);
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

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const sourceColumn = source.droppableId;
        const destColumn = destination.droppableId;
        const destIndex = destination.index;

        // Optimistic update - create proper deep copies of arrays
        const newTasks = {
            ...tasks,
            [sourceColumn]: [...tasks[sourceColumn]],
            [destColumn]: [...tasks[destColumn]],
        };

        // Remove from source
        const [movedTask] = newTasks[sourceColumn].splice(source.index, 1);

        // Add to destination
        newTasks[destColumn].splice(destIndex, 0, movedTask);

        setTasks(newTasks);

        // Update on server
        try {
            await taskAPI.move(draggableId, destColumn, destIndex);
        } catch (error) {
            console.error('Error moving task:', error);
            // Revert on error
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

    const handleTaskClick = (task) => {
        setSelectedTask(task);
    };

    const handleCloseModal = () => {
        setShowTaskModal(false);
        setSelectedTask(null);
        fetchData(); // Refresh after any modal close
    };

    const filteredTasks = (columnId) => {
        let columnTasks = tasks[columnId] || [];

        if (filter.category) {
            columnTasks = columnTasks.filter(task => task.category === parseInt(filter.category));
        }

        if (filter.priority) {
            columnTasks = columnTasks.filter(task => task.priority === filter.priority);
        }

        return columnTasks;
    };

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
                <h2>Your Tasks</h2>
                <div className="kanban-controls">
                    <select
                        className="form-select filter-select"
                        value={filter.category}
                        onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="form-select filter-select"
                        value={filter.priority}
                        onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
                    >
                        <option value="">All Priorities</option>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                    </select>

                    <button
                        // className="btn btn-primary"
                        className='new-task-btn'
                        onClick={() => setShowTaskModal(true)}
                    >
                        New
                    </button>
                </div>
            </div>

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
                                    <div
                                        className={`column-content ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                    >
                                        {filteredTasks(column.id).map((task, index) => (
                                            <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        style={{
                                                            ...provided.draggableProps.style,
                                                            opacity: snapshot.isDragging ? 0.8 : 1,
                                                        }}
                                                    >
                                                        <TaskCard
                                                            task={task}
                                                            onEdit={handleTaskClick}
                                                            onDelete={handleDeleteTask}
                                                            onView={handleTaskClick}
                                                        />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}

                                        {filteredTasks(column.id).length === 0 && (
                                            <div className="empty-column">
                                                <p>No tasks</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            {showTaskModal && (
                <TaskModal
                    mode="create"
                    categories={categories}
                    onClose={handleCloseModal}
                />
            )}

            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    categories={categories}
                    onClose={handleCloseModal}
                    onDelete={(taskId) => {
                        handleDeleteTask(taskId);
                        handleCloseModal();
                    }}
                />
            )}
        </div>
    );
}

export default KanbanBoard;
