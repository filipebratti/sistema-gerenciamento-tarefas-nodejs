// Função para alternar entre abas de login e cadastro
function showTab(tabName) {
    // Remover classe active de todas as abas e formulários
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Adicionar classe active na aba e formulário selecionados
    event.target.classList.add('active');
    document.getElementById(tabName + '-form').classList.add('active');
}

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
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        return await response.json();
    } catch (error) {
        console.error('Erro na requisição:', error);
        return { success: false, message: 'Erro de conexão' };
    }
}

// Processar formulário de login
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = {
                username: formData.get('username'),
                password: formData.get('password')
            };
            
            const submitBtn = this.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Entrando...';
            
            const result = await makeRequest('/auth/login', 'POST', data);
            
            if (result.success) {
                showAlert('Login realizado com sucesso!', 'success');
                setTimeout(() => {
                    window.location.href = result.redirect || '/dashboard';
                }, 1000);
            } else {
                showAlert(result.message);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Entrar';
            }
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = {
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword')
            };
            
            const submitBtn = this.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Cadastrando...';
            
            const result = await makeRequest('/auth/register', 'POST', data);
            
            if (result.success) {
                showAlert(result.message, 'success');
                this.reset();
                // Mudar para aba de login
                showTab('login');
            } else {
                showAlert(result.message);
            }
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Cadastrar';
        });
    }
    
    // Validação em tempo real para o formulário de cadastro
    const password = document.getElementById('reg-password');
    const confirmPassword = document.getElementById('confirm-password');
    
    if (password && confirmPassword) {
        function validatePasswordMatch() {
            if (password.value !== confirmPassword.value) {
                confirmPassword.setCustomValidity('As senhas não coincidem');
            } else {
                confirmPassword.setCustomValidity('');
            }
        }
        
        password.addEventListener('input', validatePasswordMatch);
        confirmPassword.addEventListener('input', validatePasswordMatch);
        
        // Validar força da senha
        password.addEventListener('input', function() {
            const value = this.value;
            let strengthIndicator = document.getElementById('password-strength');
            
            if (!strengthIndicator) {
                strengthIndicator = document.createElement('div');
                strengthIndicator.id = 'password-strength';
                strengthIndicator.style.marginTop = '5px';
                strengthIndicator.style.fontSize = '12px';
                this.parentNode.appendChild(strengthIndicator);
            }
            
            const strength = calculatePasswordStrength(value);
            strengthIndicator.textContent = strength.text;
            strengthIndicator.style.color = strength.color;
        });
    }
});

// Função para calcular força da senha
function calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    const strengths = [
        { text: 'Muito fraca', color: '#f56565' },
        { text: 'Fraca', color: '#ed8936' },
        { text: 'Regular', color: '#ecc94b' },
        { text: 'Boa', color: '#48bb78' },
        { text: 'Forte', color: '#38a169' },
        { text: 'Muito forte', color: '#22543d' }
    ];
    
    if (password.length === 0) {
        return { text: '', color: '' };
    }
    
    return strengths[score] || strengths[0];
}

// Animações suaves para os formulários
document.addEventListener('DOMContentLoaded', function() {
    const authBox = document.querySelector('.auth-box');
    if (authBox) {
        authBox.style.opacity = '0';
        authBox.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            authBox.style.transition = 'all 0.5s ease';
            authBox.style.opacity = '1';
            authBox.style.transform = 'translateY(0)';
        }, 100);
    }
});

