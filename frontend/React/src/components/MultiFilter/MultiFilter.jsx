import React, { useState, useRef, useEffect } from 'react';
import './MultiFilter.css';

const PRIORITIES = [
    { value: 'LOW', label: 'Low', color: '#10b981' },
    { value: 'MEDIUM', label: 'Medium', color: '#3b82f6' },
    { value: 'HIGH', label: 'High', color: '#f59e0b' },
    { value: 'URGENT', label: 'Urgent', color: '#ef4444' },
];

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'priority-high', label: 'Priority (High to Low)' },
    { value: 'priority-low', label: 'Priority (Low to High)' },
    { value: 'alphabetical', label: 'A-Z' },
];

function MultiFilter({ categories, filters, onFilterChange, sortBy, onSortChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Category handlers
    const handleCategoryToggle = (categoryId) => {
        const current = filters.categories || [];
        const updated = current.includes(categoryId)
            ? current.filter(id => id !== categoryId)
            : [...current, categoryId];
        onFilterChange({ ...filters, categories: updated });
    };

    // Priority handlers
    const handlePriorityToggle = (priority) => {
        const current = filters.priorities || [];
        const updated = current.includes(priority)
            ? current.filter(p => p !== priority)
            : [...current, priority];
        onFilterChange({ ...filters, priorities: updated });
    };

    // Remove single filter
    const removeFilter = (type, value) => {
        if (type === 'category') {
            handleCategoryToggle(value);
        } else if (type === 'priority') {
            handlePriorityToggle(value);
        }
    };

    // Clear all filters
    const clearAllFilters = () => {
        onFilterChange({ categories: [], priorities: [] });
    };

    const getCategoryName = (id) => {
        const cat = categories.find(c => c.id === id);
        return cat ? cat.name : '';
    };

    const getSelectedSortLabel = () => {
        const option = SORT_OPTIONS.find(o => o.value === sortBy);
        return option ? option.label : 'Sort';
    };

    const hasFilters = (filters.categories?.length > 0) || (filters.priorities?.length > 0);
    const totalFilterCount = (filters.categories?.length || 0) + (filters.priorities?.length || 0);

    return (
        <div className="filters-container" ref={containerRef}>
            {/* Main Filters Button */}
            <button
                className={`filters-button ${hasFilters || sortBy !== 'newest' ? 'filters-button-active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                </svg>
                <span>Filters</span>
                {totalFilterCount > 0 && (
                    <span className="filters-count">{totalFilterCount}</span>
                )}
                <svg
                    className={`filters-chevron ${isOpen ? 'filters-chevron-open' : ''}`}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {/* Popover */}
            {isOpen && (
                <div className="filters-popover">
                    {/* Sort Section */}
                    <div className="filters-section">
                        <div className="filters-section-title">Sort by</div>
                        <div className="filters-sort-options">
                            {SORT_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    className={`filters-sort-option ${sortBy === option.value ? 'filters-sort-option-active' : ''}`}
                                    onClick={() => onSortChange(option.value)}
                                >
                                    <span>{option.label}</span>
                                    {sortBy === option.value && (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 6 9 17l-5-5" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filters-divider"></div>

                    {/* Category Section */}
                    <div className="filters-section">
                        <div className="filters-section-title">Filter by Category</div>
                        <div className="filters-options">
                            {categories.length === 0 ? (
                                <div className="filters-empty">No categories available</div>
                            ) : (
                                categories.map((category) => (
                                    <label key={category.id} className="filters-option">
                                        <input
                                            type="checkbox"
                                            checked={filters.categories?.includes(category.id) || false}
                                            onChange={() => handleCategoryToggle(category.id)}
                                        />
                                        <span>{category.name}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="filters-divider"></div>

                    {/* Priority Section */}
                    <div className="filters-section">
                        <div className="filters-section-title">Filter by Priority</div>
                        <div className="filters-options">
                            {PRIORITIES.map((priority) => (
                                <label key={priority.value} className="filters-option">
                                    <input
                                        type="checkbox"
                                        checked={filters.priorities?.includes(priority.value) || false}
                                        onChange={() => handlePriorityToggle(priority.value)}
                                    />
                                    <span style={{ color: priority.color }}>{priority.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    {hasFilters && (
                        <>
                            <div className="filters-divider"></div>
                            <div className="filters-actions">
                                <button className="filters-clear" onClick={clearAllFilters}>
                                    Clear all
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Selected Filters as Tags */}
            {hasFilters && (
                <div className="filters-tags">
                    {filters.categories?.map((catId) => (
                        <span key={`cat-${catId}`} className="filters-tag">
                            <span>{getCategoryName(catId)}</span>
                            <button
                                className="filters-tag-remove"
                                onClick={() => removeFilter('category', catId)}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </span>
                    ))}
                    {filters.priorities?.map((priority) => (
                        <span
                            key={`prio-${priority}`}
                            className="filters-tag filters-tag-priority"
                            style={{
                                borderColor: PRIORITIES.find(p => p.value === priority)?.color,
                                color: PRIORITIES.find(p => p.value === priority)?.color
                            }}
                        >
                            <span>{PRIORITIES.find(p => p.value === priority)?.label}</span>
                            <button
                                className="filters-tag-remove"
                                onClick={() => removeFilter('priority', priority)}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MultiFilter;
