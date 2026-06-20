var CACHE_NAME = 'dailynews-v2';
var STATIC_URLS = [
  '/',
  '/news',
  '/briefing',
  '/search',
  '/digest',
  '/learn',
  '/info',
  '/stats',
  '/profile',
  '/static/style.css',
  '/static/manifest.json',
  '/static/app.js',
  '/static/profile.js',
  '/static/theme.js',
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.map(function(name) {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (event.request.method === 'GET') {
    event.respondWith(cacheFirst(event.request));
  }
});

function cacheFirst(request) {
  return caches.match(request).then(function(cached) {
    return cached || fetchAndCache(request);
  });
}

function networkFirst(request) {
  return fetchAndCache(request).catch(function() {
    return caches.match(request);
  });
}

function fetchAndCache(request) {
  return fetch(request).then(function(response) {
    if (!response || response.status !== 200) return response;
    var clone = response.clone();
    caches.open(CACHE_NAME).then(function(cache) {
      cache.put(request, clone);
    });
    return response;
  });
}

/* === Push Notifications === */
self.addEventListener('push', function(event) {
  var data = {};
  try { data = event.data.json(); } catch (e) {}

  var options = {
    body: data.body || 'New articles available',
    icon: '/static/icon-192.png',
    badge: '/static/icon-192.png',
    data: { url: data.url || '/news' }
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Daily News',
      options
    )
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = event.notification.data && event.notification.data.url;
  if (url) {
    event.waitUntil(clients.openWindow(url));
  }
});
