import React, { useState, useEffect } from 'react';
import { taskAPI, subtaskAPI } from '../../services/api';
import BadgeSelect from '../BadgeSelect/BadgeSelect';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import './TaskModal.css';

function TaskModal({ task, onClose, onDelete, categories: propCategories, projects: propProjects, mode: propMode, preselectedProject: propPreselectedProject, preselectedStatus: propPreselectedStatus }) {
    // Determine mode: 'create' | 'edit' | 'view' (default 'view')
    // If task is provided but mode is not, assume 'view'
    // If mode is explicitly provided, use that
    // If no task and no mode, assume 'create' for new task
    const mode = propMode || (task ? 'view' : 'create');
    const isCreateMode = mode === 'create';
    const isEditMode = mode === 'edit';
    const isViewMode = mode === 'view' || (!isCreateMode && !isEditMode);

    const [isEditing, setIsEditing] = useState(isCreateMode || isEditMode);
    const [fullTask, setFullTask] = useState(task);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [categories] = useState(propCategories || []);
    const [projects] = useState(propProjects || []);
    const [subtasks, setSubtasks] = useState([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [subtasksLoading, setSubtasksLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        project: '',
        category: '',
        priority: 'LOW',
        status: 'TODO',
        due_date: '',
    });
    const [originalFormData, setOriginalFormData] = useState(null);
    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

    // Check if form has unsaved changes
    const hasUnsavedChanges = () => {
        if (!originalFormData) return false;
        return JSON.stringify(formData) !== JSON.stringify(originalFormData);
    };

    // Handle close with unsaved changes warning
    const handleClose = () => {
        if (hasUnsavedChanges()) {
            setShowUnsavedWarning(true);
        } else {
            onClose();
        }
    };

    // Handle discard changes
    const handleDiscardChanges = () => {
        setShowUnsavedWarning(false);
        onClose();
    };

    // Handle cancel discard
    const handleCancelDiscard = () => {
        setShowUnsavedWarning(false);
    };

    // Handle beforeunload event (browser close/refresh)
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [formData, originalFormData]);

    useEffect(() => {
        // Skip fetching for create mode
        if (!task) {
            // Create mode - use default form data with preselected project and status
            const preselectedStatus = propPreselectedStatus || 'TODO';

            const defaultData = {
                title: '',
                description: '',
                project: propPreselectedProject ? propPreselectedProject.id : '',
                category: '',
                priority: 'LOW',
                status: preselectedStatus,
                due_date: '',
            };
            setFormData(defaultData);
            setOriginalFormData(defaultData);
            setSubtasks([]);
            return;
        }

        const fetchFullTask = async () => {
            if (task && task.id) {
                setLoading(true);
                try {
                    const [data, subtasksData] = await Promise.all([
                        taskAPI.getOne(task.id),
                        subtaskAPI.getByTask(task.id).catch(() => [])
                    ]);
                    setFullTask(data);
                    setSubtasks(subtasksData);
                    const taskData = {
                        title: data.title || '',
                        description: data.description || '',
                        project: data.project || '',
                        category: data.category || '',
                        priority: data.priority || 'LOW',
                        status: data.status || 'TODO',
                        due_date: data.due_date || '',
                    };
                    setFormData(taskData);
                    setOriginalFormData(taskData);
                } catch (error) {
                    console.error('Error fetching task:', error);
                    setFullTask(task);
                    setSubtasks(task.subtasks || []);
                    const taskData = {
                        title: task.title || '',
                        description: task.description || '',
                        project: task.project || '',
                        category: task.category || '',
                        priority: task.priority || 'LOW',
                        status: task.status || 'TODO',
                        due_date: task.due_date || '',
                    };
                    setFormData(taskData);
                    setOriginalFormData(taskData);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchFullTask();
    }, [task]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = async () => {
        // Validate title
        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const submitData = {
                ...formData,
                project: formData.project ? parseInt(formData.project) : null,
                category: formData.category ? parseInt(formData.category) : null,
            };

            if (isCreateMode) {
                // Create new task
                const newTask = await taskAPI.create(submitData);
                if (onClose) {
                    onClose(newTask); // Pass new task back to parent
                }
            } else {
                // Update existing task
                await taskAPI.update(fullTask.id, submitData);
                const updatedTask = await taskAPI.getOne(fullTask.id);
                setFullTask(updatedTask);
                setIsEditing(false);
                // Reset original form data after successful save
                setOriginalFormData(formData);
            }
        } catch (err) {
            console.error('Error saving task:', err);
            setError('Failed to save task. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (isCreateMode) {
            // In create mode, cancel closes the modal
            if (onClose) onClose();
            return;
        }

        setFormData({
            title: fullTask?.title || '',
            description: fullTask?.description || '',
            project: fullTask?.project || '',
            category: fullTask?.category || '',
            priority: fullTask?.priority || 'LOW',
            status: fullTask?.status || 'TODO',
            due_date: fullTask?.due_date || '',
        });
        setIsEditing(false);
    };

    // Subtask handlers
    const handleAddSubtask = async () => {
        if (!newSubtaskTitle.trim() || !fullTask?.id) return;

        setSubtasksLoading(true);
        try {
            const newSubtask = await subtaskAPI.create(fullTask.id, {
                title: newSubtaskTitle.trim()
            });
            setSubtasks([...subtasks, newSubtask]);
            setNewSubtaskTitle('');
        } catch (error) {
            console.error('Error adding subtask:', error);
        } finally {
            setSubtasksLoading(false);
        }
    };

    const handleToggleSubtask = async (subtaskId) => {
        try {
            // Find the current subtask to get its is_completed state
            const currentSubtask = subtasks.find(st => st.id === subtaskId);
            if (!currentSubtask) return;

            // Toggle to the opposite state (optimized single PATCH request)
            const updatedSubtask = await subtaskAPI.toggle(subtaskId, !currentSubtask.is_completed);
            setSubtasks(subtasks.map(st =>
                st.id === subtaskId ? updatedSubtask : st
            ));
        } catch (error) {
            console.error('Error toggling subtask:', error);
        }
    };

    const handleDeleteSubtask = async (subtaskId) => {
        try {
            await subtaskAPI.delete(subtaskId);
            setSubtasks(subtasks.filter(st => st.id !== subtaskId));
        } catch (error) {
            console.error('Error deleting subtask:', error);
        }
    };

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

    const getPriorityInfo = (priority) => {
        const priorities = {
            LOW: { label: 'Low', className: 'priority-low', color: '#22c55e' },
            MEDIUM: { label: 'Medium', className: 'priority-medium', color: '#f59e0b' },
            HIGH: { label: 'High', className: 'priority-high', color: '#ef4444' },
            URGENT: { label: 'Urgent', className: 'priority-urgent', color: '#ec4899' },
        };
        return priorities[priority] || priorities.MEDIUM;
    };

    const getStatusInfo = (status) => {
        const statuses = {
            TODO: { label: 'To Do', className: 'status-todo', color: '#f59e0b' },
            IN_PROGRESS: { label: 'In Progress', className: 'status-in-progress', color: '#3b82f6' },
            DONE: { label: 'Done', className: 'status-done', color: '#10b981' },
        };
        return statuses[status] || statuses.TODO;
    };

    // Badge select options
    const statusOptions = [
        { value: 'TODO', label: 'To Do' },
        { value: 'IN_PROGRESS', label: 'In Progress' },
        { value: 'DONE', label: 'Done' },
    ];

    const priorityOptions = [
        { value: 'LOW', label: 'Low' },
        { value: 'MEDIUM', label: 'Medium' },
        { value: 'HIGH', label: 'High' },
        { value: 'URGENT', label: 'Urgent' },
    ];

    // Build project options from propProjects
    const projectOptions = [
        { value: '', label: 'No Project', isGhost: true },
        ...(propProjects || []).map(proj => ({ value: proj.id, label: proj.name, color: proj.color })),
    ];

    // Build category options from propCategories
    const categoryOptions = [
        { value: '', label: 'No Category', isGhost: true },
        ...(propCategories || []).map(cat => ({ value: cat.id, label: cat.name, color: cat.color })),
    ];

    const getProjectOptionStyle = (option) => {
        if (option.isGhost) {
            // Ghost pill style for "No Project"
            return {
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                border: '1px dashed var(--color-border-strong)',
            };
        }
        return { backgroundColor: option.color || '#6366f1' };
    };

    const getCategoryOptionStyle = (option) => {
        if (option.isGhost) {
            // Ghost pill style for "No Category"
            return {
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                border: '1px dashed var(--color-border-strong)',
            };
        }
        return { backgroundColor: option.color || '#6366f1' };
    };

    const getStatusOptionStyle = (option) => {
        const colors = {
            TODO: '#f59e0b',
            IN_PROGRESS: '#3b82f6',
            DONE: '#10b981',
        };
        return { backgroundColor: colors[option.value] || '#6366f1' };
    };

    const getPriorityOptionStyle = (option) => {
        const priorityClasses = {
            LOW: 'priority-low',
            MEDIUM: 'priority-medium',
            HIGH: 'priority-high',
            URGENT: 'priority-urgent',
        };
        return { className: `priority-badge ${priorityClasses[option.value] || 'priority-medium'}` };
    };

    const dueDateStatus = getDueDateStatus(isEditing || isCreateMode ? formData.due_date : fullTask?.due_date);
    const statusInfo = getStatusInfo(isEditing || isCreateMode ? formData.status : fullTask?.status);
    const priorityInfo = getPriorityInfo(isEditing || isCreateMode ? formData.priority : fullTask?.priority);

    if (!task && !isCreateMode) return null;

    // In create mode, show loading state only if explicitly needed
    const showLoading = loading && !isCreateMode;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="task-modal" onClick={(e) => e.stopPropagation()}>

                {showLoading ? (
                    <div className="task-modal-loading">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <div className="task-modal-content">
                        {/* Header - Full Width */}
                        <div className="task-modal-header">
                            {isEditing || isCreateMode ? (
                                <input
                                    type="text"
                                    name="title"
                                    className={`task-modal-title-input ${error ? 'has-error' : ''}`}
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder={isCreateMode ? 'Enter task title...' : 'Task title'}
                                    autoFocus
                                />
                            ) : (
                                <h1 className="task-modal-title">{fullTask?.title}</h1>
                            )}
                            <div className="task-modal-actions">
                                {isEditing || isCreateMode ? (
                                    <>
                                        <button
                                            className="task-modal-btn task-modal-btn-secondary"
                                            onClick={handleCancel}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="task-modal-btn task-modal-btn-primary"
                                            onClick={handleSave}
                                            disabled={saving}
                                        >
                                            {saving ? (isCreateMode ? 'Creating...' : 'Saving...') : (isCreateMode ? 'Create Task' : 'Save')}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className="task-modal-action-btn"
                                            onClick={() => setIsEditing(true)}
                                            title="Edit"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button
                                            className="task-modal-action-btn task-modal-action-delete"
                                            onClick={() => {
                                                if (onDelete) onDelete(fullTask.id);
                                                onClose();
                                            }}
                                            title="Delete"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Main Body - Side by Side Layout */}
                        <div className="task-modal-body">
                            {/* Main Content - Description & Checklist */}
                            <main className="task-modal-main">
                                {/* Description Section */}
                                <div className="task-modal-section">
                                    <h3 className="task-modal-section-title">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="17" y1="10" x2="3" y2="10"></line>
                                            <line x1="21" y1="6" x2="3" y2="6"></line>
                                            <line x1="21" y1="14" x2="3" y2="14"></line>
                                            <line x1="17" y1="18" x2="3" y2="18"></line>
                                        </svg>
                                        Description
                                    </h3>
                                    {isEditing || isCreateMode ? (
                                        <textarea
                                            name="description"
                                            className="task-modal-textarea"
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Add a more detailed description..."
                                            rows={5}
                                        />
                                    ) : (
                                        <div className="task-modal-description">
                                            {fullTask?.description || (
                                                <span className="task-no-value">No description provided</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Subtasks Section - Only show when not in create mode */}
                                {!isCreateMode && fullTask && (
                                    <div className="task-modal-section">
                                        <h3 className="task-modal-section-title">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M9 11l3 3L22 4"></path>
                                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                                            </svg>
                                            Checklist
                                            <span className="subtasks-count">
                                                ({subtasks.filter(st => st.is_completed).length}/{subtasks.length})
                                            </span>
                                        </h3>

                                        {/* Subtask list */}
                                        <div className="subtasks-list">
                                            {subtasks.map((subtask) => (
                                                <div key={subtask.id} className={`subtask-item ${subtask.is_completed ? 'completed' : ''}`}>
                                                    <label className="subtask-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={subtask.is_completed}
                                                            onChange={() => handleToggleSubtask(subtask.id)}
                                                        />
                                                        <span className="subtask-title">{subtask.title}</span>
                                                    </label>
                                                    <button
                                                        className="subtask-delete-btn"
                                                        onClick={() => handleDeleteSubtask(subtask.id)}
                                                        title="Delete subtask"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add subtask input */}
                                        <div className="subtask-add-form">
                                            <input
                                                type="text"
                                                className="subtask-add-input"
                                                placeholder="Add an item..."
                                                value={newSubtaskTitle}
                                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                                            />
                                            <button
                                                className="subtask-add-btn"
                                                onClick={handleAddSubtask}
                                                disabled={!newSubtaskTitle.trim() || subtasksLoading}
                                            >
                                                {subtasksLoading ? (
                                                    <span className="subtask-add-spinner"></span>
                                                ) : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </main>
                            {/* Sidebar - Property Table */}
                            <aside className="task-modal-sidebar">
                                <div className="task-modal-properties">
                                    {error && (
                                        <div className="task-modal-error">
                                            {error}
                                        </div>
                                    )}

                                    {/* Status Row */}
                                    <div className="task-modal-property">
                                        <span className="task-modal-property-label">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle></svg>
                                            Status
                                        </span>
                                        {isEditing || isCreateMode ? (
                                            <BadgeSelect
                                                name="status"
                                                value={formData.status}
                                                onChange={handleChange}
                                                options={statusOptions}
                                                getOptionStyle={getStatusOptionStyle}
                                                placeholder="Select status..."
                                            />
                                        ) : (
                                            <span className="task-modal-property-value">
                                                <span className={`tm-status-dot tm-status-dot--${statusInfo.className.replace('status-', '')}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Priority Row */}
                                    <div className="task-modal-property">
                                        <span className="task-modal-property-label">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                                            Priority
                                        </span>
                                        {isEditing || isCreateMode ? (
                                            <BadgeSelect
                                                name="priority"
                                                value={formData.priority}
                                                onChange={handleChange}
                                                options={priorityOptions}
                                                getOptionStyle={getPriorityOptionStyle}
                                                placeholder="Select priority..."
                                            />
                                        ) : (
                                            <span className="task-modal-property-value">
                                                <span className={`tm-priority tm-priority--${priorityInfo.className.replace('priority-', '')}`}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="2"></line></svg>
                                                    {priorityInfo.label}
                                                </span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Project Row */}
                                    <div className="task-modal-property">
                                        <span className="task-modal-property-label">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                            Project
                                        </span>
                                        {isEditing || isCreateMode ? (
                                            <BadgeSelect
                                                name="project"
                                                value={formData.project}
                                                onChange={handleChange}
                                                options={projectOptions}
                                                getOptionStyle={getProjectOptionStyle}
                                                placeholder="Select project..."
                                            />
                                        ) : (
                                            <span className="task-modal-property-value">
                                                {fullTask?.project ? (
                                                    <span className="tm-project">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                                        {fullTask?.project_name || fullTask?.project}
                                                    </span>
                                                ) : (
                                                    <span className="tm-project tm-project--empty">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                                        No Project
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </div>

                                    {/* Category Row */}
                                    <div className="task-modal-property">
                                        <span className="task-modal-property-label">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>
                                            Category
                                        </span>
                                        {isEditing || isCreateMode ? (
                                            <BadgeSelect
                                                name="category"
                                                value={formData.category}
                                                onChange={handleChange}
                                                options={categoryOptions}
                                                getOptionStyle={getCategoryOptionStyle}
                                                placeholder="Select category..."
                                            />
                                        ) : (
                                            <span className="task-modal-property-value">
                                                {fullTask?.category ? (
                                                    <span className="tm-category">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>
                                                        {fullTask?.category_name || fullTask?.category}
                                                    </span>
                                                ) : (
                                                    <span className="tm-category tm-category--empty">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>
                                                        No Category
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </div>

                                    {/* Due Date Row */}
                                    <div className="task-modal-property">
                                        <span className="task-modal-property-label">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                            Due Date
                                        </span>
                                        {isEditing || isCreateMode ? (
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <DatePicker
                                                    name="due_date"
                                                    value={formData.due_date ? dayjs(formData.due_date) : null}
                                                    onChange={(newValue) => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            due_date: newValue ? newValue.format('YYYY-MM-DD') : ''
                                                        }));
                                                    }}
                                                    slotProps={{
                                                        textField: {
                                                            size: 'small',
                                                            placeholder: 'Select due date',
                                                        },
                                                    }}
                                                    disablePast
                                                    format="YYYY-MM-DD"
                                                />
                                            </LocalizationProvider>
                                        ) : (
                                            <span className="task-modal-property-value">
                                                {fullTask?.due_date ? (
                                                    <span className={`tm-due-date ${dueDateStatus === 'overdue' ? 'tm-due-date--overdue' : dueDateStatus === 'due-soon' ? 'tm-due-date--due-soon' : ''}`}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                                        {formatDate(fullTask?.due_date)}
                                                    </span>
                                                ) : (
                                                    <span className="task-no-value">No due date</span>
                                                )}
                                            </span>
                                        )}
                                    </div>

                                    {/* Metadata - Bottom section */}
                                    {!isCreateMode && fullTask && (
                                        <div className="task-modal-meta">
                                            <div className="task-modal-meta-item">
                                                <span className="task-modal-meta-label">Created</span>
                                                <span>{formatDateTime(fullTask?.created_at)}</span>
                                            </div>
                                            {fullTask?.updated_at && (
                                                <div className="task-modal-meta-item">
                                                    <span className="task-modal-meta-label">Updated</span>
                                                    <span>{formatDateTime(fullTask?.updated_at)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </aside>

                        </div>
                    </div>
                )}
            </div>

            {/* Unsaved Changes Warning Modal */}
            {showUnsavedWarning && (
                <div className="unsaved-warning-overlay" onClick={(e) => e.stopPropagation()}>
                    <div className="unsaved-warning-modal">
                        <div className="unsaved-warning-header">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                            <h3>Unsaved Changes</h3>
                        </div>
                        <p>You have unsaved changes. Are you sure you want to close without saving?</p>
                        <div className="unsaved-warning-actions">
                            <button
                                className="unsaved-warning-btn unsaved-warning-btn-secondary"
                                onClick={handleCancelDiscard}
                            >
                                Keep Editing
                            </button>
                            <button
                                className="unsaved-warning-btn unsaved-warning-btn-danger"
                                onClick={handleDiscardChanges}
                            >
                                Discard Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TaskModal;
