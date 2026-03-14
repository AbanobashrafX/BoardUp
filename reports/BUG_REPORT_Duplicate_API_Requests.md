# Bug Report: Duplicate API Requests on Initial Page Load

## 📋 Summary
Multiple redundant API requests were being made to `/api/v1/categories/` and `/api/v1/tasks/all/` when simply opening the application at `http://localhost:5173/` without any user interaction.

## 🐛 Symptoms
```
[14/Mar/2026 18:15:32] "GET /api/v1/categories/ HTTP/1.1" 200 94
[14/Mar/2026 18:15:32] "GET /api/v1/tasks/all/ HTTP/1.1" 200 2671
[14/Mar/2026 18:15:38] "GET /api/v1/categories/ HTTP/1.1" 200 94
[14/Mar/2026 18:15:38] "GET /api/v1/tasks/all/ HTTP/1.1" 200 2671
[14/Mar/2026 18:15:39] "GET /api/v1/categories/ HTTP/1.1" 200 94
[14/Mar/2026 18:15:39] "GET /api/v1/tasks/all/ HTTP/1.1" 200 2671
[14/Mar/2026 18:15:39] "GET /api/v1/categories/ HTTP/1.1" 200 94
[14/Mar/2026 18:15:39] "GET /api/v1/tasks/all/ HTTP/1.1" 200 2671
```

## 🔍 Root Cause
The issue was in `frontend/React/src/components/KanbanBoard/KanbanBoard.jsx`. There were **two separate `useEffect` hooks** that both called `fetchData()`:

### Problematic Code (Before Fix)
```javascript
// Effect 1: Triggered on searchQuery change
useEffect(() => {
    const timer = setTimeout(() => {
        fetchData();
    }, 300);
    return () => clearTimeout(timer);
}, [searchQuery]);

// Effect 2: Triggered on filter change
useEffect(() => {
    fetchData();
}, [filter]);
```

### Why It Happened
1. Both `searchQuery` and `filter` had initial values:
   - `searchQuery = ''` (empty string)
   - `filter = { category: '', priority: '' }`
2. Both values were valid entries in their respective dependency arrays
3. When the component mounted, **both effects executed**, causing duplicate API calls
4. React's state updates could trigger additional re-renders, compounding the issue

## ✅ Solution
Consolidated the two `useEffect` hooks into a single effect with proper initialization tracking using `useRef`:

### Fixed Code (After Fix)
```javascript
import React, { useState, useEffect, useRef } from 'react';

// ...

const [searchQuery, setSearchQuery] = useState('');
const isInitialized = useRef(false);

// Single effect that handles initial load and filter/search changes with debounce
useEffect(() => {
    // Skip if not yet initialized (first render)
    if (!isInitialized.current) {
        isInitialized.current = true;
        fetchData();
        return;
    }
    
    // Debounce search queries
    const timer = setTimeout(() => {
        fetchData();
    }, searchQuery ? 300 : 0);
    
    return () => clearTimeout(timer);
}, [searchQuery, filter]);
```

**Why useRef instead of useState:**
- Using `useState` for the initialization flag causes the effect to re-run when the state changes (because it's in the dependency array)
- `useRef` doesn't trigger re-renders when its value changes, so the effect only runs once on mount

## 📁 Files Modified
- `frontend/React/src/components/KanbanBoard/KanbanBoard.jsx`

## 🛡️ Prevention Tips
1. **Avoid multiple `useEffect` hooks** that call the same data-fetching function
2. **Use an initialization flag** when you need different behavior for first render vs. subsequent updates
3. **Be careful with empty strings/objects** in dependency arrays - they still trigger effects
4. Consider using a custom hook like `useFetch` or React Query for data fetching to avoid these issues
5. Use ESLint's `exhaustive-deps` rule to catch potential dependency array issues

## 📅 Date Reported
14/Mar/2026

## 👤 Reported By
Development Team
