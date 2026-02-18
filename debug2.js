const puppeteer = require('puppeteer');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 932 });
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
  
  // 切换到focus页面
  await page.evaluate(() => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('focus').classList.add('active');
  });
  await delay(300);
  
  // 检查所有页面的display状态
  const displayStates = await page.evaluate(() => {
    const pages = document.querySelectorAll('.page');
    return Array.from(pages).map(p => ({
      id: p.id, 
      active: p.classList.contains('active'),
      display: window.getComputedStyle(p).display
    }));
  });
  console.log('Display states:', displayStates);
  
  await page.screenshot({ path: 'debug_focus2.png', fullPage: false });
  
  await browser.close();
})();
