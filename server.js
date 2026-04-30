const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const USERNAME = process.env.VPM_USER || 'vpm';
const PASSWORD = process.env.VPM_PASS || 'harboriq2026';

console.log(`Starting on PORT: ${PORT}`);

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {

  // Basic Auth kontroll
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.writeHead(401, {
      'WWW-Authenticate': 'Basic realm="VPM – Vessel Prediction Model"',
      'Content-Type': 'text/html'
    });
    res.end('<h2>VPM – sisselogimine nõutud</h2>');
    return;
  }

  const base64 = authHeader.split(' ')[1];
  const [user, pass] = Buffer.from(base64, 'base64').toString().split(':');

  if (user !== USERNAME || pass !== PASSWORD) {
    res.writeHead(401, {
      'WWW-Authenticate': 'Basic realm="VPM – Vessel Prediction Model"',
      'Content-Type': 'text/html'
    });
    res.end('<h2>Vale kasutajanimi või parool</h2>');
    return;
  }

  // Teeninda failid
  let filePath = path.join(__dirname, req.url === '/' ? '/VPM3.html' : req.url);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });

}).listen(PORT, () => {
  console.log(`VPM server running on port ${PORT}`);
});
