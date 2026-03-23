# Technical Report: Centralized Data Management for API Request Optimization

## Executive Summary

This report documents the fix for duplicate API requests observed in the BoardUp frontend application. The issue resulted in redundant network calls to `/api/v1/projects/` on every application load. The solution introduces a centralized DataContext that manages application-wide data fetching, eliminating duplicates and improving performance.

**Date:** March 23, 2026  
**Status:** ✅ Implemented and Verified  
**Version:** v1.9.0 → v1.9.1

---

## 1. Problem Statement

### 1.1 Observed Behavior

The browser console and server logs showed duplicate API requests at application startup:

```
[23/Mar/2026 20:19:54] "GET /api/v1/categories/ HTTP/1.1" 200 94
[23/Mar/2026 20:19:54] "GET /api/v1/projects/ HTTP/1.1" 200 882
[23/Mar/2026 20:19:54] "GET /api/v1/tasks/all/ HTTP/1.1" 200 4268
[23/Mar/2026 20:19:54] "GET /api/v1/projects/ HTTP/1.1" 200 882
```

The `/api/v1/projects/` endpoint was being called twice in rapid succession, causing:
- Unnecessary network traffic
- Increased server load
- Potential race conditions in data synchronization
- Wasted bandwidth and processing resources

### 1.2 Impact Assessment

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| `/projects/` requests on load | 2 | 1 | 50% reduction |
| Total API calls on load | 4 | 3 | 25% reduction |
| Network overhead | Higher | Lower | Significant |

---

## 2. Root Cause Analysis

### 2.1 Architectural Issue

The application lacked a centralized data management layer. Multiple components were independently responsible for fetching the same data:

```
App Component Tree:
├── ProjectSidebar
│   └── useEffect → projectAPI.getAll() ← FETCH 1
└── BoardContainer
    ├── useEffect → categoryAPI.getAll() ← FETCH 2
    └── useEffect → projectAPI.getAll() ← FETCH 3
```

### 2.2 Code Analysis

**ProjectSidebar.jsx (Before):**
```javascript
useEffect(() => {
    fetchProjects();
}, []);

const fetchProjects = async () => {
    const data = await projectAPI.getAll();
    setProjects(data);
};
```

**BoardContainer.jsx (Before):**
```javascript
// Fetch categories on mount
useEffect(() => {
    const data = await categoryAPI.getAll();
    setCategories(data);
}, []);

// Fetch projects on mount  
useEffect(() => {
    const data = await projectAPI.getAll();
    setProjects(data);
}, []);
```

### 2.3 Root Cause

**Decentralized Data Fetching:** Each component managed its own data fetching independently, with no awareness of whether another component had already fetched the same data.

**Missing State Synchronization:** When projects were created or deleted in one component, other components remained unaware without manual state management.

**Inefficient Parallel Requests:** Even if fetches were properly deduplicated, multiple sequential fetches were slower than parallel fetching.

---

## 3. Solution Design

### 3.1 Architecture Overview

Introduce a React Context provider that acts as a single source of truth for application-wide data:

```
App Component Tree:
├── CustomThemeProvider
│   └── MuiThemeProvider
│       └── DataProvider ← CENTRALIZED DATA
│           └── AppContent
│               ├── ProjectSidebar (consumes useData())
│               └── BoardContainer (consumes useData())
```

### 3.2 Key Design Principles

1. **Single Source of Truth:** All categories and projects are fetched once at the application root
2. **Context-Based Distribution:** Data is propagated to child components via React Context
3. **Parallel Fetching:** Categories and projects are fetched simultaneously using `Promise.all`
4. **Refresh Methods:** Components can trigger data refreshes when needed

---

## 4. Implementation Details

### 4.1 New File: DataContext.jsx

**Location:** `frontend/React/src/contexts/DataContext.jsx`

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { categoryAPI, projectAPI } from '../services/api';

const DataContext = createContext(null);

export function useData() {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}

export function DataProvider({ children }) {
    const [categories, setCategories] = useState([]);
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all data once on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                
                // Fetch categories and projects in parallel
                const [categoriesData, projectsData] = await Promise.all([
                    categoryAPI.getAll(),
                    projectAPI.getAll()
                ]);

                if (categoriesData && categoriesData.length > 0) {
                    setCategories(categoriesData);
                }
                
                if (projectsData && projectsData.length > 0) {
                    setProjects(projectsData);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Refresh methods for when data needs to be updated
    const refreshCategories = async () => {
        try {
            const data = await categoryAPI.getAll();
            if (data && data.length > 0) {
                setCategories(data);
            }
        } catch (err) {
            console.error('Error refreshing categories:', err);
        }
    };

    const refreshProjects = async () => {
        try {
            const data = await projectAPI.getAll();
            if (data && data.length > 0) {
                setProjects(data);
            }
        } catch (err) {
            console.error('Error refreshing projects:', err);
        }
    };

    const value = {
        categories,
        projects,
        isLoading,
        error,
        refreshCategories,
        refreshProjects
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}
```

### 4.2 Modified File: App.jsx

**Changes:**
1. Import `DataProvider` from `./contexts/DataContext`
2. Wrap application content with `DataProvider` inside `MuiThemeProvider`

```javascript
function ThemedApp() {
    const { isDark } = useTheme();

    const muiTheme = createTheme({...});

    return (
        <MuiThemeProvider theme={muiTheme}>
            <CssBaseline />
            <DataProvider>
                <AppContent />
            </DataProvider>
        </MuiThemeProvider>
    );
}
```

### 4.3 Modified File: BoardContainer.jsx

**Changes:**
1. Removed local state for categories and projects
2. Removed useEffect hooks for fetching data
3. Use `useData()` hook to consume shared data

```javascript
function BoardContainer({
  selectedProject = null,
  projectName: propProjectName = 'All Tasks'
}) {
  // Get shared data from context
  const { categories, projects } = useData();

  // Board state - search/filter managed internally
  const [viewMode, setViewMode] = useState('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  // ... rest of component
}
```

### 4.4 Modified File: ProjectSidebar.jsx

**Changes:**
1. Removed local state for projects
2. Removed useEffect and fetchProjects function
3. Use `useData()` hook to consume shared data
4. Simplified create/delete handlers (rely on context refresh)

```javascript
function ProjectSidebar({ selectedProject, onSelectProject }) {
    const { projects } = useData();
    const [loading, setLoading] = useState(false);
    // ... rest of component
}
```

---

## 5. API Reference

### 5.1 useData Hook

```typescript
interface DataContextValue {
  categories: Category[];
  projects: Project[];
  isLoading: boolean;
  error: Error | null;
  refreshCategories: () => Promise<void>;
  refreshProjects: () => Promise<void>;
}
```

### 5.2 Usage Example

```javascript
import { useData } from './contexts/DataContext';

function MyComponent() {
  const { categories, projects, isLoading, refreshProjects } = useData();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {projects.map(project => (...))}
      <button onClick={refreshProjects}>Refresh Projects</button>
    </div>
  );
}
```

---

## 6. Benefits and Impact

### 6.1 Performance Improvements

| Improvement Area | Description |
|-----------------|-------------|
| Network Efficiency | Reduced API calls from 2 to 1 for projects endpoint |
| Parallel Loading | Categories and projects load simultaneously |
| Reduced Latency | Single fetch instead of multiple sequential requests |

### 6.2 Code Quality Improvements

| Aspect | Before | After |
|--------|--------|-------|
| Data Management | Decentralized | Centralized |
| State Synchronization | Manual prop drilling | Automatic via Context |
| Duplicate Code | Multiple fetch implementations | Single implementation |
| Maintainability | Hard to track data sources | Single source of truth |

### 6.3 Developer Experience

- **Simpler Components:** Components no longer need to manage data fetching logic
- **Easier Testing:** Mock the DataContext provider for isolated component testing
- **Better Error Handling:** Centralized error management in one place

---

## 7. Future Enhancements

### 7.1 Planned Improvements

1. **React Query Integration:** Consider using TanStack Query (React Query) for:
   - Automatic background refetching
   - Caching and stale-while-revalidate
   - Request deduplication at the network level

2. **Optimistic Updates:** Implement optimistic UI updates for better perceived performance

3. **WebSocket Support:** Add real-time data synchronization for collaborative features

4. **Pagination Support:** Add pagination for large datasets

### 7.2 Scalability Considerations

- For larger applications, consider using Redux Toolkit or Zustand for global state
- Implement request caching to reduce repeated fetches
- Add request batching for bulk operations

---

## 8. Conclusion

The implementation of the DataContext successfully eliminates duplicate API requests and establishes a clean architecture for application-wide data management. The solution is minimal, focused, and provides immediate performance benefits while laying the groundwork for future enhancements.

The fix addresses the core issue of decentralized data fetching and transforms it into a centralized, maintainable pattern that improves both runtime performance and code quality.

---

## 9. Files Modified

| File | Action | Description |
|------|--------|-------------|
| `frontend/React/src/contexts/DataContext.jsx` | Created | New centralized data provider |
| `frontend/React/src/App.jsx` | Modified | Added DataProvider wrapper |
| `frontend/React/src/components/BoardContainer/BoardContainer.jsx` | Modified | Uses useData() hook |
| `frontend/React/src/components/ProjectSidebar/ProjectSidebar.jsx` | Modified | Uses useData() hook |

---

## 10. Testing Checklist

- [x] Application loads without errors
- [x] Categories are fetched and displayed correctly
- [x] Projects are fetched and displayed correctly
- [x] Project creation works
- [x] Project deletion works
- [x] No duplicate API requests on page load
- [x] Theme switching works correctly
- [x] Kanban board displays tasks correctly
- [x] Calendar board displays tasks correctly
