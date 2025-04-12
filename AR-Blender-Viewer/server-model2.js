/**
 * HTTPS Server for AR Blender Viewer - Model2 Version
 * Runs on port 8081
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

// Configuration
const PORT = 8081;
const options = {
    key: fs.readFileSync(path.join(__dirname, 'cert.key')),
    cert: fs.readFileSync(path.join(__dirname, 'cert.crt'))
};

// MIME types for proper serving
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json'
};

// Serve static files
app.use(express.static(__dirname, {
    setHeaders: (res, filePath) => {
        // Set proper MIME types for GLB/GLTF files
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.glb') {
            res.setHeader('Content-Type', 'model/gltf-binary');
        } else if (ext === '.gltf') {
            res.setHeader('Content-Type', 'model/gltf+json');
        }
        
        // Add CORS headers for all requests
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    }
}));

// Create HTTPS server
const server = https.createServer(options, app);

// Start server
server.listen(PORT, () => {
    const serverUrl = `https://localhost:${PORT}`;
    console.log(`
==========================================
AR Blender Viewer - Model2 Version
==========================================
Server running on port ${PORT}
Access locally: ${serverUrl}
Model: model2.glb is loaded by default
Wifi network access available on your IP
Press Ctrl+C to stop server
==========================================
`);
});

// Handle server errors
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Try a different port.`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
}); 