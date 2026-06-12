const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'commands', 'igs.js');
const src = fs.readFileSync(file, 'utf8');
const start = src.indexOf('function _0x4b44');
const end = src.indexOf('function _0x55de', start);
if (start === -1 || end === -1) {
  throw new Error('Could not locate decoder functions');
}
const chunkStart = start;
const chunkEnd = src.indexOf('}function _0x55de', start) + 1;
const chunk = src.slice(chunkStart, chunkEnd);
const decoder = new Function(chunk + '\n return { _0x4b44, _0x55de };')();
const fnMap = decoder;
const callRegex = /(_0x[0-9a-fA-F]+)\((0x[0-9a-fA-F]+|\d+)\)/g;
let errors = 0;
const result = src.replace(callRegex, (match, fnName, arg) => {
  const fn = fnMap[fnName];
  if (typeof fn !== 'function') { errors++; return match; }
  try { return JSON.stringify(fn(Number(arg))); } catch (e) { errors++; return match; }
});
fs.writeFileSync(path.join(process.cwd(), 'commands', 'igs.deob.js'), result, 'utf8');
console.log('decoded file written to commands/igs.deob.js with', errors, 'failed replacements');
