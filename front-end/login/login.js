const FINANCEIRO_URL = '../../index.html'; // Definir como constante

// Definir a URL base diretamente
const API_BASE_URL = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
    ? 'http://localhost:3000' // Porta do backend local
    : 'https://financeiro-backend.vercel.app'; // Substitua por sua URL do Vercel

// Função auxiliar para fetch com retentativas
async function fetchWithRetry(url, options, retries = 3, delay = 1000, timeout = 10000) {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (error) {
            if (i === retries - 1) throw error;
            console.warn(`Tentativa ${i + 1} falhou: ${error.message}. Tentando novamente em ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Verificar se já está logado
let token = localStorage.getItem('token');
const BtnLogin = document.getElementById('Btn-Login');

if (token) {
    window.location.href = FINANCEIRO_URL; // Redireciona para a página do financeiro
}

// Mostrar formulário de login
function showLoginForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    if (loginForm && registerForm) {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        console.error('Formulários de login ou registro não encontrados.');
    }
}

// Mostrar formulário de registro
function showRegisterForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    if (loginForm && registerForm) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    } else {
        console.error('Formulários de login ou registro não encontrados.');
    }
}

// Registrar usuário
async function register() {
    const nome = document.getElementById('register-FNome')?.value;
    const sobrenome = document.getElementById('register-SNome')?.value;
    const email = document.getElementById('register-Email')?.value;
    const senha = document.getElementById('register-Senha')?.value;

    if (!nome || !sobrenome || !email || !senha) {
        Toastify({
            text: 'Por favor, preencha todos os campos.',
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: { background: 'red' },
        }).showToast();
        return;
    }

    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, sobrenome, email, senha })
        });

        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            throw new Error(`Erro na resposta do servidor: ${response.status} - ${response.statusText}`);
        }

        if (response.ok) {
            Toastify({
                text: 'Registro bem-sucedido! Faça login.',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                style: { background: 'green' },
            }).showToast();
            showLoginForm();
        } else {
            Toastify({
                text: result.error || 'Erro ao registrar.',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                style: { background: 'red' },
            }).showToast();
        }
    } catch (err) {
        console.error('Erro ao registrar:', err);
        Toastify({
            text: 'Erro ao conectar ao servidor: ' + err.message,
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: { background: 'red' },
        }).showToast();
    }
}

// Login
async function login() {
    const email = document.getElementById('Email')?.value;
    const senha = document.getElementById('Senha')?.value;

    if (!email || !senha) {
        Toastify({
            text: 'Por favor, preencha email e senha.',
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: { background: 'red' },
        }).showToast();
        return;
    }

    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });

        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            throw new Error(`Erro na resposta do servidor: ${response.status} - ${response.statusText}`);
        }

        if (response.ok) {
            token = result.token;
            localStorage.setItem('token', token);
            window.location.href = FINANCEIRO_URL; // Redireciona para a página do financeiro
        } else {
            Toastify({
                text: result.error || 'Erro ao fazer login.',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                style: { background: 'red' },
            }).showToast();
        }
    } catch (err) {
        console.error('Erro ao fazer login:', err);
        Toastify({
            text: 'Erro ao conectar ao servidor: ' + err.message,
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: { background: 'red' },
        }).showToast();
    }
}

// Logout (não é usado na página de login, mas mantido para consistência)
function logout() {
    localStorage.removeItem('token');
    token = null;
    showLoginForm();
}

// Inicializar eventos
document.addEventListener('DOMContentLoaded', () => {
    showLoginForm();

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                login();
            }
        });
    } else {
        console.error('Formulário de login não encontrado.');
    }

    if (registerForm) {
        registerForm.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                register();
            }
        });
    } else {
        console.error('Formulário de registro não encontrado.');
    }

    if (BtnLogin) {
        BtnLogin.addEventListener('click', login);
    } else {
        console.error('Botão de login com ID "Btn-Login" não encontrado.');
    }

    const btnShowRegister = document.getElementById('show-register');
    if (btnShowRegister) {
        btnShowRegister.addEventListener('click', showRegisterForm);
    } else {
        console.error('Botão para mostrar formulário de registro não encontrado.');
    }

    const btnShowLogin = document.getElementById('show-login');
    if (btnShowLogin) {
        btnShowLogin.addEventListener('click', showLoginForm);
    } else {
        console.error('Botão para mostrar formulário de login não encontrado.');
    }
});