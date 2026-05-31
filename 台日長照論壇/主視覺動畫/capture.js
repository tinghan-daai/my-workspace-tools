// 逐格擷取 record.html → PNG 序列（給 ffmpeg 合成 MP4）
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const HTML = 'file://' + path.resolve(__dirname, 'record.html');
const OUT = path.resolve(__dirname, 'frames');
const FPS = 30;

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--force-device-scale-factor=1', '--hide-scrollbars'],
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  await page.goto(HTML, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 400));

  const T = await page.evaluate(() => window.TOTAL);
  const frames = Math.round((T / 1000) * FPS);
  console.log(`總長 ${T}ms, ${FPS}fps → ${frames} 格`);

  for (let i = 0; i < frames; i++) {
    const t = (i / FPS) * 1000;
    await page.evaluate(ms => window.seek(ms), t);
    const file = path.join(OUT, `f${String(i).padStart(4, '0')}.png`);
    await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    if (i % 60 === 0) console.log(`  ${i}/${frames}`);
  }
  console.log('擷取完成');
  await browser.close();
})();
