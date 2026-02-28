import React from 'react';
import './TaskCard.css';

function TaskCard({ task, onEdit, onDelete }) {
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

    return (
        <div className="task-card" data-priority={priority}>
            <div className="task-card-header">
                <span className={priorityClass}>{priority}</span>
                <div className="task-actions">
                    <button
                        className="task-action-btn task-edit-btn"
                        onClick={() => onEdit(task)}
                        title="Edit"
                    >
                        ✏️
                    </button>
                    <button
                        className="task-action-btn task-delete-btn"
                        onClick={() => onDelete(task.id)}
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
        </div>
    );
}

export default TaskCard;
