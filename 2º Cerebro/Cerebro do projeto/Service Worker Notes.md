---
title: Service Worker Notes
description: Arquitetura PWA, caching, notificações push e modo offline
date: 2026-03-27
tags:
  - pwa
  - service-worker
  - offline
  - push-notifications
  - cache
aliases:
  - PWA
  - Service Worker
  - Offline
  - Notificações Push
cssclasses:
  - clean-embeds
---

# Service Worker Notes

> Documentação da arquitetura PWA do Gestor Financeiro.  
> Arquivo: `front-end/public/sw.js` (v3 — refatorado com Vite)

---

## Visão Geral

```mermaid
graph TD
    SW[Service Worker] -->|Install| SCACHE[STATIC_CACHE<br/>App Shell]
    SW -->|Fetch| D{Cache Strategy?}
    D -->|Static Assets| SCACHE
    D -->|API Calls| DCACHE[DATA_CACHE<br/>Network First]
    SW -->|Push| P[Push Event]
    SW -->|Sync| S[Sync Event]
    P -->|Show| N[Notification]
    S -->|Retry| API[Pending API Calls]
```

---

## Cache Strategies

### STATIC_CACHE (Cache-First)

Usado para assets estáticos — HTML, CSS, JS, imagens, fontes.

```javascript
const STATIC_CACHE = 'static-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/modern.css',
  '/js/main.js',
  '/js/config.js',
  // ...
];
```

| Evento | Ação |
|--------|------|
| `install` | Pré-cacheia todos os `STATIC_ASSETS` |
| `activate` | Limpa caches antigos (versão anterior) |
| `fetch` | Cache-first: serve do cache, busca em paralelo |

> [!tip] Cache-First
> Garante que o app carregue instantaneamente mesmo offline, pois os assets já estão em cache.

### DATA_CACHE (Network-First)

Usado para chamadas de API (`/api/listar`, `/api/profile`, etc.).

| Situação | Comportamento |
|----------|---------------|
| ✅ Online | Busca da rede → atualiza cache → retorna resposta |
| ❌ Offline | Tenta rede → falha → retorna 503 (não usa cache stale) |

> [!warning] Sem stale cache para dados financeiros
> Optamos por não servir dados desatualizados quando offline para evitar que o usuário tome decisões com base em info incorreta.  
> Em vez disso, mostramos um banner "Offline — dados podem estar desatualizados".

---

## Service Worker Lifecycle

```mermaid
sequenceDiagram
    participant Browser
    participant SW as Service Worker
    participant Cache
    participant Network
    
    Browser->>SW: Register sw.js
    SW->>Cache: Install: cache static assets
    SW->>Browser: installed (waiting)
    Browser->>SW: Activate (page reload)
    SW->>Cache: Clean old caches
    SW->>Browser: activated (controlling)
    
    Note over SW: Now intercepting all fetch requests
    
    Browser->>SW: Fetch /index.html
    SW->>Cache: Serve from static cache
    Cache-->>Browser: index.html
    
    Browser->>SW: Fetch /api/listar
    SW->>Network: Try network first
    alt Online
        Network-->>SW: Response
        SW->>Cache: Update data cache
        SW-->>Browser: Response
    else Offline
        Network--xSW: Failed
        SW-->>Browser: 503 + offline banner
    end
```

---

## Notificações Push

### Arquitetura

```mermaid
graph LR
    F[Frontend] -->|Register| SW[Service Worker]
    F -->|Subscribe| PS[Push Service]
    PS -->|Push Event| SW
    SW -->|Show| N[Notification]
    N -->|Click| F
```

### Código (Frontend)

No [[Gestor Financeiro#📱 PWA Offline|NotificatioManager]]:

```javascript
// Registrar service worker
const reg = await navigator.serviceWorker.register('/sw.js');

// Inscrever para push
const sub = await reg.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
});

// Salvar subscription no backend
await fetch('/api/push/subscribe', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify(sub.toJSON())
});
```

### Service Worker (Push Handler)

```javascript
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {
    title: 'Gestor Financeiro',
    body: 'Você tem novas movimentações!'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/badge.png',
      actions: [
        { action: 'open', title: 'Abrir' },
        { action: 'close', title: 'Fechar' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open') {
    clients.openWindow('/');
  }
});
```

---

## Modo Offline

### Indicador Visual

```html
<!-- Banner offline no index.html -->
<div id="offline-banner" class="offline-banner" style="display:none">
  <i class="fas fa-wifi-slash"></i> Modo offline — as alterações serão sincronizadas quando reconectar.
</div>
```

```javascript
// offlineManager no notifications.js
window.addEventListener('online', () => {
  document.getElementById('offline-banner').style.display = 'none';
  syncPendingTransactions();
});

window.addEventListener('offline', () => {
  document.getElementById('offline-banner').style.display = 'flex';
});
```

### Sincronização

| Operação | Comportamento Offline |
|----------|----------------------|
| Criar lançamento | Salva em fila local (`localStorage`) |
| Editar lançamento | Salva em fila local |
| Deletar lançamento | Salva em fila local |
| Listar | Mostra banner offline + dados do cache |
| Login/Registro | Bloqueado (requer rede) |

```mermaid
flowchart LR
    A[Usuário cria transação] --> B{Online?}
    B -->|Sim| C[Enviar para API]
    B -->|Não| D[Salvar em pendingQueue]
    D --> E[Reconectou?]
    E -->|Sim| F[Processar fila]
    F --> C
```

---

## VAPID Keys (Push)

Para gerar as chaves VAPID:

```bash
npx web-push generate-vapid-keys
```

```
Public Key: BEl...w==
Private Key: CQW...w==
```

> [!warning] As chaves VAPID devem ser adicionadas como env vars no Vercel:
> - `VAPID_PUBLIC_KEY`
> - `VAPID_PRIVATE_KEY`
> - `VAPID_SUBJECT` (mailto: seu@email.com)

---

## Performance

| Métrica | Valor | Nota |
|---------|:-----:|------|
| Tamanho do sw.js | ~2KB | Minificado |
| Static Cache Size | ~150KB | App shell completo |
| Estratégia API | Network-First | Prioriza dados atuais |
| Instalação PWA | ~3s (3G) | App shell leve |

---

## Checklist PWA

- [x] `manifest.json` com nome, ícones e theme_color
- [x] Service Worker registrado e ativo
- [x] Cache de assets estáticos (cache-first)
- [x] Fallback offline com banner
- [x] Push notifications configuradas
- [x] Ícone 192×192 e 512×512
- [x] Meta tags `mobile-web-app-capable`
- [x] Estratégia de atualização (activate → limpar caches antigos)

%%==================================================================================%%

## Notas Relacionadas

- [[Gestor Financeiro]]
- [[API Documentation]]
- [[Readme do Projeto]]
- [[Ideias de Melhorias]]
