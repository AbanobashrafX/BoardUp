import React, { useState, useEffect } from 'react';
import { taskAPI } from '../../services/api';
import './TaskDetailModal.css';

function TaskDetailModal({ task, onClose, onEdit, onDelete, categories }) {
    const [fullTask, setFullTask] = useState(task);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch full task details when modal opens
        const fetchFullTask = async () => {
            if (task && task.id) {
                setLoading(true);
                try {
                    const data = await taskAPI.getOne(task.id);
                    setFullTask(data);
                } catch (error) {
                    console.error('Error fetching task:', error);
                    // Use provided task data as fallback
                    setFullTask(task);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchFullTask();
    }, [task]);

    if (!task) return null;

    const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
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

    const getPriorityColor = (priority) => {
        const colors = {
            LOW: '#22c55e',
            MEDIUM: '#f59e0b',
            HIGH: '#ef4444',
            URGENT: '#ec4899',
        };
        return colors[priority] || colors.MEDIUM;
    };

    const getStatusInfo = (status) => {
        const statuses = {
            TODO: { label: 'To Do', color: '#f59e0b' },
            IN_PROGRESS: { label: 'In Progress', color: '#3b82f6' },
            DONE: { label: 'Done', color: '#10b981' },
        };
        return statuses[status] || statuses.TODO;
    };

    const dueDateStatus = getDueDateStatus(fullTask?.due_date);
    const statusInfo = getStatusInfo(fullTask?.status);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="task-detail-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                {loading ? (
                    <div className="task-detail-loading">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <div className="task-detail-content">
                        {/* Header with title and actions */}
                        <div className="task-detail-header">
                            <h1 className="task-detail-title">{fullTask?.title}</h1>
                            <div className="task-detail-actions">
                                <button className="task-detail-action-btn" onClick={() => onEdit(fullTask)} title="Edit">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                                <button className="task-detail-action-btn task-detail-action-delete" onClick={() => onDelete(fullTask.id)} title="Delete">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Properties */}
                        <div className="task-detail-properties">
                            {/* Status */}
                            <div className="task-detail-property">
                                <span className="task-detail-property-label">Status</span>
                                <span className="task-detail-property-value">
                                    <span className="task-status-badge" style={{ backgroundColor: statusInfo.color }}>
                                        {statusInfo.label}
                                    </span>
                                </span>
                            </div>

                            {/* Priority */}
                            <div className="task-detail-property">
                                <span className="task-detail-property-label">Priority</span>
                                <span className="task-detail-property-value">
                                    <span
                                        className="task-priority-badge"
                                        style={{
                                            backgroundColor: `${getPriorityColor(fullTask?.priority)}20`,
                                            color: getPriorityColor(fullTask?.priority)
                                        }}
                                    >
                                        {fullTask?.priority}
                                    </span>
                                </span>
                            </div>

                            {/* Category */}
                            {fullTask?.category && (
                                <div className="task-detail-property">
                                    <span className="task-detail-property-label">Category</span>
                                    <span className="task-detail-property-value">
                                        <span
                                            className="task-category-badge"
                                            style={{ backgroundColor: fullTask?.category_color || '#6366f1' }}
                                        >
                                            {fullTask?.category_name || fullTask?.category}
                                        </span>
                                    </span>
                                </div>
                            )}

                            {/* Due Date */}
                            {fullTask?.due_date && (
                                <div className="task-detail-property">
                                    <span className="task-detail-property-label">Due Date</span>
                                    <span className={`task-detail-property-value task-due-date ${dueDateStatus}`}>
                                        {dueDateStatus === 'overdue' && '⚠️ '}
                                        {dueDateStatus === 'due-soon' && '⏰ '}
                                        {formatDate(fullTask?.due_date)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {fullTask?.description && (
                            <div className="task-detail-section">
                                <h3 className="task-detail-section-title">Description</h3>
                                <div className="task-detail-description">
                                    {fullTask.description}
                                </div>
                            </div>
                        )}

                        {/* Metadata */}
                        <div className="task-detail-meta">
                            <span>Created: {formatDateTime(fullTask?.created_at)}</span>
                            {fullTask?.updated_at && (
                                <span>Updated: {formatDateTime(fullTask?.updated_at)}</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TaskDetailModal;
