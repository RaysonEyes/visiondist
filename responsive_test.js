const puppeteer = require('puppeteer');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// 测试的屏幕尺寸
const viewports = [
  { name: 'iphone_se', width: 320, height: 568 },
  { name: 'iphone_8', width: 375, height: 667 },
  { name: 'iphone_12', width: 390, height: 844 },
  { name: 'iphone_14_pro', width: 393, height: 852 },
  { name: 'pixel_5', width: 393, height: 851 },
  { name: 'samsung_s21', width: 360, height: 800 },
];

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  for (const viewport of viewports) {
    console.log(`Testing ${viewport.name} (${viewport.width}x${viewport.height})...`);
    
    const page = await browser.newPage();
    await page.setViewport({ 
      width: viewport.width, 
      height: viewport.height,
      deviceScaleFactor: 2
    });
    
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
    await delay(500);
    
    // 截图首页
    await page.screenshot({ 
      path: `responsive_${viewport.name}_home.png`, 
      fullPage: false 
    });
    
    // 切换到番茄钟页面
    await page.evaluate(() => {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('timer').classList.add('active');
    });
    await delay(300);
    await page.screenshot({ 
      path: `responsive_${viewport.name}_timer.png`, 
      fullPage: false 
    });
    
    // 切换到专注中状态
    await page.evaluate(() => {
      document.getElementById('timerIdleMode').classList.add('hidden');
      document.getElementById('timerFocusingMode').classList.remove('hidden');
    });
    await delay(300);
    await page.screenshot({ 
      path: `responsive_${viewport.name}_focusing.png`, 
      fullPage: false 
    });
    
    await page.close();
    console.log(`  ✓ ${viewport.name} screenshots saved`);
  }
  
  await browser.close();
  console.log('\nAll responsive tests completed!');
})();
