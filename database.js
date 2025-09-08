/**
 * Camada de persistência de dados para o sistema de tarefas
 * Gerencia operações CRUD em arquivos JSON para usuários e tarefas
 */

const fs = require('fs');
const path = require('path');
const { config, hashPassword, verifyPassword, generateId } = require('./config');

// =============================================================================
// CLASSE DATABASE - GERENCIAMENTO DE DADOS
// =============================================================================

class Database {
    
    // =========================================================================
    // INICIALIZAÇÃO E CONFIGURAÇÃO
    // =========================================================================
    
    /**
     * Inicializa estrutura de dados do sistema
     * Cria diretórios e arquivos necessários se não existirem
     */
    static init() {
        // Criar diretório de dados se não existir
        if (!fs.existsSync(config.DATA_DIR)) {
            fs.mkdirSync(config.DATA_DIR, { recursive: true });
        }
        
        // Criar arquivo de usuários se não existir
        if (!fs.existsSync(config.USERS_FILE)) {
            fs.writeFileSync(config.USERS_FILE, JSON.stringify([]));
        }
        
        // Criar arquivo de tarefas se não existir
        if (!fs.existsSync(config.TASKS_FILE)) {
            fs.writeFileSync(config.TASKS_FILE, JSON.stringify([]));
        }
    }
    
    // =========================================================================
    // OPERAÇÕES COM USUÁRIOS
    // =========================================================================
    
    /**
     * Recupera lista de usuários do arquivo JSON
     * @returns {Array} - Array de objetos usuário
     */
    static getUsers() {
        try {
            const data = fs.readFileSync(config.USERS_FILE, 'utf8');
            return JSON.parse(data) || [];
        } catch (error) {
            console.error('Erro ao ler usuários:', error);
            return [];
        }
    }
    
    /**
     * Salva lista de usuários no arquivo JSON
     * @param {Array} users - Array de usuários a serem salvos
     * @returns {boolean} - True se salvou com sucesso, false caso contrário
     */
    static saveUsers(users) {
        try {
            fs.writeFileSync(config.USERS_FILE, JSON.stringify(users, null, 2));
            return true;
        } catch (error) {
            console.error('Erro ao salvar usuários:', error);
            return false;
        }
    }
    
    /**
     * Cria novo usuário no sistema
     * @param {string} username - Nome de usuário
     * @param {string} email - Email do usuário
     * @param {string} password - Senha em texto plano
     * @returns {Object} - Resultado da operação
     */
    static createUser(username, email, password) {
        const users = this.getUsers();
        
        // Verificar se usuário já existe
        const existingUser = users.find(user => 
            user.username === username || user.email === email
        );
        
        if (existingUser) {
            return { success: false, message: 'Usuário ou email já existe' };
        }
        
        // Criar novo objeto usuário com hash da senha
        const newUser = {
            id: generateId(),
            username,
            email,
            password: hashPassword(password),
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        
        if (this.saveUsers(users)) {
            return { success: true, userId: newUser.id };
        } else {
            return { success: false, message: 'Erro ao criar usuário' };
        }
    }
    
    /**
     * Autentica usuário com credenciais fornecidas
     * @param {string} username - Nome de usuário ou email
     * @param {string} password - Senha em texto plano
     * @returns {Object} - Resultado da autenticação com dados do usuário
     */
    static authenticateUser(username, password) {
        const users = this.getUsers();
        
        // Buscar usuário por nome ou email e verificar senha
        const user = users.find(user => 
            (user.username === username || user.email === username) &&
            verifyPassword(password, user.password)
        );
        
        if (user) {
            return { success: true, user: { id: user.id, username: user.username, email: user.email } };
        } else {
            return { success: false, message: 'Usuário ou senha incorretos' };
        }
    }
    
    /**
     * Busca usuário por ID
     * @param {string} userId - ID do usuário
     * @returns {Object|null} - Dados do usuário sem senha ou null se não encontrado
     */
    static getUserById(userId) {
        const users = this.getUsers();
        const user = users.find(user => user.id === userId);
        
        if (user) {
            return { id: user.id, username: user.username, email: user.email };
        }
        return null;
    }
    
    // =========================================================================
    // OPERAÇÕES COM TAREFAS
    // =========================================================================
    
    /**
     * Recupera tarefas do arquivo JSON
     * @param {string|null} userId - ID do usuário para filtrar tarefas (null = todas)
     * @returns {Array} - Array de objetos tarefa
     */
    static getTasks(userId = null) {
        try {
            const data = fs.readFileSync(config.TASKS_FILE, 'utf8');
            const allTasks = JSON.parse(data) || [];
            
            // Filtrar por usuário se especificado
            if (userId) {
                return allTasks.filter(task => task.userId === userId);
            }
            
            return allTasks;
        } catch (error) {
            console.error('Erro ao ler tarefas:', error);
            return [];
        }
    }
    
    /**
     * Salva lista de tarefas no arquivo JSON
     * @param {Array} tasks - Array de tarefas a serem salvas
     * @returns {boolean} - True se salvou com sucesso, false caso contrário
     */
    static saveTasks(tasks) {
        try {
            fs.writeFileSync(config.TASKS_FILE, JSON.stringify(tasks, null, 2));
            return true;
        } catch (error) {
            console.error('Erro ao salvar tarefas:', error);
            return false;
        }
    }
    
    /**
     * Cria nova tarefa para o usuário
     * @param {string} userId - ID do usuário proprietário
     * @param {string} title - Título da tarefa
     * @param {string} description - Descrição da tarefa (opcional)
     * @param {string} priority - Prioridade da tarefa (low, medium, high)
     * @returns {Object} - Resultado da operação
     */
    static createTask(userId, title, description = '', priority = 'medium') {
        const tasks = this.getTasks();
        
        // Criar novo objeto tarefa
        const newTask = {
            id: generateId(),
            userId,
            title,
            description,
            priority,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        
        if (this.saveTasks(tasks)) {
            return { success: true, taskId: newTask.id };
        } else {
            return { success: false, message: 'Erro ao criar tarefa' };
        }
    }
    
    /**
     * Atualiza dados de uma tarefa existente
     * @param {string} taskId - ID da tarefa
     * @param {string} userId - ID do usuário proprietário
     * @param {Object} data - Dados a serem atualizados
     * @returns {Object} - Resultado da operação
     */
    static updateTask(taskId, userId, data) {
        const tasks = this.getTasks();
        const taskIndex = tasks.findIndex(task => task.id === taskId && task.userId === userId);
        
        if (taskIndex === -1) {
            return { success: false, message: 'Tarefa não encontrada' };
        }
        
        // Atualizar tarefa mantendo dados existentes
        // Atualizar tarefa mantendo dados existentes
        tasks[taskIndex] = {
            ...tasks[taskIndex],
            ...data,
            updatedAt: new Date().toISOString()
        };
        
        if (this.saveTasks(tasks)) {
            return { success: true };
        } else {
            return { success: false, message: 'Erro ao atualizar tarefa' };
        }
    }
    
    /**
     * Remove tarefa do sistema
     * @param {string} taskId - ID da tarefa
     * @param {string} userId - ID do usuário proprietário
     * @returns {Object} - Resultado da operação
     */
    static deleteTask(taskId, userId) {
        const tasks = this.getTasks();
        const taskIndex = tasks.findIndex(task => task.id === taskId && task.userId === userId);
        
        if (taskIndex === -1) {
            return { success: false, message: 'Tarefa não encontrada' };
        }
        
        tasks.splice(taskIndex, 1);
        
        if (this.saveTasks(tasks)) {
            return { success: true };
        } else {
            return { success: false, message: 'Erro ao excluir tarefa' };
        }
    }
    
    /**
     * Alterna status de conclusão da tarefa
     * @param {string} taskId - ID da tarefa
     * @param {string} userId - ID do usuário proprietário
     * @returns {Object} - Resultado da operação com novo status
     */
    static toggleTaskCompletion(taskId, userId) {
        const tasks = this.getTasks();
        const taskIndex = tasks.findIndex(task => task.id === taskId && task.userId === userId);
        
        if (taskIndex === -1) {
            return { success: false, message: 'Tarefa não encontrada' };
        }
        
        // Inverter status de conclusão
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        tasks[taskIndex].updatedAt = new Date().toISOString();
        
        if (this.saveTasks(tasks)) {
            return { success: true, completed: tasks[taskIndex].completed };
        } else {
            return { success: false, message: 'Erro ao atualizar tarefa' };
        }
    }
    
    /**
     * Gera estatísticas das tarefas do usuário
     * @param {string} userId - ID do usuário
     * @returns {Object} - Estatísticas organizadas
     */
    static getTaskStats(userId) {
        const tasks = this.getTasks(userId);
        
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;
        
        // Estatísticas por prioridade
        const byPriority = {
            high: tasks.filter(task => !task.completed && task.priority === 'high').length,
            medium: tasks.filter(task => !task.completed && task.priority === 'medium').length,
            low: tasks.filter(task => !task.completed && task.priority === 'low').length
        };
        
        return {
            total,
            completed,
            pending,
            byPriority
        };
    }
}

// =============================================================================
// EXPORTAÇÕES
// =============================================================================

module.exports = Database;

