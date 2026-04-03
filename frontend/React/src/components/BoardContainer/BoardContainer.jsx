import React, { useState, useRef, useEffect, useCallback } from 'react';
import KanbanBoard from '../KanbanBoard/KanbanBoard';
import CalendarBoard from '../CalendarBoard/CalendarBoard';
import MultiFilter from '../MultiFilter/MultiFilter';
import TaskModal from '../TaskModal/TaskModal';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import './BoardContainer.css';

const SAMPLE_CATEGORIES = [];
const SAMPLE_PROJECTS = [];

function BoardContainer({
  selectedProject = null,
  projectName: propProjectName = 'All Tasks'
}) {
  // Get shared data from context
  const { categories, projects, refreshProjects } = useData();
  const { toggleTheme } = useTheme();

  // Board state - search/filter managed internally
  const [viewMode, setViewMode] = useState('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState({ categories: [], priorities: [] });
  const [sortBy, setSortBy] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);

  const searchInputRef = useRef(null);

  // Project name from prop or selectedProject
  const projectName = propProjectName || (selectedProject ? selectedProject.name : 'All Tasks');

  // Handle keyboard shortcuts
  const handleKeyboardShortcut = useCallback((event) => {
    const { action, status } = event.detail;

    switch (action) {
      case 'newTask':
        setShowTaskModal(true);
        break;
      case 'search':
        searchInputRef.current?.focus();
        break;
      case 'toggleTheme':
        toggleTheme();
        break;
      case 'clearFilters':
        setSearchQuery('');
        setFilter({ categories: [], priorities: [] });
        setSortBy('');
        break;
      case 'statusFilter':
        setFilter(prev => ({
          ...prev,
          priorities: prev.priorities?.includes(status)
            ? prev.priorities.filter(p => p !== status)
            : [...(prev.priorities || []), status]
        }));
        break;
      default:
        break;
    }
  }, [toggleTheme]);

  useEffect(() => {
    window.addEventListener('keyboard-shortcut', handleKeyboardShortcut);
    return () => window.removeEventListener('keyboard-shortcut', handleKeyboardShortcut);
  }, [handleKeyboardShortcut]);

  return (
    <div className="board-container">
      {/* Header with controls */}
      <div className="board-header">
        <div className="board-header-left">
          <h2>{projectName}</h2>
        </div>

        <div className="board-controls">
          {/* Search */}
          <div className="search">
            <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <form onSubmit={(e) => e.preventDefault()}>
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                placeholder="Search... (f)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>

          <div className="filter-divider"></div>

          {/* View Toggle */}
          <div className="view-toggle-inline">
            <button
              className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Kanban View"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="5" height="18" rx="1" />
                <rect x="10" y="3" width="5" height="12" rx="1" />
                <rect x="17" y="3" width="5" height="15" rx="1" />
              </svg>
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
              title="Calendar View"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </button>
          </div>

          <div className="filter-divider"></div>

          {/* MultiFilter */}
          {categories && categories.length > 0 && (
            <MultiFilter
              categories={categories}
              filters={filter || {}}
              onFilterChange={setFilter}
              sortBy={sortBy || ''}
              onSortChange={setSortBy}
            />
          )}

          {/* New Button */}
          <button className="new-btn" onClick={() => setShowTaskModal(true)}>
            New Task
          </button>
        </div>
      </div>

      {/* Board Body - renders based on viewMode */}
      <div className="board-body">
        {viewMode === 'kanban' ? (
          <KanbanBoard
            selectedProject={selectedProject}
            searchQuery={searchQuery}
            filter={filter}
            sortBy={sortBy}
            categories={categories}
            projects={projects}
            onProjectsRefresh={refreshProjects}
          />
        ) : (
          <CalendarBoard
            selectedProject={selectedProject}
            searchQuery={searchQuery}
            categories={categories}
            projects={projects}
          />
        )}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          mode="create"
          categories={categories}
          projects={projects}
          preselectedProject={selectedProject}
          onClose={() => setShowTaskModal(false)}
        />
      )}
    </div>
  );
}

export default BoardContainer;
