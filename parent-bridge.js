/**
 * 视距佳与护眼小屋父窗口通信桥接
 * 用于在iframe中与父窗口进行数据交换
 */

(function() {
  'use strict';

  // 检查是否在iframe中运行
  const isInIframe = window.self !== window.top;

  if (!isInIframe) {
    console.log('[ParentBridge] 不在iframe中，跳过初始化');
    return;
  }

  console.log('[ParentBridge] 初始化父窗口通信桥接');

  // 监测会话数据
  let sessionData = {
    startTime: null,
    endTime: null,
    duration: 0,
    distanceViolations: 0,
    postureViolations: 0,
    healthScore: 100,
    avgDistance: 0,
    avgTiltAngle: 0,
    photos: []
  };

  // 发送消息给父窗口
  function sendToParent(type, data) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type, data }, '*');
        console.log('[ParentBridge] 发送消息:', type, data);
      }
    } catch (error) {
      console.error('[ParentBridge] 发送消息失败:', error);
    }
  }

  // 页面加载完成通知
  window.addEventListener('load', function() {
    setTimeout(function() {
      sendToParent('VISIONDIST_LOADED', { timestamp: Date.now() });
    }, 100);
  });

  // 监听来自父窗口的消息
  window.addEventListener('message', function(event) {
    const { type, data } = event.data || {};

    switch (type) {
      case 'PARENT_REQUEST_STOP':
        // 父窗口请求停止监测
        console.log('[ParentBridge] 收到停止监测请求');
        endMonitorSession();
        break;

      case 'PARENT_REQUEST_DATA':
        // 父窗口请求当前数据
        sendToParent('VISIONDIST_DATA_UPDATE', sessionData);
        break;
    }
  });

  // 开始监测会话
  window.startMonitorSession = function() {
    sessionData.startTime = new Date().toISOString();
    sessionData.duration = 0;
    sessionData.distanceViolations = 0;
    sessionData.postureViolations = 0;
    sessionData.healthScore = 100;

    sendToParent('VISIONDIST_MONITOR_START', sessionData);
    console.log('[ParentBridge] 监测开始');
  };

  // 结束监测会话
  window.endMonitorSession = function() {
    sessionData.endTime = new Date().toISOString();

    // 计算持续时间（秒）
    if (sessionData.startTime) {
      const start = new Date(sessionData.startTime);
      const end = new Date(sessionData.endTime);
      sessionData.duration = Math.round((end - start) / 1000);
    }

    sendToParent('VISIONDIST_MONITOR_END', sessionData);
    console.log('[ParentBridge] 监测结束', sessionData);
  };

  // 更新监测数据
  window.updateMonitorData = function(data) {
    Object.assign(sessionData, data);
    sendToParent('VISIONDIST_DATA_UPDATE', sessionData);
  };

  // 记录距离违规
  window.recordDistanceViolation = function() {
    sessionData.distanceViolations++;
    sessionData.healthScore = Math.max(0, sessionData.healthScore - 2);
  };

  // 记录姿势违规
  window.recordPostureViolation = function() {
    sessionData.postureViolations++;
    sessionData.healthScore = Math.max(0, sessionData.healthScore - 1);
  };

  // 暴露给全局
  window.VisionDistBridge = {
    sendToParent,
    startMonitorSession: window.startMonitorSession,
    endMonitorSession: window.endMonitorSession,
    updateMonitorData: window.updateMonitorData,
    recordDistanceViolation: window.recordDistanceViolation,
    recordPostureViolation: window.recordPostureViolation,
    getSessionData: function() { return sessionData; }
  };

  console.log('[ParentBridge] 桥接初始化完成');
})();
