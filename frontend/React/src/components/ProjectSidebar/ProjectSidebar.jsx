import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { projectAPI } from '../../services/api';
import './ProjectSidebar.css';

const SAMPLE_PROJECTS = [
];

const PROJECT_ICONS = ['📋', '🏠', '💼', '📚', '🎯', '🚀', '💡', '🎨', '🔧', '📞', '✈️', '🎮'];
const PROJECT_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function ProjectSidebar({ selectedProject, onSelectProject }) {
    const { projects } = useData();
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectIcon, setNewProjectIcon] = useState('📋');
    const [newProjectColor, setNewProjectColor] = useState('#6366f1');

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return;

        try {
            const newProject = await projectAPI.create({
                name: newProjectName,
                icon: newProjectIcon,
                color: newProjectColor,
            });
            onSelectProject(newProject);
        } catch (error) {
            const demoProject = {
                id: Date.now(),
                name: newProjectName,
                icon: newProjectIcon,
                color: newProjectColor,
                tasks_count: 0,
                completed_tasks_count: 0,
            };
            onSelectProject(demoProject);
        }
        setNewProjectName('');
        setShowCreateForm(false);
    };

    const handleDeleteProject = async (e, projectId) => {
        e.stopPropagation();
        if (!confirm('Delete this project?')) return;

        try {
            await projectAPI.delete(projectId);
            if (selectedProject?.id === projectId) {
                onSelectProject(null);
            }
        } catch (error) {
            if (selectedProject?.id === projectId) {
                onSelectProject(null);
            }
        }
    };

    return (
        <div className="project-sidebar">
            <div className="project-sidebar-header">
                <h3>Projects</h3>
                <button
                    className="project-add-btn"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    title="New Project"
                >
                    +
                </button>
            </div>

            {showCreateForm && (
                <div className="project-create-form">
                    <input
                        type="text"
                        placeholder="Project name..."
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                        autoFocus
                    />
                    <div className="project-form-options">
                        <div className="icon-picker">
                            {PROJECT_ICONS.map(icon => (
                                <button
                                    key={icon}
                                    className={`icon-option ${newProjectIcon === icon ? 'selected' : ''}`}
                                    onClick={() => setNewProjectIcon(icon)}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                        <div className="color-picker">
                            {PROJECT_COLORS.map(color => (
                                <button
                                    key={color}
                                    className={`color-option ${newProjectColor === color ? 'selected' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setNewProjectColor(color)}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="project-form-actions">
                        <button className="cancel-btn" onClick={() => setShowCreateForm(false)}>
                            Cancel
                        </button>
                        <button className="create-btn" onClick={handleCreateProject}>
                            Create
                        </button>
                    </div>
                </div>
            )}

            <div className="project-list">
                <div
                    className={`project-item ${!selectedProject ? 'active' : ''}`}
                    onClick={() => onSelectProject(null)}
                >
                    <span className="project-icon">📋</span>
                    <span className="project-name">All Tasks</span>
                    <span className="project-count">
                        {projects.reduce((acc, p) => acc + (p.tasks_count || 0), 0)}
                    </span>
                </div>

                {projects.map(project => (
                    <div
                        key={project.id}
                        className={`project-item ${selectedProject?.id === project.id ? 'active' : ''}`}
                        onClick={() => onSelectProject(project)}
                    >
                        <span className="project-icon" style={{ backgroundColor: project.color + '20' }}>
                            {project.icon}
                        </span>
                        <span className="project-name">{project.name}</span>
                        <span className="project-count">
                            {project.completed_tasks_count || 0}/{project.tasks_count || 0}
                        </span>
                        <button
                            className="project-delete-btn"
                            onClick={(e) => handleDeleteProject(e, project.id)}
                            title="Delete project"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ProjectSidebar;
