/**
 * Service Worker for SplitTheBill PWA
 * Handles caching, offline functionality, and background sync
 */

const CACHE_NAME = 'splitthebill-v1.0.0';
const STATIC_CACHE = 'splitthebill-static-v1.0.0';
const DYNAMIC_CACHE = 'splitthebill-dynamic-v1.0.0';
const OFFLINE_PAGE = '/offline.html';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/auth.html',
  '/dashboard.html',
  '/faq.html',
  '/offline.html',
  '/manifest.json',
  '/css/main.css',
  '/css/auth.css',
  '/css/dashboard.css',
  '/css/components.css',
  '/css/faq.css',
  '/js/utils.js',
  '/js/main.js',
  '/js/auth.js',
  '/js/dashboard.js',
  '/js/group-manager.js',
  '/js/expense-manager.js',
  '/js/faq.js',
  '/js/firebase-config.js',
  '/assets/placeholder.svg',
  '/assets/placeholder-icon.svg'
];

// Network-first resources (always try network first)
const NETWORK_FIRST = [
  '/js/firebase-config.js',
  'https://www.gstatic.com/firebasejs/',
  'https://apis.google.com/',
  'https://accounts.google.com/'
];

// Cache-first resources (try cache first, fallback to network)
const CACHE_FIRST = [
  '/css/',
  '/js/',
  '/assets/',
  'https://fonts.googleapis.com/',
  'https://fonts.gstatic.com/'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different caching strategies
  if (isNetworkFirst(request.url)) {
    event.respondWith(networkFirst(request));
  } else if (isCacheFirst(request.url)) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_PAGE);
    }
    
    throw error;
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache and network failed:', request.url);
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const networkResponsePromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then((c) => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => {
    // Network failed, return cached version if available
    return cachedResponse;
  });
  
  // Return cached version immediately if available, otherwise wait for network
  return cachedResponse || networkResponsePromise;
}

// Helper functions
function isNetworkFirst(url) {
  return NETWORK_FIRST.some(pattern => url.includes(pattern));
}

function isCacheFirst(url) {
  return CACHE_FIRST.some(pattern => url.includes(pattern));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'expense-sync') {
    event.waitUntil(syncExpenses());
  } else if (event.tag === 'group-sync') {
    event.waitUntil(syncGroups());
  }
});

// Sync offline expenses when back online
async function syncExpenses() {
  try {
    console.log('[SW] Syncing offline expenses...');
    
    // Get offline expenses from IndexedDB
    const offlineExpenses = await getOfflineExpenses();
    
    for (const expense of offlineExpenses) {
      try {
        // Attempt to sync with server
        await syncExpenseToServer(expense);
        
        // Remove from offline storage on success
        await removeOfflineExpense(expense.id);
        
        console.log('[SW] Synced expense:', expense.id);
      } catch (error) {
        console.error('[SW] Failed to sync expense:', expense.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Sync offline groups when back online
async function syncGroups() {
  try {
    console.log('[SW] Syncing offline groups...');
    
    const offlineGroups = await getOfflineGroups();
    
    for (const group of offlineGroups) {
      try {
        await syncGroupToServer(group);
        await removeOfflineGroup(group.id);
        console.log('[SW] Synced group:', group.id);
      } catch (error) {
        console.error('[SW] Failed to sync group:', group.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Group sync failed:', error);
  }
}

// IndexedDB helpers (simplified - would need full implementation)
async function getOfflineExpenses() {
  // Implementation would use IndexedDB to get offline expenses
  return [];
}

async function removeOfflineExpense(id) {
  // Implementation would remove expense from IndexedDB
}

async function getOfflineGroups() {
  // Implementation would use IndexedDB to get offline groups
  return [];
}

async function removeOfflineGroup(id) {
  // Implementation would remove group from IndexedDB
}

async function syncExpenseToServer(expense) {
  // Implementation would sync expense to Firebase
  const response = await fetch('/api/expenses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(expense)
  });
  
  if (!response.ok) {
    throw new Error('Failed to sync expense');
  }
}

async function syncGroupToServer(group) {
  // Implementation would sync group to Firebase
  const response = await fetch('/api/groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(group)
  });
  
  if (!response.ok) {
    throw new Error('Failed to sync group');
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'You have new expense updates!',
    icon: '/assets/placeholder-icon.svg',
    badge: '/assets/placeholder-icon.svg',
    vibrate: [200, 100, 200],
    data: {
      url: '/dashboard.html'
    },
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/assets/placeholder-icon.svg'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/assets/placeholder-icon.svg'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data = { ...options.data, ...data };
  }
  
  event.waitUntil(
    self.registration.showNotification('SplitTheBill', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    const url = event.notification.data.url || '/dashboard.html';
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered:', event.tag);
  
  if (event.tag === 'expense-backup') {
    event.waitUntil(backupExpenses());
  }
});

async function backupExpenses() {
  try {
    console.log('[SW] Creating expense backup...');
    // Implementation would backup expenses to cloud storage
  } catch (error) {
    console.error('[SW] Backup failed:', error);
  }
}