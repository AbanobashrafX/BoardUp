import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { projectAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import './ProjectSidebar.css';

// Icon and color options for project creation
const PROJECT_ICONS = ['📋', '🏠', '💼', '📚', '🎯', '🚀', '💡', '🎨', '🔧', '📞', '✈️', '🎮'];
const PROJECT_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

/**
 * ProjectSidebar Component
 * 
 * Displays a list of projects and allows creating/deleting them.
 * Uses DataContext for project state management.
 */
function ProjectSidebar({ selectedProject, onSelectProject }) {
    // Get projects from DataContext
    const { projects, refreshProjects } = useData();
    const { showSuccess, showError } = useToast();

    // Local state for UI
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(null); // Track which project is being deleted
    const [isCollapsed, setIsCollapsed] = useState(false); // Track sidebar collapsed state

    // Form state
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectIcon, setNewProjectIcon] = useState('📋');
    const [newProjectColor, setNewProjectColor] = useState('#6366f1');

    // Close modal on escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && showCreateModal) {
                setShowCreateModal(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showCreateModal]);

    /**
     * Calculate total tasks across all projects for "All Tasks" display
     * Now uses all_tasks_count from API (includes unassigned tasks)
     */
    const getAllTasksCount = () => {
        // Use all_tasks_count from first project (it's the same for all)
        if (projects && projects.length > 0 && projects[0].all_tasks_count !== undefined) {
            return projects[0].all_tasks_count;
        }
        // Fallback to manual calculation
        if (!projects || projects.length === 0) return 0;
        return projects.reduce((sum, project) => {
            return sum + (project.total_tasks_count || 0);
        }, 0);
    };

    /**
     * Handle creating a new project
     */
    const handleCreateProject = async () => {
        // Validate input
        if (!newProjectName.trim()) {
            showError('Please enter a project name');
            return;
        }

        setIsCreating(true);

        try {
            // Create project via API
            const createdProject = await projectAPI.create({
                name: newProjectName.trim(),
                icon: newProjectIcon,
                color: newProjectColor,
            });

            // Refresh projects list
            await refreshProjects();

            // Select the newly created project
            onSelectProject(createdProject);
            showSuccess(`Project "${createdProject.name}" created!`);

            // Reset form and close modal
            resetForm();
            setShowCreateModal(false);
        } catch (error) {
            console.error('Error creating project:', error);
            showError('Failed to create project. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    /**
     * Handle deleting a project
     */
    const handleDeleteProject = async (e, projectId) => {
        e.stopPropagation();

        // Confirm deletion
        if (!confirm('Are you sure you want to delete this project? All tasks in this project will also be deleted.')) {
            return;
        }

        setIsDeleting(projectId);

        try {
            // Delete via API
            await projectAPI.delete(projectId);

            // Refresh projects
            await refreshProjects();

            // Clear selection if this project was selected
            if (selectedProject?.id === projectId) {
                onSelectProject(null);
            }

            showSuccess('Project deleted');
        } catch (error) {
            console.error('Error deleting project:', error);
            showError('Failed to delete project. Please try again.');

            // Still clear selection on error
            if (selectedProject?.id === projectId) {
                onSelectProject(null);
            }
        } finally {
            setIsDeleting(null);
        }
    };

    /**
     * Reset form state
     */
    const resetForm = () => {
        setNewProjectName('');
        setNewProjectIcon('📋');
        setNewProjectColor('#6366f1');
        setShowCreateModal(false);
    };

    /**
     * Handle clicking on a project
     */
    const handleProjectClick = (project) => {
        onSelectProject(project);
    };

    /**
     * Handle clicking on "All Tasks"
     */
    const handleAllTasksClick = () => {
        onSelectProject(null);
    };

    return (
        <div className={`project-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Header with toggle button */}
            <div className="project-sidebar-header">
                {!isCollapsed && <h3>Projects</h3>}
                <button
                    className="sidebar-toggle-btn"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {isCollapsed ? (
                            <path d="M9 18l6-6-6-6" />
                        ) : (
                            <path d="M15 18l-6-6 6-6" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Project List */}
            {!isCollapsed ? (
                <div className="project-list">
                    {/* Add Project Button - visible when expanded */}
                    <button
                        className="project-add-btn"
                        onClick={() => setShowCreateModal(true)}
                        title="New Project"
                        aria-label="Create new project"
                    >
                        + New Project
                    </button>
                    {/* All Tasks */}
                    <div
                        className={`project-item ${!selectedProject ? 'active' : ''}`}
                        onClick={handleAllTasksClick}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleAllTasksClick()}
                    >
                        <span className="project-icon">📋</span>
                        <span className="project-name">All Tasks</span>
                        <span className="project-count">{getAllTasksCount()}</span>
                    </div>

                    {/* Individual Projects */}
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className={`project-item ${selectedProject?.id === project.id ? 'active' : ''}`}
                            onClick={() => handleProjectClick(project)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleProjectClick(project)}
                        >
                            <span
                                className="project-icon"
                                style={{ backgroundColor: project.color + '20' }}
                            >
                                {project.icon}
                            </span>
                            <span className="project-name">{project.name}</span>
                            <span className="project-count">
                                {project.total_tasks_count || 0}
                            </span>

                            {/* Delete Button */}
                            <button
                                className="project-delete-btn"
                                onClick={(e) => handleDeleteProject(e, project.id)}
                                disabled={isDeleting === project.id}
                                title="Delete project"
                                aria-label={`Delete ${project.name}`}
                            >
                                {isDeleting === project.id ? '...' : '×'}
                            </button>
                        </div>
                    ))}

                    {/* Empty State */}
                    {projects.length === 0 && (
                        <div className="project-empty">
                            No projects yet. Create one to get started!
                        </div>
                    )}
                </div>
            ) : (
                /* Collapsed view - just show icons */
                <div className="project-list-collapsed">
                    <button
                        className="project-add-btn"
                        onClick={() => setShowCreateModal(true)}
                        title="New Project"
                        aria-label="Create new project"
                    >
                        +
                    </button>
                    <div
                        className={`project-item-collapsed ${!selectedProject ? 'active' : ''}`}
                        onClick={handleAllTasksClick}
                        title="All Tasks"
                        role="button"
                        tabIndex={0}
                    >
                        <span className="project-icon">📋</span>
                    </div>
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className={`project-item-collapsed ${selectedProject?.id === project.id ? 'active' : ''}`}
                            onClick={() => handleProjectClick(project)}
                            title={project.name}
                            role="button"
                            tabIndex={0}
                        >
                            <span
                                className="project-icon"
                                style={{ backgroundColor: project.color + '20' }}
                            >
                                {project.icon}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Project Modal */}
            {showCreateModal && (
                <div className="project-modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="project-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="project-modal-header">
                            <h2>Create New Project</h2>
                            <button
                                className="project-modal-close"
                                onClick={() => setShowCreateModal(false)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <div className="project-modal-form">
                            <label>Project Name</label>
                            <input
                                type="text"
                                placeholder="Enter project name..."
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !isCreating && newProjectName.trim() && handleCreateProject()}
                                disabled={isCreating}
                                autoFocus
                                maxLength={50}
                            />

                            <label>Choose an Icon</label>
                            <div className="icon-picker">
                                {PROJECT_ICONS.map((icon) => (
                                    <button
                                        key={icon}
                                        type="button"
                                        className={`icon-option ${newProjectIcon === icon ? 'selected' : ''}`}
                                        onClick={() => setNewProjectIcon(icon)}
                                        disabled={isCreating}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>

                            <label>Choose a Color</label>
                            <div className="color-picker">
                                {PROJECT_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`color-option ${newProjectColor === color ? 'selected' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setNewProjectColor(color)}
                                        disabled={isCreating}
                                    />
                                ))}
                            </div>

                            <div className="project-modal-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => {
                                        resetForm();
                                        setShowCreateModal(false);
                                    }}
                                    disabled={isCreating}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="create-btn"
                                    onClick={handleCreateProject}
                                    disabled={isCreating || !newProjectName.trim()}
                                >
                                    {isCreating ? 'Creating...' : 'Create Project'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProjectSidebar;
