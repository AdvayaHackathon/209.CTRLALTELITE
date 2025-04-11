# AR Blender Model Viewer

A complete web-based Augmented Reality application for displaying 3D models exported from Blender. This application allows users to place, move, rotate, and scale 3D models in their real environment using their mobile device's camera.

## Features

- **Camera Access**: Automatically requests and initializes device camera
- **Surface Detection**: Reliably detects flat surfaces for model placement
- **Model Interactions**: Move, rotate, and scale the 3D model using intuitive touch controls
- **Performance Optimized**: Built for smooth rendering on mid-range mobile devices
- **Clean UI**: Minimalist interface that doesn't obstruct the AR view
- **Offline Capable**: Works without continuous internet connection once loaded
- **Responsive Design**: Adapts to different screen sizes and orientations
- **Easy Customization**: Simple process to swap out the 3D model

## Requirements

- A modern mobile device with a camera
- A modern web browser that supports WebGL and WebXR (Chrome, Safari, Firefox, Edge)
- A local hosting solution for development (Node.js, Python, or XAMPP)

## Setup Instructions

### 1. Prepare Your 3D Model

1. Create or modify your 3D model in Blender
2. Export it as a GLB or GLTF file:
   - In Blender, go to File > Export > glTF 2.0 (.glb/.gltf)
   - Make sure to check the appropriate options (typically default settings work well)
   - For optimal performance, keep your model under 50,000 polygons and texture sizes under 2048x2048
3. Place your exported model in the `models` folder and rename it to `model.glb` (or update the path in `main.js`)

### 2. Local Hosting Setup

#### Using Python (Simple HTTP Server)

```bash
# Navigate to the project directory
cd path/to/AR-Blender-Viewer

# If you have Python 3 installed
python -m http.server 8000

# If you have Python 2 installed
python -m SimpleHTTPServer 8000
```

#### Using Node.js

```bash
# Install http-server globally if you haven't already
npm install -g http-server

# Navigate to the project directory
cd path/to/AR-Blender-Viewer

# Start the server
http-server -p 8000
```

#### Using XAMPP (Windows)

1. Install XAMPP if you haven't already
2. Copy the AR-Blender-Viewer folder to the `htdocs` folder in your XAMPP installation
3. Start the Apache server in XAMPP Control Panel
4. Access your site at `http://localhost/AR-Blender-Viewer`

### 3. Accessing the App on Mobile Devices

#### Same WiFi Network (Local Network)

1. Find your computer's local IP address:
   - Windows: Open Command Prompt and type `ipconfig`
   - macOS: Open System Preferences > Network
   - Linux: Open Terminal and type `hostname -I`
2. On your mobile device, connect to the same WiFi network
3. Open your mobile browser and navigate to:
   `http://YOUR_COMPUTER_IP:8000`
   (Replace YOUR_COMPUTER_IP with your actual IP address)

#### Using ngrok for External Access

1. Download and install [ngrok](https://ngrok.com/)
2. Start your local server as described above
3. In a new terminal/command prompt, run:
   ```bash
   ngrok http 8000
   ```
4. Ngrok will provide a public URL that you can access from any device
5. Share this URL with others to let them try your AR app

## Usage Instructions

1. Open the app in a mobile browser
2. Allow camera permissions when prompted
3. Point your camera at a flat surface (floor, table, wall)
4. Once a surface is detected, tap on the indicator to place the 3D model
5. Use the on-screen controls to:
   - Move the model (tap the move icon, then drag)
   - Rotate the model (tap the rotate icon, then drag)
   - Scale the model (tap the scale icon, then drag up/down or pinch)
   - Take a screenshot
   - Reset the scene

## Troubleshooting

- **Camera Not Working**: Ensure your browser has camera permissions and is updated to the latest version
- **Performance Issues**: Try simplifying your 3D model or reducing texture sizes
- **Surface Detection Problems**: Ensure your environment has good lighting and distinct visual features
- **Model Not Appearing**: Check that your model file is correctly formatted and optimized for web

## Customization

### Changing the Model

1. Place your new model in the `models` folder
2. If your model is named differently than `model.glb`, update the `modelUrl` property in `js/main.js`:
   ```javascript
   modelUrl: './models/your-model-name.glb',
   ```

### Modifying the UI

- Edit `css/styles.css` to change the appearance of the application
- Modify `index.html` to add or remove UI elements
- Update the interaction functionality in `js/ui-manager.js`

## Technical Details

This application is built using:
- **AR.js**: For augmented reality capabilities
- **A-Frame**: For 3D rendering and scene management
- **Three.js**: For low-level 3D operations (used internally by A-Frame)
- **JavaScript**: For application logic and UI interaction
- **CSS3**: For styling and animations
- **HTML5**: For structure and offline capabilities via Service Workers

## License

MIT License - Feel free to use, modify, and distribute this code for personal or commercial projects.

## Acknowledgments

- [AR.js](https://github.com/AR-js-org/AR.js) - Augmented Reality for the Web
- [A-Frame](https://aframe.io/) - Web framework for building virtual reality experiences
- [Three.js](https://threejs.org/) - JavaScript 3D Library
