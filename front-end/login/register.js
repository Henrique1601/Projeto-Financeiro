const getApiBaseUrl = () => {
    return window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
        ? 'http://localhost:3000'
        : 'https://projeto-financeiro-vert.vercel.app';
};

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
            await new Promise(resolve => setTimeout(resolve, delay));
        }
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
        const response = await fetchWithRetry(`${getApiBaseUrl()}/api/register`, {
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
            if (typeof showLoginForm === 'function') {
                showLoginForm();
            } else {
                window.location.href = './login.html';
            }
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

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('Btn-Register')?.addEventListener('click', register);
    document.getElementById('register-form')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            register();
        }
    });
});
