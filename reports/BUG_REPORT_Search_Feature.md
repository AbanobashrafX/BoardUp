# Bug Report: Search Feature Issues

## 📋 Summary
The search functionality in the Kanban board had multiple issues causing poor user experience and incorrect behavior.

---

## 🐛 Bug #1: Search Input Resets on Typing

### Symptoms
- When user types in the search bar, the entire site appears to "refresh"
- The search input only shows one character instead of the full search query

### Root Cause
When `fetchData()` was called:
1. `setLoading(true)` was executed
2. The component returned a **completely different JSX** (just the loading spinner)
3. This **unmounted the entire KanbanBoard** including the search input
4. When the API call completed and `loading` became `false`, the component re-mounted with the **original empty `searchQuery` state**

### Solution
Separated the loading state into two variables:
- `isLoading` - for initial page load (shows spinner)
- `isFetching` - for search/filter queries (no spinner)

```javascript
const [isLoading, setIsLoading] = useState(true);   // Initial load
const [isFetching, setIsFetching] = useState(false); // Search/filter

const fetchData = async (showLoader = true) => {
    try {
        if (showLoader) setIsFetching(true);
        // ... API call
    } finally {
        setIsLoading(false);
        setIsFetching(false);
    }
};

// Only show spinner on initial load
if (isLoading) {
    return <div className="loading"><div className="spinner"></div></div>;
}
```

---

## 🐛 Bug #2: Search Fetched All Tasks Instead of Filtering on Backend

### Symptoms
- Search API was called correctly but all tasks were still displayed
- Frontend was doing the filtering instead of leveraging backend filtering

### Root Cause
1. The search was fetching ALL tasks from the API
2. Frontend then filtered the results in JavaScript
3. This was inefficient and defeated the purpose of backend search

### Solution
Updated `fetchData` to use backend filtering via query parameters:

```javascript
// Build query params for backend filtering
const params = {};
if (searchQuery) params.search = searchQuery;
if (filter.category) params.category = filter.category;
if (filter.priority) params.priority = filter.priority;

// Use getAll with params for backend filtering
if (params.search || params.category || params.priority) {
    const flatTasks = await taskAPI.getAll(params);
    // ... process results
} else {
    tasksData = await taskAPI.getByStatus();
}
```

---

## 🐛 Bug #3: Search Results Not Displayed Correctly

### Symptoms
- Search API returned correct filtered results
- But tasks were not displayed in Kanban columns

### Root Cause
The search API (`/tasks/?search=query`) returns a **flat array** of tasks:
```json
[
    { "id": 1, "title": "Task 1", "status": "TODO" },
    { "id": 2, "title": "Task 2", "status": "IN_PROGRESS" },
    { "id": 3, "title": "Task 3", "status": "DONE" }
]
```

But the Kanban board expects tasks **grouped by status**:
```javascript
{
    TODO: [...],
    IN_PROGRESS: [...],
    DONE: [...]
}
```

### Solution
Group the flat array results by status:

```javascript
if (params.search || params.category || params.priority) {
    const flatTasks = await taskAPI.getAll(params);
    tasksData = {
        TODO: (flatTasks || []).filter(t => t.status === 'TODO'),
        IN_PROGRESS: (flatTasks || []).filter(t => t.status === 'IN_PROGRESS'),
        DONE: (flatTasks || []).filter(t => t.status === 'DONE'),
    };
}
```

---

## 📁 Files Modified
- `frontend/React/src/components/KanbanBoard/KanbanBoard.jsx`

## 📅 Date Reported
14/Mar/2026

## ✅ All Fixes Applied
1. ✅ Separated loading states to prevent component unmounting during search
2. ✅ Search now uses backend filtering via API parameters
3. ✅ Search results are properly grouped by status for Kanban display
