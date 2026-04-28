// scripts/measure-text-char-widths.js
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const DIR = path.join(
  __dirname,
  '../src/watchfaces/gauge/assets/common.r/text_chars'
);

const map = {
  ' ': 'space.png',
  ':': 'colon.png',
  '°': 'degree.png',
  '%': '%.png',
  '-': '-.png',
};

const chars = [
  '0','1','2','3','4','5','6','7','8','9',
  '%','-',
  'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
  'а','б','в','г','д','е','ж','з','и','й','к','л','м','н','о','п','р','с','т','у','ф','х','ц','ч','ш','щ','ъ','ы','ь','э','ю','я',
  ' ', ':', '°'
];

function filenameFor(char) {
  return map[char] || `${char}.png`;
}

function measureWidth(file) {
  const png = PNG.sync.read(fs.readFileSync(file));

  let minX = png.width;
  let maxX = -1;

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) << 2;
      const alpha = png.data[idx + 3];

      if (alpha > 0) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    }
  }

  if (maxX === -1) return 8;

  // +2 = petit padding visuel
  return maxX - minX + 1 + 2;
}

const widths = {};

for (const char of chars) {
  const file = path.join(DIR, filenameFor(char));

  if (!fs.existsSync(file)) continue;

  widths[char] = measureWidth(file);
}

console.log('export const TEXT_CHAR_WIDTHS = {');
for (const [char, width] of Object.entries(widths)) {
  console.log(`  ${JSON.stringify(char)}: ${width},`);
}
console.log('};');
