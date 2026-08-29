import fs from 'node:fs';

const path = 'index.html';
let html = fs.readFileSync(path, 'utf8');
const markers = [
  '<script src="/enterprise-auth.js"></script>',
  '<script src="/enterprise-graph.js"></script>'
];
const pos = html.toLowerCase().lastIndexOf('</body>');
if (pos < 0) throw new Error('index.html has no closing body tag');
let additions = '';
for (const marker of markers) {
  if (!html.includes(marker)) additions += `  ${marker}\n`;
}
if (additions) {
  html = html.slice(0, pos) + additions + html.slice(pos);
  fs.writeFileSync(path, html);
  console.log('Enterprise integration loaders injected.');
} else {
  console.log('Enterprise integration loaders already present.');
}
