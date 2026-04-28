const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const DIR = path.join(
  process.cwd(),
  'src/watchfaces/gauge/assets/common.r/text_chars'
);

const aliases = {
  ' ': 'space.png',
  ':': 'colon.png',
  '°': 'degree.png',
};

function measureWidth(file) {
  const png = PNG.sync.read(fs.readFileSync(file));

  let minX = png.width;
  let maxX = -1;

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) * 4;
      const alpha = png.data[idx + 3];

      if (alpha > 0) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    }
  }

  if (maxX === -1) return 8;

  return maxX - minX + 1 + 2;
}

const widths = {};

for (const fileName of fs.readdirSync(DIR)) {
  if (!fileName.endsWith('.png')) continue;

  let char = fileName.replace('.png', '');

  for (const [aliasChar, aliasFile] of Object.entries(aliases)) {
    if (fileName === aliasFile) {
      char = aliasChar;
    }
  }

  widths[char] = measureWidth(path.join(DIR, fileName));
}

console.log('export const TEXT_CHAR_WIDTHS = {');

for (const key of Object.keys(widths).sort()) {
  console.log(`  ${JSON.stringify(key)}: ${widths[key]},`);
}

console.log('};');
