/**
 * Configurações e utilitários do sistema
 * Centraliza configurações, funções de segurança e validação
 */

const path = require('path');
const crypto = require('crypto');

// =============================================================================
// CONFIGURAÇÕES DA APLICAÇÃO
// =============================================================================

/**
 * Configurações gerais da aplicação
 * Utiliza variáveis de ambiente quando disponíveis
 */
const config = {
    APP_NAME: 'Sistema de Tarefas Node.js',
    PORT: process.env.PORT || 3000,
    DATA_DIR: path.join(__dirname, 'data'),
    USERS_FILE: path.join(__dirname, 'data', 'users.json'),
    TASKS_FILE: path.join(__dirname, 'data', 'tasks.json'),
    SESSION_SECRET: process.env.SESSION_SECRET || 'sistema-tarefas-secret-key'
};

// =============================================================================
// FUNÇÕES UTILITÁRIAS
// =============================================================================

/**
 * Sanitiza entrada do usuário removendo caracteres perigosos
 * Previne ataques básicos de XSS
 * @param {string} data - Dados a serem sanitizados
 * @returns {string} - Dados sanitizados
 */
function sanitizeInput(data) {
    if (typeof data !== 'string') return data;
    return data.trim().replace(/[<>]/g, '');
}

/**
 * Valida formato de email usando regex
 * @param {string} email - Email a ser validado
 * @returns {boolean} - True se válido, false caso contrário
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// =============================================================================
// FUNÇÕES DE SEGURANÇA
// =============================================================================

/**
 * Gera hash SHA-256 da senha
 * @param {string} password - Senha em texto plano
 * @returns {string} - Hash da senha
 */
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Verifica se senha corresponde ao hash armazenado
 * @param {string} password - Senha em texto plano
 * @param {string} hash - Hash armazenado
 * @returns {boolean} - True se corresponde, false caso contrário
 */
function verifyPassword(password, hash) {
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    return passwordHash === hash;
}

/**
 * Gera ID único usando bytes aleatórios
 * @returns {string} - ID único em hexadecimal
 */
function generateId() {
    return crypto.randomBytes(16).toString('hex');
}

// =============================================================================
// MIDDLEWARES DE AUTENTICAÇÃO
// =============================================================================

/**
 * Verifica se usuário está autenticado
 * @param {Object} req - Objeto de requisição Express
 * @returns {boolean} - True se autenticado, false caso contrário
 */
function isLoggedIn(req) {
    return req.session && req.session.userId;
}

/**
 * Middleware para proteger rotas que requerem autenticação
 * Redireciona para login ou retorna erro 401 para APIs
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função next do middleware
 */
function requireAuth(req, res, next) {
    if (isLoggedIn(req)) {
        next();
    } else {
        // Verificar se é uma requisição AJAX/API
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1) || req.path.startsWith('/api/')) {
            res.status(401).json({ success: false, message: 'Não autorizado' });
        } else {
            res.redirect('/auth');
        }
    }
}

// =============================================================================
// FUNÇÕES DE FORMATAÇÃO
// =============================================================================

/**
 * Formata data para exibição no padrão brasileiro
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} - Data formatada no padrão pt-BR
 */
function formatDate(date) {
    return new Date(date).toLocaleString('pt-BR');
}

// =============================================================================
// EXPORTAÇÕES
// =============================================================================

module.exports = {
    config,
    sanitizeInput,
    validateEmail,
    hashPassword,
    verifyPassword,
    generateId,
    isLoggedIn,
    requireAuth,
    formatDate
};

