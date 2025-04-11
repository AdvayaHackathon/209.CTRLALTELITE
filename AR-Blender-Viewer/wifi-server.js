const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Get network interfaces
const networkInterfaces = os.networkInterfaces();
const wifiIp = Object.values(networkInterfaces)
  .flat()
  .filter(details => details.family === 'IPv4' && !details.internal)
  .map(details => details.address)
  .filter(ip => !ip.startsWith('192.168.56.') && !ip.startsWith('172.31.64.'))[0] || 'localhost';

// Create HTTPS server with SSL certificates
const options = {
  key: fs.readFileSync('cert.key'),
  cert: fs.readFileSync('cert.crt')
};

const PORT = 5000;

// Create a simple HTTPS server
const server = https.createServer(options, (req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  // Set security headers for AR
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  
  // Specific headers for AR functionality
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Handle OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Get the request URL
  let url = req.url === '/' ? '/index.html' : req.url;
  
  // Remove query parameters if present
  url = url.split('?')[0];
  
  const filePath = path.join(__dirname, url);
  const extname = path.extname(filePath).toLowerCase();

  // Define content types for different file extensions
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.bin': 'application/octet-stream',
    '.mp4': 'video/mp4',
    '.webp': 'image/webp',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf'
  };

  const contentType = contentTypes[extname] || 'application/octet-stream';

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`File not found: ${filePath}`);
      res.writeHead(404);
      res.end(`File not found: ${url}`);
      return;
    }

    // Read the file
    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          // File not found
          console.error(`File not found (ENOENT): ${filePath}`);
          res.writeHead(404);
          res.end(`File not found: ${url}`);
        } else {
          // Server error
          console.error(`Server error: ${error.code} for ${filePath}`);
          res.writeHead(500);
          res.end(`Server Error: ${error.code}`);
        }
      } else {
        // Success
        console.log(`Serving: ${filePath} (${contentType})`);
        
        // Add content security policy for AR
        const headers = { 
          'Content-Type': contentType,
          'Content-Length': content.length
        };
        
        res.writeHead(200, headers);
        res.end(content);
      }
    });
  });
});

// Start server
server.listen(PORT, () => {
  console.log('\n\x1b[32m%s\x1b[0m', '✅ AR Blender Viewer Server running!');
  console.log('\n\x1b[36m%s\x1b[0m', '📱 Access your AR application at:');
  console.log('\x1b[33m%s\x1b[0m', `   https://${wifiIp}:${PORT}`);
  console.log('\n\x1b[31m%s\x1b[0m', '⚠️ Remember to accept the security warning in your browser');
  console.log('\x1b[31m%s\x1b[0m', '   (This is normal for self-signed certificates)');
  console.log('\n\x1b[90m%s\x1b[0m', '🛑 Press Ctrl+C to stop the server');
});
