/**
 * UI Manager for AR Blender Model Viewer
 * Handles all UI interactions, status updates, and user controls
 */

const UIManager = {
    // DOM Elements
    controlPanel: null,
    placementIndicator: null,
    modelSelectionModal: null,
    closeModelSelectionButton: null,
    helpModal: null,
    helpButton: null,
    closeHelpButton: null,
    errorMessage: null,
    notification: null,
    arStatus: null,
    notificationTimeout: null,
    
    // Current interaction mode
    interactionMode: 'place',
    
    // Initialize the UI Manager
    init: function() {
        console.log('UI Manager initializing...');
        
        try {
            // Get DOM Elements
            this.controlPanel = document.getElementById('control-panel');
            this.placementIndicator = document.getElementById('placement-indicator');
            this.modelSelectionModal = document.getElementById('model-selection-modal');
            this.closeModelSelectionButton = document.getElementById('close-model-selection');
            this.helpModal = document.getElementById('help-modal');
            this.helpButton = document.getElementById('help-button');
            this.closeHelpButton = document.querySelector('#help-modal .close-button');
            this.errorMessage = document.getElementById('error-message');
            this.notification = document.getElementById('notification');
            this.arStatus = document.getElementById('ar-status');
            
            // Create notification element if it doesn't exist
            if (!this.notification) {
                this.createNotificationElement();
            }
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('UI Manager initialized successfully!');
        } catch (error) {
            console.error('Error initializing UI Manager:', error);
        }
    },
    
    // Create notification element
    createNotificationElement: function() {
        this.notification = document.createElement('div');
        this.notification.id = 'notification';
        this.notification.className = 'notification';
        document.body.appendChild(this.notification);
        console.log('Created notification element');
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        try {
            // Close buttons for modals
            if (this.closeModelSelectionButton) {
                this.closeModelSelectionButton.addEventListener('click', () => {
                    this.hideModelSelectionModal();
                });
            }
            
            if (this.closeHelpButton) {
                this.closeHelpButton.addEventListener('click', () => {
                    this.helpModal.classList.add('hidden');
                });
            }
            
            // Help button
            if (this.helpButton) {
                this.helpButton.addEventListener('click', () => {
                    this.helpModal.classList.remove('hidden');
                });
            }
            
            // Reload button
            const reloadButton = document.getElementById('reload-button');
            if (reloadButton) {
                reloadButton.addEventListener('click', () => {
                    window.location.reload();
                });
            }
            
            // Close modal when clicking outside
            window.addEventListener('click', (event) => {
                if (event.target.classList.contains('modal')) {
                    event.target.classList.add('hidden');
                }
            });
            
            console.log('Event listeners setup complete');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    },
    
    // Show placement indicator
    showPlacementIndicator: function() {
        if (this.placementIndicator) {
            this.placementIndicator.classList.remove('hidden');
        }
        this.setInteractionMode('place');
    },
    
    // Hide placement indicator
    hidePlacementIndicator: function() {
        if (this.placementIndicator) {
            this.placementIndicator.classList.add('hidden');
        }
    },
    
    // Show model selection modal
    showModelSelectionModal: function() {
        if (this.modelSelectionModal) {
            this.modelSelectionModal.classList.remove('hidden');
        }
    },
    
    // Hide model selection modal
    hideModelSelectionModal: function() {
        if (this.modelSelectionModal) {
            this.modelSelectionModal.classList.add('hidden');
        }
    },
    
    // Show error message
    showError: function(message) {
        if (this.errorMessage) {
            const errorDescription = this.errorMessage.querySelector('.error-description');
            if (errorDescription) {
                errorDescription.textContent = message;
            }
            this.errorMessage.classList.remove('hidden');
        } else {
            console.error('Error message element not found');
            alert('Error: ' + message);
        }
    },
    
    // Hide error message
    hideError: function() {
        if (this.errorMessage) {
            this.errorMessage.classList.add('hidden');
        }
    },
    
    // Show notification
    showNotification: function(message, duration = 3000) {
        console.log('Showing notification:', message);
        
        try {
            if (!this.notification) {
                this.createNotificationElement();
            }
            
            this.notification.textContent = message;
            this.notification.classList.add('show');
            
            // Clear any existing timeout
            if (this.notificationTimeout) {
                clearTimeout(this.notificationTimeout);
            }
            
            // Hide after duration
            this.notificationTimeout = setTimeout(() => {
                this.hideNotification();
            }, duration);
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    },
    
    // Hide notification
    hideNotification: function() {
        if (this.notification) {
            this.notification.classList.remove('show');
        }
    },
    
    // Set AR status
    setARStatus: function(status) {
        if (this.arStatus) {
            const statusText = this.arStatus.querySelector('.status-text');
            const statusDot = this.arStatus.querySelector('.status-dot');
            
            if (statusText && statusDot) {
                statusText.textContent = status;
                
                // Update status dot color based on status
                statusDot.className = 'status-dot';
                if (status.includes('Ready')) {
                    statusDot.classList.add('status-ready');
                } else if (status.includes('Error')) {
                    statusDot.classList.add('status-error');
                } else {
                    statusDot.classList.add('status-working');
                }
            }
        }
    },
    
    // Set interaction mode
    setInteractionMode: function(mode) {
        const validModes = ['place', 'rotate', 'scale', 'pan', 'view360'];
        
        if (validModes.includes(mode)) {
            this.interactionMode = mode;
            
            // Update UI to reflect current mode
            if (this.controlPanel) {
                const buttons = this.controlPanel.querySelectorAll('.control-button');
                buttons.forEach(button => {
                    button.classList.remove('active');
                });
                
                const modeButton = document.getElementById(`${mode}-button`);
                if (modeButton) {
                    modeButton.classList.add('active');
                }
            }
            
            // Send interaction mode to AR components
            const modelContainer = document.getElementById('model-container');
            if (modelContainer) {
                modelContainer.setAttribute('model-controls', `mode: ${mode}`);
            }
            
            // Show feedback to user
            this.showNotification(`Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
            console.log('Interaction mode set to:', mode);
        }
    },
    
    // Reset model
    resetModel: function() {
        const modelContainer = document.getElementById('model-container');
        
        if (modelContainer) {
            // Reset position, rotation, and scale
            modelContainer.setAttribute('position', '0 0 -3');
            modelContainer.setAttribute('rotation', '0 0 0');
            modelContainer.setAttribute('scale', '1 1 1');
            
            // Show feedback
            this.showNotification('Model reset to default position and size');
        }
    },
    
    // Load model
    loadModel: function(modelPath, modelName) {
        const modelAsset = document.getElementById('model-asset');
        const model = document.getElementById('model');
        
        if (modelAsset && model) {
            // Show loading feedback
            this.showNotification(`Loading model: ${modelName}...`);
            
            // Update the model asset source
            modelAsset.setAttribute('src', modelPath);
            
            // Update the model
            model.setAttribute('gltf-model', '');
            
            // Wait for the model to load
            modelAsset.addEventListener('loaded', () => {
                model.setAttribute('gltf-model', `#model-asset`);
                this.showNotification(`Model loaded: ${modelName}`);
                this.hideModelSelectionModal();
                
                // Reset model position, rotation, and scale
                this.resetModel();
            }, { once: true });
        }
    },
    
    // Log analytics
    logAnalytics: function(eventName, eventData) {
        console.log('Analytics:', eventName, eventData);
        // In a real app, this would send data to an analytics service
    }
};

// Export the UI Manager for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}
