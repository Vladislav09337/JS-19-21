import { fetchTasks, createTask, updateTask, deleteTask } from './api.js';
import { loadTasks, saveTasks, loadFilter, saveFilter } from './storage.js';
import {
    initializeTasks,
    getTasks,
    addTask,
    updateTaskPriority,
    toggleTask,
    deleteTask as localDeleteTask,
    clearCompleted as localClearCompleted,
    getFilteredTasks,
} from './tasks.js';

let currentFilter = loadFilter();

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const prioritySelect = document.getElementById('priority-select');
const filterContainer = document.getElementById('filter-container');
const taskList = document.getElementById('task-list');
const loadServerBtn = document.getElementById('load-server-btn');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const taskStats = document.getElementById('task-stats');

const savedTasks = loadTasks();
initializeTasks(savedTasks);
renderTasks();

function saveAndRender() {
    saveTasks(getTasks());
    renderTasks();
}

function renderTasks() {
    const tasksToRender = getFilteredTasks(currentFilter);
    taskList.innerHTML = '';

    const priorityColors = {
        low: 'bg-emerald-600',
        medium: 'bg-amber-500',
        high: 'bg-red-600',
    };

    tasksToRender.forEach(task => {
        const li = document.createElement('li');
        li.dataset.id = task.id;
        li.className = 'group flex rounded-2xl overflow-hidden bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 transition-all cursor-pointer';

        const priorityClass = priorityColors[task.priority] || 'bg-zinc-600';

        li.innerHTML = `
            <div class="w-2 flex-shrink-0 ${priorityClass}"></div>
            <div class="flex-1 flex items-center gap-4 px-5 py-5">
                <input type="checkbox" class="task-checkbox w-6 h-6 accent-emerald-500 cursor-pointer" ${task.completed ? 'checked' : ''}>
                <div class="flex-1">
                    <span class="task-text text-lg ${task.completed ? 'task-completed' : ''}">${task.text}</span>
                </div>
                <button class="delete-btn text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition pointer-events-auto">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        li.addEventListener('dblclick', (e) => {
            if (e.target.closest('input[type="checkbox"]') || e.target.closest('.delete-btn')) return;
            startPriorityEdit(task, li, li.querySelector('.task-text'));
        });

        taskList.appendChild(li);
    });

    const all = getTasks();
    const done = all.filter(t => t.completed).length;
    taskStats.textContent = `${all.length} задач · ${done} выполнено`;
}

function startPriorityEdit(task, li, textElement) {
    const select = document.createElement('select');
    select.className = 'ml-3 bg-zinc-800 border border-zinc-600 rounded px-3 py-1.5 text-base text-zinc-100 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 min-w-[110px] shadow-sm';

    ['low', 'medium', 'high'].forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p.charAt(0).toUpperCase() + p.slice(1);
        if (p === task.priority) opt.selected = true;
        select.appendChild(opt);
    });

    textElement.insertAdjacentElement('afterend', select);
    textElement.style.display = 'none';
    select.focus();

    const savePriority = async () => {
        const newPriority = select.value;
        if (newPriority !== task.priority) {
            updateTaskPriority(task.id, newPriority);
            if (String(task.id).startsWith('server-')) {
                const serverId = parseInt(task.id.replace('server-', ''), 10);
                try {
                    await updateTask(serverId, { priority: newPriority });
                } catch (err) {
                    alert('Ошибка при обновлении приоритета на сервере');
                }
            }
            saveAndRender();
        } else {
            select.remove();
            textElement.style.display = 'inline';
        }
    };

    const removeSelect = () => {
        select.remove();
        textElement.style.display = 'inline';
    };

    select.addEventListener('change', savePriority);
    select.addEventListener('blur', savePriority);
    select.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            savePriority();
        } else if (e.key === 'Escape') {
            removeSelect();
        }
    });
}

taskList.addEventListener('change', async (e) => {
    if (!e.target.classList.contains('task-checkbox')) return;
    const li = e.target.closest('li');
    if (!li) return;
    const id = li.dataset.id;

    toggleTask(id);
    const task = getTasks().find(t => t.id == id);
    if (String(id).startsWith('server-')) {
        try {
            await updateTask(parseInt(id.replace('server-', '')), { completed: task.completed });
        } catch (err) {
            alert('Не удалось обновить статус на сервере');
        }
    }
    saveAndRender();
});

taskList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.delete-btn');
    if (!btn) return;
    const li = btn.closest('li');
    if (!li) return;
    const id = li.dataset.id;

    localDeleteTask(id);
    if (String(id).startsWith('server-')) {
        try {
            await deleteTask(parseInt(id.replace('server-', '')));
        } catch (err) {
            alert('Ошибка при удалении задачи с сервера');
        }
    }
    saveAndRender();
});

taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    const priority = prioritySelect.value;
    const newTask = addTask(text, priority);

    try {
        const serverTask = await createTask({ title: text, completed: false, userId: 1 });
        newTask.id = `server-${serverTask.id}`;
    } catch (err) {
        alert('Задача добавлена локально, но не сохранилась на сервере');
    }

    taskInput.value = '';
    prioritySelect.value = 'medium';
    saveAndRender();
});

filterContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    const filter = btn.dataset.filter;
    if (!filter) return;

    currentFilter = filter;
    saveFilter(filter);
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === currentFilter));
    renderTasks();
});

loadServerBtn.addEventListener('click', async () => {
    loadServerBtn.disabled = true;
    const orig = loadServerBtn.innerHTML;
    loadServerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';

    try {
        const serverTasks = await fetchTasks();
        const existing = new Set(getTasks().map(t => t.text.trim().toLowerCase()));
        let added = 0;

        for (const st of serverTasks) {
            const text = st.title.trim();
            if (existing.has(text.toLowerCase())) continue;
            const task = addTask(text, 'medium');
            task.completed = st.completed;
            task.id = `server-${st.id}`;
            existing.add(text.toLowerCase());
            added++;
        }

        alert(added ? `Загружено ${added} новых задач` : 'Новых задач нет');
        saveAndRender();
    } catch (err) {
        alert('Ошибка при загрузке с сервера');
    } finally {
        loadServerBtn.disabled = false;
        loadServerBtn.innerHTML = orig;
    }
});

clearCompletedBtn.addEventListener('click', () => {
    if (!confirm('Удалить все выполненные задачи?')) return;
    const completed = getTasks().filter(t => t.completed);
    completed.forEach(t => {
        if (String(t.id).startsWith('server-')) {
            deleteTask(parseInt(t.id.replace('server-', ''))).catch(() => {});
        }
    });
    localClearCompleted();
    saveAndRender();
});