import React, { useState, useEffect } from 'react';
import './TaskForm.css';


function TaskForm({ task, categories, onSubmit, onClose }) {
    const isEditing = !!task;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        priority: 'MEDIUM',
        status: 'TODO',
        due_date: '',
    });

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                category: task.category || '',
                priority: task.priority || 'MEDIUM',
                status: task.status || 'TODO',
                due_date: task.due_date || '',
            });
        }
    }, [task]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const submitData = {
            ...formData,
            category: formData.category ? parseInt(formData.category) : null,
        };

        onSubmit(submitData);
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

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="task-form-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <form onSubmit={handleSubmit} className="task-form">
                    {/* Title */}
                    <div className="task-form-group">
                        <input
                            type="text"
                            id="title"
                            name="title"
                            className="task-form-title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="Task title"
                            autoFocus
                        />
                    </div>

                    {/* Properties Row */}
                    <div className="task-form-properties">
                        {/* Status */}
                        <div className="task-form-property">
                            <label className="task-form-label" htmlFor="status">
                                <span className="label-icon">📋</span>
                                Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                className="task-form-select"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="DONE">Done</option>
                            </select>
                        </div>

                        {/* Priority */}
                        <div className="task-form-property">
                            <label className="task-form-label" htmlFor="priority">
                                <span className="label-icon">🔥</span>
                                Priority
                            </label>
                            <select
                                id="priority"
                                name="priority"
                                className="task-form-select"
                                value={formData.priority}
                                onChange={handleChange}
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>

                        {/* Category */}
                        <div className="task-form-property">
                            <label className="task-form-label" htmlFor="category">
                                <span className="label-icon">🏷️</span>
                                Category
                            </label>
                            <select
                                id="category"
                                name="category"
                                className="task-form-select"
                                value={formData.category}
                                onChange={handleChange}
                            >
                                <option value="">No Category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Due Date */}
                        <div className="task-form-property">
                            <label className="task-form-label" htmlFor="due_date">
                                <span className="label-icon">📅</span>
                                Due Date
                            </label>
                            <input
                                type="date"
                                id="due_date"
                                name="due_date"
                                className="task-form-input"
                                value={formData.due_date}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="task-form-group">
                        <label className="task-form-label" htmlFor="description">
                            <span className="label-icon">📝</span>
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            className="task-form-textarea"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Add a more detailed description..."
                            rows={5}
                        />
                    </div>

                    {/* Actions */}
                    <div className="task-form-actions">
                        <button
                            type="button"
                            className="task-form-btn task-form-btn-secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="task-form-btn task-form-btn-primary">
                            {isEditing ? 'Save Changes' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default TaskForm;
