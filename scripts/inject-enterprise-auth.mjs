import fs from 'node:fs';

const path = 'index.html';
const marker = '<script src="/enterprise-auth.js"></script>';
let html = fs.readFileSync(path, 'utf8');
if (!html.includes(marker)) {
  const pos = html.toLowerCase().lastIndexOf('</body>');
  if (pos < 0) throw new Error('index.html has no closing body tag');
  html = html.slice(0, pos) + `  ${marker}\n` + html.slice(pos);
  fs.writeFileSync(path, html);
  console.log('Enterprise auth injected.');
} else {
  console.log('Enterprise auth already present.');
}
