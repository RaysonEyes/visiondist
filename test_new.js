const puppeteer = require('puppeteer');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
  await delay(500);
  
  // 首页截图
  await page.screenshot({ path: 'new_home.png', fullPage: false });
  console.log('✓ 首页截图完成');
  
  // 点击监测按钮
  await page.evaluate(() => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('timer').classList.add('active');
  });
  await delay(300);
  await page.screenshot({ path: 'new_timer.png', fullPage: false });
  console.log('✓ 监测页截图完成');
  
  // 专注中状态
  await page.evaluate(() => {
    document.getElementById('timerIdleMode').classList.add('hidden');
    document.getElementById('timerFocusingMode').classList.remove('hidden');
  });
  await delay(300);
  await page.screenshot({ path: 'new_focusing.png', fullPage: false });
  console.log('✓ 监测中截图完成');
  
  // 统计页
  await page.evaluate(() => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('stats').classList.add('active');
  });
  await delay(300);
  await page.screenshot({ path: 'new_stats.png', fullPage: false });
  console.log('✓ 统计页截图完成');
  
  // 专注计划页
  await page.evaluate(() => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('focus').classList.add('active');
  });
  await delay(300);
  await page.screenshot({ path: 'new_focus.png', fullPage: false });
  console.log('✓ 计划页截图完成');
  
  // 我的页面
  await page.evaluate(() => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('profile').classList.add('active');
  });
  await delay(300);
  await page.screenshot({ path: 'new_profile.png', fullPage: false });
  console.log('✓ 我的页截图完成');
  
  await browser.close();
  console.log('\n所有截图完成！');
})();
