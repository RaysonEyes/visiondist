const puppeteer = require('puppeteer');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  
  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle0' });
  await delay(1500);
  
  // 首页截图 - 新吉祥物
  await page.screenshot({ path: 'updated_home.png', fullPage: false });
  console.log('✅ 首页截图完成');
  
  // 点击监测按钮进入监测页
  await page.evaluate(() => {
    showPage('timer');
    updateNavActive(2);
  });
  await delay(500);
  await page.screenshot({ path: 'updated_timer.png', fullPage: false });
  console.log('✅ 监测页截图完成');
  
  // 模拟开始监测状态
  await page.evaluate(() => {
    document.getElementById('timerIdleMode').classList.add('hidden');
    document.getElementById('timerFocusingMode').classList.remove('hidden');
    document.getElementById('monitorContainer').classList.add('active');
  });
  await delay(500);
  await page.screenshot({ path: 'updated_focusing.png', fullPage: false });
  console.log('✅ 监测中截图完成');
  
  // 专注模式弹窗
  await page.evaluate(() => {
    showPage('home');
    updateNavActive(0);
  });
  await delay(300);
  await page.evaluate(() => {
    showZenModeModal();
  });
  await delay(500);
  await page.screenshot({ path: 'updated_zen.png', fullPage: false });
  console.log('✅ 专注模式弹窗截图完成');
  
  await browser.close();
  console.log('🎉 所有截图完成！');
})();
