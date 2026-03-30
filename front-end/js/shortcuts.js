const KeyboardShortcuts = {
  shortcuts: {},
  
  init() {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.registerDefaultShortcuts();
    this.showShortcutsHelp();
  },
  
  registerDefaultShortcuts() {
    this.shortcuts = {
      'ctrl+n': () => this.triggerAction('new'),
      'ctrl+s': () => this.triggerAction('save'),
      'ctrl+e': () => this.triggerAction('export'),
      'ctrl+f': () => this.triggerAction('search'),
      'ctrl+d': () => this.triggerAction('delete'),
      'escape': () => this.triggerAction('close'),
      'ctrl+,': () => this.triggerAction('settings'),
      'f1': () => this.toggleHelp(),
      'f5': () => this.triggerAction('refresh'),
      '+': () => this.triggerAction('nextPage'),
      '-': () => this.triggerAction('prevPage'),
      '?': () => this.toggleHelp()
    };
  },
  
  handleKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
      if (e.key === 'Escape') {
        this.triggerAction('close');
      }
      return;
    }

    const key = this.getKeyString(e);
    
    if (this.shortcuts[key]) {
      e.preventDefault();
      this.shortcuts[key]();
    }
  },
  
  getKeyString(e) {
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.shiftKey && e.key !== 'Shift') parts.push('shift');
    if (e.altKey) parts.push('alt');
    
    let key = e.key.toLowerCase();
    if (key === ' ') key = 'space';
    if (key === '=') key = '+';
    if (key === '-') key = '-';
    
    parts.push(key);
    return parts.join('+');
  },
  
  triggerAction(action) {
    switch(action) {
      case 'new':
        document.getElementById('Lancar')?.click();
        Toastify({ text: 'Novo lançamento (Ctrl+N)', duration: 1500, gravity: 'top' }).showToast();
        break;
      case 'save':
        document.getElementById('Confirmar')?.click();
        Toastify({ text: 'Salvar (Ctrl+S)', duration: 1500, gravity: 'top' }).showToast();
        break;
      case 'export':
        this.showExportMenu();
        break;
      case 'search':
        document.getElementById('filtro-busca')?.focus();
        break;
      case 'delete':
        document.getElementById('Deletar')?.click();
        break;
      case 'close':
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
          modal.classList.remove('active');
        });
        break;
      case 'settings':
        document.getElementById('user-profile')?.scrollIntoView();
        break;
      case 'refresh':
        window.location.reload();
        break;
      case 'nextPage':
        document.getElementById('next-page')?.click();
        break;
      case 'prevPage':
        document.getElementById('prev-page')?.click();
        break;
    }
  },
  
  showExportMenu() {
    Toastify({
      text: 'Escolha: Excel (1) | PDF (2) | CSV (3)',
      duration: 3000,
      gravity: 'bottom',
      close: true,
      onClick: () => {}
    }).showToast();
    
    const handler = (e) => {
      document.removeEventListener('keydown', handler);
      switch(e.key) {
        case '1': document.getElementById('export-excel')?.click(); break;
        case '2': document.getElementById('export-pdf')?.click(); break;
        case '3': document.getElementById('export-csv')?.click(); break;
      }
    };
    document.addEventListener('keydown', handler);
  },
  
  toggleHelp() {
    let helpPanel = document.getElementById('shortcuts-help');
    
    if (!helpPanel) {
      helpPanel = document.createElement('div');
      helpPanel.id = 'shortcuts-help';
      helpPanel.className = 'shortcuts-panel';
      helpPanel.innerHTML = this.getHelpHTML();
      document.body.appendChild(helpPanel);
      
      helpPanel.querySelector('.close-btn')?.addEventListener('click', () => {
        helpPanel.classList.remove('active');
      });
    }
    
    helpPanel.classList.toggle('active');
  },
  
  showShortcutsHelp() {
    console.log('%c⌨️ Atalhos do Teclado - Gestor Financeiro', 'font-size: 16px; font-weight: bold; color: #6366f1;');
    console.log('Ctrl+N - Novo lançamento');
    console.log('Ctrl+S - Salvar');
    console.log('Ctrl+E - Exportar');
    console.log('Ctrl+F - Buscar');
    console.log('Ctrl+D - Deletar');
    console.log('Esc - Fechar modal');
    console.log('F1 ou ? - Ajuda');
    console.log('F5 - Atualizar');
    console.log('+ / - - Próxima/Anterior página');
  },
  
  getHelpHTML() {
    return `
      <div class="shortcuts-header">
        <h3><i class="fas fa-keyboard"></i> Atalhos de Teclado</h3>
        <button class="close-btn"><i class="fas fa-times"></i></button>
      </div>
      <div class="shortcuts-list">
        <div class="shortcut-item"><span class="key">Ctrl + N</span><span>Novo lançamento</span></div>
        <div class="shortcut-item"><span class="key">Ctrl + S</span><span>Salvar</span></div>
        <div class="shortcut-item"><span class="key">Ctrl + E</span><span>Exportar</span></div>
        <div class="shortcut-item"><span class="key">Ctrl + F</span><span>Buscar</span></div>
        <div class="shortcut-item"><span class="key">Ctrl + D</span><span>Deletar</span></div>
        <div class="shortcut-item"><span class="key">Esc</span><span>Fechar modal</span></div>
        <div class="shortcut-item"><span class="key">F1 / ?</span><span>Esta ajuda</span></div>
        <div class="shortcut-item"><span class="key">F5</span><span>Atualizar</span></div>
        <div class="shortcut-item"><span class="key">+ / -</span><span>Páginas</span></div>
      </div>
      <style>
        .shortcuts-panel {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 320px;
          background: var(--bg-card, #1e293b);
          border-radius: 16px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.5);
          z-index: 10000;
          transform: translateX(400px);
          transition: transform 0.3s ease;
          border: 1px solid var(--border, #334155);
        }
        .shortcuts-panel.active { transform: translateX(0); }
        .shortcuts-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border, #334155);
        }
        .shortcuts-header h3 { margin: 0; font-size: 16px; color: #f1f5f9; }
        .close-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 18px;
        }
        .close-btn:hover { color: #ef4444; }
        .shortcuts-list { padding: 16px 20px; }
        .shortcut-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .shortcut-item:last-child { border-bottom: none; }
        .key {
          background: #0f172a;
          padding: 4px 10px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 12px;
          color: #10b981;
        }
        .shortcut-item span:last-child { color: #94a3b8; font-size: 14px; }
      </style>
    `;
  }
};

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => KeyboardShortcuts.init());
}
