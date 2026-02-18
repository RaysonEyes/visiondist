/**
 * 视距佳 - 卡通形象互动系统 v2.1
 * 支持多种造型、表情、心情变化
 * 丰富的动画效果：手部、脚部、眼睛、嘴巴、触角动画
 */

class MascotManager {
  constructor() {
    // 当前状态
    this.currentMood = 'happy';      // happy, excited, worried, sleepy, love, cool, shy
    this.currentOutfit = 'default';  // default, doctor, superhero, student, chef, artist
    this.currentExpression = 'smile'; // smile, laugh, wink, surprised, sad, angry, love

    // 动画状态
    this.isAnimating = false;
    this.clickCount = 0;
    this.lastClickTime = 0;
    this.idleTimer = null;

    // 表情库 - 扩展版
    this.expressions = {
      smile: { leftEye: '◕', rightEye: '◕', mouth: 'ω', blush: true },
      laugh: { leftEye: '＾', rightEye: '＾', mouth: 'D', blush: true },
      wink: { leftEye: '◕', rightEye: '−', mouth: 'ω', blush: true },
      surprised: { leftEye: '◎', rightEye: '◎', mouth: 'O', blush: false },
      sad: { leftEye: '╥', rightEye: '╥', mouth: '︿', blush: false },
      worried: { leftEye: '・', rightEye: '・', mouth: '﹏', blush: false },
      love: { leftEye: '♥', rightEye: '♥', mouth: 'ω', blush: true },
      cool: { leftEye: '▬', rightEye: '▬', mouth: 'ー', blush: false },
      shy: { leftEye: '/', rightEye: '\\', mouth: 'ω', blush: true },
      sleepy: { leftEye: '−', rightEye: '−', mouth: 'o', blush: false },
      angry: { leftEye: '＞', rightEye: '＜', mouth: '皿', blush: false },
      thinking: { leftEye: '◕', rightEye: '◕', mouth: '～', blush: false },
      excited: { leftEye: '★', rightEye: '★', mouth: 'D', blush: true },
      confused: { leftEye: '？', rightEye: '？', mouth: '～', blush: false },
      proud: { leftEye: '◕', rightEye: '◕', mouth: 'v', blush: true },
      nervous: { leftEye: '・', rightEye: '・', mouth: '△', blush: true }
    };
    
    // 造型配置
    this.outfits = {
      default: {
        name: '默认',
        bodyColor: '#5FCFFF',
        accessory: null,
        hat: null
      },
      doctor: {
        name: '小医生',
        bodyColor: '#87CEEB',
        accessory: 'stethoscope',
        hat: 'doctor-cap'
      },
      superhero: {
        name: '超级英雄',
        bodyColor: '#FF6B6B',
        accessory: 'cape',
        hat: 'mask'
      },
      student: {
        name: '小学生',
        bodyColor: '#98D8C8',
        accessory: 'backpack',
        hat: 'cap'
      },
      chef: {
        name: '小厨师',
        bodyColor: '#FFB347',
        accessory: 'spatula',
        hat: 'chef-hat'
      },
      artist: {
        name: '小画家',
        bodyColor: '#DDA0DD',
        accessory: 'palette',
        hat: 'beret'
      },
      astronaut: {
        name: '宇航员',
        bodyColor: '#C0C0C0',
        accessory: 'flag',
        hat: 'helmet'
      },
      pirate: {
        name: '小海盗',
        bodyColor: '#8B4513',
        accessory: 'sword',
        hat: 'pirate-hat'
      }
    };
    
    // 心情配置 - 扩展版
    this.moods = {
      happy: { expression: 'smile', animation: 'bounce', color: '#5FCFFF' },
      excited: { expression: 'excited', animation: 'jump', color: '#FFD700' },
      worried: { expression: 'worried', animation: 'shake', color: '#87CEEB' },
      sleepy: { expression: 'sleepy', animation: 'sway', color: '#B0C4DE' },
      love: { expression: 'love', animation: 'heartbeat', color: '#FFB6C1' },
      cool: { expression: 'cool', animation: 'nod', color: '#4169E1' },
      shy: { expression: 'shy', animation: 'hide', color: '#FFC0CB' },
      angry: { expression: 'angry', animation: 'stomp', color: '#FF6347' },
      thinking: { expression: 'thinking', animation: 'tilt', color: '#9370DB' },
      proud: { expression: 'proud', animation: 'wiggle', color: '#98FB98' },
      nervous: { expression: 'nervous', animation: 'shake', color: '#DDA0DD' },
      confused: { expression: 'confused', animation: 'tilt', color: '#F0E68C' }
    };

    // 动画列表 - 扩展版
    this.animations = [
      // 基础动画
      'bounce', 'jump', 'shake', 'sway', 'heartbeat',
      'nod', 'hide', 'stomp', 'tilt', 'transform',
      'wave', 'spin', 'blink', 'float', 'wiggle',
      // 手部动画
      'clap', 'raise-hands', 'greet',
      // 脚部动画
      'walk',
      // 眼睛动画
      'look-around', 'surprised',
      // 嘴巴动画
      'talk', 'smile',
      // 组合动画
      'dance', 'think', 'excited', 'shy', 'blush'
    ];
    
    // 特效粒子
    this.particles = [];
    
    // 初始化
    this.init();
  }
  
  // 初始化
  init() {
    // 绑定点击事件
    this.bindEvents();

    // 加载保存的状态
    this.loadState();

    // 启动空闲动画
    this.startIdleAnimation();

    console.log('🎭 卡通形象系统初始化完成 v2.0');
  }

  // 启动空闲动画（每隔一段时间随机播放小动作）
  startIdleAnimation() {
    // 清除之前的定时器
    if (this.idleTimer) {
      clearInterval(this.idleTimer);
    }

    // 每15-30秒随机播放一个小动作
    this.idleTimer = setInterval(() => {
      if (!this.isAnimating) {
        this.playRandomIdleAction();
      }
    }, 15000 + Math.random() * 15000);
  }

  // 播放随机空闲动作
  playRandomIdleAction() {
    const idleActions = [
      // 眨眼
      () => { this.playAnimation('blink'); },
      // 眼睛左右看
      () => { this.playAnimation('look-around'); },
      // 轻微摇摆
      () => { this.playAnimation('sway'); },
      // 思考
      () => { this.setExpression('thinking'); this.playAnimation('think'); },
      // 微笑点头
      () => { this.setExpression('smile'); this.playAnimation('nod'); },
      // 眨眼卖萌
      () => { this.setExpression('wink'); this.playAnimation('blink'); },
      // 挥手打招呼
      () => { this.setExpression('smile'); this.playAnimation('wave'); },
      // 酷酷的
      () => { this.setExpression('cool'); this.playAnimation('nod'); },
      // 害羞脸红
      () => { this.setExpression('shy'); this.playAnimation('blush'); },
      // 飘浮
      () => { this.playAnimation('float'); },
      // 触角摆动
      () => { this.playAnimation('excited'); }
    ];

    const randomAction = idleActions[Math.floor(Math.random() * idleActions.length)];
    randomAction();

    // 2秒后恢复默认表情
    setTimeout(() => {
      this.setExpression('smile');
    }, 2000);
  }
  
  // 绑定事件
  bindEvents() {
    // 使用 DOMContentLoaded 确保 DOM 加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.attachEventListeners());
    } else {
      // DOM 已经加载完成
      this.attachEventListeners();
    }
  }
  
  // 附加事件监听器
  attachEventListeners() {
    const mascot = document.querySelector('.mascot-container');
    if (mascot) {
      mascot.addEventListener('click', (e) => this.handleClick(e));
      mascot.addEventListener('touchstart', (e) => this.handleTouch(e));
      console.log('🎭 吉祥物事件已绑定');
    } else {
      console.warn('🎭 未找到 .mascot-container 元素');
    }
  }

  // 处理点击
  handleClick(e) {
    e.preventDefault();

    const now = Date.now();

    // 检测连击
    if (now - this.lastClickTime < 500) {
      this.clickCount++;
    } else {
      this.clickCount = 1;
    }
    this.lastClickTime = now;

    // 根据点击次数触发不同效果
    if (this.clickCount >= 5) {
      this.triggerSpecialEffect();
      this.clickCount = 0;
    } else {
      this.triggerInteraction();
    }

    // 播放互动语音（语音播放时会自动同步显示气泡）
    if (window.voiceReminder) {
      window.voiceReminder.playInteract();
    } else {
      // 如果没有语音系统，则单独显示气泡
      this.showSpeechBubble();
    }
  }
  
  // 处理触摸
  handleTouch(e) {
    // 触摸设备上的特殊处理
    this.handleClick(e);
  }
  
  // 触发普通互动
  triggerInteraction() {
    // 随机选择互动类型（更丰富的反应）
    const interactionType = Math.floor(Math.random() * 10);

    switch (interactionType) {
      case 0:
        // 开心跳跃
        this.setExpression('laugh');
        this.playAnimation('jump');
        this.showParticles('stars');
        break;
      case 1:
        // 害羞躲藏
        this.setExpression('shy');
        this.playAnimation('shy');
        this.playAnimation('blush');
        this.showParticles('hearts');
        break;
      case 2:
        // 眨眼卖萌
        this.setExpression('wink');
        this.playAnimation('blink');
        this.showParticles('stars');
        break;
      case 3:
        // 惊讶反应
        this.setExpression('surprised');
        this.playAnimation('surprised');
        this.showParticles('sparkles');
        break;
      case 4:
        // 爱心表情
        this.setExpression('love');
        this.playAnimation('heartbeat');
        this.showParticles('hearts');
        break;
      case 5:
        // 挥手打招呼
        this.setExpression('smile');
        this.playAnimation('greet');
        this.showParticles('stars');
        break;
      case 6:
        // 开心跳舞
        this.setExpression('excited');
        this.playAnimation('dance');
        this.showParticles('music');
        break;
      case 7:
        // 拍手
        this.setExpression('laugh');
        this.playAnimation('clap');
        this.showParticles('confetti');
        break;
      case 8:
        // 举手欢呼
        this.setExpression('excited');
        this.playAnimation('raise-hands');
        this.showParticles('rainbow');
        break;
      case 9:
        // 思考
        this.setExpression('thinking');
        this.playAnimation('think');
        this.showParticles('sparkles');
        break;
      default:
        // 默认弹跳
        this.setExpression('smile');
        this.playAnimation('bounce');
        this.showParticles('stars');
    }

    // 2秒后恢复默认表情
    setTimeout(() => {
      this.setExpression('smile');
    }, 2000);
  }
  
  // 触发特殊效果（连击5次）
  triggerSpecialEffect() {
    // 随机切换造型
    const outfits = Object.keys(this.outfits);
    const currentIndex = outfits.indexOf(this.currentOutfit);
    const nextIndex = (currentIndex + 1) % outfits.length;
    this.setOutfit(outfits[nextIndex]);
    
    // 播放特殊动画
    this.playAnimation('transform');
    
    // 显示彩虹特效
    this.showParticles('rainbow');
    
    // 播放特殊语音
    if (window.voiceReminder) {
      window.voiceReminder.playCustom(`哇！我变成${this.outfits[outfits[nextIndex]].name}啦！`);
    }
  }
  
  // 设置表情
  setExpression(expression) {
    if (!this.expressions[expression]) return;
    
    this.currentExpression = expression;
    this.updateMascotDisplay();
    
    console.log('🎭 切换表情:', expression);
  }
  
  // 设置造型
  setOutfit(outfit) {
    if (!this.outfits[outfit]) return;
    
    this.currentOutfit = outfit;
    this.updateMascotDisplay();
    this.saveState();
    
    console.log('🎭 切换造型:', outfit);
  }
  
  // 设置心情
  setMood(mood) {
    if (!this.moods[mood]) return;
    
    this.currentMood = mood;
    const moodConfig = this.moods[mood];
    
    this.setExpression(moodConfig.expression);
    this.playAnimation(moodConfig.animation);
    
    console.log('🎭 切换心情:', mood);
  }
  
  // 播放动画
  playAnimation(animation) {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    const mascot = document.querySelector('.mascot-container');
    if (!mascot) return;
    
    // 移除旧动画类
    mascot.classList.remove('anim-bounce', 'anim-jump', 'anim-shake', 'anim-sway', 
                           'anim-heartbeat', 'anim-nod', 'anim-hide', 'anim-stomp',
                           'anim-tilt', 'anim-transform');
    
    // 添加新动画类
    mascot.classList.add(`anim-${animation}`);
    
    // 动画结束后移除
    setTimeout(() => {
      mascot.classList.remove(`anim-${animation}`);
      this.isAnimating = false;
    }, 1000);
  }
  
  // 显示粒子特效
  showParticles(type) {
    const container = document.querySelector('.mascot-container');
    if (!container) return;

    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-container';

    let particleCount, symbols;

    switch (type) {
      case 'rainbow':
        particleCount = 20;
        symbols = ['🌈', '✨', '💫', '⭐', '🎉', '🎊'];
        break;
      case 'hearts':
        particleCount = 12;
        symbols = ['❤️', '💕', '💖', '💗', '💓', '💝'];
        break;
      case 'stars':
        particleCount = 10;
        symbols = ['✨', '⭐', '💫', '🌟', '✦'];
        break;
      case 'sparkles':
        particleCount = 15;
        symbols = ['✨', '💎', '🔮', '💠', '✦'];
        break;
      case 'confetti':
        particleCount = 25;
        symbols = ['🎊', '🎉', '🎈', '🎀', '🎁'];
        break;
      case 'flowers':
        particleCount = 12;
        symbols = ['🌸', '🌺', '🌷', '🌹', '💐', '🌻'];
        break;
      case 'music':
        particleCount = 10;
        symbols = ['🎵', '🎶', '🎼', '♪', '♫'];
        break;
      default:
        particleCount = 10;
        symbols = ['✨', '⭐', '💫'];
    }

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('span');
      particle.className = 'particle';
      particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 0.5}s`;
      particle.style.fontSize = `${12 + Math.random() * 12}px`;
      particleContainer.appendChild(particle);
    }

    container.appendChild(particleContainer);

    // 动画结束后移除
    setTimeout(() => {
      particleContainer.remove();
    }, 2000);
  }
  
  // 更新吉祥物显示
  updateMascotDisplay() {
    const mascotSvg = document.querySelector('.mascot-svg');
    if (!mascotSvg) return;
    
    const outfit = this.outfits[this.currentOutfit];
    const expression = this.expressions[this.currentExpression];
    
    // 更新身体颜色
    const body = mascotSvg.querySelector('.body ellipse');
    if (body && outfit) {
      // 使用渐变色
      body.style.fill = outfit.bodyColor;
    }
    
    // 更新表情（通过CSS类）
    mascotSvg.setAttribute('class', 'mascot-svg expression-' + this.currentExpression + ' outfit-' + this.currentOutfit);
  }
  
  // 保存状态
  saveState() {
    const state = {
      outfit: this.currentOutfit,
      mood: this.currentMood
    };
    localStorage.setItem('mascotState', JSON.stringify(state));
  }
  
  // 加载状态
  loadState() {
    const saved = localStorage.getItem('mascotState');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.outfit) this.currentOutfit = state.outfit;
        if (state.mood) this.currentMood = state.mood;
        this.updateMascotDisplay();
      } catch (e) {
        console.error('加载吉祥物状态失败:', e);
      }
    }
  }
  
  // === 情景响应接口 ===
  
  // 距离警告时
  onDistanceWarning() {
    this.setMood('worried');
    this.showParticles('stars');
    this.showCustomBubble('哎呀！离屏幕太近啦，快退后一点~', 4000);
  }
  
  // 姿势警告时
  onPostureWarning() {
    this.setMood('worried');
    this.playAnimation('shake');
    this.showCustomBubble('注意坐姿！头歪了要调整哦~', 4000);
  }
  
  // 获得奖励时
  onReward() {
    this.setMood('excited');
    this.showParticles('rainbow');
    this.showCustomBubble('太棒啦！你做得很好，继续保持~', 3000);
  }
  
  // 开始监测时
  onStartMonitor() {
    this.setMood('cool');
    this.playAnimation('nod');
    this.showCustomBubble('开始监测！我会守护你的眼睛健康~', 2500);
  }
  
  // 结束监测时
  onEndMonitor() {
    this.setMood('happy');
    this.playAnimation('bounce');
    this.showCustomBubble('监测结束！记得让眼睛休息一下哦~', 3000);
  }
  
  // 休息提醒时
  onBreakReminder() {
    this.setMood('sleepy');
    this.playAnimation('sway');
    this.showCustomBubble('该休息啦~让眼睛放松一下吧~', 4000);
  }
  
  // 恢复正常时
  onNormal() {
    this.setMood('happy');
    this.setExpression('smile');
  }
  
  // === 文字气泡系统 ===
  
  // 根据当前表情获取对应的对话文本
  getDialogueForExpression() {
    const dialogues = {
      smile: [
        '嗨！今天也要好好保护眼睛哦~',
        '你好呀！我会陪着你一起护眼的！',
        '开心！让我们一起保持健康用眼习惯吧~',
        '嘿嘿，记得保持正确的坐姿哦！'
      ],
      laugh: [
        '哈哈哈！你做得太棒啦！',
        '太开心了！你是护眼小能手！',
        '哇哦！继续保持这个好习惯！',
        '耶！你真是我见过最棒的小伙伴！'
      ],
      wink: [
        '嘿嘿，我们之间的小秘密~',
        '悄悄告诉你，坚持就是胜利哦！',
        '眨眨眼，你懂的~保持距离很重要！',
        '小声说，你今天表现超级好！'
      ],
      surprised: [
        '哇！发生什么事了？',
        '咦？你的姿势好像不太对哦！',
        '天哪！距离是不是太近了？',
        '哎呀！快调整一下吧！'
      ],
      sad: [
        '呜呜...你的眼睛会不舒服的...',
        '好难过...请保护好你的眼睛好吗？',
        '唉...这样对眼睛不好呢...',
        '心疼...快调整姿势吧...'
      ],
      worried: [
        '有点担心你的眼睛呢...',
        '这样下去可不行哦，快调整一下！',
        '我很担心你...能不能离远一点？',
        '请注意！这个距离对眼睛不好！'
      ],
      love: [
        '爱你哦！记得保护眼睛~',
        '么么哒！你是最棒的！',
        '超喜欢你！继续保持好习惯！',
        '❤️ 你的健康是我最关心的！'
      ],
      cool: [
        '酷！就是这样保持下去！',
        '帅气！你的姿势很标准！',
        '完美！这才是正确的用眼方式！',
        '赞！你是护眼达人！'
      ],
      shy: [
        '不好意思...能请你调整一下姿势吗？',
        '那个...距离好像有点近呢...',
        '嗯...我有点害羞，但还是要提醒你哦...',
        '羞羞...你能坐直一点吗？'
      ],
      sleepy: [
        '好困啊...你是不是也该休息了？',
        '哈欠~眼睛累了就休息一下吧...',
        '困困的...让眼睛放松一下吧...',
        '打瞌睡了...该休息啦...'
      ],
      angry: [
        '生气了！你怎么又凑这么近！',
        '不行不行！这样对眼睛太不好了！',
        '哼！说了多少次要保持距离！',
        '真是的！快点调整姿势！'
      ],
      thinking: [
        '嗯...让我想想怎么帮你...',
        '思考中...你的姿势需要调整哦...',
        '想一想...这个距离合适吗？',
        '琢磨琢磨...要不要提醒你呢...'
      ]
    };
    
    const expressionDialogues = dialogues[this.currentExpression] || dialogues.smile;
    return expressionDialogues[Math.floor(Math.random() * expressionDialogues.length)];
  }
  
  // 显示文字气泡
  showSpeechBubble() {
    // 移除已存在的气泡
    const existingBubble = document.querySelector('.speech-bubble');
    if (existingBubble) {
      existingBubble.remove();
    }
    
    const container = document.querySelector('.mascot-container');
    if (!container) return;
    
    // 获取对应表情的对话文本
    const text = this.getDialogueForExpression();
    
    // 创建气泡元素
    const bubble = document.createElement('div');
    bubble.className = 'speech-bubble';
    bubble.innerHTML = `
      <div class="speech-bubble-content">${text}</div>
      <div class="speech-bubble-tail"></div>
    `;
    
    container.appendChild(bubble);
    
    // 添加显示动画
    setTimeout(() => {
      bubble.classList.add('show');
    }, 10);
    
    // 3秒后自动隐藏
    setTimeout(() => {
      bubble.classList.remove('show');
      setTimeout(() => {
        bubble.remove();
      }, 300);
    }, 3000);

    console.log('💬 显示文字气泡:', text);
  }

  // 显示自定义文字气泡
  showCustomBubble(text, duration = 3000) {
    const existingBubble = document.querySelector('.speech-bubble');
    if (existingBubble) {
      existingBubble.remove();
    }

    const container = document.querySelector('.mascot-container');
    if (!container) return;

    const bubble = document.createElement('div');
    bubble.className = 'speech-bubble';
    bubble.innerHTML = `
      <div class="speech-bubble-content">${text}</div>
      <div class="speech-bubble-tail"></div>
    `;

    container.appendChild(bubble);

    setTimeout(() => {
      bubble.classList.add('show');
    }, 10);

    setTimeout(() => {
      bubble.classList.remove('show');
      setTimeout(() => {
        bubble.remove();
      }, 300);
    }, duration);
  }

  // === 语音同步气泡方法 ===

  // 显示与语音同步的气泡（不自动隐藏，由语音结束时调用 hideSyncBubble）
  showSyncBubble(text) {
    const existingBubble = document.querySelector('.speech-bubble');
    if (existingBubble) {
      existingBubble.remove();
    }

    const container = document.querySelector('.mascot-container');
    if (!container) return;

    const bubble = document.createElement('div');
    bubble.className = 'speech-bubble sync-bubble';
    bubble.innerHTML = `
      <div class="speech-bubble-content">${text}</div>
      <div class="speech-bubble-tail"></div>
    `;

    container.appendChild(bubble);

    setTimeout(() => {
      bubble.classList.add('show');
    }, 10);

    console.log('💬 显示同步气泡:', text);
  }

  // 隐藏与语音同步的气泡
  hideSyncBubble() {
    const bubble = document.querySelector('.speech-bubble.sync-bubble');
    if (bubble) {
      bubble.classList.remove('show');
      setTimeout(() => {
        bubble.remove();
      }, 300);
      console.log('💬 隐藏同步气泡');
    }
  }
}

// 全局实例
window.mascotManager = new MascotManager();
console.log('🎭 MascotManager v2.1 已加载 - 支持丰富的手脚和表情动画');
