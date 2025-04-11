const https = require('https');
const fs = require('fs');
const path = require('path');

// Create a simple HTTPS server
const options = {
  key: fs.readFileSync('cert.key'),
  cert: fs.readFileSync('cert.crt')
};

const PORT = 5000;

const server = https.createServer(options, (req, res) => {
  // Set CORS headers to allow all origins and methods
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  
  // For preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Set security headers to help with AR functionality
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Permissions-Policy', 'camera=*, microphone=*, geolocation=*');
  res.setHeader('Content-Security-Policy', "default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;");
  
  // Get the URL path
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }
  
  // Get the file extension
  const extname = path.extname(filePath);
  
  // Set the content type based on the file extension
  let contentType = 'text/html';
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
      contentType = 'image/jpg';
      break;
    case '.gif':
      contentType = 'image/gif';
      break;
    case '.glb':
      contentType = 'model/gltf-binary';
      break;
    case '.gltf':
      contentType = 'model/gltf+json';
      break;
  }
  
  // Read the file
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found - serve index.html
        fs.readFile('./index.html', (error, content) => {
          if (error) {
            res.writeHead(500);
            res.end('Error loading index.html');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      // Successful response
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n✅ AR Blender Viewer Server running!`);
  console.log(`\n📱 Access your AR application on your WiFi network at:`);
  console.log(`   https://YOUR_IP_ADDRESS:${PORT}`);
  console.log(`\n⚠️ Remember to accept the security warning in your browser`);
  console.log(`   (This is normal for self-signed certificates)`);
  console.log(`\n🔍 Look for your IP address using the 'ipconfig' command`);
  console.log(`\n🛑 Press Ctrl+C to stop the server`);
});
