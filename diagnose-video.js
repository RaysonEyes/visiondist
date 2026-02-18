// 视频诊断脚本
console.log('=== 视频诊断脚本启动 ===');

function diagnoseVideo() {
  const video = document.getElementById('monitorVideo');
  const canvas = document.getElementById('monitorCanvas');
  const container = document.getElementById('monitorContainer');
  
  console.log('1. 元素检查:');
  console.log('  - video元素:', video ? '存在' : '不存在');
  console.log('  - canvas元素:', canvas ? '存在' : '不存在');
  console.log('  - container元素:', container ? '存在' : '不存在');
  
  if (video) {
    console.log('\n2. video元素属性:');
    console.log('  - srcObject:', video.srcObject ? '已设置' : '未设置');
    console.log('  - videoWidth:', video.videoWidth);
    console.log('  - videoHeight:', video.videoHeight);
    console.log('  - readyState:', video.readyState);
    console.log('  - paused:', video.paused);
    console.log('  - muted:', video.muted);
    console.log('  - autoplay:', video.autoplay);
    
    const style = window.getComputedStyle(video);
    console.log('\n3. video样式:');
    console.log('  - display:', style.display);
    console.log('  - visibility:', style.visibility);
    console.log('  - opacity:', style.opacity);
    console.log('  - width:', style.width);
    console.log('  - height:', style.height);
    console.log('  - position:', style.position);
    console.log('  - z-index:', style.zIndex);
    
    if (video.srcObject) {
      const tracks = video.srcObject.getTracks();
      console.log('\n4. 媒体流信息:');
      console.log('  - tracks数量:', tracks.length);
      tracks.forEach((track, i) => {
        console.log(`  - track ${i}:`, {
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted
        });
      });
    }
  }
  
  if (canvas) {
    console.log('\n5. canvas元素属性:');
    console.log('  - width:', canvas.width);
    console.log('  - height:', canvas.height);
    
    const style = window.getComputedStyle(canvas);
    console.log('  - display:', style.display);
    console.log('  - position:', style.position);
    console.log('  - z-index:', style.zIndex);
  }
  
  if (container) {
    const style = window.getComputedStyle(container);
    console.log('\n6. container样式:');
    console.log('  - display:', style.display);
    console.log('  - classList:', Array.from(container.classList).join(', '));
  }
  
  console.log('\n=== 诊断完成 ===');
}

// 延迟执行以确保页面加载完成
setTimeout(diagnoseVideo, 2000);

// 提供全局函数供手动调用
window.diagnoseVideo = diagnoseVideo;
console.log('提示: 可以在控制台输入 diagnoseVideo() 手动运行诊断');
