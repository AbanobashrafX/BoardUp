import React, { useState, useEffect } from 'react';
import { taskAPI } from '../../services/api';
import TaskModal from '../TaskModal/TaskModal';
import './CalendarBoard.css';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const SAMPLE_TASKS = [
];

function CalendarBoard({
    selectedProject = null,
    viewMode = 'calendar',
    onViewModeChange = () => { },
    propCategories = [],
    propProjects = [],
    searchQuery = '',
    filter = { categories: [], priorities: [] },
    sortBy = ''
}) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    useEffect(() => {
        fetchTasks();
    }, [selectedProject]);

    const fetchTasks = async () => {
        try {
            setIsLoading(true);
            const params = {};
            if (selectedProject) {
                params.project = selectedProject.id;
            }

            const tasksData = await taskAPI.getAll(params);

            // Use all tasks - CalendarBoard will display them on their due_date or created_at
            if (tasksData && tasksData.length > 0) {
                setTasks(tasksData);
            } else {
                // Use sample data if no tasks exist
                setTasks(SAMPLE_TASKS);
            }
        } catch (error) {
            console.log('Using sample data');
            setTasks(SAMPLE_TASKS);
        } finally {
            setIsLoading(false);
        }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days = [];

        // Previous month's days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDay - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonthLastDay - i),
                isCurrentMonth: false
            });
        }

        // Current month's days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            });
        }

        // Next month's days
        const remainingDays = 42 - days.length; // 6 weeks
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            });
        }

        return days;
    };

    // Filter and sort tasks
    const filterAndSortTasks = (tasksToFilter) => {
        let filtered = [...tasksToFilter];

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(task =>
                task.title?.toLowerCase().includes(query) ||
                task.description?.toLowerCase().includes(query)
            );
        }

        // Apply category filter
        if (filter.categories?.length > 0) {
            filtered = filtered.filter(task =>
                task.category && filter.categories.includes(task.category)
            );
        }

        // Apply priority filter
        if (filter.priorities?.length > 0) {
            filtered = filtered.filter(task =>
                task.priority && filter.priorities.includes(task.priority)
            );
        }

        // Apply sorting
        if (sortBy) {
            const priorityOrder = { 'URGENT': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
            switch (sortBy) {
                case 'oldest':
                    filtered.sort((a, b) => (a.id || 0) - (b.id || 0));
                    break;
                case 'priority-high':
                    filtered.sort((a, b) =>
                        (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
                    );
                    break;
                case 'priority-low':
                    filtered.sort((a, b) =>
                        (priorityOrder[b.priority] ?? 4) - (priorityOrder[a.priority] ?? 4)
                    );
                    break;
                case 'alphabetical':
                    filtered.sort((a, b) =>
                        (a.title || '').localeCompare(b.title || '')
                    );
                    break;
                case 'newest':
                default:
                    filtered.sort((a, b) => (b.id || 0) - (a.id || 0));
                    break;
            }
        }

        return filtered;
    };

    const getTasksForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        const dateTasks = tasks.filter(task => {
            // Use due_date if available, otherwise fall back to created_at
            const dateToUse = task.due_date || task.created_at;
            if (!dateToUse) return false;

            // Normalize date to date string for comparison
            const taskDate = dateToUse.split('T')[0];
            return taskDate === dateStr;
        });
        return filterAndSortTasks(dateTasks);
    };

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
    };

    const handleCloseModal = () => {
        setShowTaskModal(false);
        setSelectedTask(null);
        fetchTasks();
    };

    const days = getDaysInMonth(currentDate);

    if (isLoading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="calendar-board">
            <div className="calendar-header">
                <div className="calendar-header-left">
                    <h2>
                        {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <button className="today-btn" onClick={goToToday}>
                        Today
                    </button>
                </div>
                <div className="calendar-nav">

                    <button className="nav-btn" onClick={prevMonth}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <button className="nav-btn" onClick={nextMonth}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="calendar-grid">
                <div className="calendar-weekdays">
                    {DAYS_OF_WEEK.map(day => (
                        <div key={day} className="calendar-weekday">{day}</div>
                    ))}
                </div>
                <div className="calendar-days">
                    {days.map((day, index) => {
                        const dayTasks = getTasksForDate(day.date);
                        return (
                            <div
                                key={index}
                                className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isToday(day.date) ? 'today' : ''}`}
                            >
                                <span className="day-number">{day.date.getDate()}</span>
                                <div className="day-tasks">
                                    {dayTasks.slice(0, 3).map(task => (
                                        <div
                                            key={task.id}
                                            className={`calendar-task task-priority-${task.priority?.toLowerCase()}`}
                                            onClick={() => handleTaskClick(task)}
                                        >
                                            {task.title}
                                        </div>
                                    ))}
                                    {dayTasks.length > 3 && (
                                        <div className="more-tasks">+{dayTasks.length - 3} more</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    categories={propCategories}
                    projects={propProjects}
                    onClose={handleCloseModal}
                    onDelete={(id) => handleCloseModal()}
                />
            )}
        </div>
    );
}

export default CalendarBoard;
