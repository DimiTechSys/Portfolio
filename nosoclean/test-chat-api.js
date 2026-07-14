const http = require('http');
const data = JSON.stringify({ article: null, history: [], question: 'Bonjour, quelle est la bactérie dans l eau ?' });
const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};
const req = http.request(options, (res) => {
  let raw = '';
  res.on('data', (chunk) => raw += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log(raw);
  });
});
req.on('error', (e) => console.error('REQ ERROR', e.message));
req.write(data);
req.end();
