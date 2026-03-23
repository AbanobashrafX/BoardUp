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

function CalendarBoard({ selectedProject = null, viewMode = 'calendar', onViewModeChange = () => { }, propCategories = [], propProjects = [] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [categories, setCategories] = useState(propCategories);
    const [projects, setProjects] = useState(propProjects);

    // Sync prop categories and projects to state
    useEffect(() => {
        if (propCategories.length > 0) {
            setCategories(propCategories);
        }
    }, [propCategories]);

    useEffect(() => {
        if (propProjects.length > 0) {
            setProjects(propProjects);
        }
    }, [propProjects]);

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

            // Filter tasks with due dates
            const tasksWithDueDates = (tasksData || []).filter(t => t.due_date);

            if (tasksWithDueDates.length > 0) {
                setTasks(tasksWithDueDates);
            } else {
                // Use sample data if no tasks with due dates
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

    const getTasksForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return tasks.filter(task => task.due_date === dateStr);
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
                    categories={categories}
                    projects={projects}
                    onClose={handleCloseModal}
                    onDelete={(id) => handleCloseModal()}
                />
            )}
        </div>
    );
}

export default CalendarBoard;
