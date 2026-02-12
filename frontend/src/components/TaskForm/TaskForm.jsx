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
    });

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                category: task.category || '',
                priority: task.priority || 'MEDIUM',
                status: task.status || 'TODO',
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

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isEditing ? 'Edit Task' : 'Create New Task'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="title">
                            Title *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            className="form-input"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="Enter task title"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="description">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            className="form-input form-textarea"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Enter task description"
                            rows="3"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="priority">
                                Priority
                            </label>
                            <select
                                id="priority"
                                name="priority"
                                className="form-select"
                                value={formData.priority}
                                onChange={handleChange}
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="status">
                                Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                className="form-select"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="DONE">Done</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="category">
                            Category
                        </label>
                        <select
                            id="category"
                            name="category"
                            className="form-select"
                            value={formData.category}
                            onChange={handleChange}
                        >
                            {/* <option value="">No Category</option> */}
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {isEditing ? 'Save Changes' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default TaskForm;
