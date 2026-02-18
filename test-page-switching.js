// 测试页面切换功能
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // 设置视口大小为手机尺寸
  await page.setViewport({ width: 430, height: 932 });
  
  // 打开页面
  const filePath = 'file://' + path.join(__dirname, 'index.html');
  await page.goto(filePath);
  
  console.log('✓ 页面已加载');
  
  // 等待页面加载完成
  await page.waitForTimeout(1000);
  
  // 检查初始状态 - 只有首页应该可见
  const homeVisible = await page.$eval('#home', el => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.opacity !== '0' && style.visibility !== 'hidden';
  });
  
  const timerVisible = await page.$eval('#timer', el => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.opacity !== '0' && style.visibility !== 'hidden';
  });
  
  console.log('首页可见:', homeVisible);
  console.log('监测页可见:', timerVisible);
  
  if (homeVisible && !timerVisible) {
    console.log('✓ 初始状态正确：只有首页可见');
  } else {
    console.log('✗ 初始状态错误：页面重叠！');
  }
  
  // 点击监测按钮
  await page.click('.nav-tomato');
  await page.waitForTimeout(500);
  
  // 检查切换后的状态
  const homeVisibleAfter = await page.$eval('#home', el => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.opacity !== '0' && style.visibility !== 'hidden';
  });
  
  const timerVisibleAfter = await page.$eval('#timer', el => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.opacity !== '0' && style.visibility !== 'hidden';
  });
  
  console.log('\n切换到监测页后：');
  console.log('首页可见:', homeVisibleAfter);
  console.log('监测页可见:', timerVisibleAfter);
  
  if (!homeVisibleAfter && timerVisibleAfter) {
    console.log('✓ 页面切换正确：只有监测页可见');
  } else {
    console.log('✗ 页面切换错误：页面重叠！');
  }
  
  // 截图保存
  await page.screenshot({ path: 'test-screenshot.png' });
  console.log('\n截图已保存到 test-screenshot.png');
  
  // 保持浏览器打开以便查看
  console.log('\n浏览器将保持打开状态，请手动检查...');
  
})();
