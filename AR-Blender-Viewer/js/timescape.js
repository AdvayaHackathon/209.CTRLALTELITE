/**
 * TimeScape Explorer
 * Handles location-based historical model viewing in AR
 */

const TimescapeExplorer = {
    // Current state
    state: {
        currentLocation: null,
        isARActive: false,
        isSurfaceDetected: false,
        modelPlaced: false
    },
    
    // Location data
    locations: {
        ayodhya: {
            name: "Ayodhya",
            description: "Ancient city with rich historical significance",
            models: [
                { name: "Ram Mandir", path: "./models/nl.glb", thumbnail: "default-model" },
                // More models can be added here
            ]
        }
        // More locations can be added here
    },
    
    // UI Elements
    ui: {
        welcomeScreen: null,
        surfaceSelectionScreen: null,
        arScene: null,
        locationCards: null
    },
    
    // Initialize the TimeScape Explorer
    init: function() {
        console.log("Initializing TimeScape Explorer");
        
        try {
            // Cache UI elements
            this.cacheElements();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log("TimeScape Explorer initialized successfully");
        } catch (error) {
            console.error("Error initializing TimeScape Explorer:", error);
            alert("Failed to initialize TimeScape Explorer: " + error.message);
        }
    },
    
    // Cache UI elements
    cacheElements: function() {
        this.ui.welcomeScreen = document.getElementById("welcome-screen");
        this.ui.surfaceSelectionScreen = document.getElementById("surface-selection-screen");
        this.ui.arScene = document.getElementById("ar-scene");
        this.ui.locationCards = document.querySelectorAll(".location-card");
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Location selection
        this.ui.locationCards.forEach(card => {
            card.addEventListener("click", (event) => {
                const location = card.dataset.location;
                this.selectLocation(location);
            });
        });
        
        // AR placement events
        document.addEventListener("surface-detected", () => {
            this.state.isSurfaceDetected = true;
            this.showNotification("Surface detected. Tap to place model.");
        });
        
        document.addEventListener("model-placed", () => {
            this.state.modelPlaced = true;
            this.showNotification("Model placed. You can now walk around it.");
            // Hide surface selection screen if it's still visible
            this.ui.surfaceSelectionScreen.classList.add("hidden");
        });
        
        // Camera feed ready event
        document.addEventListener("camera-feed-active", () => {
            console.log("Camera feed active event received");
            // Show a notification to guide the user
            this.showNotification("Camera active. Looking for surfaces...", 3000);
            
            // Make sure the surface selection screen is semi-transparent
            // to allow the user to see the camera feed
            if (this.ui.surfaceSelectionScreen && !this.state.modelPlaced) {
                this.ui.surfaceSelectionScreen.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
                
                // Make the instruction panel more visible against the camera feed
                const instructionPanel = this.ui.surfaceSelectionScreen.querySelector(".instruction-panel");
                if (instructionPanel) {
                    instructionPanel.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
                    instructionPanel.style.border = "2px solid #3498db";
                    instructionPanel.style.boxShadow = "0 0 20px rgba(52, 152, 219, 0.5)";
                }
            }
        });
    },
    
    // Select a location
    selectLocation: function(locationId) {
        console.log("Location selected:", locationId);
        
        // Check if location exists
        if (!this.locations[locationId]) {
            console.error("Invalid location:", locationId);
            return;
        }
        
        // Set current location
        this.state.currentLocation = locationId;
        const location = this.locations[locationId];
        
        // Update models list if defined
        if (location.models && location.models.length > 0) {
            // If ARApp is available, set available models
            if (window.ARApp && ARApp.models) {
                ARApp.models = location.models;
            }
        }
        
        // Hide welcome screen
        this.ui.welcomeScreen.classList.add("hidden");
        
        // Show surface selection screen
        this.ui.surfaceSelectionScreen.classList.remove("hidden");
        
        // Start AR experience after a short delay
        setTimeout(() => {
            this.startARExperience();
        }, 3000);
    },
    
    // Start AR experience
    startARExperience: function() {
        console.log("Starting AR experience");
        
        // Show AR scene
        this.ui.arScene.classList.remove("hidden");
        
        // Set state
        this.state.isARActive = true;
        
        // Make sure the scene is visible and properly styled
        if (this.ui.arScene) {
            this.ui.arScene.style.width = '100%';
            this.ui.arScene.style.height = '100%';
            this.ui.arScene.style.position = 'absolute';
            this.ui.arScene.style.top = '0';
            this.ui.arScene.style.left = '0';
            this.ui.arScene.style.zIndex = '2'; // Higher z-index to ensure it's on top
            this.ui.arScene.style.visibility = 'visible';
            this.ui.arScene.style.display = 'block';
        }
        
        // Dispatch event to initialize AR components
        document.dispatchEvent(new CustomEvent("ar-initialize"));
        
        // Make AR.js video element visible if it exists
        setTimeout(() => {
            const arVideo = document.querySelector('#arjs-video');
            if (arVideo) {
                arVideo.style.display = 'block';
                arVideo.style.opacity = '1';
                console.log("AR.js video made visible");
            } else {
                console.warn("AR.js video element not found, trying fallback method");
                
                // Use the debug camera as a fallback
                const usingDebug = this.showDebugCamera();
                
                if (usingDebug) {
                    console.log("Using debug camera as fallback");
                    // Since we're using the fallback, we can still proceed with the flow
                    // The debug function already adds a button to trigger surface detection
                    
                    // Hide the surface selection screen after a delay to show the camera
                    setTimeout(() => {
                        // Only hide if we're still in surface detection mode
                        if (!this.state.modelPlaced) {
                            this.ui.surfaceSelectionScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                            // Keep the instructions visible but make them semi-transparent
                            const instructionPanel = this.ui.surfaceSelectionScreen.querySelector('.instruction-panel');
                            if (instructionPanel) {
                                instructionPanel.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                            }
                        }
                    }, 2000);
                } else {
                    console.error("Failed to initialize camera view for AR");
                    this.showNotification("Camera error. Please refresh and try again.", 5000);
                }
            }
        }, 1000);
        
        // Show notification
        this.showNotification("Move your device to detect surfaces");
    },
    
    // Show notification
    showNotification: function(message, duration = 3000) {
        console.log("Notification:", message);
        
        // Try to use UIManager if available
        if (window.UIManager && UIManager.showNotification) {
            UIManager.showNotification(message, duration);
            return;
        }
        
        // Fallback to built-in notification
        const notification = document.getElementById("notification");
        if (notification) {
            notification.textContent = message;
            notification.classList.add("show");
            
            setTimeout(() => {
                notification.classList.remove("show");
            }, duration);
        }
    },
    
    // Debug function to help with camera visibility issues
    showDebugCamera: function() {
        console.log("Attempting to show debug camera");
        
        // Check if we have a stored camera stream
        if (window.cameraStream) {
            console.log("Using stored camera stream for debug video");
            
            // Create or get debug video element
            let debugVideo = document.getElementById('debug-video');
            if (!debugVideo) {
                debugVideo = document.createElement('video');
                debugVideo.id = 'debug-video';
                debugVideo.autoplay = true;
                debugVideo.playsInline = true;
                document.body.appendChild(debugVideo);
            }
            
            // Make debug video visible
            debugVideo.style.display = 'block';
            
            // Connect stream
            if ('srcObject' in debugVideo) {
                debugVideo.srcObject = window.cameraStream;
            } else {
                debugVideo.src = window.URL.createObjectURL(window.cameraStream);
            }
            
            // Add a button to hide surface selection screen
            let debugButton = document.getElementById('debug-camera-button');
            if (!debugButton) {
                debugButton = document.createElement('button');
                debugButton.id = 'debug-camera-button';
                debugButton.innerHTML = 'Continue to AR';
                debugButton.style.position = 'fixed';
                debugButton.style.bottom = '20px';
                debugButton.style.left = '50%';
                debugButton.style.transform = 'translateX(-50%)';
                debugButton.style.zIndex = '1000';
                debugButton.style.padding = '12px 24px';
                debugButton.style.background = '#3498db';
                debugButton.style.color = 'white';
                debugButton.style.border = 'none';
                debugButton.style.borderRadius = '4px';
                debugButton.style.fontWeight = 'bold';
                
                debugButton.addEventListener('click', () => {
                    // Hide surface selection and proceed
                    this.state.isSurfaceDetected = true;
                    document.dispatchEvent(new CustomEvent('surface-detected'));
                    
                    // Make debug video less visible but keep it for background
                    debugVideo.style.opacity = '0.5'; 
                });
                
                document.body.appendChild(debugButton);
            }
            
            return true;
        } else {
            console.warn("No camera stream available for debug");
            return false;
        }
    }
};

// Simplified direct model placement component
AFRAME.registerComponent('surface-detector-enhanced', {
    init: function() {
        console.log('Direct model placement component initialized');
        
        // Track state
        this.isModelPlaced = false;
        
        // Reference to the model container
        this.modelContainer = document.getElementById('model-container');
        
        // Setup touch handling
        this.setupTouchHandling();
        
        // Wait for camera to activate
        document.addEventListener('camera-feed-active', () => {
            console.log('Camera feed active - ready for model placement');
        });
    },
    
    setupTouchHandling: function() {
        // Use the scene canvas for touch detection
        const canvas = document.querySelector('canvas.a-canvas');
        if (canvas) {
            console.log('Adding event listeners to canvas');
            canvas.addEventListener('click', this.handleTap.bind(this));
            canvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleTap(e);
            });
        } else {
            console.error('Canvas not found, using document.body');
            document.body.addEventListener('click', this.handleTap.bind(this));
            document.body.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleTap(e);
            });
        }
        
        // Also create a touch overlay as fallback
        this.createTouchOverlay();
    },
    
    createTouchOverlay: function() {
        // Create overlay
        this.touchOverlay = document.getElementById('touch-overlay');
        if (!this.touchOverlay) {
            this.touchOverlay = document.createElement('div');
            this.touchOverlay.id = 'touch-overlay';
            document.body.appendChild(this.touchOverlay);
            
            // Add event listeners
            this.touchOverlay.addEventListener('click', this.handleTap.bind(this));
            this.touchOverlay.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleTap(e);
            });
        }
    },
    
    handleTap: function(event) {
        // Only handle if not already placed
        if (this.isModelPlaced) {
            console.log('Model already placed - ignoring tap');
            return;
        }
        
        console.log('Tap detected - placing model');
        
        // Get tap coordinates
        let pageX, pageY;
        
        if (event.changedTouches && event.changedTouches.length > 0) {
            pageX = event.changedTouches[0].pageX;
            pageY = event.changedTouches[0].pageY;
        } else {
            pageX = event.pageX || (event.clientX + document.body.scrollLeft);
            pageY = event.pageY || (event.clientY + document.body.scrollTop);
        }
        
        console.log(`Tap at: ${pageX}, ${pageY}`);
        
        // Place the model
        this.placeModel(pageX, pageY);
    },
    
    placeModel: function(x, y) {
        if (!this.modelContainer) {
            console.error('Model container not found');
            return;
        }
        
        // Convert screen position to normalized coordinates (-1 to 1)
        const width = window.innerWidth;
        const height = window.innerHeight;
        const normalizedX = (x / width) * 2 - 1;
        const normalizedY = -((y / height) * 2 - 1);  // Y is inverted in 3D space
        
        // Simple position calculation
        // Keep model in front with horizontal offset based on tap position
        const xPos = normalizedX * 1.5;
        const yPos = -0.5;  // Below camera height
        const zPos = -2;    // Fixed distance in front
        
        console.log(`Placing model at position: x=${xPos}, y=${yPos}, z=${zPos}`);
        
        // Set model position
        this.modelContainer.setAttribute('position', {
            x: xPos,
            y: yPos,
            z: zPos
        });
        
        // Mark as placed
        this.isModelPlaced = true;
        
        // Provide feedback
        this.providePlacementFeedback();
    },
    
    providePlacementFeedback: function() {
        // Vibrate device if available
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
        
        // Show notification
        if (window.TimescapeExplorer && TimescapeExplorer.showNotification) {
            TimescapeExplorer.showNotification("Model placed successfully!", 3000);
        }
        
        // Fire event
        document.dispatchEvent(new CustomEvent('model-placed'));
        
        console.log('Model placement complete');
    }
}); 