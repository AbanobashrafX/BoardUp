import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { projectAPI } from '../../services/api';
import './CreateProjectModal.css';

// Default icons and colors
const DEFAULT_ICONS = ['📋', '🏠', '💼', '📚', '🎯', '🚀', '💡', '🎨', '🔧', '📞', '✈️', '🎮'];
const DEFAULT_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const STORAGE_KEYS = {
    icons: 'boardup-custom-icons',
    colors: 'boardup-custom-colors',
};

/**
 * CreateProjectModal Component
 * 
 * A separate modal for creating new projects.
 * Supports default + custom icons and colors.
 */
export function CreateProjectModal({ isOpen, onClose, onCreated, onSelectProject, refreshProjects }) {
    const { showSuccess, showError } = useToast();

    const [isCreating, setIsCreating] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('📋');
    const [selectedColor, setSelectedColor] = useState('#6366f1');

    // Custom options stored in localStorage
    const [customIcons, setCustomIcons] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEYS.icons);
        return stored ? JSON.parse(stored) : [];
    });

    const [customColors, setCustomColors] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEYS.colors);
        return stored ? JSON.parse(stored) : [];
    });

    // Show emoji picker or color picker
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Emoji input for custom emoji
    const [emojiInput, setEmojiInput] = useState('');

    // Reset form when modal opens/closes
    React.useEffect(() => {
        if (!isOpen) {
            setProjectName('');
            setSelectedIcon('📋');
            setSelectedColor('#6366f1');
            setShowEmojiPicker(false);
            setShowColorPicker(false);
            setEmojiInput('');
        }
    }, [isOpen]);

    const handleCreate = async () => {
        if (!projectName.trim()) {
            showError('Please enter a project name');
            return;
        }

        setIsCreating(true);

        try {
            const createdProject = await projectAPI.create({
                name: projectName.trim(),
                icon: selectedIcon,
                color: selectedColor,
            });

            await refreshProjects();
            onSelectProject?.(createdProject);
            showSuccess(`Project "${createdProject.name}" created!`);
            onClose();
            onCreated?.(createdProject);
        } catch (error) {
            console.error('Error creating project:', error);
            showError('Failed to create project. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleAddCustomEmoji = () => {
        if (emojiInput.trim()) {
            // Get the first emoji from input
            const emoji = emojiInput.trim().charAt(0);
            if (emoji && !customIcons.includes(emoji)) {
                const newIcons = [...customIcons, emoji];
                setCustomIcons(newIcons);
                localStorage.setItem(STORAGE_KEYS.icons, JSON.stringify(newIcons));
                setSelectedIcon(emoji);
            }
            setEmojiInput('');
            setShowEmojiPicker(false);
        }
    };

    const handleAddCustomColor = (color) => {
        if (!customColors.includes(color)) {
            const newColors = [...customColors, color];
            setCustomColors(newColors);
            localStorage.setItem(STORAGE_KEYS.colors, JSON.stringify(newColors));
            setSelectedColor(color);
        }
        setShowColorPicker(false);
    };

    if (!isOpen) return null;

    return (
        <div className="project-modal-overlay" onClick={onClose}>
            <div className="project-modal" onClick={(e) => e.stopPropagation()}>
                <div className="project-modal-header">
                    <h2>Create New Project</h2>
                    <button
                        className="project-modal-close"
                        onClick={onClose}
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
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isCreating && projectName.trim() && handleCreate()}
                        disabled={isCreating}
                        autoFocus
                        maxLength={50}
                    />

                    <label>Choose an Icon</label>
                    <div className="icon-picker">
                        {/* Default icons */}
                        {DEFAULT_ICONS.map((icon) => (
                            <button
                                key={icon}
                                type="button"
                                className={`icon-option ${selectedIcon === icon ? 'selected' : ''}`}
                                onClick={() => setSelectedIcon(icon)}
                                disabled={isCreating}
                            >
                                {icon}
                            </button>
                        ))}

                        {/* Custom icons */}
                        {customIcons.map((icon) => (
                            <button
                                key={icon}
                                type="button"
                                className={`icon-option ${selectedIcon === icon ? 'selected' : ''}`}
                                onClick={() => setSelectedIcon(icon)}
                                disabled={isCreating}
                            >
                                {icon}
                            </button>
                        ))}

                        {/* Add custom emoji button */}
                        <button
                            type="button"
                            className="icon-option add-custom-btn"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            title="Add custom emoji"
                        >
                            +
                        </button>
                    </div>

                    {/* Emoji picker popup */}
                    {showEmojiPicker && (
                        <div className="emoji-picker-popup">
                            <input
                                type="text"
                                placeholder="Type emoji here..."
                                value={emojiInput}
                                onChange={(e) => setEmojiInput(e.target.value)}
                                className="emoji-input"
                                maxLength={10}
                            />
                            {emojiInput.trim() && (
                                <button
                                    type="button"
                                    className="add-emoji-btn"
                                    onClick={handleAddCustomEmoji}
                                >
                                    Add {emojiInput.trim().charAt(0)}
                                </button>
                            )}
                        </div>
                    )}

                    <label>Choose a Color</label>
                    <div className="color-picker">
                        {/* Default colors */}
                        {DEFAULT_COLORS.map((color) => (
                            <button
                                key={color}
                                type="button"
                                className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setSelectedColor(color)}
                                disabled={isCreating}
                            />
                        ))}

                        {/* Custom colors */}
                        {customColors.map((color) => (
                            <button
                                key={color}
                                type="button"
                                className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setSelectedColor(color)}
                                disabled={isCreating}
                            />
                        ))}

                        {/* Add custom color button */}
                        <button
                            type="button"
                            className="color-option add-custom-btn"
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            title="Add custom color"
                        >
                            +
                        </button>
                    </div>

                    {/* Color picker popup */}
                    {showColorPicker && (
                        <div className="color-picker-popup">
                            <input
                                type="color"
                                value={selectedColor}
                                onChange={(e) => handleAddCustomColor(e.target.value)}
                                className="color-input"
                            />
                            <span className="color-preview">{selectedColor}</span>
                        </div>
                    )}

                    <div className="project-modal-actions">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={onClose}
                            disabled={isCreating}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="create-btn"
                            onClick={handleCreate}
                            disabled={isCreating || !projectName.trim()}
                        >
                            {isCreating ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateProjectModal;