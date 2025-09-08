// Variáveis globais
let currentFilter = 'all';
let allTasks = [];
let currentEditingTask = null;

// Função para mostrar alertas
function showAlert(message, type = 'error') {
    const container = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    container.innerHTML = '';
    container.appendChild(alert);
    
    // Remover alerta após 5 segundos
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Função para fazer requisições AJAX
async function makeRequest(url, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            console.error('Erro HTTP:', response.status, response.statusText);
            return { success: false, message: `Erro HTTP: ${response.status}` };
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro na requisição:', error);
        return { success: false, message: 'Erro de conexão' };
    }
}

// Carregar dados do dashboard
async function loadDashboardData(filter = 'all') {
    try {
        const response = await fetch(`/api/dashboard-data?filter=${filter}`);
        const data = await response.json();
        
        // Atualizar informações do usuário
        document.getElementById('user-greeting').textContent = `Olá, ${data.user.username}!`;
        
        // Atualizar estatísticas
        document.getElementById('total-tasks').textContent = data.stats.total;
        document.getElementById('completed-tasks').textContent = data.stats.completed;
        document.getElementById('pending-tasks').textContent = data.stats.pending;
        document.getElementById('high-priority-tasks').textContent = data.stats.byPriority.high;
        
        // Atualizar contadores dos filtros
        document.getElementById('filter-all-count').textContent = data.allTasks.length;
        document.getElementById('filter-pending-count').textContent = data.stats.pending;
        document.getElementById('filter-completed-count').textContent = data.stats.completed;
        document.getElementById('filter-high-count').textContent = data.stats.byPriority.high;
        
        // Armazenar todas as tarefas
        allTasks = data.allTasks;
        
        // Renderizar tarefas
        renderTasks(data.tasks);
        
        // Atualizar filtro ativo
        updateActiveFilter(filter);
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showAlert('Erro ao carregar dados do dashboard');
    }
}

// Renderizar tarefas na tela
function renderTasks(tasks) {
    const tasksGrid = document.getElementById('tasks-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (tasks.length === 0) {
        tasksGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    tasksGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    tasksGrid.innerHTML = tasks.map(task => {
        const priorityLabels = { low: 'Baixa', medium: 'Média', high: 'Alta' };
        const createdAt = new Date(task.createdAt).toLocaleString('pt-BR');
        const updatedAt = new Date(task.updatedAt).toLocaleString('pt-BR');
        
        return `
            <div class="task-card ${task.completed ? 'completed' : ''} priority-${task.priority}">
                <div class="task-header">
                    <h3>${escapeHtml(task.title)}</h3>
                    <span class="priority-badge priority-${task.priority}">
                        ${priorityLabels[task.priority]}
                    </span>
                </div>
                
                ${task.description ? `<p class="task-description">${escapeHtml(task.description).replace(/\n/g, '<br>')}</p>` : ''}
                
                <div class="task-meta">
                    <small>Criada em: ${createdAt}</small>
                    ${task.updatedAt !== task.createdAt ? `<small>Atualizada em: ${updatedAt}</small>` : ''}
                </div>
                
                <div class="task-actions">
                    <button onclick="toggleTask('${task.id}')" class="btn btn-small ${task.completed ? 'btn-warning' : 'btn-success'}">
                        ${task.completed ? 'Reabrir' : 'Concluir'}
                    </button>
                    
                    <button onclick="editTask('${task.id}')" class="btn btn-small btn-secondary">
                        Editar
                    </button>
                    
                    <button onclick="deleteTask('${task.id}')" class="btn btn-small btn-danger">
                        Excluir
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Função para escapar HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Atualizar filtro ativo
function updateActiveFilter(filter) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
    });
    
    const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('btn-secondary');
        activeBtn.classList.add('btn-primary');
    }
    
    currentFilter = filter;
}

// Filtrar tarefas
function filterTasks(filter) {
    currentFilter = filter;
    loadDashboardData(filter);
}

// Criar nova tarefa
async function createTask(formData) {
    const data = {
        title: formData.get('title'),
        description: formData.get('description'),
        priority: formData.get('priority')
    };
    
    const result = await makeRequest('/api/tasks', 'POST', data);
    
    if (result.success) {
        showAlert(result.message, 'success');
        document.getElementById('task-form').reset();
        loadDashboardData(currentFilter);
    } else {
        showAlert(result.message);
    }
}

// Alternar status da tarefa
async function toggleTask(taskId) {
    const result = await makeRequest(`/api/tasks/${taskId}/toggle`, 'PATCH');
    
    if (result.success) {
        showAlert(result.message, 'success');
        loadDashboardData(currentFilter);
    } else {
        showAlert(result.message);
    }
}

// Editar tarefa
function editTask(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    
    currentEditingTask = task;
    
    // Preencher o formulário de edição
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTitle').value = task.title;
    document.getElementById('editDescription').value = task.description;
    document.getElementById('editPriority').value = task.priority;
    
    // Mostrar modal
    document.getElementById('editModal').style.display = 'block';
    
    // Focar no campo título
    setTimeout(() => {
        document.getElementById('editTitle').focus();
    }, 100);
}

// Fechar modal de edição
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    currentEditingTask = null;
}

// Atualizar tarefa
async function updateTask(taskId, formData) {
    const data = {
        title: formData.get('title'),
        description: formData.get('description'),
        priority: formData.get('priority')
    };
    
    const result = await makeRequest(`/api/tasks/${taskId}`, 'PUT', data);
    
    if (result.success) {
        showAlert(result.message, 'success');
        closeEditModal();
        loadDashboardData(currentFilter);
    } else {
        showAlert(result.message);
    }
}

// Excluir tarefa
async function deleteTask(taskId) {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) {
        return;
    }
    
    const result = await makeRequest(`/api/tasks/${taskId}`, 'DELETE');
    
    if (result.success) {
        showAlert(result.message, 'success');
        loadDashboardData(currentFilter);
    } else {
        showAlert(result.message);
    }
}

// Logout
async function logout() {
    try {
        await fetch('/logout', { method: 'POST' });
        window.location.href = '/auth';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        window.location.href = '/auth';
    }
}

// Busca em tempo real
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const taskCards = document.querySelectorAll('.task-card');
        
        taskCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('.task-description');
            const descText = description ? description.textContent.toLowerCase() : '';
            
            if (title.includes(searchTerm) || descText.includes(searchTerm)) {
                card.style.display = 'block';
                card.style.animation = 'fadeIn 0.3s ease';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Carregar dados iniciais
    loadDashboardData();
    
    // Configurar busca
    setupSearch();
    
    // Formulário de nova tarefa
    const taskForm = document.getElementById('task-form');
    if (taskForm) {
        taskForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('button[type="submit"]');
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Criando...';
            
            await createTask(formData);
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Criar Tarefa';
        });
    }
    
    // Formulário de edição
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const taskId = document.getElementById('editTaskId').value;
            const submitBtn = this.querySelector('button[type="submit"]');
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Salvando...';
            
            await updateTask(taskId, formData);
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Salvar';
        });
    }
    
    // Fechar modal ao clicar fora dele
    window.onclick = function(event) {
        const modal = document.getElementById('editModal');
        if (event.target === modal) {
            closeEditModal();
        }
    };
    
    // Fechar modal com tecla ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeEditModal();
        }
    });
    
    // Animações de entrada
    setTimeout(() => {
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }, 100);
});

// Adicionar CSS para animação de fade
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

