#!/usr/bin/env node
/**
 * Production Kanban System - Node.js HTTP Server
 * Portable server solution that doesn't require Python
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// MIME types mapping
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain'
};

function findFreePort(startPort = 8000, maxPort = 8100) {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    
    function tryPort(port) {
      if (port > maxPort) {
        reject(new Error('No free port found'));
        return;
      }
      
      server.listen(port, 'localhost', () => {
        const actualPort = server.address().port;
        server.close(() => {
          resolve(actualPort);
        });
      });
      
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          tryPort(port + 1);
        } else {
          reject(err);
        }
      });
    }
    
    tryPort(startPort);
  });
}

function serveFile(req, res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }
    
    // Add CORS headers for better compatibility
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
}

async function startServer() {
  try {
    const port = await findFreePort();
    const server = http.createServer((req, res) => {
      let filePath = req.url === '/' ? '/index.html' : req.url;
      filePath = path.join(__dirname, filePath);
      
      // Security: prevent directory traversal
      if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
      }
      
      serveFile(req, res, filePath);
    });
    
    server.listen(port, 'localhost', () => {
      const url = `http://localhost:${port}`;
      console.log('Production Kanban System - Node.js Server');
      console.log(`Server running at: ${url}`);
      console.log(`Serving files from: ${__dirname}`);
      console.log('');
      console.log('Press Ctrl+C to stop the server');
      console.log('='.repeat(50));
      
      // Try to open browser
      const openCommands = {
        win32: `start "" "${url}"`,
        darwin: `open "${url}"`,
        linux: `xdg-open "${url}"`
      };
      
      const command = openCommands[process.platform] || openCommands.linux;
      exec(command, (error) => {
        if (error) {
          console.log(`Please open your browser and visit: ${url}`);
        } else {
          console.log(`Opening browser: ${url}`);
        }
      });
    });
    
    server.on('error', (err) => {
      console.error('Server error:', err.message);
      process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nServer stopped by user');
      server.close(() => {
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('Failed to start server:', error.message);
    console.log('Press Enter to exit...');
    process.stdin.once('data', () => process.exit(1));
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };