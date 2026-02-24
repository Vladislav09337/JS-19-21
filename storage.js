
const TASKS_KEY = 'todo_tasks';
const FILTER_KEY = 'todo_filter';

export function loadTasks() {
    const stored = localStorage.getItem(TASKS_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch (e) {
        return [];
    }
}

export function saveTasks(tasks) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function loadFilter() {
    return sessionStorage.getItem(FILTER_KEY) || 'all';
}

export function saveFilter(filter) {
    sessionStorage.setItem(FILTER_KEY, filter);
}