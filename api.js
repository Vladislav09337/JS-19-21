
const BASE_URL = 'https://jsonplaceholder.typicode.com/todos';

export async function fetchTasks() {
    const response = await fetch(`${BASE_URL}?_limit=10`);
    if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`);
    }
    return await response.json();
}

export async function createTask(task) {
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: task.title,
            completed: task.completed || false,
            userId: task.userId || 1,
        }),
    });

    if (!response.ok) {
        throw new Error(`Ошибка создания: ${response.status}`);
    }
    return await response.json();
}

export async function updateTask(id, updates) {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
    });

    if (!response.ok) {
        throw new Error(`Ошибка обновления: ${response.status}`);
    }
    return await response.json();
}

export async function deleteTask(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error(`Ошибка удаления: ${response.status}`);
    }
}