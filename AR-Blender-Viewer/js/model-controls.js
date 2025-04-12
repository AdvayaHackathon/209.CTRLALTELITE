/**
 * Model Transform Controls
 * Handles position, rotation, and scale of the 3D model via UI controls
 */

const ModelTransformControls = {
    // Current transform values
    transform: {
        position: { x: 0, y: 0, z: -2 },
        rotation: { x: 0, y: 180, z: 0 },
        scale: { uniform: 0.5 }
    },
    
    // Default transform values (for reset)
    defaultTransform: {
        position: { x: 0, y: 0, z: -2 },
        rotation: { x: 0, y: 180, z: 0 },
        scale: { uniform: 0.5 }
    },
    
    // UI elements
    ui: {
        panel: null,
        toggleButton: null,
        resetButton: null,
        sliders: {
            position: {
                x: null,
                y: null,
                z: null
            },
            rotation: {
                x: null,
                y: null,
                z: null
            },
            scale: {
                uniform: null
            }
        },
        valueDisplays: {
            position: {
                x: null,
                y: null,
                z: null
            },
            rotation: {
                x: null,
                y: null,
                z: null
            },
            scale: {
                uniform: null
            }
        }
    },
    
    // Model elements (a-frame entities)
    modelElements: {
        container: null,
        model: null
    },
    
    // Initialize controls
    init: function() {
        console.log('Initializing model transform controls');
        
        try {
            // Get UI elements
            this.cacheElements();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Apply initial transform
            this.applyTransform();
            
            // Show the panel initially
            this.showPanel();
            
            console.log('Model transform controls initialized');
        } catch (error) {
            console.error('Error initializing model transform controls:', error);
        }
    },
    
    // Cache DOM elements
    cacheElements: function() {
        // Control panel elements
        this.ui.panel = document.getElementById('model-controls-panel');
        this.ui.toggleButton = document.getElementById('toggle-controls-panel');
        this.ui.resetButton = document.getElementById('reset-transform-button');
        
        // Position sliders and displays
        this.ui.sliders.position.x = document.getElementById('position-x');
        this.ui.sliders.position.y = document.getElementById('position-y');
        this.ui.sliders.position.z = document.getElementById('position-z');
        this.ui.valueDisplays.position.x = document.getElementById('position-x-value');
        this.ui.valueDisplays.position.y = document.getElementById('position-y-value');
        this.ui.valueDisplays.position.z = document.getElementById('position-z-value');
        
        // Rotation sliders and displays
        this.ui.sliders.rotation.x = document.getElementById('rotation-x');
        this.ui.sliders.rotation.y = document.getElementById('rotation-y');
        this.ui.sliders.rotation.z = document.getElementById('rotation-z');
        this.ui.valueDisplays.rotation.x = document.getElementById('rotation-x-value');
        this.ui.valueDisplays.rotation.y = document.getElementById('rotation-y-value');
        this.ui.valueDisplays.rotation.z = document.getElementById('rotation-z-value');
        
        // Scale sliders and displays
        this.ui.sliders.scale.uniform = document.getElementById('scale-uniform');
        this.ui.valueDisplays.scale.uniform = document.getElementById('scale-uniform-value');
        
        // Model elements
        this.modelElements.container = document.getElementById('model-container');
        this.modelElements.model = document.getElementById('model');
        
        // Set initial slider values
        this.updateSlidersFromTransform();
    },
    
    // Set up event listeners
    setupEventListeners: function() {
        // Toggle panel expansion
        if (this.ui.panel) {
            const panelHeader = this.ui.panel.querySelector('.panel-header');
            if (panelHeader) {
                panelHeader.addEventListener('click', this.togglePanel.bind(this));
            }
        }
        
        // Reset button
        if (this.ui.resetButton) {
            this.ui.resetButton.addEventListener('click', this.resetTransform.bind(this));
        }
        
        // Position sliders
        this.addSliderListeners('position', 'x');
        this.addSliderListeners('position', 'y');
        this.addSliderListeners('position', 'z');
        
        // Rotation sliders
        this.addSliderListeners('rotation', 'x');
        this.addSliderListeners('rotation', 'y');
        this.addSliderListeners('rotation', 'z');
        
        // Scale slider
        this.addSliderListeners('scale', 'uniform');
    },
    
    // Add event listeners to a slider
    addSliderListeners: function(transformType, axis) {
        const slider = this.ui.sliders[transformType][axis];
        
        if (!slider) {
            console.warn(`Slider for ${transformType}-${axis} not found`);
            return;
        }
        
        // Update on input (while dragging)
        slider.addEventListener('input', () => {
            // Update transform value
            this.transform[transformType][axis] = parseFloat(slider.value);
            
            // Update display value
            if (this.ui.valueDisplays[transformType][axis]) {
                this.ui.valueDisplays[transformType][axis].textContent = slider.value;
            }
            
            // Apply transform to model
            this.applyTransform();
        });
    },
    
    // Toggle panel expansion
    togglePanel: function() {
        if (this.ui.panel) {
            this.ui.panel.classList.toggle('expanded');
        }
    },

    // Show the panel
    showPanel: function() {
        if (this.ui.panel) {
            // Make sure the panel is visible
            this.ui.panel.style.display = 'block';
            
            // Add it to expanded state after a short delay for animation
            setTimeout(() => {
                this.ui.panel.classList.add('expanded');
            }, 100);
        }
    },
    
    // Update slider values from current transform
    updateSlidersFromTransform: function() {
        // Position sliders
        this.updateSliderValue('position', 'x');
        this.updateSliderValue('position', 'y');
        this.updateSliderValue('position', 'z');
        
        // Rotation sliders
        this.updateSliderValue('rotation', 'x');
        this.updateSliderValue('rotation', 'y');
        this.updateSliderValue('rotation', 'z');
        
        // Scale slider
        this.updateSliderValue('scale', 'uniform');
    },
    
    // Update a single slider value
    updateSliderValue: function(transformType, axis) {
        const slider = this.ui.sliders[transformType][axis];
        const valueDisplay = this.ui.valueDisplays[transformType][axis];
        const value = this.transform[transformType][axis];
        
        if (slider) {
            slider.value = value;
        }
        
        if (valueDisplay) {
            valueDisplay.textContent = value;
        }
    },
    
    // Reset transform to default values
    resetTransform: function() {
        // Copy default values
        this.transform = JSON.parse(JSON.stringify(this.defaultTransform));
        
        // Update UI
        this.updateSlidersFromTransform();
        
        // Apply transform
        this.applyTransform();
        
        // Show notification if UIManager is available
        if (window.UIManager && UIManager.showNotification) {
            UIManager.showNotification('Model transform reset');
        }
    },
    
    // Apply current transform to model
    applyTransform: function() {
        if (!this.modelElements.container) {
            console.error('Model container not found');
            return;
        }
        
        // Apply position to container
        const pos = this.transform.position;
        this.modelElements.container.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
        
        // Apply rotation to model
        const rot = this.transform.rotation;
        this.modelElements.model.setAttribute('rotation', `${rot.x} ${rot.y} ${rot.z}`);
        
        // Apply scale to container (uniform scale)
        const scale = this.transform.scale.uniform;
        this.modelElements.container.setAttribute('scale', `${scale} ${scale} ${scale}`);
    },
    
    // Get current transform as string for display
    getTransformString: function() {
        const pos = this.transform.position;
        const rot = this.transform.rotation;
        const scale = this.transform.scale.uniform;
        
        return `Position: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})
                Rotation: (${rot.x.toFixed(0)}°, ${rot.y.toFixed(0)}°, ${rot.z.toFixed(0)}°)
                Scale: ${scale.toFixed(1)}x`;
    }
};

// Auto-initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    if (typeof ModelTransformControls !== 'undefined') {
        // Wait a short delay for other components to initialize
        setTimeout(function() {
            ModelTransformControls.init();
        }, 1000);
    }
}); 