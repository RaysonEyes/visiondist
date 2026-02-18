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
  
  // 1. 首页截图
  await page.screenshot({ path: 'screenshot_home.png', fullPage: false });
  console.log('1. Home page captured');
  
  // 2. 点击统计页 (索引2)
  await page.evaluate(() => {
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems[2]) navItems[2].click();
  });
  await delay(500);
  await page.screenshot({ path: 'screenshot_stats.png', fullPage: false });
  console.log('2. Stats page captured');
  
  // 3. 点击专注计划页 (索引1)
  await page.evaluate(() => {
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems[1]) navItems[1].click();
  });
  await delay(500);
  await page.screenshot({ path: 'screenshot_focus.png', fullPage: false });
  console.log('3. Focus page captured');
  
  // 4. 点击我的页 (索引3)
  await page.evaluate(() => {
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems[3]) navItems[3].click();
  });
  await delay(500);
  await page.screenshot({ path: 'screenshot_profile.png', fullPage: false });
  console.log('4. Profile page captured');
  
  // 5. 点击监测按钮
  await page.click('.nav-tomato');
  await delay(500);
  await page.screenshot({ path: 'screenshot_timer.png', fullPage: false });
  console.log('5. Timer page captured');
  
  // 6. 点击开始监测
  const startBtn = await page.$('.start-btn');
  if (startBtn) {
    await startBtn.click();
    await delay(1000);
    await page.screenshot({ path: 'screenshot_focusing.png', fullPage: false });
    console.log('6. Focusing page captured');
  }
  
  await browser.close();
  console.log('All screenshots saved!');
})();
