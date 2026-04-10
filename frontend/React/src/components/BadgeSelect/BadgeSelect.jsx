import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './BadgeSelect.css';

function BadgeSelect({
    name,
    value,
    onChange,
    options,
    getOptionStyle,
    placeholder = 'Select...'
}) {
    const { isDark } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange({ target: { name, value: optionValue } });
        setIsOpen(false);
    };

    return (
        <div className={`badge-select-container ${isDark ? 'dark' : 'light'}`} ref={containerRef}>
            <button
                type="button"
                className={`badge-select-trigger ${isOpen ? 'open' : ''} ${selectedOption ? 'has-value' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedOption ? (
                    (() => {
                        const optionStyle = getOptionStyle ? getOptionStyle(selectedOption) : {};
                        if (optionStyle.className) {
                            return <span className={`badge-select-value ${optionStyle.className}`}>{selectedOption.label}</span>;
                        }
                        return (
                            <span className="badge-select-value" style={optionStyle}>
                                {selectedOption.label}
                            </span>
                        );
                    })()
                ) : (
                    <span className="badge-select-placeholder">{placeholder}</span>
                )}
                <svg
                    className={`badge-select-arrow ${isOpen ? 'open' : ''}`}
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {isOpen && (
                <div className="badge-select-dropdown">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`badge-select-option ${option.value === value ? 'selected' : ''}`}
                            onClick={() => handleSelect(option.value)}
                        >
                            {(() => {
                                const optionStyle = getOptionStyle ? getOptionStyle(option) : {};
                                if (optionStyle.className) {
                                    return <span className={`badge-select-option-badge ${optionStyle.className}`}>{option.label}</span>;
                                }
                                return (
                                    <span
                                        className="badge-select-option-badge"
                                        style={optionStyle}
                                    >
                                        {option.label}
                                    </span>
                                );
                            })()}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

import Badge from './Badge';

export { Badge };
export default BadgeSelect;
