const fs = require('fs');
const path = require('path');

const appUrl = process.env.APP_URL || 'http://localhost:5000';

const wwwDir = path.join(__dirname, 'www');
if (!fs.existsSync(wwwDir)) fs.mkdirSync(wwwDir, { recursive: true });

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily News</title>
  <style>
    body { margin: 0; padding: 0; overflow: hidden; background: #f4f5f7; }
    iframe { width: 100vw; height: 100vh; border: none; }
  </style>
</head>
<body>
  <iframe src="${appUrl}" allow="geolocation; notifications"></iframe>
</body>
</html>`;

fs.writeFileSync(path.join(wwwDir, 'index.html'), html);
console.log('Generated www/index.html ->', appUrl);
