/**
 * UI Manager for AR Blender Model Viewer
 * Handles all UI interactions, status updates, and user controls
 */

const UIManager = {
    // UI elements
    elements: {
        loadingScreen: null,
        controlPanel: null,
        placementIndicator: null,
        arStatus: null,
        statusDot: null,
        statusText: null,
        modelSelectionModal: null,
        closeModelSelection: null,
        helpButton: null,
        helpModal: null,
        errorMessage: null,
        notification: null,
        permissionsRequest: null,
        viewportControls: null,
        cameraPermissionButton: null,
    },
    
    // Control buttons
    controlButtons: {
        placeButton: null,
        rotateButton: null,
        scaleButton: null,
        panButton: null,
        resetButton: null,
        modelButton: null,
        view360Button: null,
    },
    
    // Viewport control buttons
    viewportControlButtons: {
        zoomInButton: null,
        zoomOutButton: null,
        centerViewButton: null,
    },
    
    // Modal states
    modalStates: {
        isModelSelectionVisible: false,
        isHelpVisible: false,
    },
    
    // Initialize UI
    init: function() {
        console.log('Initializing UI Manager');
        
        this.cacheElements();
        this.setupEventListeners();
        this.updateARStatus('Initializing...');
        
        // Start with loading screen visible
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.classList.remove('hidden');
        }
        
        return this;
    },
    
    // Cache DOM elements
    cacheElements: function() {
        this.elements.loadingScreen = document.getElementById('loading-screen');
        this.elements.controlPanel = document.getElementById('control-panel');
        this.elements.placementIndicator = document.getElementById('placement-indicator');
        this.elements.arStatus = document.getElementById('ar-status');
        this.elements.statusDot = this.elements.arStatus ? this.elements.arStatus.querySelector('.status-dot') : null;
        this.elements.statusText = this.elements.arStatus ? this.elements.arStatus.querySelector('.status-text') : null;
        this.elements.modelSelectionModal = document.getElementById('model-selection-modal');
        this.elements.closeModelSelection = document.getElementById('close-model-selection');
        this.elements.helpButton = document.getElementById('help-button');
        this.elements.helpModal = document.getElementById('help-modal');
        this.elements.errorMessage = document.getElementById('error-message');
        this.elements.notification = document.getElementById('notification');
        this.elements.permissionsRequest = document.getElementById('permissions-request');
        this.elements.viewportControls = document.getElementById('viewport-controls');
        this.elements.cameraPermissionButton = document.getElementById('camera-permission-button');
        
        // Cache control buttons
        this.controlButtons.placeButton = document.getElementById('place-button');
        this.controlButtons.rotateButton = document.getElementById('rotate-button');
        this.controlButtons.scaleButton = document.getElementById('scale-button');
        this.controlButtons.panButton = document.getElementById('pan-button');
        this.controlButtons.resetButton = document.getElementById('reset-button');
        this.controlButtons.modelButton = document.getElementById('model-button');
        this.controlButtons.view360Button = document.getElementById('view360-button');
        
        // Cache viewport control buttons
        this.viewportControlButtons.zoomInButton = document.getElementById('zoom-in-button');
        this.viewportControlButtons.zoomOutButton = document.getElementById('zoom-out-button');
        this.viewportControlButtons.centerViewButton = document.getElementById('center-view-button');
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Close buttons for modals
        if (this.elements.closeModelSelection) {
            this.elements.closeModelSelection.addEventListener('click', () => this.hideModelSelectionModal());
        }
        
        if (this.elements.helpButton) {
            this.elements.helpButton.addEventListener('click', () => this.toggleHelpModal());
        }
        
        if (this.elements.helpModal) {
            const closeButtons = this.elements.helpModal.querySelectorAll('.close-button');
            closeButtons.forEach(button => {
                button.addEventListener('click', () => this.hideHelpModal());
            });
        }
        
        // Control buttons
        if (this.controlButtons.modelButton) {
            this.controlButtons.modelButton.addEventListener('click', () => this.showModelSelectionModal());
        }
        
        // Permissions button
        const enableMotionButton = document.getElementById('enable-motion-button');
        if (enableMotionButton) {
            enableMotionButton.addEventListener('click', () => this.requestPermissions());
        }
        
        // Camera permission button
        if (this.elements.cameraPermissionButton) {
            this.elements.cameraPermissionButton.addEventListener('click', () => {
                console.log('Camera permission button clicked');
                // This will trigger the ar-scene-manager to request camera permission
                const scene = document.querySelector('a-scene');
                if (scene && scene.components['ar-scene-manager']) {
                    scene.components['ar-scene-manager'].requestCameraPermission();
                } else {
                    this.showError('AR scene not initialized. Please refresh the page.');
                }
            });
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
    
    // Update AR status
    updateARStatus: function(status) {
        if (this.elements.statusText) {
            this.elements.statusText.textContent = status;
        }
    },
    
    // Set AR status
    setARStatus: function(status, isError = false) {
        if (this.elements.arStatus) {
            if (isError) {
                this.elements.arStatus.classList.add('error');
                this.elements.statusDot.classList.add('error');
            } else {
                this.elements.arStatus.classList.remove('error');
                this.elements.statusDot.classList.remove('error');
                this.elements.statusDot.classList.add('active');
            }
            
            this.updateARStatus(status);
        }
    },
    
    // Show camera permission UI
    showCameraPermissionUI: function() {
        if (this.elements.cameraPermissionButton) {
            this.elements.cameraPermissionButton.classList.remove('hidden');
        }
    },
    
    // Hide camera permission UI
    hideCameraPermissionUI: function() {
        if (this.elements.cameraPermissionButton) {
            this.elements.cameraPermissionButton.classList.add('hidden');
        }
    },
    
    // Show model selection modal
    showModelSelectionModal: function() {
        if (this.elements.modelSelectionModal) {
            this.modalStates.isModelSelectionVisible = true;
            this.elements.modelSelectionModal.classList.remove('hidden');
        }
    },
    
    // Hide model selection modal
    hideModelSelectionModal: function() {
        if (this.elements.modelSelectionModal) {
            this.modalStates.isModelSelectionVisible = false;
            this.elements.modelSelectionModal.classList.add('hidden');
        }
    },
    
    // Toggle help modal
    toggleHelpModal: function() {
        if (this.elements.helpModal) {
            if (this.modalStates.isHelpVisible) {
                this.hideHelpModal();
            } else {
                this.showHelpModal();
            }
        }
    },
    
    // Show help modal
    showHelpModal: function() {
        if (this.elements.helpModal) {
            this.modalStates.isHelpVisible = true;
            this.elements.helpModal.classList.remove('hidden');
        }
    },
    
    // Hide help modal
    hideHelpModal: function() {
        if (this.elements.helpModal) {
            this.modalStates.isHelpVisible = false;
            this.elements.helpModal.classList.add('hidden');
        }
    },
    
    // Show error message
    showError: function(message, title = 'Something went wrong') {
        if (this.elements.errorMessage) {
            const errorTitle = this.elements.errorMessage.querySelector('.error-title');
            const errorDescription = this.elements.errorMessage.querySelector('.error-description');
            
            if (errorTitle) errorTitle.textContent = title;
            if (errorDescription) errorDescription.textContent = message;
            
            this.elements.errorMessage.classList.remove('hidden');
            
            // Also show a notification
            this.showNotification(message, 'error');
            
            // Update AR status
            this.setARStatus('Error: ' + message, true);
        } else {
            console.error('Error:', message);
        }
    },
    
    // Hide error message
    hideError: function() {
        if (this.elements.errorMessage) {
            this.elements.errorMessage.classList.add('hidden');
        }
    },
    
    // Show notification
    showNotification: function(message, type = 'info') {
        if (this.elements.notification) {
            // Clear any existing notification
            clearTimeout(this.notificationTimeout);
            
            // Set notification text and type
            this.elements.notification.textContent = message;
            this.elements.notification.className = 'notification'; // Reset classes
            this.elements.notification.classList.add(type);
            
            // Show notification
            this.elements.notification.classList.add('visible');
            
            // Auto hide after 3 seconds
            this.notificationTimeout = setTimeout(() => {
                this.hideNotification();
            }, 3000);
        }
    },
    
    // Hide notification
    hideNotification: function() {
        if (this.elements.notification) {
            this.elements.notification.classList.remove('visible');
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
    
    // Request permissions
    requestPermissions: function() {
        console.log('Requesting device motion and camera permissions');
        
        // Request DeviceOrientationEvent permission
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(permission => {
                    if (permission === 'granted') {
                        console.log('Device orientation permission granted');
                        this.showNotification('Device orientation enabled');
                        
                        // Also request camera permission
                        this.requestCameraPermission();
                    } else {
                        console.error('Device orientation permission denied');
                        this.showError('Device orientation permission denied. Some features may not work properly.');
                    }
                })
                .catch(error => {
                    console.error('Error requesting device orientation permission:', error);
                    this.showError('Failed to request device orientation permission. Please check your browser settings.');
                })
                .finally(() => {
                    this.hidePermissionsRequest();
                });
        } else {
            // DeviceOrientationEvent doesn't require permission on this device/browser
            console.log('Device orientation permission not required on this device/browser');
            
            // Request camera permission instead
            this.requestCameraPermission();
            this.hidePermissionsRequest();
        }
    },
    
    // Request camera permission
    requestCameraPermission: function() {
        console.log('Requesting camera permission');
        
        // Show UI element for camera permission
        this.showCameraPermissionUI();
        
        // Trigger AR.js camera permission request
        const scene = document.querySelector('a-scene');
        if (scene && scene.components['ar-scene-manager']) {
            scene.components['ar-scene-manager'].requestCameraPermission();
        } else {
            this.showError('AR scene not initialized. Please refresh the page.');
        }
    },
    
    // Set control mode active
    setControlModeActive: function(mode) {
        // Reset all control buttons
        Object.values(this.controlButtons).forEach(button => {
            if (button) button.classList.remove('active');
        });
        
        // Set active mode
        switch (mode) {
            case 'place':
                if (this.controlButtons.placeButton) this.controlButtons.placeButton.classList.add('active');
                break;
            case 'rotate':
                if (this.controlButtons.rotateButton) this.controlButtons.rotateButton.classList.add('active');
                break;
            case 'scale':
                if (this.controlButtons.scaleButton) this.controlButtons.scaleButton.classList.add('active');
                break;
            case 'pan':
                if (this.controlButtons.panButton) this.controlButtons.panButton.classList.add('active');
                break;
            case 'view360':
                if (this.controlButtons.view360Button) this.controlButtons.view360Button.classList.add('active');
                break;
            default:
                break;
        }
    },
    
    // Reset model to default position and size
    resetModel: function() {
        console.log('Resetting model to default position and size');
        
        // Get the model container
        const modelContainer = document.getElementById('model-container');
        
        if (modelContainer) {
            // Reset position, rotation, and scale
            modelContainer.setAttribute('position', '0 0 -3');
            modelContainer.setAttribute('rotation', '0 0 0');
            modelContainer.setAttribute('scale', '1 1 1');
            
            // Show notification
            this.showNotification('Model reset to default position and size');
        } else {
            console.error('Model container not found');
            this.showError('Failed to reset model - container not found');
        }
    },
    
    // Load model
    loadModel: function(modelPath, modelName) {
        console.log('Loading model:', modelPath);
        
        if (!modelPath) {
            this.showError('Invalid model path');
            return;
        }
        
        // Get model asset and entity
        const modelAsset = document.getElementById('model-asset');
        const model = document.getElementById('model');
        
        if (modelAsset && model) {
            // Show loading notification
            this.showNotification(`Loading model: ${modelName || 'custom model'}...`);
            
            // Set asset source
            modelAsset.setAttribute('src', modelPath);
            
            // Clear current model
            model.removeAttribute('gltf-model');
            
            // Wait for asset to load
            modelAsset.addEventListener('loaded', () => {
                // Apply model to entity
                model.setAttribute('gltf-model', '#model-asset');
                this.showNotification(`Model loaded: ${modelName || 'custom model'}`);
                this.hideModelSelectionModal();
                
                // Reset model position and scale
                this.resetModel();
            }, { once: true });
            
            // Handle load errors
            modelAsset.addEventListener('error', (error) => {
                console.error('Error loading model:', error);
                this.showError(`Failed to load model: ${error.message || 'Unknown error'}`);
            }, { once: true });
        } else {
            this.showError('Model elements not found');
        }
    }
};

// Export the UI Manager for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}

// Initialize UI Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Delay initialization slightly to ensure all elements are available
    setTimeout(() => {
        UIManager.init();
    }, 100);
});
