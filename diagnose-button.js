// 按钮点击诊断脚本
console.log('=== 按钮点击诊断 ===');

// 检查函数是否存在
setTimeout(() => {
    console.log('1. 检查函数定义:');
    console.log('  - startFocusing:', typeof startFocusing);
    console.log('  - stopFocusing:', typeof stopFocusing);
    
    console.log('\n2. 检查全局变量:');
    console.log('  - isFocusing:', typeof isFocusing !== 'undefined' ? isFocusing : 'undefined');
    console.log('  - window.postureMonitor:', window.postureMonitor ? '存在' : '不存在');
    
    console.log('\n3. 检查按钮元素:');
    const startBtn = document.querySelector('.start-btn');
    console.log('  - 开始按钮:', startBtn ? '存在' : '不存在');
    if (startBtn) {
        console.log('  - onclick属性:', startBtn.onclick);
        console.log('  - onclick字符串:', startBtn.getAttribute('onclick'));
    }
    
    console.log('\n4. 检查页面元素:');
    console.log('  - timerIdleMode:', document.getElementById('timerIdleMode') ? '存在' : '不存在');
    console.log('  - timerFocusingMode:', document.getElementById('timerFocusingMode') ? '存在' : '不存在');
    console.log('  - monitorContainer:', document.getElementById('monitorContainer') ? '存在' : '不存在');
    
    // 尝试手动调用
    console.log('\n5. 尝试手动调用startFocusing:');
    try {
        if (typeof startFocusing === 'function') {
            console.log('  - 函数存在，可以手动调用: window.startFocusing()');
        }
    } catch (e) {
        console.error('  - 错误:', e);
    }
    
    console.log('\n=== 诊断完成 ===');
    console.log('提示: 如果函数存在但按钮无反应，请在控制台手动输入: startFocusing()');
}, 1000);

// 监听所有错误
window.addEventListener('error', (e) => {
    console.error('捕获到错误:', e.message, e.filename, e.lineno);
});
