# Bug Report: Unnecessary Categories API Calls on Every Search/Filter

## 📋 Summary
The application was making redundant API calls to `/api/v1/categories/` every time a user searched or filtered tasks, even though categories are static data that rarely changes.

## 🐛 Symptoms
Every search or filter operation triggered two API calls:
```
GET /api/v1/tasks/?search=w
GET /api/v1/categories/   ← Unnecessary!
```

## 🔍 Root Cause
The `fetchData()` function was calling `categoryAPI.getAll()` on every invocation:

```javascript
const fetchData = async (showLoader = true) => {
    // ... fetch tasks
    
    const categoriesData = await categoryAPI.getAll();  // Called EVERY time!
    setCategories(categoriesData);
};
```

Since `fetchData()` is called on:
1. Initial page load
2. Every search query
3. Every category filter change
4. Every priority filter change

This resulted in unnecessary network requests.

## 💡 Why This Is Bad
1. **Unnecessary network calls** - Categories are static reference data
2. **Performance impact** - Adds latency to every search/filter operation
3. **Redundant data transfer** - Same categories sent repeatedly
4. **Server load** - Unnecessary load on the categories endpoint

## ✅ Solution
Added a `fetchCategories` parameter to control when categories are fetched:

```javascript
// Initial load - fetch both
fetchData(true, true);

// Search/filter - only fetch tasks, use cached categories
fetchData(false, false);

const fetchData = async (showLoader = true, fetchCategories = false) => {
    // ... fetch tasks
    
    // Only fetch categories on initial load
    if (fetchCategories) {
        const categoriesData = await categoryAPI.getAll();
        setCategories(categoriesData);
    }
    // Categories are cached - don't re-fetch
};
```

## 📊 Result
| Operation | Before | After |
|-----------|--------|-------|
| Initial load | 2 requests | 2 requests |
| Search/Filter | 2 requests | 1 request |

## 📁 Files Modified
- `frontend/React/src/components/KanbanBoard/KanbanBoard.jsx`

## 📅 Date Fixed
14/Mar/2026

## 🛡️ Prevention Tips
1. **Identify static vs dynamic data** - Categories, countries, status options are typically static
2. **Cache reference data** - Fetch once on mount, use cached values
3. **Consider React Query/TanStack Query** - Built-in caching and deduplication
4. **Review API calls** - Check if same endpoint is called repeatedly with same result
