// Rendu du film.
//  Images :  node render.mjs --fps 30 --scale 0.5 --from 0 --to 72 --out ../versions/frames --workers 4
//  Contrôle : node render.mjs --at 1,5.5,10 --scale 0.5 --out /tmp/x       (captures ponctuelles)
//  Vidéo avec flou de mouvement (obturateur 180°) :
//            node render.mjs --video ../versions/sans-son.mp4 --fps 60 --flou 4 --obturateur 0.5 --workers 4
//            → chaque image = moyenne de N sous-images réparties sur la durée d'obturation (ffmpeg tmix).
//  Repères sonores : node render.mjs --cues ../audio/cues.json
import { chromium } from '/home/user/optikom-site/node_modules/playwright/index.mjs';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { extname, join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const DIR = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const fps = +arg('fps', 30), scale = +arg('scale', 1), out = arg('out', join(DIR, '../versions/frames')), workers = +arg('workers', 4);
const fmt = arg('fmt', 'jpeg');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ts': 'text/plain' };
const srv = createServer(async (req, res) => { const p = join(DIR, decodeURIComponent(req.url.split('?')[0])); let b; try { b = await readFile(p); } catch { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); });
await new Promise((r) => srv.listen(0, r));
const port = srv.address().port;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-gpu-vsync', '--font-render-hinting=none', '--force-color-profile=srgb'] });
async function page() {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.error('ERREUR PAGE', e.message));
  p.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !m.text().includes('404')) console.error('CONSOLE', m.text()); });
  await p.goto(`http://localhost:${port}/index.html`);
  await p.evaluate(() => window.__pret);
  return p;
}
const seek = (p, t) => p.evaluate((t) => window.__seek(t), t);
const shot = async (p, t, file) => { await seek(p, t); await p.screenshot({ path: file, type: fmt, quality: fmt === 'jpeg' ? 92 : undefined }); };
const at = arg('at'), video = arg('video'), cues = arg('cues');

if (cues) {
  const p = await page();
  const data = await p.evaluate(() => ({ duree: window.__duree, cues: window.__cues }));
  writeFileSync(resolve(cues), JSON.stringify(data, null, 1));
  console.log(`${data.cues.length} repères sonores → ${cues}`);
} else if (at) {
  mkdirSync(out, { recursive: true });
  const p = await page();
  for (const t of at.split(',').map(Number)) await shot(p, t, join(out, `t${t.toFixed(2).padStart(7, '0')}.${fmt === 'jpeg' ? 'jpg' : 'png'}`));
} else if (video) {
  const N = +arg('flou', 4), shutter = +arg('obturateur', .5);
  const p0 = await page();
  const duree = await p0.evaluate(() => window.__duree);
  await p0.context().close();
  const from = +arg('from', 0), to = +arg('to', duree);
  const n0 = Math.round(from * fps), n1 = Math.round(to * fps), total = n1 - n0;
  const tmp = resolve(video + '.segments'); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  let done = 0; const tStart = Date.now();
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const p = await page();
    const a = n0 + Math.floor(total * w / workers), b = n0 + Math.floor(total * (w + 1) / workers);
    const seg = join(tmp, `seg${w}.mp4`);
    const vf = N > 1 ? `tmix=frames=${N},select='eq(mod(n\\,${N})\\,${N - 1})',setpts=N/(${fps}*TB)` : 'setpts=N/(' + fps + '*TB)';
    const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps * N), '-c:v', 'mjpeg', '-i', '-',
      '-vf', vf, '-r', String(fps), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '9', '-pix_fmt', 'yuv420p', seg], { stdio: ['pipe', 'inherit', 'inherit'] });
    const ecrire = (buf) => new Promise((ok) => { if (!ff.stdin.write(buf)) ff.stdin.once('drain', ok); else ok(); });
    for (let n = a; n < b; n++) {
      for (let k = 0; k < N; k++) {
        const t = Math.min(duree, Math.max(0, n / fps + (N > 1 ? ((k + .5) / N - .5) * shutter / fps : 0)));
        await seek(p, t);
        await ecrire(await p.screenshot({ type: 'jpeg', quality: 95 }));
      }
      if (++done % 200 === 0) console.log(`${done}/${total} images — ${((Date.now() - tStart) / done).toFixed(0)} ms/image`);
    }
    ff.stdin.end();
    await new Promise((ok) => ff.on('close', ok));
  }));
  writeFileSync(join(tmp, 'liste.txt'), Array.from({ length: workers }, (_, w) => `file 'seg${w}.mp4'`).join('\n'));
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(tmp, 'liste.txt'), '-c', 'copy', resolve(video)], { stdio: 'inherit' });
  if (r.status === 0) rmSync(tmp, { recursive: true, force: true });
  console.log(`vidéo : ${video} (${total} images, ${N} sous-images, ${((Date.now() - tStart) / 60000).toFixed(1)} min)`);
} else {
  mkdirSync(out, { recursive: true });
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
