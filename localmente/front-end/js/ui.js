// js/ui.js
import { showToast } from './utils.js'; // se já tiver toast no utils, ou mantenha separado

// 1. Spinner (já existe no utils, mas se quiser customizar aqui)
export function showSpinner(message = 'Processando...') {
  const spinner = document.getElementById('spinner');
  if (spinner) {
    spinner.querySelector('p')?.textContent = message || 'Processando...';
    spinner.style.display = 'flex';
  }
}

export function hideSpinner() {
  const spinner = document.getElementById('spinner');
  if (spinner) spinner.style.display = 'none';
}

// 2. Atualizar nome do usuário (se tiver na tela)
export function atualizarUserName(nome) {
  const userNameEl = document.getElementById('user-name') || document.querySelector('.user-name');
  if (userNameEl) userNameEl.textContent = nome || 'Usuário';
}

// 3. Atualizar saldo total (se exibido na tela)
export function atualizarSaldo(valor) {
  const saldoEl = document.getElementById('saldo-total') || document.querySelector('.saldo');
  if (saldoEl) {
    saldoEl.textContent = Number(valor).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }) || 'R$ 0,00';
  }
}

// 4. Mostrar mensagem flutuante custom (sucesso/erro/info) – baseado no seu código truncado
export function showCustomMessage(mensagem, tipo = 'success') {
  const cores = {
    success: '#4caf50',
    error:   '#f44336',
    info:    '#2196f3',
    warning: '#ff9800'
  };

  const mensagemDiv = document.createElement('div');
  mensagemDiv.style.position = 'fixed';
  mensagemDiv.style.top = '20px';
  mensagemDiv.style.left = '50%';
  mensagemDiv.style.transform = 'translateX(-50%)';
  mensagemDiv.style.backgroundColor = cores[tipo] || '#333';
  mensagemDiv.style.color = 'white';
  mensagemDiv.style.padding = '12px 20px';
  mensagemDiv.style.borderRadius = '8px';
  mensagemDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
  mensagemDiv.style.zIndex = '2000';
  mensagemDiv.style.minWidth = '300px';
  mensagemDiv.style.textAlign = 'center';

  const texto = document.createElement('span');
  texto.textContent = mensagem;
  mensagemDiv.appendChild(texto);

  const fecharBtn = document.createElement('button');
  fecharBtn.textContent = '✕';
  fecharBtn.style.position = 'absolute';
  fecharBtn.style.right = '10px';
  fecharBtn.style.top = '50%';
  fecharBtn.style.transform = 'translateY(-50%)';
  fecharBtn.style.background = 'none';
  fecharBtn.style.border = 'none';
  fecharBtn.style.color = 'white';
  fecharBtn.style.fontSize = '18px';
  fecharBtn.style.cursor = 'pointer';
  fecharBtn.onclick = () => mensagemDiv.remove();
  mensagemDiv.appendChild(fecharBtn);

  document.body.appendChild(mensagemDiv);

  setTimeout(() => {
    if (mensagemDiv.parentNode) mensagemDiv.remove();
  }, 8000); // 8 segundos
}

// 5. Abrir / fechar modal genérico
export function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
    // Opcional: focar no primeiro input
    modal.querySelector('input, select, textarea')?.focus();
  }
}

export function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'none';
}

// 6. Limpar formulário
export function limparFormulario(formId) {
  const form = document.getElementById(formId);
  if (form) form.reset();
}

// 7. Desabilitar / habilitar botão durante requisições
export function desabilitarBotao(btnId, texto = 'Processando...') {
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.disabled = true;
    btn.dataset.textoOriginal = btn.textContent;
    btn.textContent = texto;
  }
}

export function habilitarBotao(btnId) {
  const btn = document.getElementById(btnId);
  if (btn && btn.dataset.textoOriginal) {
    btn.disabled = false;
    btn.textContent = btn.dataset.textoOriginal;
  }
}

// 8. Highlight em linha (ex: após editar)
export function highlightRow(rowElement, duration = 2000) {
  if (!rowElement) return;
  rowElement.style.backgroundColor = '#e8f5e9'; // verde claro
  setTimeout(() => {
    rowElement.style.backgroundColor = '';
  }, duration);
}