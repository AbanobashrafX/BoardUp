import React, { useState } from 'react';
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
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(null); // Track which project is being deleted

    // Form state
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectIcon, setNewProjectIcon] = useState('📋');
    const [newProjectColor, setNewProjectColor] = useState('#6366f1');

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

            // Reset form
            resetForm();
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
        setShowCreateForm(false);
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
        <div className="project-sidebar">
            {/* Header */}
            <div className="project-sidebar-header">
                <h3>Projects</h3>
                <button
                    className="project-add-btn"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    title="New Project"
                    aria-label="Create new project"
                >
                    +
                </button>
            </div>

            {/* Create Project Form */}
            {showCreateForm && (
                <div className="project-create-form">
                    <input
                        type="text"
                        placeholder="Project name..."
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isCreating && handleCreateProject()}
                        disabled={isCreating}
                        autoFocus
                        maxLength={50}
                    />

                    <div className="project-form-options">
                        {/* Icon Picker */}
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

                        {/* Color Picker */}
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
                    </div>

                    {/* Form Actions */}
                    <div className="project-form-actions">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={resetForm}
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
                            {isCreating ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </div>
            )}

            {/* Project List */}
            <div className="project-list">
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
        </div>
    );
}

export default ProjectSidebar;
