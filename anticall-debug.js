const fs = require('fs');
const text = fs.readFileSync('./commands/anticall.js', 'utf8');

function extractFunction(name) {
  const start = text.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('Function ' + name + ' not found');
  let i = text.indexOf('{', start);
  let depth = 1;
  i++;
  let inString = false;
  let quote = '';
  let escaped = false;
  while (i < text.length && depth > 0) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
    } else if (ch === '\\') {
      escaped = true;
    } else if (inString) {
      if (ch === quote) inString = false;
    } else if (ch === '"' || ch === "'") {
      inString = true;
      quote = ch;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
    }
    i++;
  }
  if (depth !== 0) throw new Error('Unmatched braces for ' + name);
  return text.slice(start, i);
}

const init = text.slice(0, text.indexOf('function _0x1373('));
const decoder = extractFunction('_0x1373');
const code = init + '\n' + decoder;
eval(code);

const keys = [0x1d4, 0x1ee, 0x1d1, 0x1f1, 0x1e6, 0x1ec, 0x1d8, 0x1da, 0x1ea, 0x1d6, 0x1d9, 0x1fa, 0x1ed, 0x1f3, 0x1f7, 0x1fb, 0x1f8, 0x1d5, 0x1f0, 0x1e5, 0x1eb, 0x1ef, 0x1d3, 0x1f4, 0x1dc, 0x1fc, 0x1dd, 0x1e2, 0x1e3, 0x1e9, 0x1f2, 0x1e4, 0x1f5, 0x1d7, 0x1df, 0x1de, 0x1db, 0x1e7, 0x1f6];
keys.forEach(k => {
  try {
    console.log(k.toString(16), _0x1373(k));
  } catch (err) {
    console.error(k.toString(16), 'ERROR', err.message);
  }
});
