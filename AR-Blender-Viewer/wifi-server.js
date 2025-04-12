/**
 * WiFi HTTPS Server for AR Blender Viewer
 * Runs on port 8080 and binds to all network interfaces
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');
const os = require('os');
const app = express();

// Configuration
const PORT = 8080;
const options = {
    key: fs.readFileSync(path.join(__dirname, 'cert.key')),
    cert: fs.readFileSync(path.join(__dirname, 'cert.crt'))
};

// Get all network interfaces for displaying available IPs
function getNetworkAddresses() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    for (const iface in interfaces) {
        for (const config of interfaces[iface]) {
            // Skip internal and non-IPv4 addresses
            if (config.internal === false && config.family === 'IPv4') {
                addresses.push(config.address);
            }
        }
    }
    
    return addresses;
}

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

// Redirect root to index.html
app.get('/', (req, res) => {
    res.redirect('/index.html');
});

// Create HTTPS server
const server = https.createServer(options, app);

// Start server on all network interfaces
server.listen(PORT, '0.0.0.0', () => {
    const ipAddresses = getNetworkAddresses();
    
    console.log(`
==========================================
AR Blender Viewer (WiFi)
==========================================
Server running on port ${PORT}
Access locally: https://localhost:${PORT}

Available on your network at:`);
    
    ipAddresses.forEach(ip => {
        console.log(`https://${ip}:${PORT}`);
    });
    
    console.log(`
Note: You may need to accept the security warning for the self-signed certificate
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
