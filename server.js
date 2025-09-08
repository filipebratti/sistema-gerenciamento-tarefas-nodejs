/**
 * Sistema de Gerenciamento de Tarefas - Node.js
 * Servidor Express.js com autenticação baseada em sessão
 */

const express = require('express');
const session = require('express-session');
const path = require('path');
const Database = require('./database');
const { config, sanitizeInput, validateEmail, isLoggedIn, requireAuth, formatDate } = require('./config');

const app = express();

// Inicialização da aplicação
Database.init();

// Configuração de middleware
app.use(express.urlencoded({ extended: true })); // Parse de dados de formulário
app.use(express.json()); // Parse de dados JSON
app.use(express.static(path.join(__dirname, 'public'))); // Servir arquivos estáticos

// Configuração de sessões
app.use(session({
    secret: config.SESSION_SECRET,
    resave: true, // Força resalvar sessão mesmo se não modificada
    saveUninitialized: true, // Salva sessões não inicializadas  
    cookie: { 
        secure: false, // HTTPS apenas em produção
        httpOnly: true, // Previne acesso via JavaScript (segurança XSS)
        maxAge: 24 * 60 * 60 * 1000 // 24 horas de validade
    }
}));

// Configuração do template engine
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

/**
 * Middleware global para disponibilizar dados do usuário
 * Injeta informações de autenticação em todas as views
 */
app.use((req, res, next) => {
    res.locals.user = null;
    res.locals.isLoggedIn = false;
    
    if (isLoggedIn(req)) {
        res.locals.user = Database.getUserById(req.session.userId);
        res.locals.isLoggedIn = true;
    }
    
    next();
});

// =============================================================================
// ROTAS PRINCIPAIS
// =============================================================================

/**
 * Rota raiz - Redireciona baseado no status de autenticação
 */
app.get('/', (req, res) => {
    if (isLoggedIn(req)) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/auth');
    }
});

// =============================================================================
// ROTAS DE AUTENTICAÇÃO
// =============================================================================

/**
 * Página de login e cadastro
 * Redireciona usuários já autenticados para o dashboard
 */
app.get('/auth', (req, res) => {
    if (isLoggedIn(req)) {
        res.redirect('/dashboard');
        return;
    }
    
    res.sendFile(path.join(__dirname, 'views', 'auth.html'));
});

/**
 * Processamento de login
 * Autentica usuário e cria sessão
 */
app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    // Validação básica dos campos
    if (!username || !password) {
        return res.json({ success: false, message: 'Por favor, preencha todos os campos.' });
    }
    
    const result = Database.authenticateUser(sanitizeInput(username), password);
    
    if (result.success) {
        // Criar sessão do usuário
        req.session.userId = result.user.id;
        req.session.username = result.user.username;
        
        // Salvar sessão explicitamente para garantir persistência
        req.session.save((err) => {
            if (err) {
                console.error('Erro ao salvar sessão:', err);
                return res.json({ success: false, message: 'Erro ao salvar sessão' });
            }
            
            res.json({ success: true, redirect: '/dashboard' });
        });
    } else {
        res.json({ success: false, message: result.message });
    }
});

/**
 * Processamento de cadastro
 * Cria novo usuário e redireciona para login
 */
app.post('/auth/register', (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    
    // Validação de campos obrigatórios
    if (!username || !email || !password || !confirmPassword) {
        return res.json({ success: false, message: 'Por favor, preencha todos os campos.' });
    }
    
    // Validação de formato do email
    if (!validateEmail(email)) {
        return res.json({ success: false, message: 'Email inválido.' });
    }
    
    // Validação de força da senha
    if (password.length < 6) {
        return res.json({ success: false, message: 'A senha deve ter pelo menos 6 caracteres.' });
    }
    // Validação de força da senha
    if (password.length < 6) {
        return res.json({ success: false, message: 'A senha deve ter pelo menos 6 caracteres.' });
    }
    
    // Validação de confirmação de senha
    if (password !== confirmPassword) {
        return res.json({ success: false, message: 'As senhas não coincidem.' });
    }
    
    // Tentar criar o usuário
    const result = Database.createUser(
        sanitizeInput(username),
        sanitizeInput(email),
        password
    );
    
    if (result.success) {
        res.json({ success: true, message: 'Usuário criado com sucesso! Faça login para continuar.' });
    } else {
        res.json({ success: false, message: result.message });
    }
});

// =============================================================================
// ROTAS DO DASHBOARD
// =============================================================================

/**
 * Dashboard principal - Área restrita
 * Requer autenticação via middleware requireAuth
 */
app.get('/dashboard', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

/**
 * API para dados do dashboard
 * Retorna informações do usuário, tarefas e estatísticas
 */
app.get('/api/dashboard-data', requireAuth, (req, res) => {
    const userId = req.session.userId;
    const user = Database.getUserById(userId);
    const tasks = Database.getTasks(userId);
    const stats = Database.getTaskStats(userId);
    
    // Aplicar filtros se especificados na query string
    const filter = req.query.filter || 'all';
    let filteredTasks = tasks;
    
    // Aplicar filtros baseado no parâmetro da query
    switch (filter) {
        case 'pending':
            filteredTasks = tasks.filter(task => !task.completed);
            break;
        case 'completed':
            filteredTasks = tasks.filter(task => task.completed);
            break;
        case 'high':
        case 'medium':
        case 'low':
            filteredTasks = tasks.filter(task => task.priority === filter && !task.completed);
            break;
        default: // 'all'
            filteredTasks = tasks;
    }
    
    // Ordenar por data de criação (mais recentes primeiro)
    filteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
        user,
        tasks: filteredTasks,
        allTasks: tasks,
        stats,
        filter
    });
});

// =============================================================================
// ROTAS DA API DE TAREFAS
// =============================================================================

/**
 * Criar nova tarefa
 * Requer título, descrição e prioridade opcionais
 */
app.post('/api/tasks', requireAuth, (req, res) => {
    const { title, description, priority } = req.body;
    const userId = req.session.userId;
    // Validação do campo obrigatório
    if (!title) {
        return res.json({ success: false, message: 'O título da tarefa é obrigatório.' });
    }
    
    // Criar tarefa com dados sanitizados
    const result = Database.createTask(
        userId,
        sanitizeInput(title),
        sanitizeInput(description || ''),
        sanitizeInput(priority || 'medium')
    );
    
    if (result.success) {
        res.json({ success: true, message: 'Tarefa criada com sucesso!' });
    } else {
        res.json({ success: false, message: result.message });
    }
});

/**
 * Atualizar tarefa existente
 * Permite modificar título, descrição e prioridade
 */
app.put('/api/tasks/:id', requireAuth, (req, res) => {
    const taskId = req.params.id;
    const userId = req.session.userId;
    const { title, description, priority } = req.body;
    
    // Sanitizar dados de entrada
    const data = {
        title: sanitizeInput(title),
        description: sanitizeInput(description || ''),
        priority: sanitizeInput(priority)
    };
    
    const result = Database.updateTask(taskId, userId, data);
    
    if (result.success) {
        res.json({ success: true, message: 'Tarefa atualizada com sucesso!' });
    } else {
        res.json({ success: false, message: result.message });
    }
});

/**
 * Excluir tarefa
 * Remove permanentemente a tarefa do usuário
 */
app.delete('/api/tasks/:id', requireAuth, (req, res) => {
    const taskId = req.params.id;
    const userId = req.session.userId;
    
    const result = Database.deleteTask(taskId, userId);
    
    if (result.success) {
        res.json({ success: true, message: 'Tarefa excluída com sucesso!' });
    } else {
        res.json({ success: false, message: result.message });
    }
});

/**
 * Alternar status de conclusão da tarefa
 * Marca como concluída ou pendente
 */
app.patch('/api/tasks/:id/toggle', requireAuth, (req, res) => {
    const taskId = req.params.id;
    const userId = req.session.userId;
    
    const result = Database.toggleTaskCompletion(taskId, userId);
    
    if (result.success) {
        const message = result.completed ? 'Tarefa marcada como concluída!' : 'Tarefa marcada como pendente!';
        res.json({ success: true, message, completed: result.completed });
    } else {
        res.json({ success: false, message: result.message });
    }
});

// =============================================================================
// ROTA DE LOGOUT E TRATAMENTO DE ERROS
// =============================================================================

/**
 * Logout do usuário
 * Destrói a sessão e limpa cookies
 */
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erro ao fazer logout:', err);
        }
        res.clearCookie('connect.sid');
        res.redirect('/auth');
    });
});

/**
 * Middleware para tratar rotas não encontradas (404)
 */
app.use((req, res) => {
    res.status(404).send('Página não encontrada');
});

// =============================================================================
// INICIALIZAÇÃO DO SERVIDOR
// =============================================================================

/**
 * Iniciar servidor Express na porta configurada
 * Aceita conexões de qualquer IP (0.0.0.0) para desenvolvimento
 */
app.listen(config.PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${config.PORT}`);
    console.log(`Aplicação: ${config.APP_NAME}`);
});

