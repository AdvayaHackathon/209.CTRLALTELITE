/**
 * UI Manager for AR Blender Model Viewer
 * Handles all UI interactions, status updates, and notifications
 */

const UIManager = {
    // UI elements references
    elements: {},
    
    // Initialization state
    isInitialized: false,
    
    // Initialize UI Manager
    init: function() {
        // Prevent double initialization
        if (this.isInitialized) {
            console.log('UI Manager already initialized');
            return this;
        }
        
        console.log('Initializing UI Manager');
        
        try {
            // Cache DOM elements
            this.cacheElements();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Update AR status
            this.updateARStatus('Initializing camera...');
            
            // Mark as initialized
            this.isInitialized = true;
            
            return this;
        } catch (error) {
            console.error('Error initializing UI Manager:', error);
            this.showError('Failed to initialize UI. Please refresh the page.');
            return this;
        }
    },
    
    // Cache all UI elements for quick access
    cacheElements: function() {
        console.log('Caching UI elements');
        
        try {
            // Core UI elements
            this.elements.loadingScreen = document.getElementById('loading-screen');
            this.elements.errorMessage = document.getElementById('error-message');
            this.elements.controlPanel = document.getElementById('control-panel');
            this.elements.placementIndicator = document.getElementById('placement-indicator');
            this.elements.arStatus = document.getElementById('ar-status');
            this.elements.notification = document.getElementById('notification');
            
            // Status elements
            if (this.elements.arStatus) {
                this.elements.statusDot = this.elements.arStatus.querySelector('.status-dot');
                this.elements.statusText = this.elements.arStatus.querySelector('.status-text');
            }
            
            // Model selection modal
            this.elements.modelSelectionModal = document.getElementById('model-selection-modal');
            this.elements.closeModelSelection = document.getElementById('close-model-selection');
            
            // Help modal
            this.elements.helpButton = document.getElementById('help-button');
            this.elements.helpModal = document.getElementById('help-modal');
            
            // Permissions
            this.elements.permissionsRequest = document.getElementById('permissions-request');
            this.elements.cameraPermissionButton = document.getElementById('camera-permission-button');
            
            // Viewport controls
            this.elements.viewportControls = document.getElementById('viewport-controls');
            
            // Log element availability
            for (const key in this.elements) {
                if (this.elements[key]) {
                    console.log(`✓ UI Element found: ${key}`);
                } else {
                    console.warn(`✗ UI Element not found: ${key}`);
                }
            }
        } catch (error) {
            console.error('Error caching UI elements:', error);
            throw new Error('Failed to cache UI elements: ' + error.message);
        }
    },
    
    // Setup event listeners for UI elements
    setupEventListeners: function() {
        console.log('Setting up UI event listeners');
        
        try {
            // Close buttons for modals
            this.safeAddEventListener(this.elements.closeModelSelection, 'click', () => this.hideModelSelectionModal());
            
            // Help button
            this.safeAddEventListener(this.elements.helpButton, 'click', () => this.toggleHelpModal());
            
            // Help modal close buttons
            if (this.elements.helpModal) {
                const closeButtons = this.elements.helpModal.querySelectorAll('.close-button');
                if (closeButtons && closeButtons.length > 0) {
                    closeButtons.forEach(button => {
                        this.safeAddEventListener(button, 'click', () => this.hideHelpModal());
                    });
                }
            }
            
            // Permissions button
            const enableMotionButton = document.getElementById('enable-motion-button');
            this.safeAddEventListener(enableMotionButton, 'click', () => this.requestPermissions());
            
            // Camera permission button
            this.safeAddEventListener(this.elements.cameraPermissionButton, 'click', () => {
                console.log('Camera permission button clicked');
                this.requestCameraPermission();
            });
            
            console.log('UI event listeners setup complete');
        } catch (error) {
            console.error('Error setting up UI event listeners:', error);
            throw new Error('Failed to setup event listeners: ' + error.message);
        }
    },
    
    // Safely add event listener with proper error handling
    safeAddEventListener: function(element, eventType, callback) {
        if (!element) {
            console.warn(`Cannot add ${eventType} listener to undefined element`);
            return false;
        }
        
        try {
            element.addEventListener(eventType, callback);
            return true;
        } catch (error) {
            console.error(`Error adding ${eventType} listener:`, error);
            return false;
        }
    },
    
    // Request camera permission
    requestCameraPermission: function() {
        console.log('Requesting camera permission');
        
        try {
            const scene = document.querySelector('a-scene');
            if (scene && scene.components && scene.components['ar-scene-manager']) {
                scene.components['ar-scene-manager'].requestCameraPermission();
            } else {
                this.showError('AR scene not initialized. Please refresh the page.');
            }
        } catch (error) {
            console.error('Error requesting camera permission:', error);
            this.showError('Failed to request camera access: ' + error.message);
        }
    },
    
    // Request device motion/orientation permissions
    requestPermissions: function() {
        console.log('Requesting device motion permissions');
        
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        console.log('Device motion permission granted');
                        this.hidePermissionsRequest();
                    } else {
                        console.warn('Device motion permission denied');
                        this.showError('Motion sensors permission required for AR experience');
                    }
                })
                .catch(error => {
                    console.error('Error requesting motion permission:', error);
                    this.showError('Could not access motion sensors: ' + error.message);
                });
        } else {
            console.log('Device doesn\'t require explicit motion permissions');
            this.hidePermissionsRequest();
        }
    },
    
    // Show loading screen
    showLoadingScreen: function() {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.classList.remove('hidden');
        }
    },
    
    // Hide loading screen
    hideLoadingScreen: function() {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.classList.add('hidden');
        }
    },
    
    // Show control panel
    showControlPanel: function() {
        if (this.elements.controlPanel) {
            this.elements.controlPanel.classList.remove('hidden');
        }
    },
    
    // Hide control panel
    hideControlPanel: function() {
        if (this.elements.controlPanel) {
            this.elements.controlPanel.classList.add('hidden');
        }
    },
    
    // Show placement indicator
    showPlacementIndicator: function() {
        if (this.elements.placementIndicator) {
            this.elements.placementIndicator.classList.remove('hidden');
        }
    },
    
    // Hide placement indicator
    hidePlacementIndicator: function() {
        if (this.elements.placementIndicator) {
            this.elements.placementIndicator.classList.add('hidden');
        }
    },
    
    // Update AR status text and indicator
    updateARStatus: function(status) {
        if (this.elements.statusText) {
            this.elements.statusText.textContent = status;
        }
    },
    
    // Set AR status with option to show error state
    setARStatus: function(status, isError = false) {
        this.updateARStatus(status);
        
        if (this.elements.arStatus) {
            if (isError) {
                this.elements.arStatus.classList.add('error');
                if (this.elements.statusDot) {
                    this.elements.statusDot.classList.add('error');
                }
            } else {
                this.elements.arStatus.classList.remove('error');
                if (this.elements.statusDot) {
                    this.elements.statusDot.classList.remove('error');
                }
            }
        }
    },
    
    // Show model selection modal
    showModelSelectionModal: function() {
        if (this.elements.modelSelectionModal) {
            this.elements.modelSelectionModal.classList.remove('hidden');
        }
    },
    
    // Hide model selection modal
    hideModelSelectionModal: function() {
        if (this.elements.modelSelectionModal) {
            this.elements.modelSelectionModal.classList.add('hidden');
        }
    },
    
    // Toggle help modal
    toggleHelpModal: function() {
        if (!this.elements.helpModal) return;
        
        if (this.elements.helpModal.classList.contains('hidden')) {
            this.elements.helpModal.classList.remove('hidden');
        } else {
            this.elements.helpModal.classList.add('hidden');
        }
    },
    
    // Show help modal
    showHelpModal: function() {
        if (this.elements.helpModal) {
            this.elements.helpModal.classList.remove('hidden');
        }
    },
    
    // Hide help modal
    hideHelpModal: function() {
        if (this.elements.helpModal) {
            this.elements.helpModal.classList.add('hidden');
        }
    },
    
    // Show permissions request
    showPermissionsRequest: function() {
        if (this.elements.permissionsRequest) {
            this.elements.permissionsRequest.classList.remove('hidden');
        }
    },
    
    // Hide permissions request
    hidePermissionsRequest: function() {
        if (this.elements.permissionsRequest) {
            this.elements.permissionsRequest.classList.add('hidden');
        }
    },
    
    // Show error message
    showError: function(message) {
        console.error('UI ERROR:', message);
        
        if (this.elements.errorMessage) {
            const errorDescription = this.elements.errorMessage.querySelector('.error-description');
            if (errorDescription) {
                errorDescription.textContent = message;
            }
            this.elements.errorMessage.classList.remove('hidden');
        } else {
            // Fallback to alert if error element not found
            alert('Error: ' + message);
        }
    },
    
    // Show notification
    showNotification: function(message, duration = 3000) {
        console.log('NOTIFICATION:', message);
        
        if (this.elements.notification) {
            this.elements.notification.textContent = message;
            this.elements.notification.classList.add('show');
            
            setTimeout(() => {
                this.elements.notification.classList.remove('show');
            }, duration);
        }
    },
    
    // Set active control mode
    setControlModeActive: function(mode) {
        console.log('Setting control mode:', mode);
        
        // Find all control buttons
        const controlButtons = document.querySelectorAll('.control-button');
        
        // Remove active class from all buttons
        controlButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        // Add active class to the selected mode button
        const modeButton = document.getElementById(`${mode}-button`);
        if (modeButton) {
            modeButton.classList.add('active');
        }
    },
    
    // Reset model to default position/rotation/scale
    resetModel: function() {
        console.log('Resetting model');
        
        const modelContainer = document.getElementById('model-container');
        if (modelContainer) {
            modelContainer.setAttribute('position', '0 0 -3');
            modelContainer.setAttribute('rotation', '0 0 0');
            modelContainer.setAttribute('scale', '1 1 1');
        }
        
        this.showNotification('Model reset');
    }
};

// Auto-initialize if window is already loaded
if (document.readyState === 'complete') {
    console.log('Document already loaded, initializing UI Manager');
    UIManager.init();
}
