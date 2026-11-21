// Checks that every i18n key used in src/ exists in en.json, and that tl.json has the same keys.
// Run: node scripts/check-i18n.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const en = JSON.parse(readFileSync('src/i18n/en.json', 'utf8'));
const tl = JSON.parse(readFileSync('src/i18n/tl.json', 'utf8'));
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(f) && !f.endsWith('.test.ts')) files.push(p);
  }
})('src');

const used = new Set();
const keyRe = /['"`]((?:app|lang|header|comfort|common|pick|scene|stop|captions|cue|task|shop|toggle|stressor|acc|jeepney|mall|cap|break|reflection|share)\.[A-Za-z0-9.]+)['"`]/g;
for (const f of files) for (const m of readFileSync(f, 'utf8').matchAll(keyRe)) used.add(m[1]);
// Keys built at runtime from ids.
const ids = ['noise', 'light', 'crowding', 'smell', 'social', 'sudden'];
for (const id of ids) used.add(`stressor.${id}`), used.add(`acc.${id}`);
for (const k of ['sound', 'smell', 'touch', 'speech']) used.add(`cue.kind.${k}`);
for (const s of ['jeepney', 'mall']) used.add(`pick.${s}.title`), used.add(`pick.${s}.desc`);
for (const p of ['calm', 'buildup', 'peak', 'toggle']) used.add(`scene.phase.${p}`);
for (const a of ['yes', 'little', 'no']) used.add(`reflection.ask.${a}`);
for (const l of ['en', 'tl']) used.add(`lang.${l}.short`), used.add(`lang.${l}.name`);

const real = (o) => Object.keys(o).filter((k) => !k.startsWith('_'));
const missingEn = [...used].filter((k) => !(k in en));
const missingTl = real(en).filter((k) => !(k in tl));
const extraTl = real(tl).filter((k) => !(k in en));
const todoEn = real(en).filter((k) => en[k].startsWith('TODO'));
const todoTl = real(tl).filter((k) => tl[k].startsWith('TODO'));
console.log(`keys used in code: ${used.size}, en: ${real(en).length}, tl: ${real(tl).length}`);
console.log('missing in en:', missingEn.length ? missingEn : 'none');
console.log('missing in tl:', missingTl.length ? missingTl : 'none');
console.log('in tl but not en:', extraTl.length ? extraTl : 'none');
console.log(`TODO placeholders — en: ${todoEn.length}, tl: ${todoTl.length}`);
console.log('  ' + todoTl.join('\n  '));
process.exit(missingEn.length || missingTl.length || extraTl.length ? 1 : 0);
