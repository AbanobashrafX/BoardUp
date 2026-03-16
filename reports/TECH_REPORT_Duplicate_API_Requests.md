# Technical Report: Duplicate API Requests Investigation & Fix

**Date:** March 16, 2026  
**Status:** ✅ Fixed  
**Severity:** Medium  
**Impact:** Performance degradation, unnecessary server load, potential rate limiting

---

## 📋 Executive Summary

Multiple redundant API requests were being made to `/api/v1/tasks/all/` and `/api/v1/categories/` endpoints during initial page load and refresh. This was caused by multiple React components independently fetching the same data without proper coordination.

---

## 🔍 Problem Description

### Observed Symptoms

During initial page load and refresh, the following network requests were observed:

```
http://localhost:8000/api/v1/projects/
http://localhost:8000/api/v1/tasks/all/
http://localhost:8000/api/v1/tasks/all/      ← DUPLICATE
http://localhost:8000/api/v1/categories/
http://localhost:8000/api/v1/categories/     ← DUPLICATE
```

### Impact

1. **Performance:** Unnecessary network requests slow down initial page load
2. **Server Load:** Doubles the server processing for each duplicate request
3. **Bandwidth:** Wastes bandwidth fetching the same data twice
4. **User Experience:** May cause temporary UI flickering or loading delays
5. **Scalability:** Could lead to rate limiting under high traffic

---

## 🕵️ Root Cause Analysis

### Issue 1: Duplicate Categories Requests

**Problem:** Two separate components were fetching categories independently.

| Component | File | Request |
|-----------|------|---------|
| BoardContainer | [`BoardContainer.jsx:28`](frontend/React/src/components/BoardContainer/BoardContainer.jsx:28) | `categoryAPI.getAll()` |
| KanbanBoard | [`KanbanBoard.jsx:50`](frontend/React/src/components/KanbanBoard/KanbanBoard.jsx:50) | `categoryAPI.getAll()` |

**Why it happened:**
- `BoardContainer` fetched categories to pass to `MultiFilter` component
- `KanbanBoard` independently fetched categories to pass to `TaskModal` component
- No shared state or prop passing between components for this data

### Issue 2: Duplicate Tasks Requests

**Problem:** Three separate `useEffect` hooks in KanbanBoard could all trigger task fetching.

```javascript
// Effect 1: Initial load
useEffect(() => {
    fetchData(true, true);
}, []);

// Effect 2: Filter/search changes  
useEffect(() => {
    if (!isInitialized.current) {
        isInitialized.current = true;
        return;
    }
    const timer = setTimeout(() => {
        fetchData(false, false);
    }, searchQuery ? 300 : 0);
    return () => clearTimeout(timer);
}, [searchQuery, filter, sortBy]);

// Effect 3: Project changes
useEffect(() => {
    if (isInitialized.current) {
        fetchData(true, false);
    }
}, [selectedProject]);
```

**Why it happened:**
1. Multiple effects with overlapping responsibilities
2. Race conditions between effect execution order
3. The initialization guard (`isInitialized.current`) was not consistently preventing duplicate execution
4. `propCategories` in dependency array triggered additional fetch when categories loaded

### Issue 3: Prop Categories Triggering Refetch

**Problem:** When BoardContainer finished fetching categories and passed them to KanbanBoard, it triggered another task fetch.

```javascript
// This caused tasks to be refetched when categories changed
}, [searchQuery, filter, sortBy, selectedProject, propCategories]);
```

**Why it happened:**
- Tasks and categories are independent data
- Changing categories should not require refetching tasks
- The dependency array was too broad

---

## ✅ Fixes Applied

### Fix 1: Centralized Category Fetching

**File:** [`BoardContainer.jsx`](frontend/React/src/components/BoardContainer/BoardContainer.jsx)

**Changes:**
- Restored category fetching in BoardContainer
- Pass categories to both `MultiFilter` and `KanbanBoard` via props
- Removed duplicate category fetching from KanbanBoard

```javascript
// BoardContainer now fetches once and passes down
<KanbanBoard
    selectedProject={selectedProject}
    searchQuery={searchQuery}
    filter={filter}
    sortBy={sortBy}
    categories={categories}  // ← Added
/>
```

### Fix 2: Consolidated KanbanBoard Effects

**File:** [`KanbanBoard.jsx`](frontend/React/src/components/KanbanBoard/KanbanBoard.jsx)

**Changes:**
1. Accept categories as prop instead of fetching
2. Single unified useEffect with proper initialization
3. Removed unnecessary parameters from fetchData
4. Removed propCategories from dependency array

**Before:**
```javascript
// Three separate effects
useEffect(() => { fetchData(true, true); }, []);
useEffect(() => { /* debounced fetch */ }, [searchQuery, filter, sortBy]);
useEffect(() => { /* project change */ }, [selectedProject]);
```

**After:**
```javascript
// Single unified effect
const isInitialized = useRef(false);

useEffect(() => {
    if (!isInitialized.current) {
        isInitialized.current = true;
        fetchData(true);
        return;
    }
    
    const timer = setTimeout(() => {
        fetchData(false);
    }, searchQuery ? 300 : 0);
    
    return () => clearTimeout(timer);
}, [searchQuery, filter, sortBy, selectedProject]);
```

### Fix 3: Category Sync Effect

**File:** [`KanbanBoard.jsx`](frontend/React/src/components/KanbanBoard/KanbanBoard.jsx)

Added separate effect to sync prop categories to state (without refetching tasks):

```javascript
useEffect(() => {
    if (propCategories.length > 0) {
        setCategories(propCategories);
    }
}, [propCategories]);
```

---

## 📁 Files Modified

| File | Changes |
|------|---------|
| `frontend/React/src/components/BoardContainer/BoardContainer.jsx` | Added categories prop to KanbanBoard |
| `frontend/React/src/components/KanbanBoard/KanbanBoard.jsx` | Consolidated effects, accept categories as prop, removed categoryAPI import |

---

## 📊 Before vs After

### Before Fix

```
Request Sequence:
1. GET /api/v1/projects/          (ProjectSidebar)
2. GET /api/v1/tasks/all/         (KanbanBoard Effect 1)
3. GET /api/v1/tasks/all/         (KanbanBoard Effect 2)
4. GET /api/v1/categories/       (BoardContainer)
5. GET /api/v1/categories/        (KanbanBoard Effect 1)
6. GET /api/v1/tasks/all/         (KanbanBoard propCategories change)

Total: 6 API calls (3 duplicates)
```

### After Fix

```
Request Sequence:
1. GET /api/v1/projects/          (ProjectSidebar)
2. GET /api/v1/tasks/all/         (KanbanBoard)
3. GET /api/v1/categories/       (BoardContainer)

Total: 3 API calls (0 duplicates)
```

---

## 🛡️ Prevention Recommendations

### 1. Centralized Data Fetching

- Use a state management solution (Redux, Zustand, React Query) to manage server state
- Fetch data at the appropriate level in the component tree
- Pass data down via props rather than having each component fetch independently

### 2. Use React Query / SWR

Consider implementing React Query for automatic caching and deduplication:

```javascript
// Example with React Query
const { data: tasks } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => taskAPI.getAll(filters),
});
```

### 3. ESLint Rules

Enable and follow these ESLint rules to catch similar issues:

```json
{
    "react-hooks/exhaustive-deps": "warn",
    "react-hooks/rules-of-hooks": "error"
}
```

### 4. Code Review Checklist

- [ ] Verify no duplicate API calls in useEffect hooks
- [ ] Check dependency arrays for unnecessary items
- [ ] Ensure initialization logic is consistent
- [ ] Look for race conditions between effects

### 5. Best Practices for useEffect

1. **Single responsibility:** Each effect should do one thing
2. **Proper initialization:** Use `useRef` for initialization flags (not `useState`)
3. **Minimal dependencies:** Only include values that actually need to trigger the effect
4. **Debouncing:** Use debounce for search inputs to prevent excessive calls

---

## 🔧 Alternative Solutions Considered

### Option A: React Context
Create a `DataContext` that fetches and provides all board data to child components.

**Pros:** Centralized, no prop drilling  
**Cons:** More complex setup, may be overkill for this use case

### Option B: React Query
Use React Query for automatic request deduplication and caching.

**Pros:** Built-in deduplication, caching, refetching logic  
**Cons:** Additional dependency, learning curve

### Option C: Custom Hook
Create a `useBoardData` hook that handles all data fetching.

**Pros:** Reusable, testable, clean separation  
**Cons:** More code to maintain

---

## 📅 Date Fixed

March 16, 2026

---

## 👥 Reported By

Development Team
