import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, lazy, memo } from 'react';
import ReactDOM from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { projectAPI } from '../../services/api';
import './CreateProjectModal.css';

const EmojiPicker = lazy(() => import('emoji-picker-react'));

// ============================================
// Constants
// ============================================
const DEFAULT_COLORS = Object.freeze(['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']);
const STORAGE_KEYS = Object.freeze({ icons: 'boardup-custom-icons', colors: 'boardup-custom-colors' });
const VALIDATION = Object.freeze({ name: { minLength: 1, maxLength: 50, pattern: /^[a-zA-Z0-9\s\-_]+$/ } });
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

// ============================================
// Custom Hooks
// ============================================

function useCustomOptions() {
    const [customIcons, setCustomIcons] = useState(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.icons) || '[]'); } catch { return []; } });
    const [customColors, setCustomColors] = useState(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.colors) || '[]'); } catch { return []; } });
    const saveOptions = useCallback((newIcons, newColors) => {
        try {
            if (newIcons?.length) { const u = [...new Set(newIcons)]; setCustomIcons(u); localStorage.setItem(STORAGE_KEYS.icons, JSON.stringify(u)); }
            if (newColors?.length) { const u = [...new Set(newColors)]; setCustomColors(u); localStorage.setItem(STORAGE_KEYS.colors, JSON.stringify(u)); }
        } catch (e) { console.warn('Failed to save custom options:', e); }
    }, []);
    const reloadOptions = useCallback(() => {
        setCustomIcons(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.icons) || '[]'); } catch { return []; } });
        setCustomColors(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.colors) || '[]'); } catch { return []; } });
    }, []);
    return { customIcons, customColors, saveOptions, reloadOptions };
}

function useFormValidation(projectName) {
    return useMemo(() => {
        const t = projectName.trim();
        const e = {};
        if (!t) e.name = 'Project name is required';
        else if (t.length > VALIDATION.name.maxLength) e.name = `Max ${VALIDATION.name.maxLength} characters`;
        else if (!VALIDATION.name.pattern.test(t)) e.name = 'Only letters, numbers, spaces, hyphens, underscores';
        return { isValid: !Object.keys(e).length, errors: e, isTouched: projectName.length > 0 };
    }, [projectName]);
}

function useFocusTrap(modalRef, isOpen, onClose) {
    const prev = useRef(null);
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;
        prev.current = document.activeElement;
        modalRef.current.querySelector(FOCUSABLE_SELECTOR)?.focus();
        const onKey = (e) => {
            if (e.key === 'Tab') {
                const els = Array.from(modalRef.current.querySelectorAll(FOCUSABLE_SELECTOR)).filter(el => !el.disabled && el.offsetParent);
                if (!els.length) return;
                if (e.shiftKey && document.activeElement === els[0]) { e.preventDefault(); els[els.length - 1].focus(); }
                else if (!e.shiftKey && document.activeElement === els[els.length - 1]) { e.preventDefault(); els[0].focus(); }
            }
            if (e.key === 'Escape' && !(e.target.tagName === 'INPUT' && e.target.type === 'text')) { e.preventDefault(); onClose?.(); }
        };
        document.addEventListener('keydown', onKey, true);
        return () => { document.removeEventListener('keydown', onKey, true); prev.current?.focus?.(); };
    }, [isOpen, modalRef, onClose]);
}

// ============================================
// Sub-components
// ============================================

const IconOption = memo(({ icon, isSelected, onSelect, disabled }) => (
    <button type="button" className={`icon-option ${isSelected ? 'selected' : ''}`} onClick={() => onSelect(icon)} disabled={disabled} aria-label={`Select ${icon}`} aria-pressed={isSelected}>{icon}</button>
));

const ColorOption = memo(({ color, isSelected, onSelect, disabled }) => (
    <button type="button" className={`color-option ${isSelected ? 'selected' : ''}`} style={{ backgroundColor: color }} onClick={() => onSelect(color)} disabled={disabled} aria-label={`Select ${color}`} aria-pressed={isSelected} />
));

// ============================================
// Main Component
// ============================================

export function CreateProjectModal({ isOpen, onClose, onSelectProject, refreshProjects }) {
    const { showSuccess, showError } = useToast();
    const { isDark } = useTheme();
    const { customIcons, customColors, saveOptions, reloadOptions } = useCustomOptions();
    const modalRef = useRef(null);
    const iconBtnRef = useRef(null);

    const [projectName, setProjectName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('📋');
    const [selectedColor, setSelectedColor] = useState('#6366f1');
    const [showEmoji, setShowEmoji] = useState(false);
    const [showColor, setShowColor] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [emojiPos, setEmojiPos] = useState(null);

    const pendingIcons = useRef(new Set());
    const pendingColors = useRef(new Set());
    const [ver, setVer] = useState(0);
    const bump = useCallback(() => setVer(v => v + 1), []);

    const validation = useFormValidation(projectName);
    useFocusTrap(modalRef, isOpen, onClose);

    useEffect(() => { if (isOpen) reloadOptions(); }, [isOpen, reloadOptions]);
    useEffect(() => {
        if (!isOpen) {
            setProjectName(''); setSelectedIcon('📋'); setSelectedColor('#6366f1');
            setShowEmoji(false); setShowColor(false); setEmojiPos(null);
            pendingIcons.current.clear(); pendingColors.current.clear();
            setIsCreating(false);
        }
    }, [isOpen]);

    // Close pickers on outside click
    useEffect(() => {
        if (!showEmoji && !showColor) return;
        const handler = (e) => {
            if (showEmoji && !e.target.closest('.emoji-picker-popup') && !e.target.closest('.project-identity-icon')) {
                e.stopPropagation(); setShowEmoji(false); setEmojiPos(null);
            }
            if (showColor && !e.target.closest('.color-picker-popup') && !e.target.closest('.color-option.add-custom-btn')) {
                e.stopPropagation(); setShowColor(false);
            }
        };
        const timer = setTimeout(() => document.addEventListener('mousedown', handler, true), 100);
        return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler, true); };
    }, [showEmoji, showColor]);

    const handleCreate = useCallback(async () => {
        if (!validation.isValid) return;
        setIsCreating(true);
        try {
            const project = await projectAPI.create({ name: projectName.trim(), icon: selectedIcon, color: selectedColor });
            const ni = Array.from(pendingIcons.current), nc = Array.from(pendingColors.current);
            if (ni.length || nc.length) saveOptions([...customIcons, ...ni], [...customColors, ...nc]);
            await refreshProjects();
            onSelectProject?.(project);
            showSuccess(`Project "${project.name}" created!`);
            onClose();
        } catch (err) { showError(err?.response?.data?.message || 'Failed to create project.'); }
        finally { setIsCreating(false); }
    }, [projectName, selectedIcon, selectedColor, validation.isValid, customIcons, customColors, refreshProjects, onSelectProject, showSuccess, showError, onClose, saveOptions]);

    const onEmojiSelect = useCallback((data) => {
        pendingIcons.current.add(data.emoji);
        setSelectedIcon(data.emoji);
        setShowEmoji(false); setEmojiPos(null);
        bump();
    }, [bump]);

    const onColorApply = useCallback(() => {
        pendingColors.current.add(selectedColor);
        setShowColor(false);
        bump();
    }, [selectedColor, bump]);

    const toggleEmoji = useCallback(() => {
        if (showEmoji) { setShowEmoji(false); setEmojiPos(null); return; }
        setShowColor(false);
        requestAnimationFrame(() => {
            const rect = iconBtnRef.current?.getBoundingClientRect();
            if (rect) setEmojiPos({ top: rect.bottom + 8, left: rect.left });
        });
        setShowEmoji(true);
    }, [showEmoji]);

    const allColors = useMemo(() => [...new Set([...DEFAULT_COLORS, ...customColors, ...pendingColors.current])], [customColors, ver]);

    if (!isOpen) return null;

    return (
        <>
            <div className="project-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div className="project-modal" onClick={(e) => e.stopPropagation()} ref={modalRef}>
                    <div className="project-modal-header">
                        <h2 id="modal-title">Create New Project</h2>
                        <button className="project-modal-close" onClick={onClose} disabled={isCreating} aria-label="Close">×</button>
                    </div>

                    <div className="project-modal-form" onKeyDown={(e) => { if (e.key === 'Enter' && !isCreating && validation.isValid) { e.preventDefault(); handleCreate(); } }}>
                        {/* Project Identity */}
                        <div className="form-field">
                            <label className="form-field__label">Project Identity</label>
                            <div className="project-identity-card">
                                <button type="button" ref={iconBtnRef} className="project-identity-icon" style={{ backgroundColor: selectedColor + '20' }} onClick={toggleEmoji} aria-label="Change icon" aria-expanded={showEmoji}>
                                    {selectedIcon}
                                </button>
                                <input type="text" className="project-identity-name" placeholder="Project name..." value={projectName} onChange={(e) => setProjectName(e.target.value)} disabled={isCreating} autoFocus maxLength={VALIDATION.name.maxLength} />
                            </div>
                            {validation.isTouched && validation.errors.name && <span className="form-field__error" role="alert">{validation.errors.name}</span>}
                        </div>

                        {/* Color Picker */}
                        <div className="form-field">
                            <label className="form-field__label">Choose a Color</label>
                            <div className="color-picker" role="radiogroup" aria-label="Project color">
                                {allColors.map((c) => <ColorOption key={c} color={c} isSelected={selectedColor === c} onSelect={setSelectedColor} disabled={isCreating} />)}
                                <button type="button" className={`color-option add-custom-btn ${showColor ? 'active' : ''}`} onClick={() => { setShowColor(!showColor); setShowEmoji(false); }} aria-expanded={showColor} aria-label="Custom color">+</button>
                            </div>
                            {showColor && (
                                <div className="color-picker-popup">
                                    <div className="color-picker-controls">
                                        <input type="color" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} className="native-color-input" autoFocus />
                                        <span className="color-picker-value">{selectedColor}</span>
                                        <div className="color-picker-actions">
                                            <button type="button" className="color-picker-apply" onClick={onColorApply}>Apply</button>
                                            <button type="button" className="color-picker-cancel" onClick={() => setShowColor(false)}>Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="project-modal-actions">
                            <button type="button" className="cancel-btn" onClick={onClose} disabled={isCreating}>Cancel</button>
                            <button type="button" className="create-btn" onClick={handleCreate} disabled={isCreating || !validation.isValid} aria-busy={isCreating}>
                                {isCreating ? <><span className="spinner" aria-hidden="true" />Creating...</> : 'Create Project'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Emoji Picker Portal - renders outside modal DOM tree */}
            {showEmoji && emojiPos && ReactDOM.createPortal(
                <div className="emoji-picker-popup" style={{ top: emojiPos.top, left: emojiPos.left }}>
                    <Suspense fallback={<div className="picker-loading">Loading...</div>}>
                        <EmojiPicker onEmojiClick={onEmojiSelect} width="100%" height="350px" searchDisabled={false} skinTonesDisabled={true} theme={isDark ? 'dark' : 'light'} />
                    </Suspense>
                </div>,
                document.body
            )}
        </>
    );
}

export default CreateProjectModal;