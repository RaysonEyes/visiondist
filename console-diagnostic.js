// ==================== 控制台诊断脚本 ====================
// 在 index.html 页面打开控制台 (F12)，粘贴这段代码并回车

console.log('%c=== VisionDist 诊断工具 ===', 'background: #222; color: #4CAF50; font-size: 16px; padding: 10px;');

// 1. 检查 monitor 是否初始化
console.log('\n1️⃣ 检查 PostureMonitor 初始化:');
if (window.postureMonitor) {
    console.log('✅ window.postureMonitor 存在');
    console.log('   - isMonitoring:', window.postureMonitor.isMonitoring);
    console.log('   - video:', window.postureMonitor.video ? '✅' : '❌');
    console.log('   - faceMesh:', window.postureMonitor.faceMesh ? '✅' : '❌');
} else {
    console.log('❌ window.postureMonitor 不存在！monitor.js 可能未加载');
}

// 2. 检查 DOM 元素
console.log('\n2️⃣ 检查 DOM 元素:');
const video = document.getElementById('monitorVideo');
const canvas = document.getElementById('monitorCanvas');
console.log('   - monitorVideo:', video ? '✅' : '❌');
console.log('   - monitorCanvas:', canvas ? '✅' : '❌');

if (video) {
    console.log('   - video.srcObject:', video.srcObject ? '✅ 有视频流' : '❌ 无视频流');
    console.log('   - video.readyState:', video.readyState);
}

// 3. 检查 Face Mesh 库
console.log('\n3️⃣ 检查 MediaPipe 库:');
console.log('   - window.FaceMesh:', typeof window.FaceMesh);
console.log('   - window.Camera:', typeof window.Camera);

// 4. 实时监控 (持续10秒)
console.log('\n4️⃣ 开始实时监控 (10秒)...');
let monitorCount = 0;
const monitorInterval = setInterval(() => {
    monitorCount++;
    
    if (!window.postureMonitor) {
        console.log('❌ postureMonitor 不存在');
        clearInterval(monitorInterval);
        return;
    }
    
    const m = window.postureMonitor;
    console.log(`[${monitorCount}s] 距离: ${m.estimatedDistance.toFixed(1)}cm, 倾斜: ${m.currentTiltAngle.toFixed(1)}°, 监测中: ${m.isMonitoring ? '✅' : '❌'}`);
    
    if (monitorCount >= 10) {
        clearInterval(monitorInterval);
        console.log('\n✅ 监控完成');
        
        // 总结
        console.log('\n📊 诊断总结:');
        if (m.estimatedDistance === 0 && m.isMonitoring) {
            console.log('⚠️ 监测已启动，但距离始终为0 → Face Mesh 未检测到人脸');
            console.log('   可能原因:');
            console.log('   1. 摄像头画面太暗');
            console.log('   2. 人脸不在画面中');
            console.log('   3. Face Mesh 加载失败');
            console.log('   4. 浏览器性能不足');
        } else if (!m.isMonitoring) {
            console.log('⚠️ 监测未启动 → 请点击"开始专注"按钮');
        } else if (m.estimatedDistance > 0) {
            console.log('✅ 一切正常！Face Mesh 正在工作');
        }
    }
}, 1000);

// 5. 手动测试函数
console.log('\n5️⃣ 手动测试函数:');
console.log('   输入以下命令来测试:');
console.log('   - window.postureMonitor.start()     // 启动监测');
console.log('   - window.postureMonitor.stop()      // 停止监测');
console.log('   - window.postureMonitor.getStats()  // 查看统计');
