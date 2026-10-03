// Rendu image par image du film : node render.mjs --fps 30 --scale 0.5 --from 0 --to 113 --out ../versions/frames --workers 4
// --at 1,5.5,10 : captures ponctuelles (contrôle).
import { chromium } from '/home/user/optikom-site/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const DIR = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const fps = +arg('fps', 30), scale = +arg('scale', 1), out = arg('out', join(DIR, '../versions/frames')), workers = +arg('workers', 4);
const fmt = arg('fmt', 'jpeg');
mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ts': 'text/plain' };
const srv = createServer(async (req, res) => { const p = join(DIR, decodeURIComponent(req.url.split('?')[0])); let b; try { b = await readFile(p); } catch { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); });
await new Promise((r) => srv.listen(0, r));
const port = srv.address().port;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-gpu-vsync', '--font-render-hinting=none', '--force-color-profile=srgb'] });
async function page() {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.error('ERREUR PAGE', e.message));
  await p.goto(`http://localhost:${port}/index.html`);
  await p.evaluate(() => window.__pret);
  return p;
}
const shot = async (p, t, file) => { await p.evaluate((t) => window.__seek(t), t); await p.screenshot({ path: file, type: fmt, quality: fmt === 'jpeg' ? 92 : undefined }); };
const at = arg('at');
if (at) {
  const p = await page();
  for (const t of at.split(',').map(Number)) { await shot(p, t, join(out, `t${t.toFixed(2).padStart(7, '0')}.${fmt === 'jpeg' ? 'jpg' : 'png'}`)); }
} else {
  const from = +arg('from', 0), to = +arg('to', await (await page()).evaluate(() => window.__duree));
  const n0 = Math.round(from * fps), n1 = Math.round(to * fps);
  const total = n1 - n0; let done = 0; const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const p = await page();
    const a = n0 + Math.floor(total * w / workers), b = n0 + Math.floor(total * (w + 1) / workers);
    for (let n = a; n < b; n++) {
      await shot(p, n / fps, join(out, `f${String(n).padStart(6, '0')}.${fmt === 'jpeg' ? 'jpg' : 'png'}`));
      if (++done % 200 === 0) console.log(`${done}/${total} — ${((Date.now() - t0) / done).toFixed(0)} ms/image`);
    }
  }));
}
await browser.close(); srv.close();
