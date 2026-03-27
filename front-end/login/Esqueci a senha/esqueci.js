const API_BASE_URL = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://financeiro-backend.vercel.app';

const forgotForm = document.getElementById('forgot-form');
const resetForm = document.getElementById('reset-form');

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

document.getElementById('btn-forgot').addEventListener('click', async () => {
    const email = document.getElementById('forgot-email').value;
    
    if (!email) {
        Toastify({
            text: 'Digite seu email.',
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: { background: '#ef4444' },
        }).showToast();
        return;
    }

    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const result = await response.json();

        if (response.ok) {
            Toastify({
                text: 'Código enviado! Verifique o console.',
                duration: 4000,
                gravity: 'top',
                position: 'right',
                style: { background: '#10b981' },
            }).showToast();
            
            document.getElementById('reset-email').value = email;
            forgotForm.classList.remove('active');
            resetForm.classList.add('active');
        } else {
            Toastify({
                text: result.error || 'Erro ao enviar código.',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                style: { background: '#ef4444' },
            }).showToast();
        }
    } catch (err) {
        Toastify({
            text: 'Erro ao conectar ao servidor.',
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: { background: '#ef4444' },
        }).showToast();
    }
});

document.getElementById('btn-reset').addEventListener('click', async () => {
    const email = document.getElementById('reset-email').value;
    const code = document.getElementById('reset-code').value;
    const senha = document.getElementById('reset-senha').value;
    const senha2 = document.getElementById('reset-senha2').value;

    if (!email || !code || !senha || !senha2) {
        Toastify({
            text: 'Preencha todos os campos.',
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: { background: '#ef4444' },
        }).showToast();
        return;
    }

    if (senha !== senha2) {
        Toastify({
            text: 'As senhas não coincidem.',
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: { background: '#ef4444' },
        }).showToast();
        return;
    }

    if (senha.length < 4) {
        Toastify({
            text: 'A senha deve ter pelo menos 4 caracteres.',
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: { background: '#ef4444' },
        }).showToast();
        return;
    }

    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code, senha })
        });

        const result = await response.json();

        if (response.ok) {
            Toastify({
                text: 'Senha redefinida com sucesso!',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                style: { background: '#10b981' },
            }).showToast();
            setTimeout(() => {
                window.location.href = './login.html';
            }, 1500);
        } else {
            Toastify({
                text: result.error || 'Erro ao redefinir senha.',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                style: { background: '#ef4444' },
            }).showToast();
        }
    } catch (err) {
        Toastify({
            text: 'Erro ao conectar ao servidor.',
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: { background: '#ef4444' },
        }).showToast();
    }
});

document.getElementById('btn-resend').addEventListener('click', () => {
    const email = document.getElementById('reset-email').value || document.getElementById('forgot-email').value;
    document.getElementById('forgot-email').value = email;
    forgotForm.classList.add('active');
    resetForm.classList.remove('active');
});
