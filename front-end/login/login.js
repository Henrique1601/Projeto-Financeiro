const API_BASE_URL = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://projeto-financeiro-vert.vercel.app';

const FINANCEIRO_URL = '../index.html';

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

function showForgotForm() {
    window.location.href = './Esqueci a senha/Senha.html';
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
    document.getElementById('show-register')?.addEventListener('click', showRegisterForm);
    document.getElementById('show-login')?.addEventListener('click', showLoginForm);
    document.getElementById('show-forgot')?.addEventListener('click', showForgotForm);
    
    document.getElementById('btn-google-login')?.addEventListener('click', () => loginSocial('google'));
    document.getElementById('btn-github-login')?.addEventListener('click', () => loginSocial('github'));

    document.getElementById('login-form')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            login();
        }
    });
});

async function loginSocial(provider) {
    const width = 500;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    Toastify({
        text: `Login com ${provider.charAt(0).toUpperCase() + provider.slice(1)} será implementado em breve.`,
        duration: 4000,
        gravity: 'top',
        position: 'right',
        style: { background: '#f59e0b' },
    }).showToast();
    
    return;
    
    const authUrl = `${API_BASE_URL}/api/auth/${provider}`;
    const popup = window.open(
        authUrl,
        `${provider}Auth`,
        `width=${width},height=${height},left=${left},top=${top}`
    );
    
    const checkPopup = setInterval(() => {
        if (popup.closed) {
            clearInterval(checkPopup);
            const token = localStorage.getItem('token');
            if (token) {
                Toastify({
                    text: 'Login social realizado!',
                    duration: 2000,
                    gravity: 'top',
                    style: { background: '#10b981' },
                }).showToast();
                setTimeout(() => {
                    window.location.href = FINANCEIRO_URL;
                }, 1500);
            }
        }
    }, 500);
    
    window.addEventListener('message', (event) => {
        if (event.data?.token) {
            localStorage.setItem('token', event.data.token);
            popup.close();
        }
    });
}
