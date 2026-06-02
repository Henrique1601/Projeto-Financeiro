import { API_BASE_URL } from '../config.js';

const SUGGESTIONS = [
  'Resumo do mês',
  'Maiores gastos',
  'Padrões nos gastos',
  'Dica de economia',
];

let conversation = [];
let isOpen = false;

export function initChat() {
  const fab = document.getElementById('chatFab');
  const panel = document.getElementById('chatPanel');
  const backdrop = document.getElementById('chatBackdrop');
  const closeBtn = document.getElementById('chatCloseBtn');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');
  const messages = document.getElementById('chatMessages');
  const suggestions = document.getElementById('chatSuggestions');

  if (!fab) return;

  const toggle = (open) => {
    isOpen = open;
    panel.classList.toggle('open', open);
    backdrop.classList.toggle('open', open);
    fab.innerHTML = open ? '<i class="fas fa-times"></i>' : '<i class="fas fa-comment"></i>';
    if (open) {
      input.focus();
      messages.scrollTop = messages.scrollHeight;
    }
  };

  fab.addEventListener('click', () => toggle(!isOpen));
  closeBtn.addEventListener('click', () => toggle(false));
  backdrop.addEventListener('click', () => toggle(false));

  const send = () => {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';
    addMessage(text, 'user');
    conversation.push({ role: 'user', content: text });
    sendToAI(text);
  };

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 80) + 'px';
  });

  suggestions.querySelectorAll('.chat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      input.value = chip.textContent.trim();
      send();
    });
  });
}

function addMessage(content, role) {
  const messages = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.textContent = content;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function showLoading() {
  const messages = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg assistant loading';
  div.id = 'chatLoading';
  div.textContent = 'Analisando';
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function removeLoading() {
  const el = document.getElementById('chatLoading');
  if (el) el.remove();
}

function updateAssistantMessage(content) {
  const messages = document.getElementById('chatMessages');
  let el = document.querySelector('.chat-msg.assistant.streaming');
  if (!el) {
    el = document.createElement('div');
    el.className = 'chat-msg assistant streaming';
    messages.appendChild(el);
  }
  el.textContent = content;
  messages.scrollTop = messages.scrollHeight;
}

function finalizeAssistantMessage(content) {
  const el = document.querySelector('.chat-msg.assistant.streaming');
  if (el) {
    el.classList.remove('streaming');
    el.textContent = content;
  } else {
    addMessage(content, 'assistant');
  }
}

function showError(msg) {
  removeLoading();
  const messages = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg assistant error';
  div.textContent = msg || 'Erro ao processar. Tente novamente.';
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

async function sendToAI(pergunta) {
  showLoading();
  const token = localStorage.getItem('token');
  let fullContent = '';

  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ pergunta, conversa: conversation.slice(0, -1) }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Erro ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    removeLoading();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.done) {
            fullContent = data.fullContent || fullContent;
            finalizeAssistantMessage(fullContent);
          } else if (data.content) {
            fullContent += data.content;
            updateAssistantMessage(fullContent);
          }
        } catch {}
      }
    }

    conversation.push({ role: 'assistant', content: fullContent });
  } catch (err) {
    removeLoading();
    showError(err.message);
  }
}
