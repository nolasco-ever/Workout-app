// Export every badge the Badge Builder draws, as SVG, from a saved design config.
//   node export.js <design-config.json> <out_dir>
// Writes <family>_t<tier>.svg and meta.json (the colours each drawing used).
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const [cfgPath, outDir] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const html = fs.readFileSync(path.join(__dirname, '..', 'badge-builder.html'), 'utf8');
const dom = new JSDOM('<!doctype html><html><head></head><body>' + html + '</body></html>', { runScripts: 'dangerously', pretendToBeVisual: true });
const w = dom.window;
w.addEventListener('error', e => console.log('PAGE ERROR', e.message));
w.__cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
setTimeout(() => {
  w.eval('applyDoc(window.__cfg)');
  const meta = { families: [], ladder: {}, badges: {} };
  const families = w.eval('FAMILIES');
  const tiers = w.eval('state.tiers');
  for (const [id, , ladder] of families) {
    meta.families.push(id);
    meta.ladder[id] = ladder.length;
    for (let i = 0; i < ladder.length && i < tiers.length; i++) {
      const spec = w.eval(`tierSpec(${i}, ${JSON.stringify(id)})`);
      const svg = w.eval(`badge({ ...tierSpec(${i}, ${JSON.stringify(id)}), size: 100 })`);
      fs.writeFileSync(path.join(outDir, `${id}_t${i + 1}.svg`), svg);
      meta.badges[`${id}:${i + 1}`] = {
        shape: spec.shape, metal: spec.metal, markColor: spec.markColor, enamel: spec.enamel, enamel2: spec.enamel2, stone: spec.stone,
        tone1: w.eval(`lighten(${JSON.stringify(spec.enamel)}, 0.14)`), tone2: w.eval(`darken(${JSON.stringify(spec.enamel)}, 0.22)`),
        outline: w.eval(`SHAPES[${JSON.stringify(spec.shape)}].outline`), face: w.eval('FACE'), design: spec.design,
      };
    }
  }
  fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 1));
  console.log('exported', Object.keys(meta.badges).length, 'badges');
}, 600);
