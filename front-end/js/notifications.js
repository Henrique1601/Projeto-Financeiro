const NotificationManager = {
  permission: 'default',
  
  async init() {
    this.permission = Notification.permission;
    
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.pushManager) {
          this.subscription = await registration.pushManager.getSubscription();
        }
      } catch (err) {
        console.log('[Notifications] SW ready check failed:', err);
      }
    }
    
    this.setupOfflineListener();
  },
  
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('[Notifications] Browser does not support notifications');
      return false;
    }
    
    if (this.permission === 'granted') {
      return true;
    }
    
    if (this.permission !== 'denied') {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    }
    
    return false;
  },
  
  async subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }
    
    const registration = await navigator.serviceWorker.ready;
    
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U')
      });
      
      console.log('[Notifications] Push subscription:', subscription);
      return subscription;
    } catch (err) {
      console.log('[Notifications] Failed to subscribe:', err);
      return null;
    }
  },
  
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },
  
  show(title, options = {}) {
    if (this.permission !== 'granted') {
      return null;
    }
    
    const notification = new Notification(title, {
      icon: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png',
      ...options
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    setTimeout(() => notification.close(), options.duration || 5000);
    
    return notification;
  },
  
  setupOfflineListener() {
    const offlineIndicator = document.getElementById('offlineIndicator');
    
    window.addEventListener('online', () => {
      if (offlineIndicator) {
        offlineIndicator.style.display = 'none';
      }
      Toastify({
        text: 'Conexão restaurada!',
        duration: 3000,
        gravity: 'top',
        backgroundColor: '#10b981'
      }).showToast();
      
      this.syncPendingData();
    });
    
    window.addEventListener('offline', () => {
      if (offlineIndicator) {
        offlineIndicator.style.display = 'block';
      }
      Toastify({
        text: 'Você está offline. Dados serão sincronizados quando a conexão voltar.',
        duration: 5000,
        gravity: 'top',
        backgroundColor: '#f59e0b'
      }).showToast();
    });
    
    if (!navigator.onLine) {
      if (offlineIndicator) {
        offlineIndicator.style.display = 'block';
      }
    }
  },
  
  async syncPendingData() {
    const pendingData = localStorage.getItem('pendingSync');
    if (!pendingData) return;
    
    try {
      const items = JSON.parse(pendingData);
      for (const item of items) {
        await fetch(item.url, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(item.data)
        });
      }
      localStorage.removeItem('pendingSync');
      console.log('[Sync] Pending data synced successfully');
    } catch (err) {
      console.error('[Sync] Failed to sync pending data:', err);
    }
  },
  
  async savePendingData(url, method, data) {
    const pendingData = JSON.parse(localStorage.getItem('pendingSync') || '[]');
    pendingData.push({ url, method, data, timestamp: Date.now() });
    localStorage.setItem('pendingSync', JSON.stringify(pendingData));
    
    if ('serviceWorker' in navigator && 'sync' in window.registration) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-data');
    }
  },
  
  notifyGastosExcedidos(categoria, valor, meta) {
    this.show('Alerta de Gastos!', {
      body: `${categoria}: R$ ${valor.toFixed(2)} de R$ ${meta.toFixed(2)} (${Math.round(valor/meta*100)}%)`,
      tag: 'gastos-excedidos',
      requireInteraction: true
    });
  },
  
  notifyContaVencendo(descricao, dataVencimento) {
    const diasRestantes = Math.ceil((new Date(dataVencimento) - new Date()) / (1000 * 60 * 60 * 24));
    
    this.show('Lembrete de Conta', {
      body: `${descricao} vence em ${diasRestantes} dia(s)`,
      tag: 'conta-vencendo'
    });
  }
};

const OfflineManager = {
  cacheName: 'gestor-data-v2',
  
  async saveDataLocally(key, data) {
    try {
      const cached = await caches.open(this.cacheName);
      const response = new Response(JSON.stringify(data));
      await cached.put(key, response);
      localStorage.setItem(`local_${key}`, JSON.stringify(data));
    } catch (err) {
      console.error('[Offline] Failed to save locally:', err);
    }
  },
  
  async getLocalData(key) {
    try {
      const cached = await caches.match(key);
      if (cached) {
        const data = await cached.json();
        return data;
      }
      
      const local = localStorage.getItem(`local_${key}`);
      return local ? JSON.parse(local) : null;
    } catch (err) {
      const local = localStorage.getItem(`local_${key}`);
      return local ? JSON.parse(local) : null;
    }
  },
  
  setupAutoSync() {
    if (!navigator.onLine) return;
    
    setInterval(async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const API_BASE_URL = window.location.hostname.includes('vercel')
          ? 'https://financeiro-backend.vercel.app'
          : 'http://localhost:3000';
        
        const response = await fetch(`${API_BASE_URL}/api/listar`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          await this.saveDataLocally('/api/listar', data);
        }
      } catch (err) {
        console.log('[Sync] Background sync skipped:', err.message);
      }
    }, 5 * 60 * 1000);
  }
};

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    NotificationManager.init();
    OfflineManager.setupAutoSync();
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('[SW] Registered:', reg.scope))
        .catch(err => console.log('[SW] Registration failed:', err));
    }
  });
}
