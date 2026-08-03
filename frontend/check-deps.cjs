const fs = require('fs');
const dirs = fs.readdirSync('node_modules/.pnpm').filter(d =>
  d.startsWith('katex@') || d.startsWith('rehype-katex@') || d.startsWith('remark-math@') || d.startsWith('react-markdown@')
);
console.log('pnpm dirs:');
console.log(dirs.join('\n'));
const p = JSON.parse(fs.readFileSync('node_modules/rehype-katex/package.json', 'utf8'));
console.log('\nrehype-katex version:', p.version);
console.log('rehype-katex dependencies:', JSON.stringify(p.dependencies));
console.log('rehype-katex peerDependencies:', JSON.stringify(p.peerDependencies));
const k = JSON.parse(fs.readFileSync('node_modules/katex/package.json', 'utf8'));
console.log('\nroot katex version:', k.version);
// rehype-katex 实际 resolve 到的 katex
try {
  const resolved = require.resolve('katex', { paths: [require('path').dirname(require.resolve('rehype-katex/package.json'))] });
  console.log('katex resolved from rehype-katex:', resolved);
  const kv = JSON.parse(fs.readFileSync(require('path').join(require('path').dirname(resolved), '..', 'package.json'), 'utf8'));
  console.log('resolved katex version:', kv.version);
} catch (e) {
  console.log('resolve err:', e.message);
}
