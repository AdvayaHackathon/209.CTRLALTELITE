/**
 * UI Manager for AR Blender Model Viewer
 * Handles all UI interactions, status updates, and user controls
 */

class UIManager {
    constructor() {
        // UI Elements
        this.loadingScreen = document.getElementById('loading-screen');
        this.arStatus = document.getElementById('ar-status');
        this.controlPanel = document.getElementById('control-panel');
        this.viewportControls = document.getElementById('viewport-controls');
        this.modelSelectionModal = document.getElementById('model-selection-modal');
        this.helpModal = document.getElementById('help-modal');
        
        // Control Buttons
        this.placeButton = document.getElementById('place-button');
        this.rotateButton = document.getElementById('rotate-button');
        this.scaleButton = document.getElementById('scale-button');
        this.panButton = document.getElementById('pan-button');
        this.resetButton = document.getElementById('reset-button');
        this.modelButton = document.getElementById('model-button');
        this.helpButton = document.getElementById('help-button');
        this.view360Button = document.getElementById('view360-button');
        
        // Viewport Controls
        this.zoomInButton = document.getElementById('zoom-in-button');
        this.zoomOutButton = document.getElementById('zoom-out-button');
        this.centerViewButton = document.getElementById('center-view-button');
        
        // Close buttons
        this.closeModelSelectionButton = document.getElementById('close-model-selection');
        this.closeHelpButton = document.querySelector('#help-modal .close-button');
        
        // State
        this.isARStarted = false;
        this.isModelPlaced = false;
        this.activeInteractionMode = 'none';
        
        // Analytics data
        this.analytics = {
            sessionStartTime: Date.now(),
            interactions: 0
        };
        
        // Initialize
        this.init();
    }
    
    init() {
        // Setup event listeners
        this.setupEventListeners();
        
        // Show appropriate starting screen
        this.hideLoadingScreen();
        
        // Log analytics event
        this.logAnalytics('session_start', {
            userAgent: navigator.userAgent,
            screenSize: `${window.innerWidth}x${window.innerHeight}`
        });
    }
    
    setupEventListeners() {
        // Control Panel Buttons
        if (this.placeButton) {
            this.placeButton.addEventListener('click', () => {
                this.setInteractionMode('place');
                this.logAnalytics('select_interaction_mode', { mode: 'place' });
            });
        }
        
        if (this.rotateButton) {
            this.rotateButton.addEventListener('click', () => {
                this.setInteractionMode('rotate');
                this.logAnalytics('select_interaction_mode', { mode: 'rotate' });
            });
        }
        
        if (this.scaleButton) {
            this.scaleButton.addEventListener('click', () => {
                this.setInteractionMode('scale');
                this.logAnalytics('select_interaction_mode', { mode: 'scale' });
            });
        }
        
        if (this.panButton) {
            this.panButton.addEventListener('click', () => {
                this.setInteractionMode('pan');
                this.logAnalytics('select_interaction_mode', { mode: 'pan' });
            });
        }
        
        if (this.resetButton) {
            this.resetButton.addEventListener('click', () => {
                this.resetScene();
                this.setInteractionMode('none');
                this.logAnalytics('reset_scene');
            });
        }
        
        if (this.modelButton) {
            this.modelButton.addEventListener('click', () => {
                this.showModelSelectionModal();
                this.logAnalytics('open_model_selection');
            });
        }
        
        if (this.view360Button) {
            this.view360Button.addEventListener('click', () => {
                this.setInteractionMode('view360');
                this.logAnalytics('select_interaction_mode', { mode: 'view360' });
            });
        }
        
        // Viewport Controls
        if (this.zoomInButton) {
            this.zoomInButton.addEventListener('click', () => {
                this.zoomViewport(0.1);
                this.logAnalytics('zoom_in');
            });
        }
        
        if (this.zoomOutButton) {
            this.zoomOutButton.addEventListener('click', () => {
                this.zoomViewport(-0.1);
                this.logAnalytics('zoom_out');
            });
        }
        
        if (this.centerViewButton) {
            this.centerViewButton.addEventListener('click', () => {
                this.centerViewport();
                this.logAnalytics('center_view');
            });
        }
        
        // Help Button
        if (this.helpButton) {
            this.helpButton.addEventListener('click', () => {
                this.showHelpModal();
                this.logAnalytics('open_help');
            });
        }
        
        // Close buttons
        if (this.closeModelSelectionButton) {
            this.closeModelSelectionButton.addEventListener('click', () => {
                this.hideModelSelectionModal();
                this.logAnalytics('close_model_selection');
            });
        }
        
        if (this.closeHelpButton) {
            this.closeHelpButton.addEventListener('click', () => {
                this.hideHelpModal();
                this.logAnalytics('close_help');
            });
        }
        
        // Listen for A-Frame events
        window.addEventListener('model-loaded', () => {
            this.onModelLoaded();
            this.logAnalytics('model_loaded');
        });
        
        // Listen for tracking status changes from AR.js
        document.addEventListener('arTrackingFound', () => {
            this.updateARStatus('Tracking OK', 'connected');
            this.logAnalytics('tracking_found');
        });
        
        document.addEventListener('arTrackingLost', () => {
            this.updateARStatus('Tracking lost', '');
            this.logAnalytics('tracking_lost');
        });
        
        // Handle scene loaded
        const scene = document.querySelector('a-scene');
        if (scene.hasLoaded) {
            this.onSceneLoaded();
        } else {
            scene.addEventListener('loaded', () => this.onSceneLoaded());
        }
        
        // Keyboard controls for accessibility
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.hideAllModals();
            }
        });
    }
    
    onSceneLoaded() {
        // Show control panel once scene is loaded
        setTimeout(() => {
            this.showControlPanel();
            this.showViewportControls();
            this.updateARStatus('Ready', 'connected');
        }, 1000);
        
        // Make camera and model reference available
        this.camera = document.getElementById('camera');
        this.modelContainer = document.getElementById('model-container');
        
        // Ensure browser compatibility with AR features
        if (!this.checkBrowserCompatibility()) {
            this.showError('Browser Compatibility Issue', 
                'Your browser may not support all required AR features. For best experience, use recent versions of Chrome or Safari on a modern device.');
        }
    }
    
    onModelLoaded() {
        this.hideLoadingScreen();
        this.isModelPlaced = true;
        
        // Update controls visibility
        this.showControlPanel();
        this.showViewportControls();
    }
    
    checkBrowserCompatibility() {
        // Check for WebGL support
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            return false;
        }
        
        // Check for camera access
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            return false;
        }
        
        return true;
    }
    
    setInteractionMode(mode) {
        this.activeInteractionMode = mode;
        
        // Update button states
        const buttons = document.querySelectorAll('.control-button');
        buttons.forEach(button => button.classList.remove('active'));
        
        // Set active button
        if (mode !== 'none') {
            const activeButton = document.getElementById(`${mode}-button`);
            if (activeButton) {
                activeButton.classList.add('active');
            }
        }
        
        // Notify the model-controls component about the mode change
        const modelContainer = document.getElementById('model-container');
        if (modelContainer && modelContainer.components && modelContainer.components['model-controls']) {
            // Handle mode change via A-Frame's ways or dispatch an event
            window.dispatchEvent(new CustomEvent('model-interaction-mode', {
                detail: { mode: mode }
            }));
        }
    }
    
    resetScene() {
        // Reset camera and model
        if (this.camera) {
            this.camera.setAttribute('position', '0 1.6 0');
            this.camera.setAttribute('rotation', '0 0 0');
        }
        
        if (this.modelContainer) {
            this.modelContainer.setAttribute('position', '0 0 -3');
            this.modelContainer.setAttribute('rotation', '0 0 0');
            this.modelContainer.setAttribute('scale', '1 1 1');
        }
        
        // Reset interaction mode
        this.setInteractionMode('none');
    }
    
    zoomViewport(delta) {
        if (window.ARApp) {
            window.ARApp.zoomViewport(delta);
        }
    }
    
    centerViewport() {
        if (window.ARApp) {
            window.ARApp.centerViewport();
        }
    }
    
    updateARStatus(text, statusClass) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (statusText) {
            statusText.textContent = text;
        }
        
        if (statusDot) {
            statusDot.className = 'status-dot';
            if (statusClass) {
                statusDot.classList.add(statusClass);
            }
        }
    }
    
    showControlPanel() {
        if (this.controlPanel) {
            this.controlPanel.classList.remove('hidden');
        }
    }
    
    hideControlPanel() {
        if (this.controlPanel) {
            this.controlPanel.classList.add('hidden');
        }
    }
    
    showViewportControls() {
        if (this.viewportControls) {
            this.viewportControls.classList.remove('hidden');
        }
    }
    
    hideViewportControls() {
        if (this.viewportControls) {
            this.viewportControls.classList.add('hidden');
        }
    }
    
    showModelSelectionModal() {
        if (this.modelSelectionModal) {
            this.modelSelectionModal.classList.remove('hidden');
        }
    }
    
    hideModelSelectionModal() {
        if (this.modelSelectionModal) {
            this.modelSelectionModal.classList.add('hidden');
        }
    }
    
    showHelpModal() {
        if (this.helpModal) {
            this.helpModal.classList.remove('hidden');
        }
    }
    
    hideHelpModal() {
        if (this.helpModal) {
            this.helpModal.classList.add('hidden');
        }
    }
    
    hideAllModals() {
        this.hideModelSelectionModal();
        this.hideHelpModal();
    }
    
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
        }
    }
    
    showError(title, message) {
        const errorMessage = document.getElementById('error-message');
        const errorTitle = document.querySelector('#error-message .error-title');
        const errorDescription = document.querySelector('#error-message .error-description');
        
        if (errorTitle && errorDescription) {
            errorTitle.textContent = title;
            errorDescription.textContent = message;
        }
        
        if (errorMessage) {
            errorMessage.classList.remove('hidden');
        }
        
        this.logAnalytics('error', { title, message });
    }
    
    showNotification(message, duration = 3000) {
        let notification = document.getElementById('notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'notification';
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.classList.add('show');
        
        // Auto-hide after duration
        setTimeout(() => {
            notification.classList.remove('show');
        }, duration);
    }
    
    logAnalytics(eventName, eventData = {}) {
        this.analytics.interactions++;
        console.log(`Analytics: ${eventName}`, eventData);
        
        // Implement actual analytics tracking here if needed
    }
}

// Create and export UI manager
window.UIManager = new UIManager();
