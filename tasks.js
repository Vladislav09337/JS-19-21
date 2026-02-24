
let tasks = [];

export function initializeTasks(initialTasks) {
    tasks = [...initialTasks];
}

export function getTasks() {
    return [...tasks];
}

export function addTask(text, priority = 'medium') {
    const newTask = {
        id: Date.now() + Math.random(),
        text: text.trim(),
        completed: false,
        priority: priority,
        createdAt: new Date().toISOString(),
    };
    tasks.push(newTask);
    return newTask;
}

export function updateTaskPriority(id, newPriority) {
    const task = tasks.find(t => t.id == id);
    if (task) {
        task.priority = newPriority;
    }
}

export function toggleTask(id) {
    const task = tasks.find(t => t.id == id);
    if (task) {
        task.completed = !task.completed;
    }
}

export function deleteTask(id) {
    tasks = tasks.filter(t => t.id != id);
}

export function clearCompleted() {
    tasks = tasks.filter(t => !t.completed);
}

export function getFilteredTasks(filter) {
    switch (filter) {
        case 'active':
            return tasks.filter(t => !t.completed);
        case 'completed':
            return tasks.filter(t => t.completed);
        case 'all':
        default:
            return [...tasks];
    }
}