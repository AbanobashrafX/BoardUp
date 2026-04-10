import React from 'react';
import { Badge } from '../BadgeSelect/BadgeSelect';
import './TaskCard.css';

const TaskCard = React.memo(({ task, columnColor, isDragging = false, onEdit, onDelete, onView }) => {
    const priority = task.priority || 'MEDIUM';

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    const getDueDateStatus = (dueDate) => {
        if (!dueDate) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'overdue';
        if (diffDays <= 2) return 'due-soon';
        return 'normal';
    };

    const handleCardClick = (e) => {
        // Don't trigger view if clicking on action buttons
        if (e.target.closest('.task-actions')) return;
        if (onView) onView(task);
    };

    const dueDateStatus = getDueDateStatus(task.due_date);

    return (
        <div
            className={`task-card ${isDragging ? 'dragging' : ''}`}
            data-priority={priority}
            onClick={handleCardClick}
            style={{
                ...(columnColor ? { '--column-color': columnColor } : {})
            }}
        >
            <div className="task-card-header">
                <Badge type="priority" variant={`priority-${priority.toLowerCase()}`}>{priority}</Badge>
                <div className="task-actions">
                    <button
                        className="task-action-btn task-delete-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(task.id);
                        }}
                        title="Delete"
                        aria-label="Delete task"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            <h4 className="task-title">{task.title}</h4>

            {task.description && (
                <p className="task-description">
                    {task.description.length > 100
                        ? `${task.description.substring(0, 100)}...`
                        : task.description}
                </p>
            )}

            {/* Subtasks Progress Bar */}
            {task.subtasks_count > 0 && (
                <div className="task-subtasks-progress">
                    <div className="task-subtasks-label">
                        <span className="task-subtasks-count">
                            ☑️ Subtasks
                        </span>
                        <span>{task.completed_subtasks_count}/{task.subtasks_count}</span>
                    </div>
                    <div className="progress">
                        <div
                            className={`progress-bar ${task.completed_subtasks_count === task.subtasks_count ? 'success' : ''}`}
                            style={{
                                width: `${(task.completed_subtasks_count / task.subtasks_count) * 100}%`
                            }}
                        />
                    </div>
                </div>
            )}
            <div className="task-additional-feature-container">
                {task.category && (
                    <Badge
                        type="category"
                        style={{ backgroundColor: task.category_color + '20' }}
                    >
                        {task.category_name || task.category}
                    </Badge>
                )}
                {task.project && (
                    <Badge
                        type="project"
                        style={{ backgroundColor: task.project_color + '20' }}
                    >
                        📁 {task.project_name || task.project}
                    </Badge>
                )}
                {task.due_date && (
                    <Badge
                        type="date"
                        variant={dueDateStatus}
                        color={dueDateStatus === 'overdue' ? '#ef4444' : dueDateStatus === 'due-soon' ? '#f59e0b' : '#ffffffbe'}
                    >
                        {dueDateStatus === 'overdue' && '🎯 '}
                        {dueDateStatus === 'due-soon' && '⚠️ '}
                        {dueDateStatus === 'normal' && '📆 '}
                        {formatDate(task.due_date)}
                    </Badge>
                )}
                {/* Subtask progress removed - now shown as ProgressBar above */}
            </div>

            <div className="task-card-footer">
                {task.created_at && (
                    <span className="task-date">{formatDate(task.created_at)}</span>
                )}
            </div>
        </div>
    );
});

TaskCard.displayName = 'TaskCard';

export default TaskCard;
