/**
 * 视距佳 - 情景弹窗系统 v1.0
 * 根据监测情况显示不同的卡通弹窗
 * 配合语音提醒
 */

class PopupManager {
  constructor() {
    // 弹窗状态
    this.isShowing = false;
    this.currentPopup = null;
    this.popupQueue = [];
    this.maxQueueSize = 5; // 最大队列大小
    
    // 弹窗类型配置
    this.popupTypes = {
      // 距离警告弹窗
      distanceWarning: {
        title: '距离提醒',
        icon: '👀',
        mascotMood: 'worried',
        mascotExpression: 'worried',
        bgColor: '#FFF3E0',
        borderColor: '#FF9800',
        animation: 'shake'
      },
      // 姿势警告弹窗
      postureWarning: {
        title: '姿势提醒',
        icon: '🧘',
        mascotMood: 'worried',
        mascotExpression: 'sad',
        bgColor: '#E3F2FD',
        borderColor: '#2196F3',
        animation: 'tilt'
      },
      // 奖励弹窗
      reward: {
        title: '恭喜获得奖励！',
        icon: '🏆',
        mascotMood: 'excited',
        mascotExpression: 'laugh',
        bgColor: '#FFF8E1',
        borderColor: '#FFC107',
        animation: 'bounce'
      },
      // 休息提醒弹窗
      breakReminder: {
        title: '该休息啦',
        icon: '☕',
        mascotMood: 'sleepy',
        mascotExpression: 'sleepy',
        bgColor: '#E8F5E9',
        borderColor: '#4CAF50',
        animation: 'sway'
      },
      // 开始监测弹窗
      startMonitor: {
        title: '开始监测',
        icon: '🚀',
        mascotMood: 'cool',
        mascotExpression: 'cool',
        bgColor: '#E1F5FE',
        borderColor: '#03A9F4',
        animation: 'nod'
      },
      // 结束监测弹窗
      endMonitor: {
        title: '监测完成',
        icon: '✅',
        mascotMood: 'happy',
        mascotExpression: 'smile',
        bgColor: '#F3E5F5',
        borderColor: '#9C27B0',
        animation: 'bounce'
      },
      // 成就解锁弹窗
      achievement: {
        title: '成就解锁！',
        icon: '🎖️',
        mascotMood: 'love',
        mascotExpression: 'love',
        bgColor: '#FCE4EC',
        borderColor: '#E91E63',
        animation: 'heartbeat'
      },
      // 鼓励弹窗
      encourage: {
        title: '加油！',
        icon: '💪',
        mascotMood: 'excited',
        mascotExpression: 'wink',
        bgColor: '#E8EAF6',
        borderColor: '#3F51B5',
        animation: 'jump'
      }
    };
    
    // 初始化
    this.init();
  }
  
  // 初始化
  init() {
    // 创建弹窗容器
    this.createPopupContainer();
    
    console.log('💬 情景弹窗系统初始化完成');
  }
  
  // 创建弹窗容器
  createPopupContainer() {
    if (document.getElementById('scenarioPopupContainer')) return;
    
    const container = document.createElement('div');
    container.id = 'scenarioPopupContainer';
    container.innerHTML = `
      <div class="scenario-popup-overlay"></div>
      <div class="scenario-popup">
        <div class="scenario-popup-header">
          <span class="scenario-popup-icon"></span>
          <span class="scenario-popup-title"></span>
          <button class="scenario-popup-close">×</button>
        </div>
        <div class="scenario-popup-mascot"></div>
        <div class="scenario-popup-message"></div>
        <div class="scenario-popup-actions"></div>
      </div>
    `;
    
    document.body.appendChild(container);
    
    // 绑定关闭事件
    container.querySelector('.scenario-popup-close').addEventListener('click', () => this.hide());
    container.querySelector('.scenario-popup-overlay').addEventListener('click', () => this.hide());
  }
  
  // 显示弹窗
  show(type, options = {}) {
    const config = this.popupTypes[type];
    if (!config) {
      console.error('未知的弹窗类型:', type);
      return;
    }
    
    // 如果正在显示，加入队列（限制队列大小）
    if (this.isShowing) {
      if (this.popupQueue.length < this.maxQueueSize) {
        this.popupQueue.push({ type, options });
      } else {
        console.warn('弹窗队列已满，跳过此弹窗');
      }
      return;
    }
    
    this.isShowing = true;
    this.currentPopup = type;
    
    const container = document.getElementById('scenarioPopupContainer');
    if (!container) {
      console.warn('scenarioPopupContainer 不存在');
      return;
    }
    
    const popup = container.querySelector('.scenario-popup');
    const overlay = container.querySelector('.scenario-popup-overlay');
    
    if (!popup || !overlay) {
      console.warn('弹窗元素不存在，跳过显示');
      this.isShowing = false;
      return;
    }
    
    // 设置弹窗样式
    popup.style.background = config.bgColor;
    popup.style.borderColor = config.borderColor;
    
    // 设置内容
    container.querySelector('.scenario-popup-icon').textContent = config.icon;
    container.querySelector('.scenario-popup-title').textContent = options.title || config.title;
    
    // 设置吉祥物
    const mascotContainer = container.querySelector('.scenario-popup-mascot');
    mascotContainer.innerHTML = this.getMascotSVG(config.mascotExpression, config.mascotMood);
    
    // 设置消息
    const messageEl = container.querySelector('.scenario-popup-message');
    messageEl.textContent = options.message || '';
    
    // 设置按钮
    const actionsEl = container.querySelector('.scenario-popup-actions');
    actionsEl.innerHTML = '';
    
    if (options.actions && options.actions.length > 0) {
      options.actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = `scenario-popup-btn ${action.primary ? 'primary' : 'secondary'}`;
        btn.textContent = action.text;
        btn.onclick = () => {
          if (action.onClick) action.onClick();
          if (action.closeOnClick !== false) this.hide();
        };
        actionsEl.appendChild(btn);
      });
    } else {
      // 默认按钮
      const btn = document.createElement('button');
      btn.className = 'scenario-popup-btn primary';
      btn.textContent = '知道了';
      btn.onclick = () => this.hide();
      actionsEl.appendChild(btn);
    }
    
    // 显示弹窗
    container.classList.add('active');
    popup.classList.add(`anim-${config.animation}`);
    
    // 触发吉祥物响应
    if (window.mascotManager) {
      window.mascotManager.setMood(config.mascotMood);
    }
    
    // 播放语音
    if (options.playVoice !== false && window.voiceReminder) {
      this.playVoiceForType(type, options.voiceStyle);
    }
    
    // 自动关闭
    if (options.autoClose !== false) {
      const duration = options.duration || 5000;
      setTimeout(() => {
        if (this.currentPopup === type) {
          this.hide();
        }
      }, duration);
    }
    
    console.log('💬 显示弹窗:', type);
  }
  
  // 隐藏弹窗
  hide() {
    const container = document.getElementById('scenarioPopupContainer');
    if (!container) return;
    
    container.classList.remove('active');
    
    // 移除动画类
    const popup = container.querySelector('.scenario-popup');
    popup.className = 'scenario-popup';
    
    this.isShowing = false;
    this.currentPopup = null;
    
    // 处理队列中的下一个弹窗
    if (this.popupQueue.length > 0) {
      const next = this.popupQueue.shift();
      setTimeout(() => this.show(next.type, next.options), 300);
    }
  }
  
  // 获取吉祥物SVG
  getMascotSVG(expression, mood) {
    const moodColors = {
      happy: '#5FCFFF',
      excited: '#FFD700',
      worried: '#87CEEB',
      sleepy: '#B0C4DE',
      love: '#FFB6C1',
      cool: '#4169E1',
      shy: '#FFC0CB'
    };
    
    const bodyColor = moodColors[mood] || '#5FCFFF';
    
    // 根据表情设置眼睛和嘴巴
    let leftEye, rightEye, mouth;
    switch (expression) {
      case 'laugh':
        leftEye = `<path d="M35 75 Q40 70 45 75" stroke="#333" stroke-width="3" fill="none"/>`;
        rightEye = `<path d="M55 75 Q60 70 65 75" stroke="#333" stroke-width="3" fill="none"/>`;
        mouth = `<path d="M40 95 Q50 110 60 95" stroke="#333" stroke-width="2" fill="#FF9999"/>`;
        break;
      case 'worried':
        leftEye = `<circle cx="40" cy="75" r="6" fill="#333"/><circle cx="42" cy="73" r="2" fill="white"/>`;
        rightEye = `<circle cx="60" cy="75" r="6" fill="#333"/><circle cx="62" cy="73" r="2" fill="white"/>`;
        mouth = `<path d="M40 100 Q50 95 60 100" stroke="#333" stroke-width="2" fill="none"/>`;
        break;
      case 'sleepy':
        leftEye = `<path d="M35 75 L45 75" stroke="#333" stroke-width="3"/>`;
        rightEye = `<path d="M55 75 L65 75" stroke="#333" stroke-width="3"/>`;
        mouth = `<ellipse cx="50" cy="100" rx="5" ry="3" fill="#333"/>`;
        break;
      case 'love':
        leftEye = `<text x="35" y="80" font-size="16" fill="#FF69B4">♥</text>`;
        rightEye = `<text x="55" y="80" font-size="16" fill="#FF69B4">♥</text>`;
        mouth = `<path d="M42 95 Q50 105 58 95" stroke="#333" stroke-width="2" fill="none"/>`;
        break;
      case 'cool':
        leftEye = `<rect x="32" y="72" width="16" height="6" rx="2" fill="#333"/>`;
        rightEye = `<rect x="52" y="72" width="16" height="6" rx="2" fill="#333"/>`;
        mouth = `<path d="M45 98 L55 98" stroke="#333" stroke-width="2"/>`;
        break;
      case 'wink':
        leftEye = `<circle cx="40" cy="75" r="8" fill="white" stroke="#333" stroke-width="2"/>
                   <circle cx="42" cy="75" r="5" fill="#333"/>
                   <circle cx="44" cy="73" r="2" fill="white"/>`;
        rightEye = `<path d="M55 75 L65 75" stroke="#333" stroke-width="3"/>`;
        mouth = `<path d="M42 95 Q50 105 58 95" stroke="#333" stroke-width="2" fill="none"/>`;
        break;
      case 'sad':
        leftEye = `<circle cx="40" cy="75" r="6" fill="#333"/>
                   <path d="M35 68 Q40 72 45 68" stroke="#333" stroke-width="2" fill="none"/>`;
        rightEye = `<circle cx="60" cy="75" r="6" fill="#333"/>
                    <path d="M55 68 Q60 72 65 68" stroke="#333" stroke-width="2" fill="none"/>`;
        mouth = `<path d="M40 102 Q50 95 60 102" stroke="#333" stroke-width="2" fill="none"/>`;
        break;
      default: // smile
        leftEye = `<circle cx="40" cy="75" r="8" fill="white" stroke="#333" stroke-width="2"/>
                   <circle cx="42" cy="75" r="5" fill="#333"/>
                   <circle cx="44" cy="73" r="2" fill="white"/>`;
        rightEye = `<circle cx="60" cy="75" r="8" fill="white" stroke="#333" stroke-width="2"/>
                    <circle cx="62" cy="75" r="5" fill="#333"/>
                    <circle cx="64" cy="73" r="2" fill="white"/>`;
        mouth = `<path d="M42 95 Q50 105 58 95" stroke="#333" stroke-width="2" fill="none"/>`;
    }
    
    return `
      <svg class="popup-mascot-svg" viewBox="0 0 100 140" width="100" height="140">
        <!-- 触角 -->
        <g class="antenna">
          <line x1="35" y1="30" x2="30" y2="10" stroke="#FFD700" stroke-width="3"/>
          <circle cx="30" cy="8" r="5" fill="#FFD700"/>
          <line x1="65" y1="30" x2="70" y2="10" stroke="#FFD700" stroke-width="3"/>
          <circle cx="70" cy="8" r="5" fill="#FFD700"/>
        </g>
        
        <!-- 身体 -->
        <ellipse cx="50" cy="85" rx="35" ry="45" fill="${bodyColor}"/>
        <ellipse cx="50" cy="90" rx="25" ry="30" fill="#E0F7FF" opacity="0.5"/>
        
        <!-- 腮红 -->
        <ellipse cx="28" cy="85" rx="8" ry="5" fill="#FFB6C1" opacity="0.6"/>
        <ellipse cx="72" cy="85" rx="8" ry="5" fill="#FFB6C1" opacity="0.6"/>
        
        <!-- 眼睛 -->
        ${leftEye}
        ${rightEye}
        
        <!-- 嘴巴 -->
        ${mouth}
        
        <!-- 小手 -->
        <ellipse cx="18" cy="90" rx="8" ry="10" fill="${bodyColor}"/>
        <ellipse cx="82" cy="90" rx="8" ry="10" fill="${bodyColor}"/>
        
        <!-- 小脚 -->
        <ellipse cx="35" cy="128" rx="10" ry="6" fill="${bodyColor}"/>
        <ellipse cx="65" cy="128" rx="10" ry="6" fill="${bodyColor}"/>
      </svg>
    `;
  }
  
  // 根据类型播放语音
  playVoiceForType(type, style) {
    if (!window.voiceReminder) return;
    
    switch (type) {
      case 'distanceWarning':
        window.voiceReminder.playDistanceWarning(style);
        break;
      case 'postureWarning':
        window.voiceReminder.playPostureWarning(style);
        break;
      case 'reward':
        window.voiceReminder.playReward(style);
        break;
      case 'breakReminder':
        window.voiceReminder.playBreakReminder();
        break;
      case 'startMonitor':
        window.voiceReminder.playStartMonitor();
        break;
      case 'endMonitor':
        window.voiceReminder.playEndMonitor();
        break;
      case 'encourage':
        window.voiceReminder.playCustom('加油！你做得很棒，继续保持！');
        break;
    }
  }
  
  // === 便捷接口 ===
  
  // 显示距离警告
  showDistanceWarning(distance, minDistance) {
    this.show('distanceWarning', {
      message: `当前距离 ${distance}cm，建议保持 ${minDistance}cm 以上`,
      duration: 4000
    });
  }
  
  // 显示姿势警告
  showPostureWarning(angle) {
    this.show('postureWarning', {
      message: `头部倾斜 ${angle.toFixed(1)}°，请调整坐姿`,
      duration: 4000
    });
  }
  
  // 显示奖励
  showReward(points, reason) {
    this.show('reward', {
      message: `+${points} 积分\n${reason || '健康用眼达成奖励！'}`,
      duration: 3000
    });
  }
  
  // 显示休息提醒
  showBreakReminder(duration) {
    this.show('breakReminder', {
      message: `已专注 ${duration} 分钟，让眼睛休息一下吧`,
      actions: [
        { text: '休息5分钟', primary: true, onClick: () => console.log('开始休息') },
        { text: '继续专注', onClick: () => console.log('继续专注') }
      ],
      autoClose: false
    });
  }
  
  // 显示开始监测
  showStartMonitor() {
    this.show('startMonitor', {
      message: '监测已开始，我会守护你的眼睛健康~',
      duration: 2500
    });
  }
  
  // 显示结束监测
  showEndMonitor(stats) {
    const message = stats ? 
      `本次监测：偏头${stats.headTiltCount}次，距离过近${stats.distanceCount}次` :
      '监测已结束，记得休息眼睛哦~';
    
    this.show('endMonitor', {
      message: message,
      duration: 3000
    });
  }
  
  // 显示成就
  showAchievement(title, description) {
    this.show('achievement', {
      title: title || '成就解锁！',
      message: description || '恭喜你获得新成就！',
      duration: 4000
    });
  }
  
  // 显示鼓励
  showEncourage(message) {
    this.show('encourage', {
      message: message || '继续保持，你做得很棒！',
      duration: 3000
    });
  }
}

// 全局实例
window.popupManager = new PopupManager();
console.log('💬 PopupManager v1.0 已加载');
