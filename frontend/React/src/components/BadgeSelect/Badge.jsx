import React from 'react';
import PropTypes from 'prop-types';
import './BadgeSelect.css';

/**
 * Universal Badge component inheriting from BadgeSelect styles.
 * Single source of truth for ALL badges in the application.
 * Use this for Categories, Projects, Priorities, Status, and Dates.
 * All styling is centralized in BadgeSelect.css for perfect consistency.
 */
const Badge = ({
    children,
    variant,
    className = '',
    type = 'default', // 'category', 'project', 'priority', 'status', 'date'
    color,
    ...props
}) => {
    // Determine the base class based on the intended use case
    const typeClasses = {
        category: 'category-tag',
        project: 'project-tag',
        priority: 'priority-badge',
        status: 'status-badge',
        date: 'task-due-date',
        default: 'badge-select-value'
    };

    const baseClass = typeClasses[type] || typeClasses.default;

    // Combine base class, the specific variant (e.g., 'priority-high'), and custom classes
    const combinedClasses = [baseClass, variant, className].filter(Boolean).join(' ');

    // Apply pastel alpha transparency automatically to solid colors
    const pastelStyle = color ? {
        backgroundColor: `${color}20`,
        color
    } : {};

    return (
        <span
            className={combinedClasses}
            style={{ ...pastelStyle, ...props.style }}
            {...props}
        >
            {children}
        </span>
    );
};

Badge.propTypes = {
    children: PropTypes.node.isRequired,
    variant: PropTypes.string, // e.g., 'status-todo', 'priority-urgent'
    type: PropTypes.oneOf(['category', 'project', 'priority', 'status', 'date', 'default']),
    className: PropTypes.string,
    color: PropTypes.string, // Solid RGB color from database, will be converted to pastel transparency
};

export default Badge;
