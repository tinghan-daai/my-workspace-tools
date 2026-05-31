// 逐格擷取 record.html → PNG 序列（給 ffmpeg 合成 MP4）
//   node capture.js test    只輸出幾張測試幀到 test/
//   node capture.js         全片逐格輸出到 frames/
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pathToFileURL } = require('url');

function findChrome() {
  const cands = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  for (const c of cands) if (fs.existsSync(c)) return c;
  throw new Error('找不到 Chrome/Edge');
}

const CHROME = findChrome();
const HTML = pathToFileURL(path.resolve(__dirname, 'record.html')).href;
const FPS = 30;
const TEST = process.argv[2] === 'test';
// 逐格 PNG 寫到「本機暫存」：避免 Google Drive 遞迴刪除/大量寫入造成 Node 崩潰
const OUT = path.join(os.tmpdir(), 'tjforum_kv', TEST ? 'test' : 'frames');

async function main() {
  console.log('Chrome:', CHROME);
  console.log('OUT:', OUT);
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(OUT)) if (f.endsWith('.png')) fs.unlinkSync(path.join(OUT, f));
  if (!TEST) fs.writeFileSync(path.join(__dirname, '_framesdir.txt'), OUT, 'utf-8');

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--force-device-scale-factor=1'],
  });
  console.log('launched');
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto(HTML, { waitUntil: 'load', timeout: 60000 });
  await Promise.race([
    page.evaluate(() => document.fonts.ready),
    new Promise(r => setTimeout(r, 8000)),
  ]);
  await new Promise(r => setTimeout(r, 400));
  const T = await page.evaluate(() => window.TOTAL);
  console.log('TOTAL', T);

  if (TEST) {
    for (const ms of [1500, 2400, 3600, 5800, 9000, 11500, 17800, 19500]) {
      await page.evaluate(m => window.seek(m), ms);
      await new Promise(r => setTimeout(r, 60));
      await page.screenshot({ path: path.join(OUT, `t${String(ms).padStart(5, '0')}.png`), clip: { x: 0, y: 0, width: 1920, height: 1080 } });
      console.log('  test', ms);
    }
  } else {
    const frames = Math.round((T / 1000) * FPS);
    console.log(`${FPS}fps → ${frames} 格`);
    const t0 = Date.now();
    for (let i = 0; i < frames; i++) {
      await page.evaluate(ms => window.seek(ms), (i / FPS) * 1000);
      await page.screenshot({ path: path.join(OUT, `f${String(i).padStart(4, '0')}.png`), clip: { x: 0, y: 0, width: 1920, height: 1080 } });
      if (i % 30 === 0) console.log(`  ${i}/${frames}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  }
  console.log('完成 →', OUT);
  await browser.close();
}

main().catch(e => { console.error('ERR:', (e && e.stack) || e); process.exit(3); });
