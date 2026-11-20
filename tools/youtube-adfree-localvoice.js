// Apply the Local Voice relaunch route to the installed YouTube AdFree 0.9.2 user script.
// Usage: node youtube-adfree-localvoice.js original-userScript.js patched-userScript.js
'use strict';
const crypto = require('crypto');
const fs = require('fs');

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('Provide the input and output file paths.');

const original = fs.readFileSync(input);
const hash = crypto.createHash('sha256').update(original).digest('hex');
if (hash !== 'bb99e7f892af7afacd4bb1a6ad45bd14c6994e832546fea17d59c32bb5e80c93') {
  throw new Error('This patch requires the original YouTube AdFree 0.9.2 user script.');
}
const anchor = 'const t=e.detail;t&&"object"==typeof t&&(t.target||t.contentTarget)&&function(e){console.info("handleLaunch"';
const source = original.toString('utf8');
if (source.indexOf(anchor) < 0 || source.indexOf(anchor) !== source.lastIndexOf(anchor)) {
  throw new Error('Could not find the YouTube relaunch handler.');
}

const route = `const t=e.detail;
  if (t && t.localvoice && t.localvoice.youtubeSearch === true &&
      typeof t.target === 'string' &&
      location.origin === 'https://www.youtube.com' && location.pathname === '/tv') {
    const params = new URLSearchParams(t.target);
    const query = params.get('vq');
    if (params.get('launch') === 'voice' && query) {
      location.hash = '/search?inApp=true&vq=' + encodeURIComponent(query).replace(/%20/g, '+');
      return;
    }
  }
`;
fs.writeFileSync(output, source.replace(anchor, route + anchor.slice('const t=e.detail;'.length)), {flag: 'wx'});
