const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  await page.goto('http://localhost:8080/showcase.html', { waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 2000)); // 等待动画完成
  await page.screenshot({ path: 'showcase_preview.png', fullPage: true });
  console.log('Showcase screenshot saved!');
  await browser.close();
})();
