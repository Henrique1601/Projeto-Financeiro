const FINANCEIRO_URL = '../index.html';

const API_BASE_URL = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
    ? 'http://localhost:3000'
    : '';

async function fetchWithRetry(url, options, retries = 3, delay = 1000, timeout = 15000) {
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

let token = localStorage.getItem('token');

if (token) {
    window.location.href = FINANCEIRO_URL;
}

function showLoginForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    if (loginForm && registerForm) {
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
    }
}

function showRegisterForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    if (loginForm && registerForm) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
    }
}

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
            style: { background: '#ef4444' },
        }).showToast();
        return;
    }

    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, sobrenome, email, senha })
        });

        const result = await response.json();

        if (response.ok) {
            Toastify({
                text: 'Conta criada! Faça login.',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                style: { background: '#10b981' },
            }).showToast();
            showLoginForm();
        } else {
            Toastify({
                text: result.error || 'Erro ao registrar.',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                style: { background: '#ef4444' },
            }).showToast();
        }
    } catch (err) {
        console.error('Erro ao registrar:', err);
        Toastify({
            text: 'Erro ao conectar ao servidor.',
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: { background: '#ef4444' },
        }).showToast();
    }
}

async function login() {
    const email = document.getElementById('Email')?.value;
    const senha = document.getElementById('Senha')?.value;

    if (!email || !senha) {
        Toastify({
            text: 'Preencha email e senha.',
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: { background: '#ef4444' },
        }).showToast();
        return;
    }

    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const result = await response.json();

        if (response.ok) {
            token = result.token;
            localStorage.setItem('token', token);
            Toastify({
                text: 'Login realizado!',
                duration: 1500,
                gravity: 'top',
                position: 'right',
                style: { background: '#10b981' },
            }).showToast();
            setTimeout(() => {
                window.location.href = FINANCEIRO_URL;
            }, 1500);
        } else {
            Toastify({
                text: result.error || 'Email ou senha incorretos.',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                style: { background: '#ef4444' },
            }).showToast();
        }
    } catch (err) {
        console.error('Erro ao fazer login:', err);
        Toastify({
            text: 'Erro ao conectar ao servidor.',
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: { background: '#ef4444' },
        }).showToast();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    showLoginForm();

    document.getElementById('Btn-Login')?.addEventListener('click', login);
    document.getElementById('Btn-Register')?.addEventListener('click', register);
    document.getElementById('show-register')?.addEventListener('click', showRegisterForm);
    document.getElementById('show-login')?.addEventListener('click', showLoginForm);

    document.getElementById('login-form')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            login();
        }
    });

    document.getElementById('register-form')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            register();
        }
    });
});
