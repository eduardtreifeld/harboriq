const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const USERNAME = process.env.VPM_USER || 'vpm';
const PASSWORD = process.env.VPM_PASS || 'vpm2026';

console.log(`Starting VPM server on PORT: ${PORT}`);

const sessions = {};

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getCookie(req, name) {
  const cookies = req.headers.cookie || '';
  const match = cookies.split(';').find(c => c.trim().startsWith(name + '='));
  return match ? match.trim().split('=')[1] : null;
}

const loginPage = `<!DOCTYPE html>
<html lang="et">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VPM</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#07090f;color:#e6edf3;font-family:system-ui,sans-serif;
  display:flex;align-items:center;justify-content:center;min-height:100vh}
.box{background:#0d1117;border:1px solid #21262d;border-radius:12px;
  padding:40px;width:320px;text-align:center}
.logo{background:#1d4ed8;color:#fff;font-size:18px;font-weight:700;
  padding:6px 16px;border-radius:6px;display:inline-block;margin-bottom:16px;
  letter-spacing:.1em;font-family:monospace}
h2{font-size:13px;color:#8b949e;margin-bottom:24px}
input{width:100%;padding:10px 14px;background:#161b22;border:1px solid #30363d;
  color:#e6edf3;border-radius:6px;font-size:14px;margin-bottom:10px;outline:none}
input:focus{border-color:#1d4ed8}
button{width:100%;padding:10px;background:#1d4ed8;color:#fff;border:none;
  border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;margin-top:4px}
button:hover{background:#1e40af}
.err{color:#f85149;font-size:12px;margin-top:10px;min-height:16px}
</style>
</head>
<body>
<div class="box">
  <div class="logo">VPM</div>
  <h2>Vessel Prediction Model</h2>
  <form method="POST" action="/login">
    <input type="text" name="u" placeholder="Kasutajanimi" autofocus autocomplete="username">
    <input type="password" name="p" placeholder="Parool" autocomplete="current-password">
    <button type="submit">Logi sisse</button>
  </form>
  <div class="err">ERRMSG</div>
</div>
</body>
</html>`;

const MIME = {
  '.html':'text/html','.js':'text/javascript',
  '.css':'text/css','.json':'application/json',
  '.png':'image/png','.ico':'image/x-icon'
};

function parseBody(req, cb) {
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    const p = {};
    body.split('&').forEach(x => {
      const [k,v] = x.split('=');
      if(k) p[decodeURIComponent(k)] = decodeURIComponent((v||'').replace(/\+/g,' '));
    });
    cb(p);
  });
}

http.createServer((req, res) => {

  if (req.method === 'POST' && req.url === '/login') {
    parseBody(req, (p) => {
      console.log(`Login attempt: user="${p.u}" pass="${p.p}"`);
      console.log(`Expected: user="${USERNAME}" pass="${PASSWORD}"`);
      if (p.u === USERNAME && p.p === PASSWORD) {
        const tok = generateToken();
        sessions[tok] = Date.now();
        res.writeHead(302, {
          'Set-Cookie': `s=${tok}; Path=/; HttpOnly; Max-Age=86400`,
          'Location': '/'
        });
        res.end();
      } else {
        const page = loginPage.replace('ERRMSG', 'Vale kasutajanimi voi parool');
        res.writeHead(200, {'Content-Type':'text/html'});
        res.end(page);
      }
    });
    return;
  }

  if (req.url === '/login') {
    const page = loginPage.replace('ERRMSG', '');
    res.writeHead(200, {'Content-Type':'text/html'});
    res.end(page);
    return;
  }

  const tok = getCookie(req, 's');
  if (!tok || !sessions[tok]) {
    res.writeHead(302, {'Location':'/login'});
    res.end();
    return;
  }

  let filePath = path.join(__dirname, req.url === '/' ? '/VPM3.html' : req.url);
  const ext = path.extname(filePath);
  const ct = MIME[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, {'Content-Type': ct});
    res.end(data);
  });

}).listen(PORT, () => {
  console.log('VPM running on port ' + PORT);
});
