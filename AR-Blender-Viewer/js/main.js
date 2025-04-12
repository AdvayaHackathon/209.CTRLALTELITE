/**
 * Main Application Logic for AR Blender Model Viewer
 * Initializes the AR experience and handles core functionality
 */

// Main Application Namespace
const ARApp = {
    // Config
    config: {
        initialModelPath: './models/model2.glb',
        defaultDelay: 3000,
        zoomMin: 0.5,
        zoomMax: 3.0,
        zoomStep: 0.2
    },
    
    // State
    state: {
        isInitialized: false,
        isARReady: false,
        activeControl: null,
        zoomLevel: 1.0,
        orientation360Enabled: false,
        isARActive: false,
        isCameraReady: false,
        currentModel: null,
        modelPlaced: false,
        currentModelIndex: 1  // Start with model2 (index 1)
    },
    
    // UI Elements (will be populated during init)
    ui: {
        loadingScreen: null,
        errorMessage: null,
        controlPanel: null,
        modelSelectionModal: null,
        controls: {} // will contain all control buttons
    },
    
    // Model data
    models: [
        { name: 'Model 1', path: './models/model1.glb', thumbnail: 'default-model' },
        { name: 'Model 2', path: './models/model2.glb', thumbnail: 'default-model' }
    ],
    
    // Guaranteed safe initialization
    init: function() {
        // Wait for page to be fully loaded
        if (document.readyState !== 'complete') {
            console.log('Waiting for page to fully load...');
            window.addEventListener('load', this.init.bind(this));
            return;
        }
        
        console.log('Initializing AR Blender Viewer...');
        
        try {
            // Prevent double initialization
            if (this.state.isInitialized) {
                console.log('Already initialized, skipping...');
                return;
            }
            
            // Mark as initialized
            this.state.isInitialized = true;
            
            // Cache all UI elements
            this.cacheUIElements();
            
            // Explicitly initialize model
            this.initializeModel();
            
            // Initialize UI Manager if it exists
            if (typeof UIManager !== 'undefined' && UIManager) {
                try {
                    UIManager.init();
                    console.log('UI Manager initialized');
                } catch (e) {
                    console.error('Error initializing UI Manager:', e);
                }
            }
            
            // Set up all event listeners
            this.setupEventListeners();
            
            // Initialize model selection
            this.setupModelSelection();
            
            // Set up viewport controls
            this.setupViewportControls();
            
            // Initialize 360 view functionality
            this.setup360View();
            
            // Show success notification
            this.showStartupSuccessMessage();
            
            // Hide loading screen after delay
            setTimeout(() => {
                this.hideLoadingScreen();
            }, this.config.defaultDelay);
            
            console.log('AR Blender Viewer initialized successfully!');
            
            // Show UI elements once everything is ready
            document.body.classList.add('ready');
            
            // Show control panel
            if (this.ui.controlPanel) {
                this.ui.controlPanel.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error initializing AR Blender Viewer:', error);
            this.showError('Failed to initialize AR Blender Viewer: ' + error.message);
        }
    },
    
    // Initialize model
    initializeModel: function() {
        console.log('Initializing model...');
        
        if (this.ui.modelEntity) {
            // Ensure the model has the initial path
            const currentModelPath = this.ui.modelEntity.getAttribute('gltf-model');
            
            if (!currentModelPath || currentModelPath !== this.config.initialModelPath) {
                console.log('Setting initial model path to:', this.config.initialModelPath);
                
                // Apply initial model
                this.ui.modelEntity.setAttribute('gltf-model', this.config.initialModelPath);
                
                // Add event listener for model loaded
                this.ui.modelEntity.addEventListener('model-loaded', (e) => {
                    console.log('Model loaded successfully:', e.detail.model);
                    this.showNotification('Model loaded successfully');
                });
                
                // Add event listener for model error
                this.ui.modelEntity.addEventListener('model-error', (e) => {
                    console.error('Error loading model:', e.detail.src);
                    this.showError('Failed to load model: ' + this.config.initialModelPath);
                });
            } else {
                console.log('Model already has correct path:', currentModelPath);
            }
        } else {
            console.error('Cannot initialize model: model entity not found');
        }
    },
    
    // Cache all UI elements
    cacheUIElements: function() {
        console.log('Caching UI elements...');
        
        // Main elements
        this.ui.loadingScreen = document.getElementById('loading-screen');
        this.ui.errorMessage = document.getElementById('error-message');
        this.ui.controlPanel = document.getElementById('control-panel');
        this.ui.modelSelectionModal = document.getElementById('model-selection-modal');
        this.ui.placementIndicator = document.getElementById('placement-indicator');
        
        // Control buttons - using query selector to get all at once
        const controlButtons = document.querySelectorAll('.control-button');
        if (controlButtons && controlButtons.length > 0) {
            // Convert to array and create a map by ID for easy access
            Array.from(controlButtons).forEach(button => {
                if (button && button.id) {
                    this.ui.controls[button.id] = button;
                }
            });
            console.log('Found control buttons:', Object.keys(this.ui.controls).length);
        } else {
            console.warn('No control buttons found in the DOM');
        }
        
        // Model selection elements
        this.ui.modelPresetGrid = document.getElementById('model-preset-grid');
        this.ui.modelUpload = document.getElementById('model-upload');
        this.ui.closeModelSelection = document.getElementById('close-model-selection');
        
        // Viewport control buttons
        this.ui.zoomInButton = document.getElementById('zoom-in-button');
        this.ui.zoomOutButton = document.getElementById('zoom-out-button');
        this.ui.centerViewButton = document.getElementById('center-view-button');
        this.ui.switchModelButton = document.getElementById('switch-model-button');
        
        // A-Frame scene
        this.ui.scene = document.querySelector('a-scene');
        this.ui.modelEntity = document.querySelector('#model');
        this.ui.modelContainer = document.querySelector('#model-container');
        
        // Log if critical elements are missing
        if (!this.ui.modelEntity) {
            console.error('Critical error: Model entity (#model) not found in the DOM');
        } else {
            console.log('Model entity found with current model:', this.ui.modelEntity.getAttribute('gltf-model'));
        }
        
        if (!this.ui.modelContainer) {
            console.error('Critical error: Model container (#model-container) not found in the DOM');
        }
    },
    
    // Set up all event listeners
    setupEventListeners: function() {
        console.log('Setting up event listeners...');
        
        try {
            // Safely add click listeners to all control buttons
            Object.keys(this.ui.controls).forEach(id => {
                const button = this.ui.controls[id];
                if (!button) return;
                
                console.log('Adding click listener to:', id);
                
                // Using the safer technique to add event listeners
                this.addSafeEventListener(button, 'click', () => {
                    console.log('Button clicked:', id);
                    
                    // Toggle active state for the button
                    if (id !== 'model-button' && id !== 'reset-button') {
                        this.setActiveControl(button);
                    }
                    
                    // Handle button actions
                    switch(id) {
                        case 'place-button':
                            this.setControlMode('place');
                            break;
                        case 'rotate-button':
                            this.setControlMode('rotate');
                            break;
                        case 'scale-button':
                            this.setControlMode('scale');
                            break;
                        case 'pan-button':
                            this.setControlMode('pan');
                            break;
                        case 'view360-button':
                            this.toggle360View();
                            break;
                        case 'reset-button':
                            this.resetModel();
                            break;
                        case 'model-button':
                            this.showModelSelectionModal();
                            break;
                    }
                });
            });
            
            // Window resize handler
            this.addSafeEventListener(window, 'resize', () => {
                console.log('Window resized');
                // Make any adjustments needed on resize
            });
            
            // A-Frame scene event listeners
            if (this.ui.scene) {
                this.addSafeEventListener(this.ui.scene, 'loaded', () => {
                    console.log('A-Frame scene loaded');
                    this.showNotification('AR scene loaded successfully');
                });
                
                this.addSafeEventListener(this.ui.scene, 'renderstart', () => {
                    console.log('A-Frame render started');
                });
            } else {
                console.warn('A-Frame scene not found in DOM');
            }
            
            // Listen for camera feed active event
            document.addEventListener('camera-feed-active', () => {
                console.log('Camera feed is active');
                this.state.isCameraReady = true;
                
                // Show notification
                if (window.UIManager && UIManager.showNotification) {
                    UIManager.showNotification("Camera active. Looking for surfaces...");
                }
                
                // Show surface indicator
                const indicator = document.querySelector('.surface-detection-indicator');
                if (indicator) {
                    indicator.style.display = 'block';
                }
            });
            
            // Listen for model placement
            document.addEventListener('model-placed', () => {
                console.log('Model placed event received');
                this.state.modelPlaced = true;
                
                // Show success animation
                this.showPlacementSuccess();
            });
            
            console.log('Event listeners setup completed');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    },
    
    // Helper method to safely add event listeners
    addSafeEventListener: function(element, eventType, callback) {
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
    
    // Set active control
    setActiveControl: function(button) {
        if (!button) return;
        
        // Remove active class from all buttons
        Object.values(this.ui.controls).forEach(btn => {
            if (btn && btn.classList) {
                btn.classList.remove('active');
            }
        });
        
        // Add active class to the selected button
        button.classList.add('active');
        
        // Update active control
        this.state.activeControl = button.id;
    },
    
    // Set control mode
    setControlMode: function(mode) {
        console.log('Setting control mode to:', mode);
        
        // Update model controls via event
        try {
            window.dispatchEvent(new CustomEvent('model-interaction-mode', { 
                detail: { mode: mode }
            }));
        } catch (e) {
            console.error('Error dispatching model-interaction-mode event:', e);
        }
        
        // Show placement indicator if in place mode
        if (mode === 'place') {
            this.showPlacementIndicator();
        } else {
            this.hidePlacementIndicator();
        }
        
        // Notify UIManager if it exists
        if (typeof UIManager !== 'undefined' && UIManager && UIManager.setControlModeActive) {
            UIManager.setControlModeActive(mode);
        }
    },
    
    // Show error message
    showError: function(message) {
        console.error('ERROR:', message);
        
        if (this.ui.errorMessage) {
            const errorDescription = this.ui.errorMessage.querySelector('.error-description');
            if (errorDescription) {
                errorDescription.textContent = message;
            }
            this.ui.errorMessage.classList.remove('hidden');
        } else {
            alert('Error: ' + message);
        }
    },
    
    // Show notification
    showNotification: function(message) {
        console.log('NOTIFICATION:', message);
        
        if (typeof UIManager !== 'undefined' && UIManager && UIManager.showNotification) {
            UIManager.showNotification(message);
        } else {
            // Fallback notification
            const notification = document.getElementById('notification');
            if (notification) {
                notification.textContent = message;
                notification.classList.add('show');
                
                setTimeout(() => {
                    notification.classList.remove('show');
                }, 3000);
            }
        }
    },
    
    // Hide loading screen
    hideLoadingScreen: function() {
        if (this.ui.loadingScreen) {
            this.ui.loadingScreen.classList.add('hidden');
        }
    },
    
    // Show placement indicator
    showPlacementIndicator: function() {
        if (this.ui.placementIndicator) {
            this.ui.placementIndicator.classList.remove('hidden');
        }
        
        if (typeof UIManager !== 'undefined' && UIManager && UIManager.showPlacementIndicator) {
            UIManager.showPlacementIndicator();
        }
    },
    
    // Hide placement indicator
    hidePlacementIndicator: function() {
        if (this.ui.placementIndicator) {
            this.ui.placementIndicator.classList.add('hidden');
        }
        
        if (typeof UIManager !== 'undefined' && UIManager && UIManager.hidePlacementIndicator) {
            UIManager.hidePlacementIndicator();
        }
    },
    
    // Reset model to default position, rotation, and scale
    resetModel: function() {
        console.log('Resetting model');
        
        if (this.ui.modelContainer) {
            this.ui.modelContainer.setAttribute('position', '0 0 -3');
            this.ui.modelContainer.setAttribute('rotation', '0 0 0');
            this.ui.modelContainer.setAttribute('scale', '1 1 1');
        }
        
        if (typeof UIManager !== 'undefined' && UIManager && UIManager.resetModel) {
            UIManager.resetModel();
        }
        
        this.showNotification('Model reset');
    },
    
    // Setup model selection
    setupModelSelection: function() {
        // Setup close button for model selection modal
        if (this.ui.closeModelSelection) {
            this.addSafeEventListener(this.ui.closeModelSelection, 'click', () => {
                this.hideModelSelectionModal();
            });
        }
        
        // Handle model upload
        if (this.ui.modelUpload) {
            this.addSafeEventListener(this.ui.modelUpload, 'change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleModelUpload(file);
                }
            });
        }
        
        // Populate preset models grid
        this.populateModelGrid();
    },
    
    // Show model selection modal
    showModelSelectionModal: function() {
        console.log('Showing model selection modal');
        
        if (this.ui.modelSelectionModal) {
            this.ui.modelSelectionModal.classList.remove('hidden');
        }
    },
    
    // Hide model selection modal
    hideModelSelectionModal: function() {
        console.log('Hiding model selection modal');
        
        if (this.ui.modelSelectionModal) {
            this.ui.modelSelectionModal.classList.add('hidden');
        }
    },
    
    // Populate the model grid with available models
    populateModelGrid: function() {
        if (!this.ui.modelPresetGrid) return;
        
        console.log('Populating model grid');
            
            // Clear existing content
        this.ui.modelPresetGrid.innerHTML = '';
        
        // Add each model to the grid
        this.models.forEach(model => {
                const modelElement = document.createElement('div');
                modelElement.className = 'model-preset';
                modelElement.dataset.model = model.path;
                
            const thumbnail = document.createElement('div');
            thumbnail.className = 'model-thumbnail ' + model.thumbnail;
            
            const name = document.createElement('div');
            name.className = 'model-name';
            name.textContent = model.name;
            
            modelElement.appendChild(thumbnail);
            modelElement.appendChild(name);
            
            // Add click handler
            this.addSafeEventListener(modelElement, 'click', () => {
                this.changeModel(model.path);
                this.hideModelSelectionModal();
            });
            
            this.ui.modelPresetGrid.appendChild(modelElement);
        });
    },
    
    // Change the current model
    changeModel: function(modelPath) {
        console.log('Changing model to:', modelPath);
        
        if (this.ui.modelEntity) {
            // Remove any existing model first to force reload
            this.ui.modelEntity.removeAttribute('gltf-model');
            
            // Set timeout to ensure the attribute removal has taken effect
            setTimeout(() => {
                // Apply the new model path
                this.ui.modelEntity.setAttribute('gltf-model', modelPath);
                console.log('Model attribute set to:', modelPath);
                
                // Force a scene update
                if (this.ui.scene) {
                    this.ui.scene.object3D.updateMatrixWorld(true);
                }
                
                this.showNotification('Model changed to: ' + modelPath);
            }, 100);
        } else {
            console.error('Model entity not found in the DOM');
        }
    },
    
    // Handle model upload
    handleModelUpload: function(file) {
        console.log('Handling model upload:', file.name);
        
        // Create object URL for the uploaded model
        const objectURL = URL.createObjectURL(file);
        
        // Change the model to the uploaded file
        this.changeModel(objectURL);
                this.hideModelSelectionModal();
    },
    
    // Setup viewport controls
    setupViewportControls: function() {
        // Zoom in button
        if (this.ui.zoomInButton) {
            this.addSafeEventListener(this.ui.zoomInButton, 'click', () => {
                this.zoomViewport(this.config.zoomStep);
            });
        }
        
        // Zoom out button
        if (this.ui.zoomOutButton) {
            this.addSafeEventListener(this.ui.zoomOutButton, 'click', () => {
                this.zoomViewport(-this.config.zoomStep);
            });
        }
        
        // Center view button
        if (this.ui.centerViewButton) {
            this.addSafeEventListener(this.ui.centerViewButton, 'click', () => {
                this.centerView();
            });
        }
        
        // Switch model button - Using direct onclick in HTML now
        const switchModelButton = document.getElementById('switch-model-button');
        if (switchModelButton && !switchModelButton.hasAttribute('onclick')) {
            console.log('Adding click event listener to switch model button');
            this.addSafeEventListener(switchModelButton, 'click', () => {
                console.log('Switch model button clicked via event listener');
                this.switchModel();
            });
        } else {
            console.log('Switch model button already has onclick attribute or not found');
        }
    },
    
    // Zoom viewport
    zoomViewport: function(zoomDelta) {
        this.state.zoomLevel = Math.max(
            this.config.zoomMin, 
            Math.min(this.config.zoomMax, this.state.zoomLevel + zoomDelta)
        );
        
        console.log('Zooming viewport to:', this.state.zoomLevel);
        
        if (this.ui.modelContainer) {
            const currentScale = this.ui.modelContainer.getAttribute('scale');
            const newScale = this.state.zoomLevel;
            
            this.ui.modelContainer.setAttribute('scale', `${newScale} ${newScale} ${newScale}`);
        }
    },
    
    // Center the view
    centerView: function() {
        console.log('Centering view');
        
        if (this.ui.modelContainer) {
            this.ui.modelContainer.setAttribute('position', '0 0 -3');
        }
    },
    
    // Setup 360 view
    setup360View: function() {
        console.log('Setting up 360 view capability');
        
        // Implement 360 view functionality if needed
    },
    
    // Toggle 360 view
    toggle360View: function() {
        this.state.orientation360Enabled = !this.state.orientation360Enabled;
        console.log('360 view toggled:', this.state.orientation360Enabled);
        
        if (this.state.orientation360Enabled) {
            this.enable360View();
        } else {
            this.disable360View();
        }
    },
    
    // Enable 360 view
    enable360View: function() {
        if (this.ui.controls['view360-button']) {
            this.ui.controls['view360-button'].classList.add('active');
        }
        
        // Code to enable 360 view functionality
    },
    
    // Disable 360 view
    disable360View: function() {
        if (this.ui.controls['view360-button']) {
            this.ui.controls['view360-button'].classList.remove('active');
        }
        
        // Code to disable 360 view functionality
    },
    
    // Show startup success message
    showStartupSuccessMessage: function() {
        setTimeout(() => {
            if (window.UIManager && UIManager.showNotification) {
                UIManager.showNotification("AR viewer initialized successfully. Finding camera...");
            }
        }, 1000);
    },
    
    // Show placement success animation and feedback
    showPlacementSuccess: function() {
        console.log("Showing placement success");
        
        // Create success indicator
        let successIndicator = document.getElementById('placement-success');
        if (!successIndicator) {
            successIndicator = document.createElement('div');
            successIndicator.id = 'placement-success';
            successIndicator.style.position = 'fixed';
            successIndicator.style.top = '50%';
            successIndicator.style.left = '50%';
            successIndicator.style.transform = 'translate(-50%, -50%)';
            successIndicator.style.width = '200px';
            successIndicator.style.height = '200px';
            successIndicator.style.background = 'rgba(46, 204, 113, 0.3)';
            successIndicator.style.borderRadius = '50%';
            successIndicator.style.border = '8px solid #2ecc71';
            successIndicator.style.zIndex = '1001';
            successIndicator.style.animation = 'success-pulse 1s 1 forwards';
            
            // Create checkmark inside
            const checkmark = document.createElement('div');
            checkmark.style.position = 'absolute';
            checkmark.style.top = '50%';
            checkmark.style.left = '50%';
            checkmark.style.transform = 'translate(-50%, -50%)';
            checkmark.style.color = '#2ecc71';
            checkmark.style.fontSize = '80px';
            checkmark.innerHTML = '✓';
            
            successIndicator.appendChild(checkmark);
            document.body.appendChild(successIndicator);
            
            // Add animation style
            const style = document.createElement('style');
            style.textContent = `
                @keyframes success-pulse {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
                }
            `;
            document.head.appendChild(style);
            
            // Remove after animation
            setTimeout(() => {
                if (successIndicator.parentNode) {
                    successIndicator.parentNode.removeChild(successIndicator);
                }
            }, 1500);
        }
        
        // Vibrate for success feedback
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 200]);
        }
        
        // Show notification
        if (window.UIManager && UIManager.showNotification) {
            UIManager.showNotification("Model placed successfully! You can now interact with it.", 4000);
        }
    },
    
    // Switch between available models
    switchModel: function() {
        try {
            // Toggle between model1.glb and model2.glb
            this.state.currentModelIndex = this.state.currentModelIndex === 0 ? 1 : 0;
            
            // Get direct references to the model paths
            const modelPaths = ['./models/model1.glb', './models/model2.glb'];
            const modelNames = ['Model 1', 'Model 2'];
            
            // Get the new model path
            const newModelPath = modelPaths[this.state.currentModelIndex];
            const modelName = modelNames[this.state.currentModelIndex];
            
            console.log('Switching to model:', newModelPath, 'Index:', this.state.currentModelIndex);
            
            // Get direct reference to model entity
            const modelEntity = document.getElementById('model');
            
            if (modelEntity) {
                console.log('Model entity found, current model:', modelEntity.getAttribute('gltf-model'));
                
                // First remove the current model
                modelEntity.removeAttribute('gltf-model');
                console.log('Removed current model');
                
                // Directly update the HTML attribute
                setTimeout(() => {
                    modelEntity.setAttribute('gltf-model', newModelPath);
                    console.log('Set new model path:', newModelPath);
                    
                    // Update debug display
                    const debugState = document.getElementById('debug-state');
                    if (debugState) {
                        debugState.textContent = modelName;
                        console.log('Updated debug state to:', modelName);
                    }
                    
                    // Show notification
                    this.showNotification(`Switched to ${modelName}`);
                }, 100);
                
                // Create a visual indicator that model is changing
                this.showModelChangeIndicator(modelName);
            } else {
                console.error('Model entity not found - cannot switch model');
                this.showError('Failed to switch model: Model element not found');
            }
        } catch (error) {
            console.error('Error switching model:', error);
            this.showError('Error switching model: ' + error.message);
        }
    },
    
    // Show visual indicator that model is changing
    showModelChangeIndicator: function(modelName) {
        // Create temporary visual indicator
        const indicator = document.createElement('div');
        indicator.style.position = 'fixed';
        indicator.style.top = '50%';
        indicator.style.left = '50%';
        indicator.style.transform = 'translate(-50%, -50%)';
        indicator.style.background = 'rgba(142, 68, 173, 0.8)';
        indicator.style.color = 'white';
        indicator.style.padding = '20px 40px';
        indicator.style.borderRadius = '10px';
        indicator.style.fontWeight = 'bold';
        indicator.style.fontSize = '18px';
        indicator.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        indicator.style.zIndex = '10000';
        indicator.textContent = `Loading ${modelName}...`;
        
        document.body.appendChild(indicator);
        
        // Remove after 1.5 seconds
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 1500);
    }
};

// Auto-initialize when script is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Short delay to ensure all resources are loaded
        setTimeout(function() {
            ARApp.init();
        }, 500);
    });
} else {
    // DOM already loaded, initialize with delay
    setTimeout(function() {
        ARApp.init();
    }, 500);
}

// Simple UI Manager for showing notifications
const UIManager = {
    showNotification: function(message, duration = 3000) {
        console.log('UI Manager: Notification - ' + message);
        
        const notification = document.getElementById('notification');
        if (notification) {
            notification.textContent = message;
            notification.classList.add('show');
            
            setTimeout(function() {
                notification.classList.remove('show');
            }, duration);
        }
    },
    
    showError: function(message) {
        console.error('UI Manager: Error - ' + message);
        this.showNotification('Error: ' + message, 5000);
    }
};
