/**
 * AR Components for A-Frame
 * Custom components to handle AR tracking, model interactions and surface detection
 */

// Component to handle and display AR tracking status
AFRAME.registerComponent('ar-tracking-status', {
    init: function () {
        this.lastStatus = '';
        this.statusElement = document.getElementById('tracking-status');
        
        // Listen for AR tracking events from AR.js
        this.el.addEventListener('arTrackingFound', () => this.updateStatus('good'));
        this.el.addEventListener('arTrackingLost', () => this.updateStatus('lost'));
        
        // Setup initial status
        setTimeout(() => {
            this.updateStatus('initializing');
            document.getElementById('ar-status').classList.remove('hidden');
        }, 1000);
    },
    
    updateStatus: function (status) {
        if (status === this.lastStatus) return;
        this.lastStatus = status;
        
        let text = '';
        let icon = '';
        
        switch (status) {
            case 'initializing':
                text = 'Initializing tracking...';
                icon = 'fa-satellite-dish';
                break;
            case 'good':
                text = 'Tracking OK';
                icon = 'fa-check-circle';
                break;
            case 'lost':
                text = 'Tracking lost';
                icon = 'fa-exclamation-triangle';
                break;
            default:
                text = 'Unknown status';
                icon = 'fa-question-circle';
        }
        
        // Update the UI
        this.statusElement.innerHTML = `<i class="fas ${icon}"></i><span>${text}</span>`;
        
        // Add a visual class
        this.statusElement.className = 'status-indicator';
        this.statusElement.classList.add(`status-${status}`);
        
        // Notify status change
        window.dispatchEvent(new CustomEvent('ar-tracking-status-change', { detail: { status } }));
    }
});

// Component to handle surface detection and model placement
AFRAME.registerComponent('surface-detector', {
    schema: {
        minDistance: {type: 'number', default: 0.5},
        maxDistance: {type: 'number', default: 5.0},
        interval: {type: 'number', default: 100}
    },
    
    init: function () {
        // Surface indicator element
        this.surfaceIndicator = document.createElement('div');
        this.surfaceIndicator.className = 'surface-indicator';
        this.surfaceIndicator.style.display = 'none';
        document.body.appendChild(this.surfaceIndicator);
        
        // Raycaster for detecting surfaces
        this.raycaster = new THREE.Raycaster();
        this.camera = document.querySelector('a-entity[camera]').object3D;
        this.surfaces = [];
        
        // Setup detection interval
        this.detectSurfaceInterval = setInterval(() => this.detectSurface(), this.data.interval);
        
        // Set up click listener for model placement
        document.addEventListener('click', this.onDocumentClick.bind(this));
        
        // Listen for tracking status change
        window.addEventListener('ar-tracking-status-change', (e) => {
            if (e.detail.status === 'good') {
                this.surfaceIndicator.style.display = 'block';
            } else {
                this.surfaceIndicator.style.display = 'none';
            }
        });
    },
    
    detectSurface: function () {
        // Only detect if tracking is good
        if (document.querySelector('.status-good') === null) return;
        
        // Cast a ray from the center of the screen
        const center = new THREE.Vector2();
        this.raycaster.setFromCamera(center, this.camera);
        
        // Check for intersections with detected planes
        const hits = this.raycaster.intersectObjects(this.surfaces, true);
        
        if (hits.length > 0) {
            const hit = hits[0];
            
            // Check if within min/max distance
            if (hit.distance < this.data.minDistance || hit.distance > this.data.maxDistance) {
                this.surfaceIndicator.style.display = 'none';
                return;
            }
            
            // Update indicator position to show where the model would be placed
            const point = hit.point;
            const vector = new THREE.Vector3(point.x, point.y, point.z);
            vector.project(this.camera);
            
            const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
            
            this.surfaceIndicator.style.display = 'block';
            this.surfaceIndicator.style.left = `${x}px`;
            this.surfaceIndicator.style.top = `${y}px`;
            
            // Store the hit point for model placement
            this.currentHit = hit;
        } else {
            this.surfaceIndicator.style.display = 'none';
            this.currentHit = null;
        }
    },
    
    onDocumentClick: function (event) {
        // Only process clicks if we have a valid surface hit
        if (!this.currentHit) return;
        
        // Dispatch an event with the hit information for model placement
        window.dispatchEvent(new CustomEvent('surface-selected', { 
            detail: {
                position: this.currentHit.point,
                normal: this.currentHit.face.normal,
                distance: this.currentHit.distance
            }
        }));
    },
    
    // Register a new surface plane for detection
    registerSurface: function (object) {
        this.surfaces.push(object);
    },
    
    remove: function () {
        clearInterval(this.detectSurfaceInterval);
        document.removeEventListener('click', this.onDocumentClick.bind(this));
        if (this.surfaceIndicator && this.surfaceIndicator.parentNode) {
            this.surfaceIndicator.parentNode.removeChild(this.surfaceIndicator);
        }
    }
});

// Component to handle model interaction (move, rotate, scale)
AFRAME.registerComponent('model-interaction', {
    schema: {
        mode: {type: 'string', default: 'none'}, // none, move, rotate, scale
        sensitivity: {type: 'number', default: 1.0}
    },
    
    init: function () {
        this.isActive = false;
        this.lastPosition = { x: 0, y: 0 };
        this.modelRoot = this.el;
        
        // Setup touch/mouse event handlers
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
        
        document.addEventListener('touchstart', this.onTouchStart);
        document.addEventListener('touchmove', this.onTouchMove);
        document.addEventListener('touchend', this.onTouchEnd);
        document.addEventListener('mousedown', this.onTouchStart);
        document.addEventListener('mousemove', this.onTouchMove);
        document.addEventListener('mouseup', this.onTouchEnd);
        
        // Listen for mode changes
        window.addEventListener('model-interaction-mode', (e) => {
            this.data.mode = e.detail.mode;
            this.isActive = false;
        });
    },
    
    onTouchStart: function (event) {
        if (this.data.mode === 'none') return;
        
        // Get touch or mouse position
        const position = this.getTouchPosition(event);
        this.lastPosition.x = position.x;
        this.lastPosition.y = position.y;
        this.isActive = true;
        
        // For pinch-to-scale
        if (this.data.mode === 'scale' && event.touches && event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            this.lastDistance = Math.hypot(
                touch1.clientX - touch2.clientX,
                touch1.clientY - touch2.clientY
            );
        }
    },
    
    onTouchMove: function (event) {
        if (!this.isActive) return;
        
        const position = this.getTouchPosition(event);
        const deltaX = position.x - this.lastPosition.x;
        const deltaY = position.y - this.lastPosition.y;
        
        // Handle different interaction modes
        switch (this.data.mode) {
            case 'move':
                this.handleMove(deltaX, deltaY);
                break;
            case 'rotate':
                this.handleRotate(deltaX, deltaY);
                break;
            case 'scale':
                if (event.touches && event.touches.length === 2) {
                    this.handlePinchScale(event);
                } else {
                    this.handleScale(deltaY);
                }
                break;
        }
        
        this.lastPosition.x = position.x;
        this.lastPosition.y = position.y;
    },
    
    onTouchEnd: function () {
        this.isActive = false;
    },
    
    getTouchPosition: function (event) {
        // For touch events
        if (event.touches && event.touches.length > 0) {
            return {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        }
        // For mouse events
        return {
            x: event.clientX,
            y: event.clientY
        };
    },
    
    handleMove: function (deltaX, deltaY) {
        // Convert screen space to world space delta
        const camera = document.querySelector('a-entity[camera]').object3D;
        const worldDirection = new THREE.Vector3();
        camera.getWorldDirection(worldDirection);
        
        // Create movement vector based on camera direction
        const right = new THREE.Vector3();
        right.crossVectors(worldDirection, new THREE.Vector3(0, 1, 0)).normalize();
        const up = new THREE.Vector3();
        up.crossVectors(right, worldDirection).normalize();
        
        // Scale movement by sensitivity and apply
        const sensitivity = this.data.sensitivity * 0.01;
        const movement = new THREE.Vector3()
            .addScaledVector(right, deltaX * sensitivity)
            .addScaledVector(up, -deltaY * sensitivity);
        
        const currentPosition = this.modelRoot.getAttribute('position');
        this.modelRoot.setAttribute('position', {
            x: currentPosition.x + movement.x,
            y: currentPosition.y + movement.y,
            z: currentPosition.z + movement.z
        });
    },
    
    handleRotate: function (deltaX, deltaY) {
        const sensitivity = this.data.sensitivity * 0.5;
        const rotation = this.modelRoot.getAttribute('rotation');
        
        this.modelRoot.setAttribute('rotation', {
            x: rotation.x + (deltaY * sensitivity),
            y: rotation.y + (deltaX * sensitivity),
            z: rotation.z
        });
    },
    
    handleScale: function (deltaY) {
        const sensitivity = this.data.sensitivity * 0.01;
        const scale = this.modelRoot.getAttribute('scale');
        const scaleFactor = 1 - (deltaY * sensitivity);
        
        // Ensure scale doesn't go too small or too large
        const newScale = {
            x: Math.max(0.1, Math.min(5, scale.x * scaleFactor)),
            y: Math.max(0.1, Math.min(5, scale.y * scaleFactor)),
            z: Math.max(0.1, Math.min(5, scale.z * scaleFactor))
        };
        
        this.modelRoot.setAttribute('scale', newScale);
    },
    
    handlePinchScale: function (event) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.hypot(
            touch1.clientX - touch2.clientX,
            touch1.clientY - touch2.clientY
        );
        
        const scaleFactor = distance / this.lastDistance;
        this.lastDistance = distance;
        
        const scale = this.modelRoot.getAttribute('scale');
        const sensitivity = this.data.sensitivity * 0.5;
        const adjustedScaleFactor = 1 + ((scaleFactor - 1) * sensitivity);
        
        // Ensure scale doesn't go too small or too large
        const newScale = {
            x: Math.max(0.1, Math.min(5, scale.x * adjustedScaleFactor)),
            y: Math.max(0.1, Math.min(5, scale.y * adjustedScaleFactor)),
            z: Math.max(0.1, Math.min(5, scale.z * adjustedScaleFactor))
        };
        
        this.modelRoot.setAttribute('scale', newScale);
    },
    
    remove: function () {
        document.removeEventListener('touchstart', this.onTouchStart);
        document.removeEventListener('touchmove', this.onTouchMove);
        document.removeEventListener('touchend', this.onTouchEnd);
        document.removeEventListener('mousedown', this.onTouchStart);
        document.removeEventListener('mousemove', this.onTouchMove);
        document.removeEventListener('mouseup', this.onTouchEnd);
    }
});

// Component to handle model loading and GLTF animations
AFRAME.registerComponent('model-handler', {
    schema: {
        src: {type: 'string'},
        autoPlay: {type: 'boolean', default: true}
    },
    
    init: function () {
        this.model = null;
        this.mixer = null;
        this.animationActions = [];
        
        // Add debug log
        console.log('Model handler initialized, loading model from:', this.data.src);
        
        // Load the model
        this.el.setAttribute('gltf-model', this.data.src);
        
        // Listen for model loaded
        this.el.addEventListener('model-loaded', this.onModelLoaded.bind(this));
        
        // Add error handler for model loading
        this.el.addEventListener('model-error', this.onModelError.bind(this));
        
        // Listen for animation controls
        this.el.addEventListener('animation-play', this.playAnimation.bind(this));
        this.el.addEventListener('animation-pause', this.pauseAnimation.bind(this));
        this.el.addEventListener('animation-stop', this.stopAnimation.bind(this));
        
        // If model isn't loaded within 10 seconds, try force loading
        this.loadTimer = setTimeout(() => {
            if (!this.model) {
                console.warn('Model load timeout, attempting to force load');
                this.el.removeAttribute('gltf-model');
                setTimeout(() => {
                    this.el.setAttribute('gltf-model', this.data.src);
                }, 500);
            }
        }, 10000);
    },
    
    onModelLoaded: function (evt) {
        clearTimeout(this.loadTimer);
        console.log('Model loaded successfully!');
        this.model = evt.detail.model;
        
        // Initialize animations if present
        const animations = this.model.animations || [];
        if (animations.length) {
            this.mixer = new THREE.AnimationMixer(this.model);
            
            for (let i = 0; i < animations.length; i++) {
                const clip = animations[i];
                const action = this.mixer.clipAction(clip);
                this.animationActions.push(action);
                
                // Auto-play the first animation if autoPlay is true
                if (i === 0 && this.data.autoPlay) {
                    action.play();
                }
            }
        }
        
        // Center and normalize the model
        this.centerModel();
        
        // Make sure the model is visible
        this.model.visible = true;
        if (this.model.traverse) {
            this.model.traverse(function(node) {
                if (node.isMesh) {
                    node.frustumCulled = false;  // Ensure model always renders
                }
            });
        }
        
        // Notify that model is ready
        window.dispatchEvent(new CustomEvent('model-ready', { detail: { model: this.model } }));
    },
    
    onModelError: function (evt) {
        clearTimeout(this.loadTimer);
        console.error('Error loading model:', evt);
        
        // Notify of error
        window.dispatchEvent(new CustomEvent('model-error', { 
            detail: { 
                error: evt,
                src: this.data.src
            } 
        }));
    },
    
    centerModel: function () {
        if (!this.model) return;
        
        // Calculate the bounding box
        const box = new THREE.Box3().setFromObject(this.model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Calculate scale to normalize model size
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.0 / maxDim;
        
        // Apply transformations to center and normalize model
        this.model.position.x = -center.x;
        this.model.position.y = -center.y;
        this.model.position.z = -center.z;
        
        // Rather than scaling the model directly, let's update the entity's scale
        const currentScale = this.el.getAttribute('scale');
        this.el.setAttribute('scale', {
            x: currentScale.x * scale,
            y: currentScale.y * scale,
            z: currentScale.z * scale
        });
    },
    
    playAnimation: function (evt) {
        const index = evt.detail.index || 0;
        if (this.animationActions[index]) {
            this.animationActions[index].play();
        }
    },
    
    pauseAnimation: function (evt) {
        const index = evt.detail.index || 0;
        if (this.animationActions[index]) {
            this.animationActions[index].paused = true;
        }
    },
    
    stopAnimation: function (evt) {
        const index = evt.detail.index || 0;
        if (this.animationActions[index]) {
            this.animationActions[index].stop();
        }
    },
    
    tick: function (time, timeDelta) {
        if (this.mixer) {
            this.mixer.update(timeDelta / 1000);
        }
    },
    
    remove: function () {
        if (this.mixer) {
            this.mixer.stopAllAction();
        }
    }
});

// Component for handling occlusion
AFRAME.registerComponent('ar-occlusion', {
    schema: {
        enabled: {type: 'boolean', default: true}
    },
    
    init: function () {
        // Check if the browser supports depth API
        if (navigator.xr && navigator.xr.getDevice) {
            navigator.xr.getDevice().then(device => {
                if (device && device.supportedFeatures && device.supportedFeatures.has('depth-sensing')) {
                    this.setupOcclusion();
                } else {
                    console.log('Depth sensing not supported by this device. Occlusion will be disabled.');
                    this.data.enabled = false;
                }
            }).catch(error => {
                console.log('XR device detection error:', error);
                this.data.enabled = false;
            });
        } else {
            console.log('WebXR not supported. Occlusion will be disabled.');
            this.data.enabled = false;
        }
    },
    
    setupOcclusion: function () {
        // This is a simplified implementation - actual depth-based occlusion
        // requires more complex shader and depth buffer handling
        if (!this.data.enabled) return;
        
        // Create a depth material
        const depthMaterial = new THREE.MeshDepthMaterial({
            depthPacking: THREE.RGBADepthPacking,
            blending: THREE.NoBlending
        });
        
        // Apply to all 3D models in the scene
        this.el.sceneEl.object3D.traverse(node => {
            if (node.isMesh && !node.userData.isOccluder) {
                node.customDepthMaterial = depthMaterial;
                node.renderOrder = 2;
            }
        });
    }
});

// Component to handle AR tracking and model visibility
AFRAME.registerComponent('ar-tracking-manager', {
    schema: {
        markerTimeout: {type: 'number', default: 5000}, // Time in ms to wait for marker before falling back
        hitTestEnabled: {type: 'boolean', default: true}
    },
    
    init: function() {
        this.markerVisible = false;
        this.markerFound = false;
        this.fallbackActive = false;
        
        // Get references to models
        this.markerModel = document.querySelector('#test-model');
        this.fallbackModel = document.querySelector('#fixed-model');
        this.arMarker = document.querySelector('#ar-marker');
        
        // Set up event listeners for marker
        if (this.arMarker) {
            this.arMarker.addEventListener('markerFound', this.onMarkerFound.bind(this));
            this.arMarker.addEventListener('markerLost', this.onMarkerLost.bind(this));
        }
        
        // Set fallback timer to show fixed model if marker isn't found
        this.fallbackTimer = setTimeout(() => {
            if (!this.markerFound) {
                this.activateFallbackMode();
            }
        }, this.data.markerTimeout);
        
        // Set up hit testing for model placement on surfaces
        if (this.data.hitTestEnabled) {
            this.setupHitTesting();
        }
        
        // Ensure model is properly sized and visible
        this.ensureModelsReady();
        
        console.log('AR tracking manager initialized');
    },
    
    onMarkerFound: function() {
        console.log('AR Marker found!');
        this.markerFound = true;
        this.markerVisible = true;
        
        // Make marker model visible
        if (this.markerModel) {
            this.markerModel.setAttribute('visible', true);
        }
        
        // Hide fallback model if it was active
        if (this.fallbackActive && this.fallbackModel) {
            this.fallbackModel.setAttribute('visible', false);
            this.fallbackActive = false;
        }
        
        // Clear fallback timer if still active
        if (this.fallbackTimer) {
            clearTimeout(this.fallbackTimer);
            this.fallbackTimer = null;
        }
        
        // Hide loading screen and UI controls
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
        
        // Show UI controls
        const uiControls = document.getElementById('ui-controls');
        if (uiControls) {
            uiControls.classList.remove('hidden');
        }
    },
    
    onMarkerLost: function() {
        console.log('AR Marker lost');
        this.markerVisible = false;
        
        // Don't immediately switch to fallback mode, 
        // only hide the marker model if we've been tracking for a while
        if (this.markerFound && this.markerModel) {
            // Just hide the marker model
            this.markerModel.setAttribute('visible', false);
            
            // Start a timer to activate fallback if marker doesn't reappear
            if (!this.fallbackTimer && !this.fallbackActive) {
                this.fallbackTimer = setTimeout(() => {
                    if (!this.markerVisible) {
                        this.activateFallbackMode();
                    }
                }, 3000); // 3 second grace period
            }
        }
    },
    
    activateFallbackMode: function() {
        console.log('Activating fallback AR mode');
        this.fallbackActive = true;
        
        // Hide marker model
        if (this.markerModel) {
            this.markerModel.setAttribute('visible', false);
        }
        
        // Show fallback model
        if (this.fallbackModel) {
            this.fallbackModel.setAttribute('visible', true);
        }
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
        
        // Show UI controls
        const uiControls = document.getElementById('ui-controls');
        if (uiControls) {
            uiControls.classList.remove('hidden');
        }
        
        // Add dynamic movement to fallback model based on device orientation
        this.setupDeviceOrientationTracking();
    },
    
    setupDeviceOrientationTracking: function() {
        // Add event listener for device orientation changes
        window.addEventListener('deviceorientation', this.onDeviceOrientation.bind(this));
        
        // Add listener for device motion
        window.addEventListener('devicemotion', this.onDeviceMotion.bind(this));
    },
    
    onDeviceOrientation: function(event) {
        if (!this.fallbackActive || !this.fallbackModel) return;
        
        // Get orientation values
        const alpha = event.alpha || 0; // Z-axis rotation
        const beta = event.beta || 0;   // X-axis rotation
        const gamma = event.gamma || 0; // Y-axis rotation
        
        // Apply subtle rotation to model based on device orientation
        // This creates a "floating" effect as the device moves
        this.fallbackModel.setAttribute('rotation', {
            x: beta * 0.1,
            y: gamma * 0.1 + alpha * 0.05,
            z: 0
        });
    },
    
    onDeviceMotion: function(event) {
        if (!this.fallbackActive || !this.fallbackModel) return;
        
        // Get acceleration data
        const accel = event.accelerationIncludingGravity;
        if (!accel) return;
        
        // Get current position
        const currentPosition = this.fallbackModel.getAttribute('position');
        
        // Apply subtle position changes based on device motion
        // This makes the model appear to float/react to device movement
        this.fallbackModel.setAttribute('position', {
            x: currentPosition.x + (accel.x || 0) * 0.001,
            y: currentPosition.y + (accel.y || 0) * 0.001,
            z: currentPosition.z + (accel.z || 0) * 0.001
        });
    },
    
    setupHitTesting: function() {
        // Set up WebXR hit testing if available
        if (navigator.xr) {
            console.log('WebXR supported, trying to set up hit testing');
            
            // Add hit-test component to camera
            const camera = document.querySelector('a-entity[camera]');
            if (camera && !camera.hasAttribute('ar-hit-test')) {
                camera.setAttribute('ar-hit-test', {
                    target: '#fallback-model-anchor'
                });
            }
        } else {
            console.log('WebXR not supported, using fallback positioning');
        }
    },
    
    ensureModelsReady: function() {
        // Add event listeners to handle model loading
        if (this.markerModel) {
            this.markerModel.addEventListener('model-loaded', () => {
                console.log('Marker model loaded successfully');
            });
        }
        
        if (this.fallbackModel) {
            this.fallbackModel.addEventListener('model-loaded', () => {
                console.log('Fallback model loaded successfully');
            });
        }
        
        // Set a timeout to force fallback mode if models don't load
        setTimeout(() => {
            // If neither model has shown, activate fallback
            if (!this.markerVisible && !this.fallbackActive) {
                console.log('No models visible after timeout, forcing fallback mode');
                this.activateFallbackMode();
            }
        }, 10000); // 10 seconds
    }
});

// AR Hit Test component for surface detection
AFRAME.registerComponent('ar-hit-test', {
    schema: {
        target: {type: 'selector'}
    },
    
    init: function() {
        this.hitTestSource = null;
        this.hitTestSourceRequested = false;
        this.frame = null;
        
        // Get AR session if available
        if (navigator.xr) {
            // Add session listener
            this.el.sceneEl.addEventListener('enter-vr', this.onEnterVR.bind(this));
        }
    },
    
    onEnterVR: function(event) {
        const session = this.el.sceneEl.xrSession;
        if (!session) return;
        
        // Check if hit test is supported
        if (session.requestHitTestSource) {
            console.log('Hit test supported in this session');
            this.requestHitTestSource(session);
        } else {
            console.log('Hit test not supported in this session');
        }
    },
    
    requestHitTestSource: function(session) {
        if (this.hitTestSourceRequested) return;
        
        this.hitTestSourceRequested = true;
        
        // Request hit test source
        session.requestReferenceSpace('viewer').then((referenceSpace) => {
            session.requestHitTestSource({space: referenceSpace}).then((source) => {
                this.hitTestSource = source;
            }).catch((error) => {
                console.error('Error requesting hit test source:', error);
            });
        });
    },
    
    tick: function() {
        if (!this.hitTestSource || !this.data.target) return;
        
        // Get current frame
        const frame = this.el.sceneEl.frame;
        if (!frame) return;
        
        // Perform hit test
        const hitTestResults = frame.getHitTestResults(this.hitTestSource);
        if (hitTestResults.length) {
            // Move target to hit test position
            const pose = hitTestResults[0].getPose(this.el.sceneEl.xrReferenceSpace);
            this.data.target.setAttribute('position', {
                x: pose.transform.position.x,
                y: pose.transform.position.y,
                z: pose.transform.position.z
            });
        }
    }
});

// Register AR tracking manager component on scene load
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    if (scene && !scene.hasAttribute('ar-tracking-manager')) {
        scene.setAttribute('ar-tracking-manager', '');
    }
});

// AR Components for Blender Model Viewer

/**
 * AR Scene Manager Component
 * Handles initialization of the AR scene and model
 */
AFRAME.registerComponent('ar-scene-manager', {
    schema: {
        debugEnabled: { type: 'boolean', default: false }
    },
    
    init: function() {
        this.bindMethods();
        this.addEventListeners();
        
        // Initialize debug state
        this.debug = this.data.debugEnabled;
        
        // Setup scene
        this.setupScene();
        
        // Initialize camera
        this.initCamera();
        
        console.log('AR Scene Manager initialized');
    },
    
    bindMethods: function() {
        this.onSceneLoaded = this.onSceneLoaded.bind(this);
        this.onSceneError = this.onSceneError.bind(this);
        this.onCameraAccessGranted = this.onCameraAccessGranted.bind(this);
        this.onCameraAccessDenied = this.onCameraAccessDenied.bind(this);
        this.requestCameraPermission = this.requestCameraPermission.bind(this);
    },
    
    addEventListeners: function() {
        this.el.addEventListener('loaded', this.onSceneLoaded);
        this.el.addEventListener('error', this.onSceneError);
        
        // Listen for camera-related events
        this.el.addEventListener('camera-init', (event) => {
            console.log('Camera initialized:', event);
            UIManager.showNotification('Camera initialized');
        });
        
        this.el.addEventListener('camera-error', (event) => {
            console.error('Camera error:', event);
            UIManager.showError('Camera access error. Please check permissions and try again.');
        });
        
        // Add camera permission button listener
        const cameraButton = document.getElementById('camera-permission-button');
        if (cameraButton) {
            cameraButton.addEventListener('click', this.requestCameraPermission);
        }
    },
    
    setupScene: function() {
        // Get scene elements
        this.camera = document.getElementById('camera');
        this.modelContainer = document.getElementById('model-container');
        
        // Set initial properties
        if (this.camera) {
            // Enable device orientation for 360 view
            this.camera.setAttribute('look-controls', 'magicWindowTrackingEnabled: true');
            
            if (AFRAME.utils.device.isMobile()) {
                console.log('Mobile device detected. Enabling device orientation controls.');
            }
        }
    },
    
    initCamera: function() {
        // Check if AR.js has already initialized the camera
        if (this.el.getAttribute('arjs')) {
            console.log('AR.js camera already initialized');
            return;
        }
        
        // Manually initialize camera if needed
        this.requestCameraPermission();
    },
    
    requestCameraPermission: function() {
        console.log('Requesting camera permission...');
        
        // Show camera permission button
        const cameraButton = document.getElementById('camera-permission-button');
        if (cameraButton) {
            cameraButton.classList.remove('hidden');
        }
        
        // Request camera access
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(this.onCameraAccessGranted)
                .catch(this.onCameraAccessDenied);
        } else {
            console.error('MediaDevices API not supported');
            UIManager.showError('Your browser does not support camera access. Please try a different browser.');
        }
    },
    
    onCameraAccessGranted: function(stream) {
        console.log('Camera access granted');
        UIManager.showNotification('Camera access granted');
        
        // Hide camera permission button
        const cameraButton = document.getElementById('camera-permission-button');
        if (cameraButton) {
            cameraButton.classList.add('hidden');
        }
        
        // Create video element if it doesn't exist
        let video = document.querySelector('#arjs-video');
        if (!video) {
            video = document.createElement('video');
            video.id = 'arjs-video';
            video.autoplay = true;
            video.playsinline = true;
            video.style.display = 'none';
            document.body.appendChild(video);
        }
        
        // Set up video stream
        if ('srcObject' in video) {
            video.srcObject = stream;
        } else {
            // Fallback for older browsers
            video.src = window.URL.createObjectURL(stream);
        }
        
        // Add arjs-video class to ensure AR.js uses this video
        const sceneEl = document.querySelector('a-scene');
        if (sceneEl && !sceneEl.classList.contains('arjs-video-loaded')) {
            sceneEl.classList.add('arjs-video-loaded');
            
            // Force AR.js to use our video
            const arToolkitContext = sceneEl.systems['arjs'] && sceneEl.systems['arjs'].arToolkitContext;
            if (arToolkitContext) {
                arToolkitContext.arController.videoWidth = video.videoWidth;
                arToolkitContext.arController.videoHeight = video.videoHeight;
            }
        }
        
        // Set AR status
        UIManager.setARStatus('Ready: Camera active');
    },
    
    onCameraAccessDenied: function(error) {
        console.error('Camera access denied:', error);
        UIManager.showError('Camera access denied. Please allow camera access to use AR features.');
        
        // Show camera permission button
        const cameraButton = document.getElementById('camera-permission-button');
        if (cameraButton) {
            cameraButton.classList.remove('hidden');
        }
        
        // Set AR status
        UIManager.setARStatus('Error: Camera access denied');
    },
    
    onSceneLoaded: function() {
        console.log('AR Scene loaded successfully');
        UIManager.setARStatus('Ready: AR Scene loaded');
        UIManager.showNotification('AR Scene loaded. Ready for interaction.');
        
        // Check if camera is working
        const video = document.querySelector('#arjs-video');
        if (!video || !video.srcObject) {
            console.warn('Camera not initialized yet, requesting permission...');
            this.requestCameraPermission();
        }
    },
    
    onSceneError: function(event) {
        console.error('AR Scene error:', event);
        UIManager.setARStatus('Error: AR Scene failed to load');
        UIManager.showError('Failed to load AR scene. Please check your device compatibility and try again.');
    },
    
    update: function() {
        this.debug = this.data.debugEnabled;
    },
    
    remove: function() {
        this.removeEventListeners();
        
        // Clean up camera resources
        const video = document.querySelector('#arjs-video');
        if (video && video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
    },
    
    removeEventListeners: function() {
        this.el.removeEventListener('loaded', this.onSceneLoaded);
        this.el.removeEventListener('error', this.onSceneError);
        
        const cameraButton = document.getElementById('camera-permission-button');
        if (cameraButton) {
            cameraButton.removeEventListener('click', this.requestCameraPermission);
        }
    }
});

// Device Orientation Controls Component
AFRAME.registerComponent('device-orientation-controls', {
    init: function() {
        this.bindMethods();
        this.setupControls();
    },
    
    bindMethods: function() {
        this.handleOrientation = this.handleOrientation.bind(this);
    },
    
    setupControls: function() {
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', this.handleOrientation);
            console.log('Device orientation controls initialized');
        } else {
            console.warn('Device orientation not supported');
        }
    },
    
    handleOrientation: function(event) {
        // This will be handled by A-Frame's look-controls component
        // We're just making sure the event listener is attached
    },
    
    remove: function() {
        window.removeEventListener('deviceorientation', this.handleOrientation);
    }
});

// Model Controls Component
AFRAME.registerComponent('model-controls', {
    schema: {
        mode: { type: 'string', default: 'place' }
    },
    
    init: function() {
        this.bindMethods();
        this.setupState();
        this.setupGestures();
        
        console.log('Model Controls initialized with mode:', this.data.mode);
    },
    
    bindMethods: function() {
        this.onModelLoaded = this.onModelLoaded.bind(this);
        this.handlePan = this.handlePan.bind(this);
        this.handleRotate = this.handleRotate.bind(this);
        this.handleScale = this.handleScale.bind(this);
    },
    
    setupState: function() {
        this.isVisible = this.el.getAttribute('visible');
        this.initialScale = this.el.getAttribute('scale');
        this.initialPosition = this.el.getAttribute('position');
        this.initialRotation = this.el.getAttribute('rotation');
        this.lastTime = 0;
        
        // Get the model entity
        this.model = this.el.querySelector('#model');
        
        if (this.model) {
            this.model.addEventListener('model-loaded', this.onModelLoaded);
        }
    },
    
    setupGestures: function() {
        // Create a HammerJS instance
        if (window.Hammer && this.el) {
            const hammerOptions = {
                domEvents: true,
                touchAction: 'none',
                recognizers: [
                    [Hammer.Rotate, { enable: true }],
                    [Hammer.Pinch, { enable: true }],
                    [Hammer.Pan, { enable: true, direction: Hammer.DIRECTION_ALL }]
                ]
            };
            
            this.hammer = new Hammer.Manager(document.body, hammerOptions);
            
            // Add recognizers
            const pinch = new Hammer.Pinch();
            const rotate = new Hammer.Rotate();
            const pan = new Hammer.Pan({ direction: Hammer.DIRECTION_ALL });
            
            // Add recognizers to the manager
            pinch.recognizeWith(rotate);
            this.hammer.add([pinch, rotate, pan]);
            
            // Add event listeners
            this.hammer.on('pinch', this.handleScale);
            this.hammer.on('rotate', this.handleRotate);
            this.hammer.on('pan', this.handlePan);
            
            console.log('Gesture handlers initialized');
        } else {
            console.warn('Hammer.js not found or element is null');
        }
    },
    
    update: function(oldData) {
        if (oldData.mode !== this.data.mode) {
            console.log('Model controls mode changed:', this.data.mode);
        }
    },
    
    onModelLoaded: function() {
        console.log('Model loaded successfully');
        UIManager.showNotification('Model loaded successfully');
    },
    
    handlePan: function(event) {
        if (this.data.mode !== 'pan') return;
        
        // Calculate delta movement
        const deltaX = event.deltaX * 0.01;
        const deltaY = event.deltaY * 0.01;
        
        // Get current position
        const position = this.el.getAttribute('position');
        
        // Update position
        this.el.setAttribute('position', {
            x: position.x + deltaX,
            y: position.y - deltaY,
            z: position.z
        });
    },
    
    handleRotate: function(event) {
        if (this.data.mode !== 'rotate') return;
        
        // Get current rotation
        const rotation = this.el.getAttribute('rotation');
        
        // Calculate rotation delta
        const deltaRotation = event.rotation - (this.lastRotation || event.rotation);
        this.lastRotation = event.rotation;
        
        // Update rotation (y-axis)
        this.el.setAttribute('rotation', {
            x: rotation.x,
            y: rotation.y + deltaRotation,
            z: rotation.z
        });
    },
    
    handleScale: function(event) {
        if (this.data.mode !== 'scale') return;
        
        // Calculate scale factor
        const scaleFactor = event.scale;
        
        // Get current scale
        const scale = this.el.getAttribute('scale');
        
        // Base scale on initial scale and pinch
        const newScale = {
            x: this.initialScale.x * scaleFactor,
            y: this.initialScale.y * scaleFactor,
            z: this.initialScale.z * scaleFactor
        };
        
        // Apply min/max scale limits
        const minScale = 0.1;
        const maxScale = 5.0;
        
        newScale.x = Math.max(minScale, Math.min(maxScale, newScale.x));
        newScale.y = Math.max(minScale, Math.min(maxScale, newScale.y));
        newScale.z = Math.max(minScale, Math.min(maxScale, newScale.z));
        
        // Update model scale
        this.el.setAttribute('scale', newScale);
    },
    
    reset: function() {
        // Reset to initial values
        this.el.setAttribute('position', this.initialPosition);
        this.el.setAttribute('rotation', this.initialRotation);
        this.el.setAttribute('scale', this.initialScale);
        
        console.log('Model reset to initial state');
    },
    
    remove: function() {
        // Cleanup
        if (this.model) {
            this.model.removeEventListener('model-loaded', this.onModelLoaded);
        }
        
        if (this.hammer) {
            this.hammer.off('pinch');
            this.hammer.off('rotate');
            this.hammer.off('pan');
            this.hammer.destroy();
        }
    }
});

// Camera initialization component
AFRAME.registerComponent('camera-init', {
    init: function() {
        console.log('Initializing camera component');
        
        // Make sure we have access to the camera
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
                .then(function(stream) {
                    console.log('Camera access granted successfully');
                    
                    // Stop the stream as AR.js will handle it
                    stream.getTracks().forEach(function(track) {
                        track.stop();
                    });
                    
                    // Force the scene to be visible
                    document.querySelector('a-scene').style.visibility = 'visible';
                    document.querySelector('a-scene').style.display = 'block';
                })
                .catch(function(err) {
                    console.error('Camera access error:', err);
                });
        } else {
            console.error('MediaDevices API is not supported in this browser');
        }
    }
});

// AR.js camera visibility component
AFRAME.registerComponent('arjs-camera-visibility', {
    init: function() {
        console.log('Initializing AR.js camera visibility component');
        
        // Wait for AR.js to initialize its video element
        setTimeout(() => {
            this.makeVideoVisible();
        }, 2000);
        
        // Also listen for ar-initialize event
        document.addEventListener('ar-initialize', () => {
            console.log('AR initialize event received - ensuring video visibility');
            setTimeout(() => {
                this.makeVideoVisible();
            }, 1000);
        });
    },
    
    makeVideoVisible: function() {
        // Find AR.js video element
        const arVideo = document.querySelector('#arjs-video');
        if (arVideo) {
            console.log('Making AR.js video visible');
            arVideo.style.display = 'block';
            arVideo.style.opacity = '1';
            arVideo.style.position = 'absolute';
            arVideo.style.top = '0';
            arVideo.style.left = '0';
            arVideo.style.width = '100%';
            arVideo.style.height = '100%';
            arVideo.style.objectFit = 'cover';
            arVideo.style.zIndex = '1';
            
            // For debugging
            console.log('AR.js video styles applied:', {
                display: arVideo.style.display,
                opacity: arVideo.style.opacity,
                position: arVideo.style.position,
                width: arVideo.style.width,
                height: arVideo.style.height
            });
        } else {
            console.warn('AR.js video element not found');
            
            // Check for other video elements that might be used by AR.js
            const videos = document.querySelectorAll('video');
            if (videos.length > 0) {
                console.log('Found video elements:', videos.length);
                videos.forEach((video, index) => {
                    console.log(`Video ${index}:`, video.id, video.className);
                });
            }
        }
    }
});

// AR Components for Camera Access and Surface Detection

// Direct camera access component to ensure camera feed is visible
AFRAME.registerComponent('direct-camera-access', {
    schema: {
        width: {type: 'number', default: 1280},
        height: {type: 'number', default: 720}
    },
    
    init: function() {
        console.log('Initializing direct camera access component');
        this.videoEl = null;
        this.stream = null;
        this.attempts = 0;
        this.maxAttempts = 5;
        
        // Store bound methods
        this.initializeCamera = this.initializeCamera.bind(this);
        this.tryEnablingCamera = this.tryEnablingCamera.bind(this);
        this.forceStartCamera = this.forceStartCamera.bind(this);
        
        // Start camera after a short delay to ensure everything is ready
        setTimeout(this.initializeCamera, 1000);
        
        // Add click handler that will try to enable camera again if needed
        document.addEventListener('click', this.tryEnablingCamera);
        
        // Add a camera button to force start if needed
        this.addCameraButton();
        
        // Additional event listeners for camera visibility
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && (!this.videoEl || !this.videoEl.srcObject)) {
                console.log('Page became visible, ensuring camera is active');
                this.initializeCamera();
            }
        });
    },
    
    addCameraButton: function() {
        // Add a floating camera button in case automatic initialization fails
        let cameraBtn = document.getElementById('force-camera-button');
        if (!cameraBtn) {
            cameraBtn = document.createElement('button');
            cameraBtn.id = 'force-camera-button';
            cameraBtn.innerText = 'Start Camera';
            cameraBtn.style.position = 'fixed';
            cameraBtn.style.bottom = '80px';
            cameraBtn.style.left = '50%';
            cameraBtn.style.transform = 'translateX(-50%)';
            cameraBtn.style.zIndex = '9999';
            cameraBtn.style.padding = '10px 20px';
            cameraBtn.style.backgroundColor = '#4361ee';
            cameraBtn.style.color = 'white';
            cameraBtn.style.border = 'none';
            cameraBtn.style.borderRadius = '8px';
            cameraBtn.style.fontSize = '16px';
            cameraBtn.style.cursor = 'pointer';
            
            cameraBtn.addEventListener('click', this.forceStartCamera);
            
            document.body.appendChild(cameraBtn);
        }
    },
    
    forceStartCamera: function(e) {
        if (e) e.preventDefault();
        console.log('Force starting camera');
        
        // Reset attempts counter
        this.attempts = 0;
        
        // Try with minimal constraints
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            })
            .then(stream => {
                console.log('Camera force started successfully');
                this.stream = stream;
                window.cameraStream = stream;
                
                // Create or get video element
                this.videoEl = document.querySelector('#arjs-video');
                if (!this.videoEl) {
                    this.videoEl = document.createElement('video');
                    this.videoEl.id = 'arjs-video';
                    this.videoEl.setAttribute('autoplay', '');
                    this.videoEl.setAttribute('playsinline', '');
                    this.videoEl.setAttribute('muted', '');
                    document.body.appendChild(this.videoEl);
                }
                
                // Configure video element
                try {
                    this.videoEl.srcObject = stream;
                } catch (error) {
                    console.error('Error setting srcObject:', error);
                    this.videoEl.src = window.URL.createObjectURL(stream);
                }
                
                this.videoEl.muted = true;
                this.videoEl.play().then(() => {
                    console.log('Video playing after force start');
                    this.setupVideoVisibility();
                }).catch(error => {
                    console.error('Error playing video after force start:', error);
                    // Try one more time with user interaction
                    alert('Please tap OK to enable the camera');
                    this.videoEl.play().catch(e => console.error('Final play error:', e));
                });
            })
            .catch(error => {
                console.error('Force start camera error:', error);
                alert('Camera access denied. Please check your camera permissions in browser settings.');
            });
        }
    },
    
    tryEnablingCamera: function() {
        // Only try again if camera isn't already working
        const arVideo = document.querySelector('#arjs-video');
        if (!arVideo || !arVideo.srcObject || arVideo.paused) {
            console.log('Attempting to enable camera on user interaction');
            this.initializeCamera();
        }
    },
    
    initializeCamera: function() {
        if (this.attempts >= this.maxAttempts) {
            console.warn('Maximum camera initialization attempts reached');
            this.showCameraError('Camera initialization failed after multiple attempts. Please reload the page.');
            return;
        }
        
        this.attempts++;
        console.log(`Camera initialization attempt ${this.attempts}/${this.maxAttempts}`);
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            // Try first with ideal constraints
            const constraints = {
                audio: false,
                video: {
                    facingMode: {ideal: 'environment'},
                    width: { ideal: this.data.width },
                    height: { ideal: this.data.height }
                }
            };
            
            console.log('Requesting camera access with constraints:', constraints);
            
            navigator.mediaDevices.getUserMedia(constraints)
                .then(stream => {
                    console.log('Camera access granted');
                    this.stream = stream;
                    window.cameraStream = stream; // Store globally for potential debug use
                    
                    // Create or get video element
                    this.videoEl = document.querySelector('#arjs-video');
                    if (!this.videoEl) {
                        console.log('Creating new video element for camera feed');
                        this.videoEl = document.createElement('video');
                        this.videoEl.id = 'arjs-video';
                        this.videoEl.setAttribute('autoplay', '');
                        this.videoEl.setAttribute('playsinline', '');
                        this.videoEl.setAttribute('muted', '');
                        document.body.appendChild(this.videoEl);
                    }
                    
                    // Configure video element
                    try {
                        this.videoEl.srcObject = stream;
                    } catch (error) {
                        console.error('Error setting srcObject:', error);
                        // Fallback for older browsers
                        this.videoEl.src = window.URL.createObjectURL(stream);
                    }
                    
                    this.videoEl.onloadedmetadata = () => {
                        // Ensure video plays
                        const playPromise = this.videoEl.play();
                        if (playPromise !== undefined) {
                            playPromise
                                .then(() => {
                                    console.log('Camera video playing successfully');
                                    this.setupVideoVisibility();
                                })
                                .catch(error => {
                                    console.error('Error playing video:', error);
                                    // Auto-play may be blocked, add a play button
                                    this.addPlayButton();
                                });
                        } else {
                            console.log('Play promise not supported, assuming video is playing');
                            this.setupVideoVisibility();
                        }
                    };
                    
                    // Add error handler
                    this.videoEl.onerror = (error) => {
                        console.error('Video element error:', error);
                        this.showCameraError('Video playback error. Please reload and try again.');
                    };
                    
                    // Ensure video is muted to allow autoplay
                    this.videoEl.muted = true;
                })
                .catch(error => {
                    console.error('Error accessing camera with ideal constraints:', error);
                    
                    // Fall back to more permissive constraints
                    const fallbackConstraints = {
                        audio: false,
                        video: true
                    };
                    
                    console.log('Trying fallback constraints:', fallbackConstraints);
                    
                    navigator.mediaDevices.getUserMedia(fallbackConstraints)
                        .then(stream => {
                            console.log('Camera access granted with fallback constraints');
                            this.stream = stream;
                            window.cameraStream = stream;
                            
                            // Create or get video element (same as above)
                            this.videoEl = document.querySelector('#arjs-video');
                            if (!this.videoEl) {
                                this.videoEl = document.createElement('video');
                                this.videoEl.id = 'arjs-video';
                                this.videoEl.setAttribute('autoplay', '');
                                this.videoEl.setAttribute('playsinline', '');
                                this.videoEl.setAttribute('muted', '');
                                document.body.appendChild(this.videoEl);
                            }
                            
                            // Configure video element
                            try {
                                this.videoEl.srcObject = stream;
                            } catch (error) {
                                this.videoEl.src = window.URL.createObjectURL(stream);
                            }
                            
                            this.videoEl.onloadedmetadata = () => {
                                const playPromise = this.videoEl.play();
                                if (playPromise !== undefined) {
                                    playPromise
                                        .then(() => {
                                            console.log('Camera video playing with fallback');
                                            this.setupVideoVisibility();
                                        })
                                        .catch(error => {
                                            console.error('Error playing fallback video:', error);
                                            this.addPlayButton();
                                        });
                                } else {
                                    this.setupVideoVisibility();
                                }
                            };
                            
                            this.videoEl.muted = true;
                        })
                        .catch(finalError => {
                            console.error('All camera access attempts failed:', finalError);
                            this.showCameraError('Camera access denied or not available. Please check permissions and try again.');
                            
                            // Try again with user interaction
                            if (this.attempts < this.maxAttempts) {
                                this.addCameraPermissionButton();
                            }
                        });
                });
        } else {
            console.error('getUserMedia not supported');
            this.showCameraError('Your browser doesn\'t support camera access. Please try a different browser.');
        }
    },
    
    setupVideoVisibility: function() {
        if (!this.videoEl) return;
        
        // Make sure video is visible and properly styled
        this.videoEl.style.display = 'block';
        this.videoEl.style.position = 'absolute';
        this.videoEl.style.top = '0';
        this.videoEl.style.left = '0';
        this.videoEl.style.width = '100%';
        this.videoEl.style.height = '100%';
        this.videoEl.style.objectFit = 'cover';
        this.videoEl.style.zIndex = '1';
        this.videoEl.style.opacity = '1';
        
        // Dispatch event to notify that camera is ready
        document.dispatchEvent(new CustomEvent('camera-feed-active'));
        
        // Ensure AR.js can access this camera feed
        const scene = document.querySelector('a-scene');
        if (scene && scene.systems && scene.systems.arjs) {
            console.log('Notifying AR.js system of camera feed');
            scene.systems.arjs.arReady = true;
            if (scene.systems.arjs._arSession && scene.systems.arjs._arSession.arSource) {
                try {
                    scene.systems.arjs._arSession.arSource.domElement = this.videoEl;
                } catch (e) {
                    console.error('Error connecting camera to AR.js:', e);
                }
            }
        }
        
        console.log('Camera feed setup complete and active');
    },
    
    addPlayButton: function() {
        // Create a play button for browsers that block autoplay
        let playButton = document.getElementById('camera-play-button');
        if (!playButton) {
            playButton = document.createElement('button');
            playButton.id = 'camera-play-button';
            playButton.innerText = 'Enable Camera';
            playButton.style.position = 'fixed';
            playButton.style.zIndex = '9999';
            playButton.style.top = '50%';
            playButton.style.left = '50%';
            playButton.style.transform = 'translate(-50%, -50%)';
            playButton.style.padding = '15px 30px';
            playButton.style.backgroundColor = '#4361ee';
            playButton.style.color = 'white';
            playButton.style.border = 'none';
            playButton.style.borderRadius = '8px';
            playButton.style.fontSize = '16px';
            playButton.style.cursor = 'pointer';
            
            playButton.onclick = () => {
                if (this.videoEl) {
                    const playPromise = this.videoEl.play();
                    if (playPromise !== undefined) {
                        playPromise
                            .then(() => {
                                console.log('Video playing after user interaction');
                                playButton.remove();
                                this.setupVideoVisibility();
                            })
                            .catch(error => {
                                console.error('Still cannot play video after interaction:', error);
                                this.showCameraError('Cannot enable camera. Please check permissions and reload.');
                            });
                    }
                }
            };
            
            document.body.appendChild(playButton);
        }
    },
    
    addCameraPermissionButton: function() {
        let permButton = document.getElementById('camera-permission-button');
        if (!permButton) {
            permButton = document.createElement('button');
            permButton.id = 'camera-permission-button';
            permButton.innerText = 'Grant Camera Permission';
            permButton.style.position = 'fixed';
            permButton.style.zIndex = '9999';
            permButton.style.top = '50%';
            permButton.style.left = '50%';
            permButton.style.transform = 'translate(-50%, -50%)';
            permButton.style.padding = '15px 30px';
            permButton.style.backgroundColor = '#4361ee';
            permButton.style.color = 'white';
            permButton.style.border = 'none';
            permButton.style.borderRadius = '8px';
            permButton.style.fontSize = '16px';
            permButton.style.cursor = 'pointer';
            
            permButton.onclick = () => {
                permButton.innerText = 'Requesting Permission...';
                this.initializeCamera();
                setTimeout(() => {
                    permButton.remove();
                }, 2000);
            };
            
            document.body.appendChild(permButton);
        }
    },
    
    showCameraError: function(message) {
        // Show error message to user
        if (window.TimescapeExplorer && TimescapeExplorer.showNotification) {
            TimescapeExplorer.showNotification(message, 8000);
        }
        
        // Also show in console
        console.error('Camera error:', message);
        
        // Show error message on screen
        let errorMsg = document.getElementById('camera-error-message');
        if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.id = 'camera-error-message';
            errorMsg.style.position = 'fixed';
            errorMsg.style.top = '10px';
            errorMsg.style.left = '50%';
            errorMsg.style.transform = 'translateX(-50%)';
            errorMsg.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
            errorMsg.style.color = 'white';
            errorMsg.style.padding = '10px 20px';
            errorMsg.style.borderRadius = '8px';
            errorMsg.style.zIndex = '10000';
            errorMsg.style.maxWidth = '80%';
            errorMsg.style.textAlign = 'center';
            
            document.body.appendChild(errorMsg);
        }
        
        errorMsg.textContent = message;
    },
    
    remove: function() {
        // Clean up event listeners
        document.removeEventListener('click', this.tryEnablingCamera);
        
        // Stop all tracks
        if (this.stream) {
            const tracks = this.stream.getTracks();
            tracks.forEach(track => track.stop());
        }
        
        // Remove any UI elements we created
        const playButton = document.getElementById('camera-play-button');
        if (playButton) playButton.remove();
        
        const permButton = document.getElementById('camera-permission-button');
        if (permButton) permButton.remove();
        
        const errorMsg = document.getElementById('camera-error-message');
        if (errorMsg) errorMsg.remove();
    }
});

// Failsafe camera component
AFRAME.registerComponent('failsafe-camera', {
    init: function() {
        console.log('Initializing failsafe camera component');
        this.cameraEl = document.querySelector('#camera');
        this.scene = this.el;
        this.timeout = null;
        this.cameraReady = false;
        this.checkAttempts = 0;
        this.maxCheckAttempts = 3;
        
        // Bind methods
        this.checkCameraFeed = this.checkCameraFeed.bind(this);
        this.reinitializeCamera = this.reinitializeCamera.bind(this);
        this.createDebugCamera = this.createDebugCamera.bind(this);
        
        // Listen for camera-ready event
        document.addEventListener('camera-ready', () => {
            console.log('Camera ready event received');
            this.cameraReady = true;
        });
        
        document.addEventListener('camera-feed-active', () => {
            console.log('Camera feed active event received');
            this.cameraReady = true;
            clearTimeout(this.timeout);
        });
        
        // Start checking camera feed after initialization
        this.timeout = setTimeout(this.checkCameraFeed, 5000);
        
        // Add periodic checks
        setInterval(this.checkCameraFeed, 15000);
    },
    
    checkCameraFeed: function() {
        if (this.cameraReady) {
            // Camera is ready, check if it's still working
            const arVideo = document.querySelector('#arjs-video');
            if (arVideo && arVideo.srcObject && !arVideo.paused) {
                console.log('Camera feed is active and working');
                return;
            } else {
                console.warn('Camera was ready but appears to have stopped working');
                this.cameraReady = false;
            }
        }
        
        if (this.checkAttempts >= this.maxCheckAttempts) {
            console.warn('Maximum camera check attempts reached');
            
            // Create a debug fallback
            this.createDebugCamera();
            return;
        }
        
        console.log('Camera feed not detected, attempt', this.checkAttempts + 1, 'of', this.maxCheckAttempts);
        this.checkAttempts++;
        
        // First, check if we have an active video element for AR.js
        const arVideo = document.querySelector('#arjs-video');
        const debugVideo = document.querySelector('#debug-video');
        const backgroundVideo = document.getElementById('background-video');
        
        if (!arVideo || (arVideo && !arVideo.srcObject && !arVideo.src)) {
            console.warn('AR.js video not properly initialized, attempting fixes');
            
            // Try AR.js alternative method first
            const scene = document.querySelector('a-scene');
            if (scene && scene.systems && scene.systems.arjs) {
                console.log('Trying to restart AR.js camera');
                
                try {
                    if (scene.systems.arjs._arSession && scene.systems.arjs._arSession.arSource) {
                        const arSource = scene.systems.arjs._arSession.arSource;
                        
                        // Try to reinitialize the source
                        if (typeof arSource.restart === 'function') {
                            console.log('Restarting AR.js camera source');
                            arSource.restart();
                            
                            // Check again after a short delay
                            setTimeout(() => {
                                const arVideo = document.querySelector('#arjs-video');
                                if (arVideo && arVideo.srcObject) {
                                    console.log('AR.js camera restart successful');
                                    this.cameraReady = true;
                                    document.dispatchEvent(new CustomEvent('camera-feed-active'));
                                }
                            }, 2000);
                            
                            return;
                        }
                    }
                } catch (e) {
                    console.error('Error restarting AR.js camera:', e);
                }
            }
            
            // If we have a background video, try to use that
            if (backgroundVideo && backgroundVideo.srcObject) {
                console.log('Using background video as fallback');
                
                if (!arVideo) {
                    arVideo = document.createElement('video');
                    arVideo.id = 'arjs-video';
                    arVideo.setAttribute('autoplay', '');
                    arVideo.setAttribute('playsinline', '');
                    arVideo.setAttribute('muted', '');
                    document.body.appendChild(arVideo);
                }
                
                try {
                    arVideo.srcObject = backgroundVideo.srcObject;
                    arVideo.play().then(() => {
                        console.log('Background video repurposed for AR');
                        document.dispatchEvent(new CustomEvent('camera-feed-active'));
                        this.cameraReady = true;
                    }).catch(e => {
                        console.error('Error playing repurposed video:', e);
                    });
                    return;
                } catch (e) {
                    console.error('Error using background video as fallback:', e);
                }
            }
            
            // Try direct camera access as last resort
            this.reinitializeCamera();
        } else {
            console.log('Camera element exists but may not be functioning correctly');
            
            // Check if video is paused and try to play it
            if (arVideo.paused) {
                console.log('Video is paused, attempting to play');
                arVideo.play().then(() => {
                    console.log('Successfully restarted video playback');
                    this.cameraReady = true;
                }).catch(e => {
                    console.error('Error restarting video playback:', e);
                    this.reinitializeCamera();
                });
            } else {
                console.log('Video appears to be playing but not visible or functioning');
                
                // Ensure video is visible and properly styled
                arVideo.style.display = 'block';
                arVideo.style.position = 'absolute';
                arVideo.style.top = '0';
                arVideo.style.left = '0';
                arVideo.style.width = '100%';
                arVideo.style.height = '100%';
                arVideo.style.objectFit = 'cover';
                arVideo.style.zIndex = '1';
                arVideo.style.opacity = '1';
            }
        }
    },
    
    reinitializeCamera: function() {
        console.log('Attempting to reinitialize camera');
        
        // Function to handle camera initialization
        const tryCamera = (constraints) => {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                return navigator.mediaDevices.getUserMedia(constraints)
                    .then(stream => {
                        // Store stream for AR.js to use
                        window.cameraStream = stream;
                        
                        // Create or get the video element
                        let arVideo = document.querySelector('#arjs-video');
                        if (!arVideo) {
                            arVideo = document.createElement('video');
                            arVideo.id = 'arjs-video';
                            arVideo.setAttribute('autoplay', '');
                            arVideo.setAttribute('playsinline', '');
                            arVideo.setAttribute('muted', '');
                            document.body.appendChild(arVideo);
                        }
                        
                        // Set the stream
                        try {
                            arVideo.srcObject = stream;
                        } catch (error) {
                            arVideo.src = window.URL.createObjectURL(stream);
                        }
                        
                        // Ensure video plays
                        arVideo.muted = true;
                        arVideo.onloadedmetadata = () => {
                            arVideo.play().then(() => {
                                console.log('Camera reinitialized and playing');
                                
                                // Style video element
                                arVideo.style.display = 'block';
                                arVideo.style.position = 'absolute';
                                arVideo.style.top = '0';
                                arVideo.style.left = '0';
                                arVideo.style.width = '100%';
                                arVideo.style.height = '100%';
                                arVideo.style.objectFit = 'cover';
                                arVideo.style.zIndex = '1';
                                arVideo.style.opacity = '1';
                                
                                this.cameraReady = true;
                                document.dispatchEvent(new CustomEvent('camera-feed-active'));
                                
                                // Connect to AR.js if available
                                const scene = document.querySelector('a-scene');
                                if (scene && scene.systems && scene.systems.arjs) {
                                    try {
                                        scene.systems.arjs.arReady = true;
                                        if (scene.systems.arjs._arSession && scene.systems.arjs._arSession.arSource) {
                                            scene.systems.arjs._arSession.arSource.domElement = arVideo;
                                        }
                                    } catch (e) {
                                        console.error('Error connecting to AR.js:', e);
                                    }
                                }
                            }).catch(error => {
                                console.error('Error playing video after reinitialization:', error);
                                document.addEventListener('click', () => {
                                    arVideo.play().catch(e => console.error('Error on click play:', e));
                                }, {once: true});
                            });
                        };
                        
                        return true;
                    });
            }
            return Promise.reject('getUserMedia not supported');
        };
        
        // Try first with environment camera
        const constraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };
        
        tryCamera(constraints).catch(err => {
            console.warn('Failed with environment camera, trying any camera:', err);
            // Fall back to any camera
            return tryCamera({ video: true, audio: false });
        }).catch(err => {
            console.error('All camera initialization attempts failed:', err);
            // Create a debug camera as last resort
            this.createDebugCamera();
        });
    },
    
    createDebugCamera: function() {
        console.log('Creating debug camera fallback');
        
        // Create a debug video element that shows a static pattern or color
        let debugVideo = document.querySelector('#debug-video');
        if (!debugVideo) {
            debugVideo = document.createElement('div');
            debugVideo.id = 'debug-video';
            debugVideo.style.position = 'absolute';
            debugVideo.style.top = '0';
            debugVideo.style.left = '0';
            debugVideo.style.width = '100%';
            debugVideo.style.height = '100%';
            debugVideo.style.backgroundColor = '#333';
            debugVideo.style.zIndex = '1';
            
            // Add a pattern
            debugVideo.style.backgroundImage = 'linear-gradient(45deg, #444 25%, transparent 25%), linear-gradient(-45deg, #444 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #444 75%), linear-gradient(-45deg, transparent 75%, #444 75%)';
            debugVideo.style.backgroundSize = '20px 20px';
            debugVideo.style.backgroundPosition = '0 0, 0 10px, 10px -10px, -10px 0px';
            
            document.body.appendChild(debugVideo);
        } else {
            debugVideo.style.display = 'block';
        }
        
        // Show a message to the user
        const errorMessage = document.createElement('div');
        errorMessage.style.position = 'absolute';
        errorMessage.style.top = '50%';
        errorMessage.style.left = '50%';
        errorMessage.style.transform = 'translate(-50%, -50%)';
        errorMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        errorMessage.style.color = 'white';
        errorMessage.style.padding = '20px';
        errorMessage.style.borderRadius = '10px';
        errorMessage.style.maxWidth = '80%';
        errorMessage.style.textAlign = 'center';
        errorMessage.style.zIndex = '100';
        errorMessage.innerHTML = `
            <h3 style="margin-top: 0;">Camera Access Failed</h3>
            <p>Unable to access your camera. The application will continue in debug mode with limited functionality.</p>
            <button id="retry-camera" style="background-color: #4361ee; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px;">Retry Camera Access</button>
        `;
        
        document.body.appendChild(errorMessage);
        
        // Add event listener to retry button
        const retryButton = document.getElementById('retry-camera');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                errorMessage.remove();
                this.checkAttempts = 0;
                this.reinitializeCamera();
            });
        }
        
        // Try to continue with the application despite no camera
        setTimeout(() => {
            document.dispatchEvent(new CustomEvent('camera-feed-active'));
        }, 1000);
    }
});

// AR.js camera visibility component
AFRAME.registerComponent('arjs-camera-visibility', {
    init: function() {
        // Wait for AR.js to initialize
        setTimeout(() => {
            const arjsVideo = document.querySelector('#arjs-video');
            if (arjsVideo) {
                console.log('Found AR.js video element, ensuring visibility');
                arjsVideo.style.display = 'block';
                arjsVideo.style.opacity = '1';
                arjsVideo.style.visibility = 'visible';
                arjsVideo.style.position = 'absolute';
                arjsVideo.style.top = '0';
                arjsVideo.style.left = '0';
                arjsVideo.style.width = '100%';
                arjsVideo.style.height = '100%';
                arjsVideo.style.objectFit = 'cover';
                arjsVideo.style.zIndex = '1';
            } else {
                console.warn('AR.js video element not found, camera may not be visible');
            }
        }, 2000);
    }
});

// Camera initialization component
AFRAME.registerComponent('camera-init', {
    init: function() {
        console.log('Camera init component started');
        
        // Ensure camera entity has correct attributes
        this.el.setAttribute('look-controls', {
            magicWindowTrackingEnabled: true,
            pointerLockEnabled: false,
            reverseMouseDrag: false
        });
        
        // Make sure camera is positioned correctly
        if (!this.el.getAttribute('position')) {
            this.el.setAttribute('position', {x: 0, y: 1.6, z: 0});
        }
    }
});

// AR Scene Manager
AFRAME.registerComponent('ar-scene-manager', {
    init: function() {
        console.log('AR Scene Manager initialized');
        
        // Hide loading screen after initial load
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 2000);
    }
});

// Component to handle fixed model placement in AR space
AFRAME.registerComponent('fixed-model-placement', {
    schema: {
        modelSelector: {type: 'string', default: '#model-container'},
        placementIndicatorId: {type: 'string', default: 'placement-prompt'},
        notificationDuration: {type: 'number', default: 3000}
    },
    
    init: function() {
        // Get DOM elements
        this.camera = document.querySelector('#camera');
        this.modelContainer1 = document.querySelector('#model-container-1');
        this.modelContainer2 = document.querySelector('#model-container-2');
        this.modelContainer3 = document.querySelector('#model-container-3');
        this.placementIndicator = document.getElementById(this.data.placementIndicatorId);
        this.debugStateElement = document.getElementById('debug-state');
        
        // Set initial state
        this.isModelPlaced = false;
        
        // Log initialization and update debug display
        console.log('Fixed model placement initialized', this.camera ? 'Camera found' : 'Camera missing', 
                    this.modelContainer1 ? 'Model 1 found' : 'Model 1 missing',
                    this.modelContainer2 ? 'Model 2 found' : 'Model 2 missing',
                    this.modelContainer3 ? 'Model 3 found' : 'Model 3 missing');
        this.updateDebugState('Ready - Click to place models');
        
        // Make placement indicator visible
        if (this.placementIndicator) {
            this.placementIndicator.style.display = 'block';
            this.placementIndicator.style.opacity = '1';
            this.placementIndicator.classList.remove('hidden');
        }
        
        // Set up click listener for model placement
        this.onClickBound = this.onClick.bind(this);
        document.addEventListener('click', this.onClickBound);
        
        // Set the models to follow camera position immediately
        this.positionModelsInFrontOfCamera();
    },
    
    tick: function() {
        // Only update position when not placed
        if (!this.isModelPlaced) {
            this.positionModelsInFrontOfCamera();
        }
    },
    
    positionModelsInFrontOfCamera: function() {
        if (!this.camera || !this.modelContainer1 || !this.modelContainer2 || !this.modelContainer3) return;
        
        try {
            // Get camera position and rotation
            const cameraPosition = this.camera.getAttribute('position');
            const cameraRotation = this.camera.getAttribute('rotation');
            
            // Convert Y rotation to radians for math calculations
            const rotationYRad = THREE.MathUtils.degToRad(cameraRotation.y);
            
            // Calculate positions in triangular formation
            // Model 1 - In front of user
            const distance1 = 4.0;
            const x1 = cameraPosition.x - Math.sin(rotationYRad) * distance1;
            const z1 = cameraPosition.z - Math.cos(rotationYRad) * distance1;
            
            // Model 2 - Back left from user's perspective
            const distance2 = 4.0;
            const angle2 = rotationYRad + Math.PI * 0.666; // ~120 degrees
            const x2 = cameraPosition.x - Math.sin(angle2) * distance2;
            const z2 = cameraPosition.z - Math.cos(angle2) * distance2;
            
            // Model 3 - Back right from user's perspective
            const distance3 = 4.0;
            const angle3 = rotationYRad - Math.PI * 0.666; // ~-120 degrees
            const x3 = cameraPosition.x - Math.sin(angle3) * distance3;
            const z3 = cameraPosition.z - Math.cos(angle3) * distance3;
            
            // Set model positions (at eye level - slightly lower)
            const modelY = Math.max(0.5, cameraPosition.y - 0.5);
            
            // Position model 1 (front)
            this.modelContainer1.setAttribute('position', {
                x: x1,
                y: modelY,
                z: z1
            });
            
            // Position model 2 (back left)
            this.modelContainer2.setAttribute('position', {
                x: x2,
                y: modelY,
                z: z2
            });
            
            // Position model 3 (back right)
            this.modelContainer3.setAttribute('position', {
                x: x3,
                y: modelY,
                z: z3
            });
            
            // Set model rotations to face the center
            this.modelContainer1.setAttribute('rotation', {
                x: 0,
                y: cameraRotation.y,
                z: 0
            });
            
            this.modelContainer2.setAttribute('rotation', {
                x: 0,
                y: cameraRotation.y + 120,
                z: 0
            });
            
            this.modelContainer3.setAttribute('rotation', {
                x: 0,
                y: cameraRotation.y - 120,
                z: 0
            });
            
            // Ensure models are visible
            this.modelContainer1.setAttribute('visible', true);
            this.modelContainer2.setAttribute('visible', true);
            this.modelContainer3.setAttribute('visible', true);
        } catch (err) {
            console.error('Error positioning models:', err);
        }
    },
    
    onClick: function(event) {
        // Check if already placed
        if (this.isModelPlaced) return;
        
        console.log('Tap detected - placing models');
        this.updateDebugState('Models placed');
        
        // Mark as placed so it stops following the camera
        this.isModelPlaced = true;
        
        // Hide the placement indicator
        if (this.placementIndicator) {
            this.placementIndicator.classList.add('hidden');
        }
        
        // Start rotation animations
        this.startRotationAnimations();
        
        // Show success notification
        this.showNotification('Models placed in triangle formation. You can rotate to see them all.');
        
        // Dispatch event for other components
        const placedEvent = new CustomEvent('model-placed');
        window.dispatchEvent(placedEvent);
        
        // Make simple controls visible
        const simpleControls = document.getElementById('simple-controls');
        if (simpleControls) {
            simpleControls.classList.remove('hidden');
        }
    },
    
    startRotationAnimations: function() {
        // Start animation for each model
        if (this.modelContainer1) {
            this.modelContainer1.emit('model-rotate-start');
        }
        if (this.modelContainer2) {
            this.modelContainer2.emit('model-rotate-start');
        }
        if (this.modelContainer3) {
            this.modelContainer3.emit('model-rotate-start');
        }
    },
    
    resetPlacement: function() {
        console.log('Resetting model placement');
        this.updateDebugState('Reset - Following camera');
        
        // Reset placement state
        this.isModelPlaced = false;
        
        // Stop animations
        if (this.modelContainer1) {
            this.modelContainer1.emit('model-rotate-stop');
        }
        if (this.modelContainer2) {
            this.modelContainer2.emit('model-rotate-stop');
        }
        if (this.modelContainer3) {
            this.modelContainer3.emit('model-rotate-stop');
        }
        
        // Reset model positions and rotations
        this.positionModelsInFrontOfCamera();
        
        // Show placement indicator again
        if (this.placementIndicator) {
            this.placementIndicator.style.display = 'block';
            this.placementIndicator.classList.remove('hidden');
        }
        
        // Hide simple controls
        const simpleControls = document.getElementById('simple-controls');
        if (simpleControls) {
            simpleControls.classList.add('hidden');
        }
        
        // Show notification
        this.showNotification('Tap to place the models');
        
        // Dispatch reset event
        window.dispatchEvent(new CustomEvent('model-reset'));
    },
    
    showNotification: function(message) {
        // Show notification using UIManager if available
        if (window.UIManager && UIManager.showNotification) {
            UIManager.showNotification(message, this.data.notificationDuration);
        } else {
            // Fallback to basic notification
            const notification = document.getElementById('notification');
            if (notification) {
                notification.textContent = message;
                notification.classList.add('show');
                
                setTimeout(() => {
                    notification.classList.remove('show');
                }, this.data.notificationDuration);
            }
        }
    },
    
    updateDebugState: function(state) {
        if (this.debugStateElement) {
            this.debugStateElement.textContent = state;
        }
    },
    
    remove: function() {
        // Clean up event listeners
        document.removeEventListener('click', this.onClickBound);
    }
});

// Model Loader Debug Component - Ensures models load properly and are placed correctly
AFRAME.registerComponent('model-loader-debug', {
    schema: {
        model1: {type: 'selector', default: '#model-1'},
        model2: {type: 'selector', default: '#model-2'},
        model3: {type: 'selector', default: '#model-3'},
        container1: {type: 'selector', default: '#model-container-1'},
        container2: {type: 'selector', default: '#model-container-2'},
        container3: {type: 'selector', default: '#model-container-3'}
    },
    
    init: function() {
        console.log('Model loader debug component initialized');
        
        // Keep track of loaded models
        this.loadedModels = {
            model1: false,
            model2: false,
            model3: false
        };
        
        // Bind methods
        this.checkModelLoading = this.checkModelLoading.bind(this);
        this.forceReloadModel = this.forceReloadModel.bind(this);
        this.setupModelPositions = this.setupModelPositions.bind(this);
        
        // Register event listeners for model loading
        if (this.data.model1) {
            this.data.model1.addEventListener('model-loaded', () => {
                console.log('Model 1 loaded successfully');
                this.loadedModels.model1 = true;
                this.ensureModelVisible(this.data.model1);
            });
            
            this.data.model1.addEventListener('model-error', (e) => {
                console.error('Error loading Model 1:', e.detail);
                this.forceReloadModel(this.data.model1, './models/model1.glb');
            });
        }
        
        if (this.data.model2) {
            this.data.model2.addEventListener('model-loaded', () => {
                console.log('Model 2 loaded successfully');
                this.loadedModels.model2 = true;
                this.ensureModelVisible(this.data.model2);
            });
            
            this.data.model2.addEventListener('model-error', (e) => {
                console.error('Error loading Model 2:', e.detail);
                this.forceReloadModel(this.data.model2, './models/model2.glb');
            });
        }
        
        if (this.data.model3) {
            this.data.model3.addEventListener('model-loaded', () => {
                console.log('Model 3 loaded successfully');
                this.loadedModels.model3 = true;
                this.ensureModelVisible(this.data.model3);
            });
            
            this.data.model3.addEventListener('model-error', (e) => {
                console.error('Error loading Model 3:', e.detail);
                this.forceReloadModel(this.data.model3, './models/model3.glb');
            });
        }
        
        // Check model loading status after a delay
        setTimeout(this.checkModelLoading, 5000);
        
        // Camera ready listener
        document.addEventListener('camera-feed-active', () => {
            console.log('Camera ready, setting up model positions');
            this.setupModelPositions();
        });
    },
    
    checkModelLoading: function() {
        console.log('Checking model loading status');
        
        // Check each model for loading status
        if (!this.loadedModels.model1 && this.data.model1) {
            console.log('Model 1 not loaded yet, forcing reload');
            this.forceReloadModel(this.data.model1, './models/model1.glb');
        }
        
        if (!this.loadedModels.model2 && this.data.model2) {
            console.log('Model 2 not loaded yet, forcing reload');
            this.forceReloadModel(this.data.model2, './models/model2.glb');
        }
        
        if (!this.loadedModels.model3 && this.data.model3) {
            console.log('Model 3 not loaded yet, forcing reload');
            this.forceReloadModel(this.data.model3, './models/model3.glb');
        }
        
        // Check one last time after a delay
        setTimeout(() => {
            let allLoaded = this.loadedModels.model1 && this.loadedModels.model2 && this.loadedModels.model3;
            console.log('All models loaded:', allLoaded);
            
            if (!allLoaded) {
                console.warn('Some models failed to load, deploying fallback strategy');
                this.deployFallbackStrategy();
            }
        }, 10000);
    },
    
    forceReloadModel: function(modelEl, src) {
        if (!modelEl) return;
        
        // Try removing and re-adding the model
        console.log(`Force reloading model from ${src}`);
        
        // First remove the model
        modelEl.removeAttribute('gltf-model');
        
        // Wait a moment before re-adding
        setTimeout(() => {
            // Re-add with cache-busting
            const cacheBuster = `?t=${Date.now()}`;
            modelEl.setAttribute('gltf-model', src + cacheBuster);
            
            // Make sure model is visible
            modelEl.setAttribute('visible', true);
        }, 1000);
    },
    
    ensureModelVisible: function(modelEl) {
        if (!modelEl) return;
        
        // Make sure model and all its meshes are visible
        modelEl.setAttribute('visible', true);
        
        // Get the 3D object
        const obj3D = modelEl.object3D;
        if (obj3D) {
            obj3D.visible = true;
            
            // Make all child meshes visible and disable frustum culling
            obj3D.traverse((node) => {
                if (node.isMesh) {
                    node.visible = true;
                    node.frustumCulled = false;
                }
            });
        }
    },
    
    setupModelPositions: function() {
        console.log('Setting up fixed model positions');
        
        // Set fixed positions for the models
        if (this.data.container1) {
            console.log('Setting Model 1 position (front)');
            this.data.container1.setAttribute('position', {x: 0, y: 0, z: -4});
            // Inner model rotation
            if (this.data.model1) {
                this.data.model1.setAttribute('rotation', {x: 0, y: 0, z: 0});
            }
        }
        
        if (this.data.container2) {
            console.log('Setting Model 2 position (back left)');
            this.data.container2.setAttribute('position', {x: -3.5, y: 0, z: 2});
            // Inner model rotation
            if (this.data.model2) {
                this.data.model2.setAttribute('rotation', {x: 0, y: 120, z: 0});
            }
        }
        
        if (this.data.container3) {
            console.log('Setting Model 3 position (back right)');
            this.data.container3.setAttribute('position', {x: 3.5, y: 0, z: 2});
            // Inner model rotation
            if (this.data.model3) {
                this.data.model3.setAttribute('rotation', {x: 0, y: 240, z: 0});
            }
        }
    },
    
    deployFallbackStrategy: function() {
        console.log('Deploying fallback strategy for model loading');
        
        // Fallback: Try using object models if GLB fails
        if (!this.loadedModels.model1 && this.data.model1) {
            console.log('Trying OBJ format for Model 1');
            this.data.model1.setAttribute('obj-model', 'obj: ./models/model1.obj');
        }
        
        if (!this.loadedModels.model2 && this.data.model2) {
            console.log('Trying OBJ format for Model 2');
            this.data.model2.setAttribute('obj-model', 'obj: ./models/model2.obj');
        }
        
        if (!this.loadedModels.model3 && this.data.model3) {
            console.log('Trying OBJ format for Model 3');
            this.data.model3.setAttribute('obj-model', 'obj: ./models/model3.obj');
        }
        
        // Final check - if all else fails, create simple geometry placeholders
        setTimeout(() => {
            if (!this.loadedModels.model1 && this.data.model1) {
                this.createPlaceholder(this.data.model1, 'red');
            }
            if (!this.loadedModels.model2 && this.data.model2) {
                this.createPlaceholder(this.data.model2, 'green');
            }
            if (!this.loadedModels.model3 && this.data.model3) {
                this.createPlaceholder(this.data.model3, 'blue');
            }
        }, 5000);
    },
    
    createPlaceholder: function(modelEl, color) {
        console.log(`Creating placeholder for model with color ${color}`);
        
        // Remove any previous model attributes
        modelEl.removeAttribute('gltf-model');
        modelEl.removeAttribute('obj-model');
        
        // Create a simple box as placeholder
        const box = document.createElement('a-box');
        box.setAttribute('color', color);
        box.setAttribute('width', 1);
        box.setAttribute('height', 1);
        box.setAttribute('depth', 1);
        
        // Clear any existing children
        while (modelEl.firstChild) {
            modelEl.removeChild(modelEl.firstChild);
        }
        
        // Add the placeholder box
        modelEl.appendChild(box);
    },
    
    tick: function() {
        // Periodically check if models are visible
        if (this.el.sceneEl.time % 1000 < 10) { // Check roughly every second
            if (this.loadedModels.model1 && this.data.model1) {
                this.ensureModelVisible(this.data.model1);
            }
            if (this.loadedModels.model2 && this.data.model2) {
                this.ensureModelVisible(this.data.model2);
            }
            if (this.loadedModels.model3 && this.data.model3) {
                this.ensureModelVisible(this.data.model3);
            }
        }
    }
});
