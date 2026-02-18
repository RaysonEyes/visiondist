/**
 * VisionDist 护眼监测模块 v4.0
 * 移植自 Next.js PWA 版本，包含完整功能：
 * - 摄像头调取与面部检测
 * - 距离和姿势估算
 * - 语音提醒（自适应文案和音调）
 * - 正激励系统（积分/理想距离时长/庆祝动画）
 * - 违规记录系统（自动拍照/保留最差记录）
 * - 设置系统（LocalStorage 持久化）
 */

// ==================== 设置类型定义 ====================
const DEFAULT_SETTINGS = {
  idealDistance: 50,      // 理想距离 (cm)
  minDistance: 35,        // 最低距离 (cm)
  warningInterval: 5,     // 报警间隔 (秒)
  enablePositiveReward: true,  // 启用正激励
  maxAngle: 15,           // 最大倾斜角度 (度)
  calibrationFactor: 1.0, // 距离校准系数
  isCalibrated: false,    // 是否已校准
};

const DEFAULT_REWARD_STATS = {
  totalPoints: 0,         // 累计积分
  totalIdealTime: 0,      // 累计保持理想距离时长(秒)
  currentStreak: 0,       // 当前连续保持理想距离时长(秒)
  lastCelebrationAt: 0,
  lastPointsAt: 0,
};

const STORAGE_KEYS = {
  DISTANCE_SETTINGS: 'visiondist_settings',
  REWARD_STATS: 'visiondist_rewards',
};

// 违规记录限制
const MAX_VIOLATION_RECORDS = 3;

// ==================== 主类 ====================
class PostureMonitor {
  constructor() {
    // === 状态 ===
    this.isMonitoring = false;
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.faceMesh = null;
    
    // === 面部数据 ===
    this.currentFaceWidth = 0;
    this.currentTiltAngle = 0;
    this.estimatedDistance = 0;
    this.landmarks = {
      faceBox: null,
      leftEye: null,
      rightEye: null,
      noseTip: null,
    };
    
    // === 设置（从 localStorage 加载） ===
    this.settings = this.loadSettings();
    this.rewardStats = this.loadRewardStats();
    
    // === 统计数据 ===
    this.stats = {
      headTiltCount: 0,
      distanceCount: 0,
      maxTilt: 0,
      minDistance: 999,
      screenshots: []  // 添加截图数组
    };
    
    // === 违规记录 ===
    this.violationRecords = [];
    
    // === 违规时长追踪（用于自适应语音） ===
    this.violationDuration = 0;
    this.violationStartTime = null;
    this.wasViolating = false;
    
    // === 语音控制 ===
    this.lastSpeakTime = 0;
    this.isSpeaking = false;
    
    // === 警告控制 ===
    this.lastWarningTime = 0;
    
    // === 离开画面管理 ===
    this.faceLeftTime = null;           // 离开画面的时间戳
    this.isPaused = false;              // 是否已暂停
    this.pauseTimeout = null;           // 自动终止的定时器
    this.awayTimeout = this.loadAwayTimeout(); // 离开自动结束时长（毫秒）
    this.awayDurationInterval = null;   // 离开时长更新定时器
    
    // === 调试 ===
    this.debugMode = true;
  }
  
  // 加载离开时长设置
  loadAwayTimeout() {
    try {
      const saved = localStorage.getItem('awayTimeout');
      if (saved) {
        const parsed = parseInt(saved);
        if (!isNaN(parsed) && parsed > 0) {
          return parsed * 60 * 1000; // 转换为毫秒
        }
      }
    } catch (e) {
      console.error('加载离开时长设置失败:', e);
    }
    return 5 * 60 * 1000; // 默认5分钟
  }
  
  // ==================== 设置管理 ====================
  loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DISTANCE_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        // 验证解析后的数据是对象且包含有效值
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          // 验证关键字段的类型
          const validated = { ...DEFAULT_SETTINGS };
          if (typeof parsed.idealDistance === 'number' && parsed.idealDistance > 0) {
            validated.idealDistance = parsed.idealDistance;
          }
          if (typeof parsed.minDistance === 'number' && parsed.minDistance > 0) {
            validated.minDistance = parsed.minDistance;
          }
          if (typeof parsed.warningInterval === 'number' && parsed.warningInterval > 0) {
            validated.warningInterval = parsed.warningInterval;
          }
          if (typeof parsed.enablePositiveReward === 'boolean') {
            validated.enablePositiveReward = parsed.enablePositiveReward;
          }
          if (typeof parsed.maxAngle === 'number' && parsed.maxAngle > 0) {
            validated.maxAngle = parsed.maxAngle;
          }
          if (typeof parsed.calibrationFactor === 'number' && parsed.calibrationFactor > 0) {
            validated.calibrationFactor = parsed.calibrationFactor;
          }
          if (typeof parsed.isCalibrated === 'boolean') {
            validated.isCalibrated = parsed.isCalibrated;
          }
          return validated;
        }
      }
    } catch (e) {
      console.error('加载设置失败:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }
  
  saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEYS.DISTANCE_SETTINGS, JSON.stringify(this.settings));
    } catch (e) {
      console.error('保存设置失败:', e);
    }
  }
  
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    console.log('设置已更新:', this.settings);
  }
  
  calibrateDistance(actualDistanceCM) {
    if (!this.estimatedDistance || this.estimatedDistance === 0) {
      console.error('校准失败：无法检测到人脸');
      return false;
    }
    
    const calculatedDistance = this.estimatedDistance / this.settings.calibrationFactor;
    const newCalibrationFactor = actualDistanceCM / calculatedDistance;
    
    this.updateSettings({
      calibrationFactor: newCalibrationFactor,
      isCalibrated: true
    });
    
    console.log('距离校准完成:', {
      actualDistance: actualDistanceCM,
      calculatedDistance: calculatedDistance.toFixed(1),
      calibrationFactor: newCalibrationFactor.toFixed(3)
    });
    
    return true;
  }
  
  resetCalibration() {
    this.updateSettings({
      calibrationFactor: 1.0,
      isCalibrated: false
    });
    console.log('校准已重置');
  }
  
  loadRewardStats() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REWARD_STATS);
      if (saved) {
        return { ...DEFAULT_REWARD_STATS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('加载奖励统计失败:', e);
    }
    return { ...DEFAULT_REWARD_STATS };
  }
  
  saveRewardStats() {
    try {
      localStorage.setItem(STORAGE_KEYS.REWARD_STATS, JSON.stringify(this.rewardStats));
    } catch (e) {
      console.error('保存奖励统计失败:', e);
    }
  }
  
  addPoints(points) {
    this.rewardStats.totalPoints += points;
    this.saveRewardStats();
    this.updateRewardUI();
  }
  
  incrementIdealTime(seconds = 1) {
    this.rewardStats.totalIdealTime += seconds;
    this.rewardStats.currentStreak += seconds;
    this.saveRewardStats();
    this.updateRewardUI();
  }
  
  resetStreak() {
    this.rewardStats.currentStreak = 0;
    this.saveRewardStats();
    this.updateRewardUI();
  }
  
  // ==================== 摄像头初始化 ====================
  async initCamera() {
    try {
      console.log('正在初始化摄像头...');
      this.updateCameraStatus('初始化中...', false);
      
      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('浏览器不支持 getUserMedia');
        this.updateStatusUI('camera-error', '浏览器不支持摄像头');
        this.updateCameraStatus('浏览器不支持', true);
        alert('您的浏览器不支持摄像头功能，请使用Chrome、Edge或Safari浏览器');
        return false;
      }
      
      // 先获取video元素引用
      this.video = document.getElementById('monitorVideo');
      if (!this.video) {
        console.error('未找到video元素');
        this.updateCameraStatus('元素加载失败', true);
        alert('页面元素加载异常，请刷新页面重试');
        return false;
      }
      
      // 请求摄像头权限和流
      console.log('请求摄像头权限...');
      this.updateCameraStatus('请求权限中...', false);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, min: 480 },
          height: { ideal: 480, min: 360 },
          facingMode: 'user'
        },
        audio: false
      });
      
      console.log('摄像头权限已获取，设置视频流...');
      this.updateCameraStatus('加载视频流...', false);
      this.video.srcObject = stream;
      
      // 等待视频元数据加载并播放
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('视频加载超时'));
        }, 10000);
        
        this.video.onloadedmetadata = async () => {
          clearTimeout(timeout);
          try {
            await this.video.play();
            console.log('摄像头视频播放成功');
            this.updateCameraStatus('摄像头就绪', false);
            resolve();
          } catch (playError) {
            console.error('视频播放失败:', playError);
            this.updateCameraStatus('播放失败', true);
            reject(playError);
          }
        };
        
        this.video.onerror = (e) => {
          clearTimeout(timeout);
          console.error('视频加载错误:', e);
          this.updateCameraStatus('加载错误', true);
          reject(new Error('视频加载失败'));
        };
      });
      
      // 初始化canvas
      this.canvas = document.getElementById('monitorCanvas');
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
        // 设置canvas尺寸与video匹配
        this.canvas.width = this.video.videoWidth || 640;
        this.canvas.height = this.video.videoHeight || 480;
        console.log('Canvas初始化成功', {
          width: this.canvas.width,
          height: this.canvas.height
        });
      }
      
      console.log('摄像头初始化完成', {
        videoWidth: this.video.videoWidth,
        videoHeight: this.video.videoHeight,
        videoSrc: this.video.srcObject ? '已设置' : '未设置'
      });
      return true;
      
    } catch (error) {
      console.error('摄像头初始化失败:', error);
      
      let errorMsg = '摄像头打开失败';
      let detailMsg = '';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMsg = '摄像头权限被拒绝';
        detailMsg = '请点击地址栏左侧的图标，允许访问摄像头';
        this.updateCameraStatus('权限被拒绝', true);
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMsg = '未找到摄像头设备';
        detailMsg = '请确保您的设备有摄像头并已正确连接';
        this.updateCameraStatus('未找到设备', true);
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMsg = '摄像头被其他应用占用';
        detailMsg = '请关闭其他正在使用摄像头的应用';
        this.updateCameraStatus('设备被占用', true);
      } else if (error.name === 'OverconstrainedError') {
        errorMsg = '摄像头不支持请求的配置';
        detailMsg = '您的摄像头可能不支持所需的分辨率';
        this.updateCameraStatus('配置不支持', true);
      } else {
        detailMsg = error.message || '未知错误';
        this.updateCameraStatus('初始化失败', true);
      }
      
      this.updateStatusUI('camera-error', errorMsg);
      alert(`${errorMsg}\n\n${detailMsg}`);
      
      return false;
    }
  }
  
  updateCameraStatus(text, isError = false) {
    const statusText = document.querySelector('.status-text');
    const statusDot = document.querySelector('.status-dot');
    
    if (statusText) {
      statusText.textContent = text;
    }
    
    if (statusDot) {
      if (isError) {
        statusDot.classList.add('error');
      } else {
        statusDot.classList.remove('error');
      }
    }
  }
  
  // ==================== Face Mesh 初始化 ====================
  async initFaceMesh() {
    console.log('正在加载 Face Mesh...');
    
    return new Promise((resolve, reject) => {
      try {
        if (!window.FaceMesh) {
          reject(new Error('FaceMesh 未加载，请检查 CDN 脚本'));
          return;
        }
        
        this.faceMesh = new FaceMesh({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
          }
        });
        
        this.faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        
        this.faceMesh.onResults((results) => this.onFaceResults(results));
        
        console.log('Face Mesh 加载成功');
        resolve(true);
      } catch (error) {
        console.error('Face Mesh 加载失败:', error);
        reject(error);
      }
    });
  }
  
  // ==================== 面部检测结果处理 ====================
  onFaceResults(results) {
    if (!this.isMonitoring) return;
    
    // 清空画布
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const lm = results.multiFaceLandmarks[0];
      
      this.handleFaceReturn();
      
      this.estimatedDistance = this.estimateDistanceFromPupils(lm);
      this.currentTiltAngle = this.calculateTiltAngle(lm);
      this.extractLandmarks(lm);
      this.updateRealTimeDisplay();
      this.checkViolations();
      this.drawFaceOverlay();
      
    } else {
      this.handleFaceLeft();
      this.estimatedDistance = 0;
      this.landmarks = { faceBox: null, leftEye: null, rightEye: null, noseTip: null };
      this.updateRealTimeDisplay();
    }
  }
  
  // === 基于瞳距估算距离（与 Next.js 版本一致） ===
  estimateDistanceFromPupils(lm) {
    const LEFT_EYE_CENTER = 33;
    const RIGHT_EYE_CENTER = 263;
    
    const leftEye = lm[LEFT_EYE_CENTER];
    const rightEye = lm[RIGHT_EYE_CENTER];
    
    const pupilDistNormalized = Math.sqrt(
      Math.pow(rightEye.x - leftEye.x, 2) + 
      Math.pow(rightEye.y - leftEye.y, 2)
    );
    
    const AVERAGE_PUPIL_DISTANCE_MM = 63;
    const FOCAL_LENGTH_NORMALIZED = 1.2;
    
    const distanceMM = (AVERAGE_PUPIL_DISTANCE_MM * FOCAL_LENGTH_NORMALIZED) / pupilDistNormalized;
    const distanceCM = distanceMM / 10;
    
    return distanceCM * this.settings.calibrationFactor;
  }
  
  // === 计算头部倾斜角度 ===
  calculateTiltAngle(lm) {
    const leftEye = lm[33];
    const rightEye = lm[263];
    
    const eyeDy = leftEye.y - rightEye.y;
    const eyeDx = Math.abs(leftEye.x - rightEye.x);
    const tiltRad = Math.atan2(eyeDy, eyeDx);
    return tiltRad * (180 / Math.PI);
  }
  
  // === 提取关键点 ===
  extractLandmarks(lm) {
    const topHead = lm[10];
    const chin = lm[152];
    const leftCheek = lm[234];
    const rightCheek = lm[454];
    const leftEye = lm[33];
    const rightEye = lm[263];
    const noseTip = lm[1];
    
    const minX = Math.min(leftCheek.x, rightCheek.x);
    const maxX = Math.max(leftCheek.x, rightCheek.x);
    const minY = topHead.y;
    const maxY = chin.y;
    const padding = 0.03;
    
    this.landmarks = {
      faceBox: {
        x: Math.max(0, minX - padding),
        y: Math.max(0, minY - padding),
        width: Math.min(1, (maxX - minX) + padding * 2),
        height: Math.min(1, (maxY - minY) + padding * 2),
      },
      leftEye: { x: leftEye.x, y: leftEye.y },
      rightEye: { x: rightEye.x, y: rightEye.y },
      noseTip: { x: noseTip.x, y: noseTip.y },
    };
  }
  
  // ==================== 离开画面管理 ====================
  handleFaceLeft() {
    if (!this.faceLeftTime) {
      this.faceLeftTime = Date.now();
      const timeoutMinutes = Math.floor(this.awayTimeout / 60000);
      console.log(`⚠️ 检测到人脸离开画面，${timeoutMinutes}分钟后将自动结束`);
      
      // 显示离开提示UI
      this.showAwayNotification();
      
      // 清理可能存在的旧定时器，防止泄漏
      if (this.pauseTimeout) {
        clearTimeout(this.pauseTimeout);
      }
      this.pauseTimeout = setTimeout(() => {
        console.log(`❌ 离开超过${timeoutMinutes}分钟，终止监测`);
        this.terminateSession();
      }, this.awayTimeout);
      
      // 启动离开时长更新
      if (this.awayDurationInterval) {
        clearInterval(this.awayDurationInterval);
      }
      this.awayDurationInterval = setInterval(() => {
        this.updateAwayDuration();
      }, 1000);
    }
  }
  
  handleFaceReturn() {
    if (this.faceLeftTime) {
      const awayDuration = Date.now() - this.faceLeftTime;
      console.log(`✅ 人脸返回画面，离开时长: ${Math.floor(awayDuration / 1000)}秒`);
      
      if (this.pauseTimeout) {
        clearTimeout(this.pauseTimeout);
        this.pauseTimeout = null;
      }
      
      if (this.awayDurationInterval) {
        clearInterval(this.awayDurationInterval);
        this.awayDurationInterval = null;
      }
      
      // 隐藏离开提示UI
      this.hideAwayNotification();
      
      this.faceLeftTime = null;
      this.isPaused = false;
    }
  }
  
  // 显示离开提示
  showAwayNotification() {
    const panel = document.getElementById('awayNotificationPanel');
    if (panel) {
      panel.style.display = 'flex';
      setTimeout(() => {
        panel.classList.add('show');
      }, 10);
    }
  }
  
  // 隐藏离开提示
  hideAwayNotification() {
    const panel = document.getElementById('awayNotificationPanel');
    if (panel) {
      panel.classList.remove('show');
      setTimeout(() => {
        panel.style.display = 'none';
      }, 300);
    }
  }
  
  // 更新离开时长显示
  updateAwayDuration() {
    if (!this.faceLeftTime) return;
    
    const awaySeconds = Math.floor((Date.now() - this.faceLeftTime) / 1000);
    const awayMinutes = Math.floor(awaySeconds / 60);
    const remainingSeconds = awaySeconds % 60;
    
    // 更新已离开时长
    const durationEl = document.getElementById('awayDuration');
    if (durationEl) {
      if (awayMinutes > 0) {
        durationEl.textContent = `${awayMinutes}分${remainingSeconds}秒`;
      } else {
        durationEl.textContent = `${awaySeconds}秒`;
      }
    }
    
    // 更新倒计时（使用配置的时长）
    const totalSeconds = Math.floor(this.awayTimeout / 1000);
    const remainingTime = totalSeconds - awaySeconds;
    if (remainingTime > 0) {
      const countdownMinutes = Math.floor(remainingTime / 60);
      const countdownSeconds = remainingTime % 60;
      const countdownEl = document.getElementById('awayCountdown');
      if (countdownEl) {
        countdownEl.textContent = `${countdownMinutes}:${countdownSeconds.toString().padStart(2, '0')}`;
        
        // 最后30秒变红色警告
        if (remainingTime <= 30) {
          countdownEl.classList.add('warning');
        } else {
          countdownEl.classList.remove('warning');
        }
      }
    }
  }
  
  terminateSession() {
    console.log('📊 生成本次监测数据...');
    
    if (typeof window !== 'undefined' && window.focusComplete) {
      window.focusComplete();
    }
    
    this.stop();
  }
  
  // ==================== 违规检测 ====================
  checkViolations() {
    const isActuallyTooClose = this.estimatedDistance > 0 && this.estimatedDistance < this.settings.minDistance;
    const isBadPosture = Math.abs(this.currentTiltAngle) > (this.settings.maxAngle || 15);
    const isAtIdealDistance = this.estimatedDistance >= this.settings.idealDistance && this.estimatedDistance > 0;
    const isViolating = isActuallyTooClose || isBadPosture;
    
    const now = Date.now();
    
    // === 违规时长追踪 ===
    if (isViolating) {
      if (!this.violationStartTime) {
        this.violationStartTime = now;
      }
      this.violationDuration = Math.floor((now - this.violationStartTime) / 1000);
      this.wasViolating = true;
      
      // 中断理想距离连续时间
      if (this.rewardStats.currentStreak > 0) {
        this.resetStreak();
      }
      
    } else {
      // 从违规中恢复
      if (this.wasViolating && this.violationDuration > 5 && this.settings.enablePositiveReward) {
        // 纠正姿势奖励
        this.addPoints(1);
        this.showInstantReward('太棒了！你坐正了！+1积分');
        this.speak('太棒了！你坐正了！奖励1积分！', { pitch: 1.4, rate: 1.2 });
      }
      this.wasViolating = false;
      this.violationStartTime = null;
      this.violationDuration = 0;
    }
    
    // === 正激励：理想距离累计 ===
    if (isAtIdealDistance && !isViolating && this.settings.enablePositiveReward) {
      this.incrementIdealTime(1);
      
      // 每60秒庆祝
      if (this.rewardStats.currentStreak > 0 && this.rewardStats.currentStreak % 60 === 0) {
        const minutes = Math.floor(this.rewardStats.currentStreak / 60);
        this.showCelebration(minutes);
      }
      
      // 每30分钟奖励10积分
      if (this.rewardStats.totalIdealTime > 0 && this.rewardStats.totalIdealTime % 1800 === 0) {
        this.addPoints(10);
        this.showPointsReward(10);
      }
    }
    
    // === 更新状态 UI ===
    this.updateStatusUI('distance', isActuallyTooClose ? 'warning' : (isAtIdealDistance ? 'ideal' : 'normal'));
    this.updateStatusUI('posture', isBadPosture ? 'warning' : 'normal');
    
    // === 语音提醒 ===
    if (isViolating) {
      this.speakViolationWarning(isActuallyTooClose, isBadPosture);
    }
    
    // === 记录违规并拍照 ===
    if (isViolating && (now - this.lastWarningTime > this.settings.warningInterval * 1000)) {
      this.lastWarningTime = now;
      
      if (isActuallyTooClose) {
        this.stats.distanceCount++;
        this.stats.minDistance = Math.min(this.stats.minDistance, this.estimatedDistance);
        this.captureViolation('distance', this.estimatedDistance);
      }
      
      if (isBadPosture) {
        this.stats.headTiltCount++;
        this.stats.maxTilt = Math.max(this.stats.maxTilt, Math.abs(this.currentTiltAngle));
        this.captureViolation('posture', Math.abs(this.currentTiltAngle));
      }
      
      this.updateStatsUI();
    }
  }
  
  // ==================== 语音系统 ====================
  speakViolationWarning(isTooClose, isBadPosture) {
    const now = Date.now();
    if (now - this.lastSpeakTime < this.settings.warningInterval * 1000) return;
    
    // 自适应文案
    const tooCloseTexts = [
      "小朋友，太近啦~",           // < 5s (卡通)
      "请退后一点哦，保持距离。",   // 5-15s (正常)
      "请立刻调整距离！"           // > 15s (严厉)
    ];
    
    const badPostureTexts = [
      "小朋友，头歪啦~",           // < 5s (卡通)
      "请坐正哦，头要摆正。",       // 5-15s (正常)
      "注意！请立刻把头摆正！"     // > 15s (严厉)
    ];
    
    const texts = isTooClose ? tooCloseTexts : badPostureTexts;
    
    // 根据时长选择等级
    let level = 0;
    if (this.violationDuration > 15) level = 2;
    else if (this.violationDuration > 5) level = 1;
    
    // 设置音效参数
    let pitch = 1.4, rate = 1.1;  // 卡通/高音
    if (level === 1) {
      pitch = 1.0; rate = 1.0;    // 正常
    } else if (level === 2) {
      pitch = 0.8; rate = 0.9;    // 严厉
    }
    
    this.speak(texts[level], { pitch, rate });
  }
  
  speak(text, options = {}) {
    if (!("speechSynthesis" in window)) return;
    
    const now = Date.now();
    if (now - this.lastSpeakTime < 2000) return;  // 基础冷却
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // 寻找最佳中文声音
    const voices = window.speechSynthesis.getVoices();
    let bestVoice = voices.find(v => v.lang.includes("zh") && v.name.includes("Google"));
    if (!bestVoice) {
      bestVoice = voices.find(v => v.lang.includes("zh") && (v.name.includes("Microsoft") || v.name.includes("Natural")));
    }
    if (!bestVoice) {
      bestVoice = voices.find(v => v.lang.includes("zh"));
    }
    
    if (bestVoice) {
      utterance.voice = bestVoice;
    }
    
    utterance.lang = "zh-CN";
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.2;
    utterance.volume = options.volume || 1.0;
    
    utterance.onstart = () => { this.isSpeaking = true; };
    utterance.onend = () => { this.isSpeaking = false; };
    utterance.onerror = (e) => {
      console.error("语音播放错误:", e);
      this.isSpeaking = false;
    };
    
    window.speechSynthesis.speak(utterance);
    this.lastSpeakTime = now;
  }
  
  // ==================== 违规拍照 ====================
  captureViolation(type, value) {
    if (!this.video) return;
    
    // 检查视频是否准备就绪
    if (this.video.readyState < 2) {
      console.warn('视频未就绪，跳过截图');
      return;
    }
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = this.video.videoWidth || 640;
      canvas.height = this.video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('无法获取 canvas context');
        return;
      }
      
      ctx.drawImage(this.video, 0, 0);
      
      const photo = canvas.toDataURL('image/jpeg', 0.7);
      
      const record = {
        type,
        value,
        timestamp: new Date(),
        photo,
      };
      
      this.violationRecords.push(record);
      this.violationRecords.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      // 限制记录数量，防止内存泄漏
      if (this.violationRecords.length > MAX_VIOLATION_RECORDS) {
        this.violationRecords = this.violationRecords.slice(0, MAX_VIOLATION_RECORDS);
      }
      
      this.updateViolationRecordsUI();
      console.log(`违规记录: ${type} = ${value.toFixed(1)}`);
      
    } catch (e) {
      console.error('拍照失败:', e);
    }
  }
  
  // ==================== 绘制面部标记 ====================
  drawFaceOverlay() {
    if (!this.ctx || !this.canvas || !this.landmarks.faceBox) return;
    
    const w = this.canvas.width;
    const h = this.canvas.height;
    const lm = this.landmarks;
    const isViolating = (this.estimatedDistance > 0 && this.estimatedDistance < this.settings.minDistance) 
                       || Math.abs(this.currentTiltAngle) > (this.settings.maxAngle || 15);
    const isBadPosture = Math.abs(this.currentTiltAngle) > (this.settings.maxAngle || 15);
    const isActuallyTooClose = this.estimatedDistance > 0 && this.estimatedDistance < this.settings.minDistance;
    
    // 面部框
    const box = lm.faceBox;
    const boxX = box.x * w;
    const boxY = box.y * h;
    const boxW = box.width * w;
    const boxH = box.height * h;
    
    this.ctx.strokeStyle = isViolating ? "#EF4444" : "#4CAF50";
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([]);
    this.ctx.strokeRect(boxX, boxY, boxW, boxH);
    
    // 角标
    const cornerLen = Math.min(boxW, boxH) * 0.15;
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = "round";
    
    // 左上角
    this.ctx.beginPath();
    this.ctx.moveTo(boxX, boxY + cornerLen);
    this.ctx.lineTo(boxX, boxY);
    this.ctx.lineTo(boxX + cornerLen, boxY);
    this.ctx.stroke();
    
    // 右上角
    this.ctx.beginPath();
    this.ctx.moveTo(boxX + boxW - cornerLen, boxY);
    this.ctx.lineTo(boxX + boxW, boxY);
    this.ctx.lineTo(boxX + boxW, boxY + cornerLen);
    this.ctx.stroke();
    
    // 左下角
    this.ctx.beginPath();
    this.ctx.moveTo(boxX, boxY + boxH - cornerLen);
    this.ctx.lineTo(boxX, boxY + boxH);
    this.ctx.lineTo(boxX + cornerLen, boxY + boxH);
    this.ctx.stroke();
    
    // 右下角
    this.ctx.beginPath();
    this.ctx.moveTo(boxX + boxW - cornerLen, boxY + boxH);
    this.ctx.lineTo(boxX + boxW, boxY + boxH);
    this.ctx.lineTo(boxX + boxW, boxY + boxH - cornerLen);
    this.ctx.stroke();
    
    // 眼睛连线
    if (lm.leftEye && lm.rightEye) {
      const leftEyeX = lm.leftEye.x * w;
      const leftEyeY = lm.leftEye.y * h;
      const rightEyeX = lm.rightEye.x * w;
      const rightEyeY = lm.rightEye.y * h;
      
      this.ctx.strokeStyle = isBadPosture ? "#F59E0B" : "#4CAF50";
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([3, 3]);
      this.ctx.beginPath();
      this.ctx.moveTo(leftEyeX, leftEyeY);
      this.ctx.lineTo(rightEyeX, rightEyeY);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
      
      // 眼睛点
      this.ctx.fillStyle = isActuallyTooClose ? "#EF4444" : "#4CAF50";
      this.ctx.beginPath();
      this.ctx.arc(leftEyeX, leftEyeY, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = "#fff";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      this.ctx.beginPath();
      this.ctx.arc(rightEyeX, rightEyeY, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    }
    
    // 鼻尖
    if (lm.noseTip) {
      const noseX = lm.noseTip.x * w;
      const noseY = lm.noseTip.y * h;
      
      this.ctx.fillStyle = "#FF9800";
      this.ctx.beginPath();
      this.ctx.arc(noseX, noseY, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  // ==================== UI 更新 ====================
  updateRealTimeDisplay() {
    const distanceDisplay = document.getElementById('distanceValue');
    const angleDisplay = document.getElementById('angleValue');
    
    if (distanceDisplay) {
      if (this.estimatedDistance > 0) {
        distanceDisplay.textContent = `${this.estimatedDistance.toFixed(0)}cm`;
      } else {
        distanceDisplay.textContent = '--';
      }
    }
    
    if (angleDisplay) {
      if (this.estimatedDistance > 0) {
        angleDisplay.textContent = `${Math.abs(this.currentTiltAngle).toFixed(1)}°`;
      } else {
        angleDisplay.textContent = '--';
      }
    }
  }
  
  updateStatusUI(type, status) {
    if (type === 'distance') {
      const indicator = document.getElementById('distanceIndicator');
      if (indicator) {
        indicator.classList.remove('status-ok', 'status-warning', 'status-ideal');
        if (status === 'warning') {
          indicator.classList.add('status-warning');
          indicator.innerHTML = `<span class="status-icon">&#9888;</span> 距离过近 (<${this.settings.minDistance}cm)`;
        } else if (status === 'ideal') {
          indicator.classList.add('status-ideal');
          indicator.innerHTML = `<span class="status-icon">&#11088;</span> 理想距离`;
        } else {
          indicator.classList.add('status-ok');
          indicator.innerHTML = `<span class="status-icon">&#10003;</span> 距离正常`;
        }
      }
    } else if (type === 'posture') {
      const indicator = document.getElementById('postureIndicator');
      if (indicator) {
        indicator.classList.remove('status-ok', 'status-warning');
        if (status === 'warning') {
          indicator.classList.add('status-warning');
          indicator.innerHTML = `<span class="status-icon">&#9888;</span> 姿势不正`;
        } else {
          indicator.classList.add('status-ok');
          indicator.innerHTML = `<span class="status-icon">&#10003;</span> 姿势端正`;
        }
      }
    } else if (type === 'camera-error') {
      const distanceIndicator = document.getElementById('distanceIndicator');
      const postureIndicator = document.getElementById('postureIndicator');
      if (distanceIndicator) distanceIndicator.innerHTML = `<span class="status-icon">&#10060;</span> ${status}`;
      if (postureIndicator) postureIndicator.innerHTML = `<span class="status-icon">&#10060;</span> 请允许摄像头权限`;
    }
  }
  
  updateStatsUI() {
    const headTiltEl = document.getElementById('headTiltCount');
    const distanceEl = document.getElementById('distanceCount');
    const maxTiltEl = document.getElementById('maxTiltValue');
    const minDistEl = document.getElementById('minDistValue');
    
    if (headTiltEl) headTiltEl.textContent = this.stats.headTiltCount;
    if (distanceEl) distanceEl.textContent = this.stats.distanceCount;
    if (maxTiltEl) maxTiltEl.textContent = this.stats.maxTilt > 0 ? `${this.stats.maxTilt.toFixed(0)}°` : '-';
    if (minDistEl) minDistEl.textContent = this.stats.minDistance < 999 ? `${this.stats.minDistance.toFixed(0)}` : '-';
  }
  
  updateRewardUI() {
    const totalPointsEl = document.getElementById('totalPoints');
    const totalIdealTimeEl = document.getElementById('totalIdealTime');
    const currentStreakEl = document.getElementById('currentStreak');
    const streakProgressEl = document.getElementById('streakProgress');
    
    if (totalPointsEl) totalPointsEl.textContent = this.rewardStats.totalPoints;
    if (totalIdealTimeEl) totalIdealTimeEl.textContent = Math.floor(this.rewardStats.totalIdealTime / 60);
    if (currentStreakEl) {
      const mins = Math.floor(this.rewardStats.currentStreak / 60);
      const secs = this.rewardStats.currentStreak % 60;
      currentStreakEl.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
    }
    if (streakProgressEl) {
      const progress = ((this.rewardStats.totalIdealTime % 1800) / 1800) * 100;
      streakProgressEl.style.width = `${progress}%`;
    }
  }
  
  updateViolationRecordsUI() {
    const container = document.getElementById('violationRecords');
    if (!container) return;
    
    if (this.violationRecords.length === 0) {
      container.style.display = 'none';
      return;
    }
    
    container.style.display = 'block';
    const photosContainer = container.querySelector('.violation-photos');
    if (!photosContainer) return;
    
    photosContainer.innerHTML = this.violationRecords.slice(0, 3).map((record, i) => `
      <div class="violation-photo-item">
        <img src="${record.photo}" alt="异常 ${i + 1}">
        <div class="violation-photo-label">
          <span>${record.type === 'distance' ? `${record.value.toFixed(0)}cm` : `${record.value.toFixed(0)}°`}</span>
          <span>${record.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>
    `).join('');
  }
  
  // ==================== 奖励动画 ====================
  showInstantReward(message) {
    const rewardEl = document.getElementById('instantReward');
    if (!rewardEl) return;
    
    rewardEl.querySelector('.reward-message').textContent = message;
    rewardEl.classList.add('show');
    
    setTimeout(() => {
      rewardEl.classList.remove('show');
    }, 2000);
  }
  
  showCelebration(minutes) {
    const celebrationEl = document.getElementById('celebration');
    if (!celebrationEl) return;
    
    celebrationEl.querySelector('.celebration-minutes').textContent = minutes;
    celebrationEl.classList.add('show');
    
    setTimeout(() => {
      celebrationEl.classList.remove('show');
    }, 3000);
  }
  
  showPointsReward(points) {
    const rewardEl = document.getElementById('pointsReward');
    if (!rewardEl) return;
    
    rewardEl.querySelector('.points-value').textContent = `+${points}`;
    rewardEl.classList.add('show');
    
    setTimeout(() => {
      rewardEl.classList.remove('show');
    }, 3000);
  }
  
  // ==================== 启动/停止 ====================
  async start() {
    if (this.isMonitoring) return;
    
    console.log('开始启动监测...');
    
    const cameraReady = await this.initCamera();
    if (!cameraReady) {
      console.error('摄像头初始化失败，无法开始监测');
      return false;
    }
    
    try {
      await this.initFaceMesh();
    } catch (e) {
      console.error('Face Mesh 初始化失败:', e);
      return false;
    }
    
    this.isMonitoring = true;
    console.log('监测已启动');
    
    this.detectLoop();
    return true;
  }
  
  async detectLoop() {
    if (!this.isMonitoring || !this.video || !this.faceMesh) return;
    
    if (this.video.readyState >= 2) {
      try {
        await this.faceMesh.send({ image: this.video });
      } catch (e) {
        console.error('Face Mesh 检测错误:', e);
      }
    }
    
    requestAnimationFrame(() => this.detectLoop());
  }
  
  stop() {
    console.log('停止监测...');
    this.isMonitoring = false;
    
    if (this.pauseTimeout) {
      clearTimeout(this.pauseTimeout);
      this.pauseTimeout = null;
    }
    
    this.faceLeftTime = null;
    this.isPaused = false;
    
    if (this.video && this.video.srcObject) {
      const tracks = this.video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      this.video.srcObject = null;
    }
    
    this.violationStartTime = null;
    this.violationDuration = 0;
    this.wasViolating = false;
    
    console.log('监测已停止');
  }
  
  resetStats() {
    this.stats = {
      headTiltCount: 0,
      distanceCount: 0,
      maxTilt: 0,
      minDistance: 999,
      screenshots: []
    };
    this.violationRecords = [];
    this.updateStatsUI();
    this.updateViolationRecordsUI();
  }
  
  getStats() {
    return { 
      ...this.stats, 
      violationRecords: this.violationRecords,
      rewardStats: this.rewardStats,
    };
  }
}

// ==================== 全局实例 ====================
window.postureMonitor = new PostureMonitor();
console.log('VisionDist Monitor v4.0 已加载 - 完整功能移植自 Next.js PWA');
