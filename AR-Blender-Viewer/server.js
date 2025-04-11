const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Create Express app
const app = express();

// Enable CORS for all routes and origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Range', 'Origin', 'X-Requested-With', 'Accept']
}));

// Set security headers to allow AR features
app.use((req, res, next) => {
  // Remove restrictive security headers
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Add necessary permissions policies
  res.setHeader('Permissions-Policy', 'camera=*, microphone=*, geolocation=*');
  
  // Set content security policy that allows everything
  res.setHeader('Content-Security-Policy', "default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;");
  
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Handle 404s by redirecting to index.html for SPA functionality
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// HTTPS settings
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'cert.key')),
  cert: fs.readFileSync(path.join(__dirname, 'cert.crt'))
};

// Start HTTPS server
const PORT = 8080;
const server = https.createServer(httpsOptions, app);

server.listen(PORT, () => {
  console.log(`\n✅ AR Blender Viewer Server running!`);
  console.log(`\n📱 Access your AR application on your WiFi network at:`);
  console.log(`   https://YOUR_IP_ADDRESS:${PORT}`);
  console.log(`\n⚠️ Remember to accept the security warning in your browser`);
  console.log(`   (This is normal for self-signed certificates)`);
  console.log(`\n🔍 Look for your IP address using the 'ipconfig' command`);
  console.log(`\n🛑 Press Ctrl+C to stop the server`);
});
