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
