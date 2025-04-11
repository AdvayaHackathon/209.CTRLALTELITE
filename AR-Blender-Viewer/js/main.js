/**
 * Main Application Logic for AR Blender Model Viewer
 * Initializes the AR experience and handles core functionality
 */

// Application namespace
const ARApp = {
    isInitialized: false,
    arScene: null,
    cameraEl: null,
    modelUrl: './models/model.glb',
    modelElement: null,
    viewportSettings: {
        zoom: 1.0,
        maxZoom: 3.0,
        minZoom: 0.5,
        zoomStep: 0.1
    },
    availableModels: [
        { name: 'Default Model', path: './models/model.glb', thumbnail: 'default-model' }
        // Add more models as they become available
    ],
    orientation360Enabled: false,

    // Initialize the application
    init: function() {
        if (this.isInitialized) return;
        
        // Get references to key elements
        this.arScene = document.querySelector('a-scene');
        this.cameraEl = document.querySelector('a-entity[camera]');
        this.modelEl = document.querySelector('#model');
        this.modelContainer = document.querySelector('#model-container');
        this.modelAsset = document.querySelector('#model-asset');
        
        // Setup model selection modal
        this.setupModelSelection();
        
        // Setup viewport controls
        this.setupViewportControls();
        
        // Setup 360-degree view with device orientation
        this.setup360View();
        
        // Check for mobile device
        this.isMobile = this.checkIsMobile();
        
        // Force hide loading screen after delay
        setTimeout(() => this.hideLoadingScreen(), 1500);
        
        // Ensure model is visible
        if (this.modelEl) {
            this.modelEl.setAttribute('visible', true);
            console.log('Made model visible explicitly');
        }
        
        // Add event listener for model loaded
        if (this.modelEl) {
            this.modelEl.addEventListener('model-loaded', (e) => {
                console.log('Model loaded successfully!');
                // Ensure model is visible after loading
                setTimeout(() => {
                    if (e.detail && e.detail.model) {
                        console.log('Got model detail, making visible');
                        const model = e.detail.model;
                        model.visible = true;
                        
                        // Traverse all mesh objects and ensure they're visible
                        model.traverse((node) => {
                            if (node.isMesh) {
                                node.frustumCulled = false;
                                node.material.needsUpdate = true;
                                console.log('Updated mesh visibility');
                            }
                        });
                    }
                    
                    // Hide loading screen again just to be sure
                    this.hideLoadingScreen();
                }, 1000);
            });
            
            // Add backup timeout in case model loading takes too long
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 5000);
        }
        
        // Mark as initialized
        this.isInitialized = true;
    },
    
    // Setup model selection
    setupModelSelection: function() {
        // Get modal elements
        this.modelSelectionModal = document.getElementById('model-selection-modal');
        this.modelSelectionCloseBtn = document.getElementById('close-model-selection');
        this.modelButton = document.getElementById('model-button');
        this.modelPresetGrid = document.getElementById('model-preset-grid');
        this.modelUpload = document.getElementById('model-upload');
        
        // Setup event listeners for model selection
        if (this.modelButton) {
            this.modelButton.addEventListener('click', () => {
                this.showModelSelectionModal();
            });
        }
        
        if (this.modelSelectionCloseBtn) {
            this.modelSelectionCloseBtn.addEventListener('click', () => {
                this.hideModelSelectionModal();
            });
        }
        
        // Handle model upload
        if (this.modelUpload) {
            this.modelUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleModelUpload(file);
                }
            });
        }
        
        // Populate preset models grid
        this.populateModelGrid();
        
        // Initially hide the modal
        this.hideModelSelectionModal();
    },
    
    // Setup viewport controls
    setupViewportControls: function() {
        // Get viewport control buttons
        this.zoomInButton = document.getElementById('zoom-in-button');
        this.zoomOutButton = document.getElementById('zoom-out-button');
        this.centerViewButton = document.getElementById('center-view-button');
        
        // Setup event listeners for viewport controls
        if (this.zoomInButton) {
            this.zoomInButton.addEventListener('click', () => {
                this.zoomViewport(this.viewportSettings.zoomStep);
            });
        }
        
        if (this.zoomOutButton) {
            this.zoomOutButton.addEventListener('click', () => {
                this.zoomViewport(-this.viewportSettings.zoomStep);
            });
        }
        
        if (this.centerViewButton) {
            this.centerViewButton.addEventListener('click', () => {
                this.centerViewport();
            });
        }
        
        // Setup wheel event for zooming
        this.arScene.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY * -0.001;
            this.zoomViewport(delta);
        });
    },
    
    // Setup 360-degree view with device orientation
    setup360View: function() {
        // Check if DeviceOrientationEvent is supported
        if (window.DeviceOrientationEvent) {
            // For iOS 13+ we need to request permission first
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                this.enableMotionButton = document.getElementById('enable-motion-button');
                this.view360Button = document.getElementById('view360-button');
                this.permissionsRequest = document.getElementById('permissions-request');
                
                this.enableMotionButton.addEventListener('click', () => {
                    DeviceOrientationEvent.requestPermission()
                        .then(permissionState => {
                            if (permissionState === 'granted') {
                                this.enable360View();
                                this.permissionsRequest.classList.add('hidden');
                            } else {
                                this.showError('Permission denied for device orientation.');
                            }
                        })
                        .catch(console.error);
                });
                
                // Show the permissions request when 360 view is activated
                this.view360Button.addEventListener('click', () => {
                    this.permissionsRequest.classList.remove('hidden');
                });
            } else {
                // For devices that don't require permission
                this.enable360View();
            }
        } else {
            // Device doesn't support orientation events
            this.showError('Your device does not support 360° view.');
            this.view360Button.classList.add('disabled');
        }
    },
    
    // Enable 360-degree view
    enable360View: function() {
        const camera = document.getElementById('camera');
        
        // Enable device orientation controls
        this.orientation360Enabled = true;
        
        // Update scene camera settings
        camera.setAttribute('look-controls', 'magicWindowTrackingEnabled: true; reverseMouseDrag: false');
        console.log('360° view enabled. Move your device to look around.');
        
        // Set the view360Button as active
        this.setActiveControl(document.getElementById('view360-button'));
    },
    
    // Toggle 360-degree view on/off
    toggle360View: function() {
        const camera = document.getElementById('camera');
        
        if (this.orientation360Enabled) {
            // Disable 360 view
            camera.setAttribute('look-controls', 'magicWindowTrackingEnabled: false');
            this.orientation360Enabled = false;
            console.log('360° view disabled.');
        } else {
            // Try to enable or request permission
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                this.permissionsRequest.classList.remove('hidden');
            } else {
                this.enable360View();
            }
        }
    },
    
    // Populate the model grid with available models
    populateModelGrid: function() {
        if (!this.modelPresetGrid) return;
        
        // Clear existing content
        this.modelPresetGrid.innerHTML = '';
        
        // Add available models
        this.availableModels.forEach(model => {
            const modelElement = document.createElement('div');
            modelElement.className = 'model-preset';
            modelElement.dataset.model = model.path;
            
            const thumbnailElement = document.createElement('div');
            thumbnailElement.className = `model-thumbnail ${model.thumbnail}`;
            
            const nameElement = document.createElement('div');
            nameElement.className = 'model-name';
            nameElement.textContent = model.name;
            
            modelElement.appendChild(thumbnailElement);
            modelElement.appendChild(nameElement);
            
            // Add click event to select this model
            modelElement.addEventListener('click', () => {
                this.selectPresetModel(model.path);
            });
            
            this.modelPresetGrid.appendChild(modelElement);
        });
    },
    
    // Select a preset model
    selectPresetModel: function(modelPath) {
        // Show loading screen
        document.getElementById('loading-screen').classList.remove('hidden');
        
        // Update the model asset source
        if (this.modelAsset) {
            this.modelAsset.setAttribute('src', modelPath);
        }
        
        // Reload the model entity
        if (this.modelEl) {
            this.modelEl.setAttribute('gltf-model', '');
            
            // Wait a moment and set the new model
            setTimeout(() => {
                this.modelEl.setAttribute('gltf-model', '#model-asset');
                
                // Hide the model selection modal
                this.hideModelSelectionModal();
                
                // Add listener to hide loading screen when model is loaded
                this.modelEl.addEventListener('model-loaded', () => {
                    this.hideLoadingScreen();
                }, { once: true });
                
                // Backup timeout
                setTimeout(() => this.hideLoadingScreen(), 5000);
            }, 300);
        }
    },
    
    // Handle user uploaded model
    handleModelUpload: function(file) {
        if (!file || (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf'))) {
            window.UIManager.showNotification('Only GLB and GLTF formats are supported.');
            return;
        }
        
        // Show loading screen
        document.getElementById('loading-screen').classList.remove('hidden');
        
        // Create object URL
        const objectURL = URL.createObjectURL(file);
        
        // Update the model asset
        if (this.modelAsset) {
            this.modelAsset.setAttribute('src', objectURL);
        }
        
        // Set the model source
        if (this.modelEl) {
            this.modelEl.setAttribute('gltf-model', '');
            
            // Wait a moment and set the new model
            setTimeout(() => {
                this.modelEl.setAttribute('gltf-model', '#model-asset');
                
                // Hide the model selection modal
                this.hideModelSelectionModal();
                
                // Add listener to hide loading screen when model is loaded
                this.modelEl.addEventListener('model-loaded', () => {
                    this.hideLoadingScreen();
                }, { once: true });
                
                // Backup timeout
                setTimeout(() => this.hideLoadingScreen(), 5000);
            }, 300);
        }
    },
    
    // Show the model selection modal
    showModelSelectionModal: function() {
        if (this.modelSelectionModal) {
            this.modelSelectionModal.classList.remove('hidden');
        }
    },
    
    // Hide the model selection modal
    hideModelSelectionModal: function() {
        if (this.modelSelectionModal) {
            this.modelSelectionModal.classList.add('hidden');
        }
    },
    
    // Zoom the viewport in/out
    zoomViewport: function(delta) {
        // Calculate new zoom level
        let newZoom = this.viewportSettings.zoom + delta;
        
        // Clamp to min/max values
        newZoom = Math.max(this.viewportSettings.minZoom, 
                           Math.min(this.viewportSettings.maxZoom, newZoom));
        
        // Update zoom setting
        this.viewportSettings.zoom = newZoom;
        
        // Apply zoom to the scene camera
        if (this.cameraEl) {
            const currentPos = this.cameraEl.getAttribute('position');
            // Zoom by changing the Z position of the camera
            this.cameraEl.setAttribute('position', { 
                x: currentPos.x,
                y: currentPos.y,
                z: -newZoom * 3 // Multiply by 3 for more pronounced effect
            });
        }
    },
    
    // Center the viewport
    centerViewport: function() {
        // Reset camera position and rotation
        if (this.cameraEl) {
            this.cameraEl.setAttribute('position', { x: 0, y: 1.6, z: -3 });
            this.cameraEl.setAttribute('rotation', { x: 0, y: 0, z: 0 });
        }
        
        // Reset model position if it exists
        if (this.modelContainer) {
            this.modelContainer.setAttribute('position', { x: 0, y: 0, z: -3 });
            this.modelContainer.setAttribute('rotation', { x: 0, y: 0, z: 0 });
        }
        
        // Reset zoom
        this.viewportSettings.zoom = 1.0;
    },
    
    // Hide loading screen
    hideLoadingScreen: function() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            console.log('Hiding loading screen');
        }
        
        // Also ensure instruction overlay is hidden
        const instructionOverlay = document.getElementById('instruction-overlay');
        if (instructionOverlay) {
            instructionOverlay.style.display = 'none';
            console.log('Hiding instruction overlay');
        }
    },
    
    // Check if the device is a mobile device
    checkIsMobile: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    // Check device capabilities for AR
    checkDeviceCapabilities: function() {
        // Check camera access
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.showError('Camera Access Error', 'Your browser does not support camera access, which is required for AR functionality.');
            return false;
        }
        
        // Check WebGL support
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            this.showError('WebGL Support Error', 'Your browser does not support WebGL, which is required for AR functionality.');
            return false;
        }
        
        // Check device orientation
        if (typeof DeviceOrientationEvent === 'undefined' || 
            typeof DeviceOrientationEvent.requestPermission !== 'function') {
            // Not an iOS device that requires permission, or device orientation is supported
            return true;
        }
        
        // For iOS 13+ devices that require permission for device orientation
        document.getElementById('start-ar-button').addEventListener('click', () => {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        console.log('Device orientation permission granted');
                    } else {
                        this.showError('Permission Error', 'Device orientation permission is required for AR functionality.');
                    }
                })
                .catch(console.error);
        });
        
        return true;
    },
    
    // Setup offline capabilities
    setupOfflineCapabilities: function() {
        // Check if service workers are supported
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./service-worker.js').then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }).catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
            });
        }
        
        // Listen for online/offline status changes
        window.addEventListener('online', this.handleOnlineStatusChange.bind(this));
        window.addEventListener('offline', this.handleOnlineStatusChange.bind(this));
        
        // Check initial status
        this.handleOnlineStatusChange();
    },
    
    // Handle online/offline status changes
    handleOnlineStatusChange: function() {
        const isOnline = navigator.onLine;
        console.log(`Application is ${isOnline ? 'online' : 'offline'}`);
        
        // Notify user if offline
        if (!isOnline) {
            window.UIManager.showNotification('You are currently offline. The app will continue to work, but some features may be limited.');
        }
    },
    
    // Setup error handling
    setupErrorHandling: function() {
        window.addEventListener('error', (event) => {
            console.error('Error:', event.error);
            
            // Show user-friendly error notification
            const errorMessage = 'An error occurred. Please try refreshing the page.';
            window.UIManager.showNotification(errorMessage, 5000);
            
            // Log to analytics
            if (window.UIManager) {
                window.UIManager.logAnalytics('application_error', {
                    message: event.error ? event.error.message : 'Unknown error',
                    stack: event.error ? event.error.stack : 'No stack trace'
                });
            }
        });
    },
    
    // Request device motion and orientation permissions
    requestSensorPermissions: function() {
        // iOS 13+ requires permission for DeviceMotionEvent and DeviceOrientationEvent
        if (typeof DeviceMotionEvent !== 'undefined' && 
            typeof DeviceMotionEvent.requestPermission === 'function') {
            
            // We need a user gesture to request permission
            document.getElementById('start-ar-button').addEventListener('click', () => {
                DeviceMotionEvent.requestPermission()
                    .then(response => {
                        if (response === 'granted') {
                            console.log('Device motion permission granted');
                        } else {
                            console.warn('Device motion permission denied');
                        }
                    })
                    .catch(console.error);
            });
        }
        
        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            
            document.getElementById('start-ar-button').addEventListener('click', () => {
                DeviceOrientationEvent.requestPermission()
                    .then(response => {
                        if (response === 'granted') {
                            console.log('Device orientation permission granted');
                        } else {
                            console.warn('Device orientation permission denied');
                        }
                    })
                    .catch(console.error);
            });
        }
    },
    
    // Show error message to user
    showError: function(title, message) {
        const errorMessageElement = document.getElementById('error-message');
        const errorTitleElement = document.querySelector('#error-message .error-title');
        const errorDescriptionElement = document.querySelector('#error-message .error-description');
        
        if (errorTitleElement) {
            errorTitleElement.textContent = title;
        }
        
        if (errorDescriptionElement) {
            errorDescriptionElement.textContent = message;
        }
        
        if (errorMessageElement) {
            errorMessageElement.classList.remove('hidden');
        }
        
        // Add reload button functionality
        const reloadButton = document.getElementById('reload-button');
        if (reloadButton) {
            reloadButton.addEventListener('click', () => {
                window.location.reload();
            });
        }
        
        console.error(title, message);
    },
    
    // Validate model parameter to prevent security issues
    isValidModelParameter: function(param) {
        // Only allow paths to .glb or .gltf files within the models directory
        return typeof param === 'string' && 
            (param.endsWith('.glb') || param.endsWith('.gltf')) && 
            (param.startsWith('./models/') || param.startsWith('/models/'));
    },
    
    // Set active control button
    setActiveControl: function(activeButton) {
        const controlButtons = document.querySelectorAll('.control-button');
        
        controlButtons.forEach(button => {
            if (button !== this.modelButton && button !== document.getElementById('reset-button')) {
                button.classList.remove('active');
            }
        });
        
        activeButton.classList.add('active');
    }
};

// Initialize the application when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    ARApp.init();
    
    // Setup additional capabilities
    ARApp.setupOfflineCapabilities();
    ARApp.setupErrorHandling();
    
    // Make sure A-Frame scene is properly shown
    setTimeout(() => {
        document.querySelectorAll('canvas.a-canvas').forEach(canvas => {
            canvas.style.zIndex = '1';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
        });
    }, 1000);
});

// Create service worker for offline capabilities
function createServiceWorker() {
    // Create a service worker file if it doesn't exist
    if ('serviceWorker' in navigator) {
        const swContent = `
        // AR Blender Viewer Service Worker for offline capabilities
        
        const CACHE_NAME = 'ar-viewer-cache-v1';
        const urlsToCache = [
            '/',
            '/index.html',
            '/css/styles.css',
            '/js/main.js',
            '/js/ar-components.js',
            '/js/ui-manager.js',
            '/models/model.glb',
            '/img/shadow.png',
            '/img/favicon.png',
            '/img/help.svg',
            '/img/move.svg',
            '/img/reset.svg',
            '/img/rotate.svg',
            '/img/scale.svg',
            '/img/tap.svg',
            '/img/zoom-in.svg',
            '/img/zoom-out.svg',
            '/img/center.svg',
            '/img/model.svg',
            '/img/upload.svg'
        ];
        
        // Install event - cache resources
        self.addEventListener('install', event => {
            event.waitUntil(
                caches.open(CACHE_NAME)
                    .then(cache => {
                        console.log('Opened cache');
                        return cache.addAll(urlsToCache);
                    })
            );
        });
        
        // Fetch event - serve from cache or fetch from network
        self.addEventListener('fetch', event => {
            event.respondWith(
                caches.match(event.request)
                    .then(response => {
                        // Cache hit - return response
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
        `;
        
        // Log but don't actually create the file in this example
        console.log('Service worker content would be created here in a real app.');
    }
}

// Expose to global scope for debugging and development purposes
window.ARApp = ARApp;
window.createServiceWorker = createServiceWorker;
