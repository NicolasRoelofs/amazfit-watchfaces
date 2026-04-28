export const TEXT_CHAR_WIDTH = px(26);

export const TEXT_CHAR_HEIGHT = px(36);

const buildFileName = (name) => `text_chars/${name}.png`;

const images = {};

[
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '%',
  '-',
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
  'а',
  'б',
  'в',
  'г',
  'д',
  'е',
  'ж',
  'з',
  'и',
  'й',
  'к',
  'л',
  'м',
  'н',
  'о',
  'п',
  'р',
  'с',
  'т',
  'у',
  'ф',
  'х',
  'ц',
  'ч',
  'ш',
  'щ',
  'ъ',
  'ы',
  'ь',
  'э',
  'ю',
  'я',
].forEach((name) => {
  images[name] = buildFileName(name);
});

images[' '] = buildFileName('space');
images[':'] = buildFileName('colon');
images['°'] = buildFileName('degree');

export const TEXT_CHARS = images;

export const TEXT_CHAR_WIDTHS = {
  ' ': 8,

  // très étroites
  i: 8,
  l: 9,
  j: 9,

  // étroites
  t: 10,
  f: 10,
  r: 11,

  // normales
  s: 13,
  e: 13,
  a: 13,
  c: 13,
  n: 14,
  u: 14,
  o: 14,
  d: 14,

  // larges
  h: 15,
  k: 15,
  x: 15,
  y: 15,

  // très larges
  m: 18,
  w: 18,

  // chiffres (souvent homogènes mais à ajuster)
  '0': 14,
  '1': 10,
  '2': 13,
  '3': 13,
  '4': 13,
  '5': 13,
  '6': 14,
  '7': 12,
  '8': 14,
  '9': 14,

  // symboles utiles
  ':': 8,
  '%': 16,
};
