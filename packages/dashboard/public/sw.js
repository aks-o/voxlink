// VoxLink Service Worker - Enhanced PWA Implementation
const CACHE_VERSION = '2.0.0';
const STATIC_CACHE = `voxlink-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `voxlink-dynamic-v${CACHE_VERSION}`;
const CALL_LOGS_CACHE = `voxlink-call-logs-v${CACHE_VERSION}`;
const MESSAGES_CACHE = `voxlink-messages-v${CACHE_VERSION}`;
const OFFLINE_QUEUE_CACHE = `voxlink-offline-queue-v${CACHE_VERSION}`;

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap'
];

// API endpoints to cache with different strategies
const API_CACHE_PATTERNS = {
  // Critical data - cache for offline access
  callLogs: [
    /\/api\/v1\/call-logs/,
    /\/api\/v1\/calls/,
    /\/api\/v1\/recordings/
  ],
  messages: [
    /\/api\/v1\/inbox\/messages/,
    /\/api\/v1\/sms/,
    /\/api\/v1\/conversations/
  ],
  // Less critical - network first
  analytics: [
    /\/api\/v1\/analytics/,
    /\/api\/v1\/reports/,
    /\/api\/v1\/metrics/
  ],
  // Configuration data - cache first
  config: [
    /\/api\/v1\/numbers/,
    /\/api\/v1\/agents/,
    /\/api\/v1\/workflows/,
    /\/api\/v1\/templates/
  ]
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing VoxLink Service Worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating VoxLink Service Worker v' + CACHE_VERSION);
  
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, CALL_LOGS_CACHE, MESSAGES_CACHE, OFFLINE_QUEUE_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content and implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle POST/PUT/DELETE requests for offline queue
  if (request.method !== 'GET') {
    if (isApiRequest(url)) {
      event.respondWith(handleOfflineQueue(request));
    }
    return;
  }

  // Handle call logs with cache-first strategy for offline access
  if (isCallLogsRequest(url)) {
    event.respondWith(callLogsCacheStrategy(request));
    return;
  }

  // Handle messages with cache-first strategy for offline access
  if (isMessagesRequest(url)) {
    event.respondWith(messagesCacheStrategy(request));
    return;
  }

  // Handle analytics with network-first strategy
  if (isAnalyticsRequest(url)) {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
    return;
  }

  // Handle configuration with cache-first strategy
  if (isConfigRequest(url)) {
    event.respondWith(cacheFirstStrategy(request, DYNAMIC_CACHE));
    return;
  }

  // Handle static assets with cache-first strategy
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Handle navigation requests with network-first, fallback to cache
  if (isNavigationRequest(request)) {
    event.respondWith(navigationStrategy(request));
    return;
  }

  // Default: network-first strategy
  event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
});

// Network-first strategy (good for API calls and dynamic content)
async function networkFirstStrategy(request, cacheName = DYNAMIC_CACHE) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
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
    if (isNavigationRequest(request)) {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Cache-first strategy (good for static assets and configuration)
async function cacheFirstStrategy(request, cacheName = STATIC_CACHE) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background if it's older than 1 hour
    const cacheDate = new Date(cachedResponse.headers.get('date'));
    const now = new Date();
    const hoursSinceCache = (now - cacheDate) / (1000 * 60 * 60);
    
    if (hoursSinceCache > 1) {
      // Background update
      fetch(request).then(response => {
        if (response.ok) {
          caches.open(cacheName).then(cache => cache.put(request, response));
        }
      }).catch(() => {
        // Ignore background update failures
      });
    }
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch:', request.url, error);
    throw error;
  }
}

// Call logs cache strategy - prioritize offline access
async function callLogsCacheStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Return cached version immediately
    // Update in background
    fetch(request).then(response => {
      if (response.ok) {
        caches.open(CALL_LOGS_CACHE).then(cache => {
          cache.put(request, response.clone());
          // Notify clients of updated data
          notifyClientsOfUpdate('call-logs', request.url);
        });
      }
    }).catch(() => {
      // Ignore background update failures
    });
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CALL_LOGS_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Call logs fetch failed:', request.url, error);
    // Return empty response with appropriate structure
    return new Response(JSON.stringify({ 
      data: [], 
      offline: true, 
      message: 'Data unavailable offline' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Messages cache strategy - prioritize offline access
async function messagesCacheStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Return cached version immediately
    // Update in background
    fetch(request).then(response => {
      if (response.ok) {
        caches.open(MESSAGES_CACHE).then(cache => {
          cache.put(request, response.clone());
          // Notify clients of updated data
          notifyClientsOfUpdate('messages', request.url);
        });
      }
    }).catch(() => {
      // Ignore background update failures
    });
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(MESSAGES_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Messages fetch failed:', request.url, error);
    // Return empty response with appropriate structure
    return new Response(JSON.stringify({ 
      conversations: [], 
      messages: [],
      offline: true, 
      message: 'Messages unavailable offline' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle offline queue for POST/PUT/DELETE requests
async function handleOfflineQueue(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('[SW] Request failed, adding to offline queue:', request.url);
    
    // Store request in offline queue
    const cache = await caches.open(OFFLINE_QUEUE_CACHE);
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now()
    };
    
    await cache.put(
      new Request(`offline-queue-${Date.now()}`),
      new Response(JSON.stringify(requestData))
    );
    
    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      await self.registration.sync.register('offline-queue-sync');
    }
    
    // Return appropriate offline response
    return new Response(JSON.stringify({
      success: false,
      offline: true,
      message: 'Request queued for when connection is restored'
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Navigation strategy (for page requests)
async function navigationStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation failed, serving cached index');
    return caches.match('/index.html');
  }
}

// Helper functions
function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isCallLogsRequest(url) {
  return API_CACHE_PATTERNS.callLogs.some(pattern => pattern.test(url.pathname));
}

function isMessagesRequest(url) {
  return API_CACHE_PATTERNS.messages.some(pattern => pattern.test(url.pathname));
}

function isAnalyticsRequest(url) {
  return API_CACHE_PATTERNS.analytics.some(pattern => pattern.test(url.pathname));
}

function isConfigRequest(url) {
  return API_CACHE_PATTERNS.config.some(pattern => pattern.test(url.pathname));
}

function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff|woff2|ttf|eot|ico)$/);
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

// Notify clients of data updates
function notifyClientsOfUpdate(dataType, url) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'DATA_UPDATE',
        dataType,
        url,
        timestamp: Date.now()
      });
    });
  });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-queue-sync') {
    event.waitUntil(processOfflineQueue());
  }
  
  if (event.tag === 'call-logs-sync') {
    event.waitUntil(syncCallLogs());
  }
  
  if (event.tag === 'messages-sync') {
    event.waitUntil(syncMessages());
  }
  
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'You have a new call or message',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View Dashboard',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-icon.png'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data = { ...options.data, ...data };
  }
  
  event.waitUntil(
    self.registration.showNotification('VoxLink', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Sync functions
async function processOfflineQueue() {
  try {
    console.log('[SW] Processing offline queue...');
    const cache = await caches.open(OFFLINE_QUEUE_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await cache.match(request);
        const requestData = await response.json();
        
        // Replay the request
        const replayResponse = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body || undefined
        });
        
        if (replayResponse.ok) {
          console.log('[SW] Successfully replayed request:', requestData.url);
          await cache.delete(request);
          
          // Notify clients of successful sync
          notifyClientsOfUpdate('offline-sync', requestData.url);
        }
      } catch (error) {
        console.error('[SW] Failed to replay request:', error);
        // Keep request in queue for next sync attempt
      }
    }
  } catch (error) {
    console.error('[SW] Offline queue processing failed:', error);
  }
}

async function syncCallLogs() {
  try {
    console.log('[SW] Syncing call logs...');
    
    // Refresh call logs cache with latest data
    const cache = await caches.open(CALL_LOGS_CACHE);
    const cachedRequests = await cache.keys();
    
    for (const request of cachedRequests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response.clone());
        }
      } catch (error) {
        console.log('[SW] Failed to sync call log:', request.url);
      }
    }
    
    notifyClientsOfUpdate('call-logs-sync', 'complete');
  } catch (error) {
    console.error('[SW] Call logs sync failed:', error);
  }
}

async function syncMessages() {
  try {
    console.log('[SW] Syncing messages...');
    
    // Refresh messages cache with latest data
    const cache = await caches.open(MESSAGES_CACHE);
    const cachedRequests = await cache.keys();
    
    for (const request of cachedRequests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response.clone());
        }
      } catch (error) {
        console.log('[SW] Failed to sync message:', request.url);
      }
    }
    
    notifyClientsOfUpdate('messages-sync', 'complete');
  } catch (error) {
    console.error('[SW] Messages sync failed:', error);
  }
}

async function syncAnalytics() {
  try {
    console.log('[SW] Syncing analytics...');
    
    // Refresh analytics cache with latest data
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedRequests = await cache.keys();
    
    for (const request of cachedRequests) {
      if (isAnalyticsRequest(new URL(request.url))) {
        try {
          const response = await fetch(request);
          if (response.ok) {
            await cache.put(request, response.clone());
          }
        } catch (error) {
          console.log('[SW] Failed to sync analytics:', request.url);
        }
      }
    }
    
    notifyClientsOfUpdate('analytics-sync', 'complete');
  } catch (error) {
    console.error('[SW] Analytics sync failed:', error);
  }
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then(cache => cache.addAll(event.data.payload))
    );
  }
});