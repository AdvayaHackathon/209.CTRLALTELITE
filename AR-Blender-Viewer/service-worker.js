// Service Worker for AR Blender Model Viewer
const CACHE_NAME = 'ar-blender-viewer-v1';
const urlsToCache = [
    './',
    './index.html',
    './css/styles.css',
    './js/main.js',
    './js/ar-components.js',
    './js/ui-manager.js',
    './models/model.glb',
    'https://aframe.io/releases/1.3.0/aframe.min.js',
    'https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js',
    'https://raw.githack.com/donmccurdy/aframe-extras/master/dist/aframe-extras.loaders.min.js',
    'https://unpkg.com/aframe-event-set-component@5.0.0/dist/aframe-event-set-component.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve from cache if available
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return the response
                if (response) {
                    return response;
                }
                
                // Clone the request
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest).then(
                    response => {
                        // Check if valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response
                        const responseToCache = response.clone();
                        
                        // Add to cache
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    }
                );
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
