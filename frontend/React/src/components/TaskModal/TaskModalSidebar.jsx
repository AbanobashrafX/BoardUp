import React, { useMemo } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import BadgeSelect, { Badge } from '../BadgeSelect/BadgeSelect';

const TaskModalSidebar = React.memo(({
    isEditing,
    isCreateMode,
    formData,
    handleChange,
    fullTask,
    categories = [],
    projects = [],
    error
}) => {
    // Memoize option arrays to prevent unnecessary recalculations
    const statusOptions = useMemo(() => [
        { value: 'TODO', label: 'To Do' },
        { value: 'IN_PROGRESS', label: 'In Progress' },
        { value: 'DONE', label: 'Done' },
    ], []);

    const priorityOptions = useMemo(() => [
        { value: 'LOW', label: 'Low' },
        { value: 'MEDIUM', label: 'Medium' },
        { value: 'HIGH', label: 'High' },
        { value: 'URGENT', label: 'Urgent' },
    ], []);

    const projectOptions = useMemo(() => [
        { value: '', label: 'No Project', isGhost: true },
        ...(projects || []).map(proj => ({ value: proj.id, label: proj.name, color: proj.color })),
    ], [projects]);

    const categoryOptions = useMemo(() => [
        { value: '', label: 'No Category', isGhost: true },
        ...(categories || []).map(cat => ({ value: cat.id, label: cat.name, color: cat.color })),
    ], [categories]);

    // Utility functions
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

    // Style functions
    const getProjectOptionStyle = (option) => {
        if (option.isGhost) {
            return {
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                border: '1px dashed var(--color-border-strong)',
            };
        }
        return { backgroundColor: option.color + '20' };
    };

    const getCategoryOptionStyle = (option) => {
        if (option.isGhost) {
            return {
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                border: '1px dashed var(--color-border-strong)',
            };
        }
        return { backgroundColor: option.color + '20' };
    };

    const getStatusOptionStyle = (option) => {
        const colors = {
            TODO: '#f59e0b',
            IN_PROGRESS: '#3b82f6',
            DONE: '#10b981',
        };
        return { backgroundColor: colors[option.value] + '20' };
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

    // Computed values
    const dueDateStatus = getDueDateStatus(isEditing || isCreateMode ? formData.due_date : fullTask?.due_date);
    const statusInfo = getStatusInfo(isEditing || isCreateMode ? formData.status : fullTask?.status);
    const priorityInfo = getPriorityInfo(isEditing || isCreateMode ? formData.priority : fullTask?.priority);

    return (
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
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                        </svg>
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
                            <Badge type="status" variant={statusInfo.className} color={statusInfo.color}>
                                {statusInfo.label}
                            </Badge>
                        </span>
                    )}
                </div>

                {/* Priority Row */}
                <div className="task-modal-property">
                    <span className="task-modal-property-label">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                            <line x1="4" y1="22" x2="4" y2="15"></line>
                        </svg>
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
                            <Badge type="priority" variant={priorityInfo.className}>
                                {priorityInfo.label}
                            </Badge>
                        </span>
                    )}
                </div>

                {/* Project Row */}
                <div className="task-modal-property">
                    <span className="task-modal-property-label">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
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
                                <Badge
                                    type="project"
                                    color={fullTask.project_color}
                                >
                                    📁 {fullTask?.project_name || fullTask?.project}
                                </Badge>
                            ) : (
                                <span className="badge-select-value">
                                    No Project
                                </span>
                            )}
                        </span>
                    )}
                </div>

                {/* Category Row */}
                <div className="task-modal-property">
                    <span className="task-modal-property-label">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="4" y1="9" x2="20" y2="9"></line>
                            <line x1="4" y1="15" x2="20" y2="15"></line>
                            <line x1="10" y1="3" x2="8" y2="21"></line>
                            <line x1="16" y1="3" x2="14" y2="21"></line>
                        </svg>
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
                                <Badge
                                    type="category"
                                    color={fullTask.category_color}
                                >
                                    {fullTask?.category_name || fullTask?.category}
                                </Badge>
                            ) : (
                                <span className="tm-category tm-category--empty">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="4" y1="9" x2="20" y2="9"></line>
                                        <line x1="4" y1="15" x2="20" y2="15"></line>
                                        <line x1="10" y1="3" x2="8" y2="21"></line>
                                        <line x1="16" y1="3" x2="14" y2="21"></line>
                                    </svg>
                                    No Category
                                </span>
                            )}
                        </span>
                    )}
                </div>

                {/* Due Date Row */}
                <div className="task-modal-property">
                    <span className="task-modal-property-label">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Due Date
                    </span>
                    {isEditing || isCreateMode ? (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                name="due_date"
                                value={formData.due_date ? dayjs(formData.due_date) : null}
                                onChange={(newValue) => {
                                    handleChange({
                                        target: {
                                            name: 'due_date',
                                            value: newValue ? newValue.format('YYYY-MM-DD') : ''
                                        }
                                    });
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
                                <Badge className={`tm-due-date ${dueDateStatus === 'overdue' ? 'tm-due-date--overdue' : dueDateStatus === 'due-soon' ? 'tm-due-date--due-soon' : ''}`} variant={fullTask.HIGH}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    {formatDate(fullTask?.due_date)}
                                </Badge>
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
                            <span>
                                {fullTask?.created_at ? new Date(fullTask.created_at).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                }) : 'Unknown'}
                            </span>
                        </div>
                        {fullTask?.updated_at && (
                            <div className="task-modal-meta-item">
                                <span className="task-modal-meta-label">Updated</span>
                                <span>
                                    {new Date(fullTask.updated_at).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
});

TaskModalSidebar.displayName = 'TaskModalSidebar';

export default TaskModalSidebar;