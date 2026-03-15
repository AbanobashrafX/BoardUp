import React, { useState, useRef, useEffect } from 'react';
import './MultiFilter.css';

const PRIORITIES = [
    { value: 'LOW', label: 'Low', color: '#10b981' },
    { value: 'MEDIUM', label: 'Medium', color: '#3b82f6' },
    { value: 'HIGH', label: 'High', color: '#f59e0b' },
    { value: 'URGENT', label: 'Urgent', color: '#ef4444' },
];

const SORT_OPTIONS = [
    { value: '', label: 'Manual' },
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

    // Toggle category filter
    const handleCategoryToggle = (categoryId) => {
        const current = filters.categories || [];
        const updated = current.includes(categoryId)
            ? current.filter(id => id !== categoryId)
            : [...current, categoryId];
        onFilterChange({ ...filters, categories: updated });
    };

    // Toggle priority filter
    const handlePriorityToggle = (priority) => {
        const current = filters.priorities || [];
        const updated = current.includes(priority)
            ? current.filter(p => p !== priority)
            : [...current, priority];
        onFilterChange({ ...filters, priorities: updated });
    };

    // Get category name by ID
    const getCategoryName = (id) => {
        const cat = categories.find(c => c.id === id);
        return cat ? cat.name : '';
    };

    // Clear all (filters and sort)
    const clearAllFilters = () => {
        onFilterChange({ categories: [], priorities: [] });
        onSortChange('');
    };

    const hasFilters = (filters.categories?.length > 0) || (filters.priorities?.length > 0);
    const hasSort = sortBy && sortBy !== '';
    const hasActive = hasFilters || hasSort;

    return (
        <div className="filter-component" ref={containerRef}>
            {/* Filter Button */}
            <button
                className={`filter-main-btn ${hasActive ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                </svg>
                <span>Filter</span>
                {hasActive && (
                    <span className="filter-count">
                        {(filters.categories?.length || 0) + (filters.priorities?.length || 0) + (hasSort ? 1 : 0)}
                    </span>
                )}
            </button>

            {/* Popover */}
            {isOpen && (
                <div className="filter-popover">
                    {/* Sort Section */}
                    <div className="filter-section">
                        <div className="filter-title">Sort</div>
                        <div className="filter-badges">
                            {SORT_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    className={`filter-badge ${sortBy === option.value ? 'selected' : ''}`}
                                    onClick={() => onSortChange(option.value)}
                                    aria-pressed={sortBy === option.value}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            onSortChange(option.value);
                                        }
                                    }}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Priority */}
                    <div className="filter-section">
                        <div className="filter-title">Priority</div>
                        <div className="filter-badges">
                            {PRIORITIES.map((priority) => (
                                <button
                                    key={priority.value}
                                    className={`filter-badge ${filters.priorities?.includes(priority.value) ? 'selected' : ''}`}
                                    style={{
                                        '--badge-color': priority.color,
                                        color: filters.priorities?.includes(priority.value) ? priority.color : undefined,
                                        borderColor: filters.priorities?.includes(priority.value) ? priority.color : undefined,
                                    }}
                                    onClick={() => handlePriorityToggle(priority.value)}
                                    aria-pressed={filters.priorities?.includes(priority.value)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handlePriorityToggle(priority.value);
                                        }
                                    }}
                                >
                                    {priority.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category */}
                    <div className="filter-section">
                        <div className="filter-title">Category</div>
                        <div className="filter-badges">
                            {categories.length === 0 ? (
                                <span className="filter-empty">No categories</span>
                            ) : (
                                categories.map((category) => (
                                    <button
                                        key={category.id}
                                        className={`filter-badge ${filters.categories?.includes(category.id) ? 'selected' : ''}`}
                                        onClick={() => handleCategoryToggle(category.id)}
                                        aria-pressed={filters.categories?.includes(category.id)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleCategoryToggle(category.id);
                                            }
                                        }}
                                    >
                                        {category.name}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Clear */}
                    {hasActive && (
                        <button className="filter-clear" onClick={clearAllFilters}>
                            Clear all
                        </button>
                    )}
                </div>
            )}

            {/* Filter Tags - Circular Buttons */}
            {hasActive && (
                <div className="filter-tags">
                    {hasSort && (
                        <button
                            className="filter-tag sort-tag"
                            onClick={() => onSortChange('')}
                            title="Clear sort"
                            aria-label="Clear sort"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onSortChange('');
                                }
                            }}
                        >
                            ↓
                        </button>
                    )}
                    {filters.categories?.map((catId) => (
                        <button
                            key={`cat-${catId}`}
                            className="filter-tag"
                            onClick={() => handleCategoryToggle(catId)}
                            title="Remove category filter"
                            aria-label={`Remove ${getCategoryName(catId)} filter`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleCategoryToggle(catId);
                                }
                            }}
                        >
                            Cat
                        </button>
                    ))}
                    {filters.priorities?.map((priority) => (
                        <button
                            key={`prio-${priority}`}
                            className="filter-tag"
                            onClick={() => handlePriorityToggle(priority)}
                            title="Remove priority filter"
                            aria-label={`Remove ${priority} priority filter`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handlePriorityToggle(priority);
                                }
                            }}
                            style={{ borderColor: PRIORITIES.find(p => p.value === priority)?.color, color: PRIORITIES.find(p => p.value === priority)?.color }}
                        >
                            Prio
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MultiFilter;
