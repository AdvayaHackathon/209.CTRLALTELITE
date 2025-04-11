/**
 * Main Application Logic for AR Blender Model Viewer
 * Initializes the AR experience and handles core functionality
 */

// Application namespace
const ARApp = {
    // DOM Elements
    loadingScreen: null,
    modelButton: null,
    controlButtons: [],
    modelSelectionModal: null,
    viewportSettings: {
        zoomLevel: 1.0,
        zoomMin: 0.5,
        zoomMax: 3.0,
        zoomStep: 0.2
    },
    orientation360Enabled: false,
    isInitialized: false,
    
    // Available models for selection
    availableModels: [
        { name: 'Default Model', path: './models/model.glb', thumbnail: 'default-model' },
        { name: 'Cube', path: './models/cube.glb', thumbnail: 'default-model' },
        { name: 'Robot', path: './models/robot.glb', thumbnail: 'default-model' }
    ],
    
    // Initialize the application
    init: function() {
        console.log('AR Blender Viewer initializing...');
        
        try {
            if (this.isInitialized) return;
            this.isInitialized = true;
            
            // Initialize UI Manager first to ensure it's ready
            UIManager.init();
            
            // Get DOM Elements - with error handling
            this.loadingScreen = document.getElementById('loading-screen');
            this.modelButton = document.getElementById('model-button');
            
            // Safely get control buttons with error handling
            const controlButtonElements = document.querySelectorAll('.control-button');
            this.controlButtons = controlButtonElements ? Array.from(controlButtonElements) : [];
            
            this.modelSelectionModal = document.getElementById('model-selection-modal');
            this.permissionsRequest = document.getElementById('permissions-request');
            this.enableMotionButton = document.getElementById('enable-motion-button');
            this.view360Button = document.getElementById('view360-button');
            
            // Log debug info
            console.log('Control buttons found:', this.controlButtons.length);
            
            // Check if elements exist
            if (!this.loadingScreen) console.error('Loading screen element not found');
            if (!this.modelButton) console.error('Model button element not found');
            if (!this.modelSelectionModal) console.error('Model selection modal element not found');
            
            // Setup Event Listeners
            this.setupEventListeners();
            
            // Setup Model Selection
            this.setupModelSelection();
            
            // Setup Viewport Controls
            this.setupViewportControls();
            
            // Setup 360 View
            this.setup360View();
            
            // Hide loading screen after delay
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 3000);
            
            console.log('AR Blender Viewer initialized successfully!');
            
            // Show UI elements once everything is ready
            document.body.classList.add('ready');
        } catch (error) {
            console.error('Error initializing AR Blender Viewer:', error);
            this.showError('Failed to initialize AR Blender Viewer. ' + error.message);
        }
    },
    
    // Show error message
    showError: function(message) {
        const errorMessage = document.getElementById('error-message');
        const errorDescription = document.querySelector('.error-description');
        
        if (errorMessage && errorDescription) {
            errorDescription.textContent = message;
            errorMessage.classList.remove('hidden');
        } else {
            console.error('Error elements not found', message);
            alert('Error: ' + message);
        }
    },
    
    // Setup Event Listeners
    setupEventListeners: function() {
        try {
            // Safety check before using forEach
            if (!this.controlButtons || this.controlButtons.length === 0) {
                console.warn('No control buttons found to set up event listeners');
                return;
            }
            
            // Control Button Click Events
            this.controlButtons.forEach(button => {
                if (!button) return; // Skip if button is null
                
                button.addEventListener('click', () => {
                    const buttonId = button.id;
                    
                    // Toggle active state for the button
                    if (buttonId !== 'model-button' && buttonId !== 'reset-button') {
                        this.setActiveControl(button);
                    }
                    
                    // Handle button actions
                    switch(buttonId) {
                        case 'place-button':
                            if (UIManager.showPlacementIndicator) {
                                UIManager.showPlacementIndicator();
                            }
                            if (UIManager.setControlModeActive) {
                                UIManager.setControlModeActive('place');
                            }
                            break;
                        case 'rotate-button':
                            if (UIManager.setControlModeActive) {
                                UIManager.setControlModeActive('rotate');
                            }
                            break;
                        case 'scale-button':
                            if (UIManager.setControlModeActive) {
                                UIManager.setControlModeActive('scale');
                            }
                            break;
                        case 'pan-button':
                            if (UIManager.setControlModeActive) {
                                UIManager.setControlModeActive('pan');
                            }
                            break;
                        case 'view360-button':
                            this.toggle360View();
                            break;
                        case 'reset-button':
                            // Call UIManager reset if it exists
                            if (UIManager.resetModel) {
                                UIManager.resetModel();
                            } else {
                                this.resetModel(); // Fallback to local method
                            }
                            break;
                        case 'model-button':
                            if (UIManager.showModelSelectionModal) {
                                UIManager.showModelSelectionModal();
                            }
                            break;
                    }
                });
            });
            
            // Window resize event
            window.addEventListener('resize', () => {
                console.log('Window resized');
                // Make any adjustments needed on resize
            });
            
            // Error handling for A-Frame scene
            const scene = document.querySelector('a-scene');
            if (scene) {
                scene.addEventListener('renderstart', () => {
                    console.log('A-Frame scene render started');
                });
                
                scene.addEventListener('loaded', () => {
                    console.log('A-Frame scene loaded');
                    if (UIManager.showNotification) {
                        UIManager.showNotification('AR Scene loaded successfully');
                    }
                });
                
                scene.addEventListener('error', (error) => {
                    console.error('A-Frame scene error:', error);
                    this.showError('Error loading AR scene');
                });
            } else {
                console.error('A-Frame scene not found');
            }
            
            console.log('Event listeners setup complete');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
            this.showError('Failed to setup controls. ' + error.message);
        }
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
        try {
            // Safety check for model grid element
            if (!this.modelPresetGrid) {
                console.error('Model preset grid element not found');
                return;
            }
            
            // Safety check for available models
            if (!this.availableModels || !Array.isArray(this.availableModels)) {
                console.error('Available models not defined or not an array');
                this.availableModels = [
                    { name: 'Default Model', path: './models/model.glb', thumbnail: 'default-model' }
                ];
            }
            
            // Clear existing content
            this.modelPresetGrid.innerHTML = '';
            
            console.log('Populating model grid with', this.availableModels.length, 'models');
            
            // Add available models
            this.availableModels.forEach(model => {
                const modelElement = document.createElement('div');
                modelElement.className = 'model-preset';
                modelElement.dataset.model = model.path;
                
                const thumbnailElement = document.createElement('div');
                thumbnailElement.className = `model-thumbnail ${model.thumbnail || 'default-model'}`;
                
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
            
            console.log('Model grid populated successfully');
        } catch (error) {
            console.error('Error populating model grid:', error);
        }
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
        let newZoom = this.viewportSettings.zoomLevel + delta;
        
        // Clamp to min/max values
        newZoom = Math.max(this.viewportSettings.zoomMin, 
                           Math.min(this.viewportSettings.zoomMax, newZoom));
        
        // Update zoom setting
        this.viewportSettings.zoomLevel = newZoom;
        
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
        this.viewportSettings.zoomLevel = 1.0;
    },
    
    // Hide loading screen
    hideLoadingScreen: function() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
            
            // Show control panel and viewport controls
            const controlPanel = document.getElementById('control-panel');
            const viewportControls = document.getElementById('viewport-controls');
            
            if (controlPanel) controlPanel.classList.remove('hidden');
            if (viewportControls) viewportControls.classList.remove('hidden');
            
            UIManager.showNotification('AR Blender Viewer ready!');
        } else {
            console.error('Loading screen element not found');
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

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        ARApp.init();
    }, 1000); // Short delay to ensure all resources are loaded
});

// Handle errors globally
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    if (ARApp && typeof ARApp.showError === 'function') {
        ARApp.showError('An error occurred: ' + (event.error ? event.error.message : 'Unknown error'));
    }
});
