import React from 'react';
import './TaskCard.css';

function TaskCard({ task, onEdit, onDelete, onView }) {
    const priority = task.priority || 'MEDIUM';
    const priorityClass = `priority-badge priority-${priority.toLowerCase()}`;

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
            className="task-card clickable"
            data-priority={priority}
            onClick={handleCardClick}
        >
            <div className="task-card-header">
                <span className={priorityClass}>{priority}</span>
                <div className="task-actions">
                    <button
                        className="task-action-btn task-edit-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(task);
                        }}
                        title="Edit"
                    >
                        ✏️
                    </button>
                    <button
                        className="task-action-btn task-delete-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(task.id);
                        }}
                        title="Delete"
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

            <div className="task-card-footer">
                {task.category && (
                    <span
                        className="category-tag"
                        style={{ backgroundColor: task.category_color || '#6366f1' }}
                    >
                        {task.category_name || task.category}
                    </span>
                )}

                {task.created_at && (
                    <span className="task-date">{formatDate(task.created_at)}</span>
                )}
            </div>
            <div className="task-additional-feature-container">
                {task.due_date && (
                    <span className={`task-due-date ${dueDateStatus}`}>
                        {dueDateStatus === 'overdue' && '⚠️ '}
                        {dueDateStatus === 'due-soon' && '⏰ '}
                        {dueDateStatus === 'normal' && '🟢 '}
                        {formatDate(task.due_date)}
                    </span>
                )}
            </div>
        </div>
    );
}

export default TaskCard;
