/**
 * 视距佳 - 成就系统 v1.0
 * 激励用户养成良好的护眼习惯
 */

class AchievementSystem {
  constructor() {
    this.storageKey = 'visionDist_achievements';
    this.userProgressKey = 'visionDist_userProgress';
    
    // 定义所有成就
    this.achievements = {
      // 监测时长成就
      first_session: {
        id: 'first_session',
        name: '初次体验',
        description: '完成第一次监测',
        icon: '🎯',
        category: 'monitoring',
        requirement: { type: 'sessions', value: 1 },
        reward: { points: 10, badge: 'bronze' }
      },
      sessions_10: {
        id: 'sessions_10',
        name: '坚持不懈',
        description: '累计完成10次监测',
        icon: '💪',
        category: 'monitoring',
        requirement: { type: 'sessions', value: 10 },
        reward: { points: 50, badge: 'silver' }
      },
      sessions_50: {
        id: 'sessions_50',
        name: '护眼达人',
        description: '累计完成50次监测',
        icon: '🏆',
        category: 'monitoring',
        requirement: { type: 'sessions', value: 50 },
        reward: { points: 200, badge: 'gold' }
      },
      sessions_100: {
        id: 'sessions_100',
        name: '护眼大师',
        description: '累计完成100次监测',
        icon: '👑',
        category: 'monitoring',
        requirement: { type: 'sessions', value: 100 },
        reward: { points: 500, badge: 'platinum' }
      },
      
      // 时长成就
      duration_1h: {
        id: 'duration_1h',
        name: '一小时守护',
        description: '累计监测时长达到1小时',
        icon: '⏰',
        category: 'duration',
        requirement: { type: 'duration', value: 60 },
        reward: { points: 30, badge: 'bronze' }
      },
      duration_10h: {
        id: 'duration_10h',
        name: '十小时坚守',
        description: '累计监测时长达到10小时',
        icon: '⏱️',
        category: 'duration',
        requirement: { type: 'duration', value: 600 },
        reward: { points: 150, badge: 'silver' }
      },
      duration_50h: {
        id: 'duration_50h',
        name: '五十小时传奇',
        description: '累计监测时长达到50小时',
        icon: '🕐',
        category: 'duration',
        requirement: { type: 'duration', value: 3000 },
        reward: { points: 500, badge: 'gold' }
      },
      
      // 连续打卡成就
      streak_3: {
        id: 'streak_3',
        name: '三天打卡',
        description: '连续3天使用监测',
        icon: '🔥',
        category: 'streak',
        requirement: { type: 'streak', value: 3 },
        reward: { points: 50, badge: 'bronze' }
      },
      streak_7: {
        id: 'streak_7',
        name: '一周坚持',
        description: '连续7天使用监测',
        icon: '🌟',
        category: 'streak',
        requirement: { type: 'streak', value: 7 },
        reward: { points: 100, badge: 'silver' }
      },
      streak_30: {
        id: 'streak_30',
        name: '月度冠军',
        description: '连续30天使用监测',
        icon: '👑',
        category: 'streak',
        requirement: { type: 'streak', value: 30 },
        reward: { points: 500, badge: 'gold' }
      },
      
      // 健康习惯成就
      perfect_posture: {
        id: 'perfect_posture',
        name: '完美姿势',
        description: '单次监测无姿势违规',
        icon: '🎖️',
        category: 'health',
        requirement: { type: 'perfect_posture', value: 1 },
        reward: { points: 20, badge: 'bronze' }
      },
      perfect_distance: {
        id: 'perfect_distance',
        name: '理想距离',
        description: '单次监测无距离违规',
        icon: '📏',
        category: 'health',
        requirement: { type: 'perfect_distance', value: 1 },
        reward: { points: 20, badge: 'bronze' }
      },
      perfect_session: {
        id: 'perfect_session',
        name: '完美监测',
        description: '单次监测无任何违规',
        icon: '💯',
        category: 'health',
        requirement: { type: 'perfect_session', value: 1 },
        reward: { points: 50, badge: 'silver' }
      },
      perfect_10: {
        id: 'perfect_10',
        name: '完美十连',
        description: '连续10次完美监测',
        icon: '🌈',
        category: 'health',
        requirement: { type: 'perfect_streak', value: 10 },
        reward: { points: 300, badge: 'gold' }
      },
      
      // 对战成就
      first_battle: {
        id: 'first_battle',
        name: '初次对战',
        description: '完成第一次对战',
        icon: '⚔️',
        category: 'battle',
        requirement: { type: 'battles', value: 1 },
        reward: { points: 30, badge: 'bronze' }
      },
      battle_winner: {
        id: 'battle_winner',
        name: '对战胜者',
        description: '赢得一场对战',
        icon: '🏅',
        category: 'battle',
        requirement: { type: 'battle_wins', value: 1 },
        reward: { points: 50, badge: 'silver' }
      },
      battle_master: {
        id: 'battle_master',
        name: '对战大师',
        description: '赢得10场对战',
        icon: '🏆',
        category: 'battle',
        requirement: { type: 'battle_wins', value: 10 },
        reward: { points: 300, badge: 'gold' }
      },
      
      // 特殊成就
      early_bird: {
        id: 'early_bird',
        name: '早起鸟儿',
        description: '在早上6点前完成监测',
        icon: '🌅',
        category: 'special',
        requirement: { type: 'early_morning', value: 1 },
        reward: { points: 50, badge: 'special' }
      },
      night_owl: {
        id: 'night_owl',
        name: '夜猫子',
        description: '在晚上11点后完成监测',
        icon: '🌙',
        category: 'special',
        requirement: { type: 'late_night', value: 1 },
        reward: { points: 50, badge: 'special' }
      },
      weekend_warrior: {
        id: 'weekend_warrior',
        name: '周末战士',
        description: '周末完成监测',
        icon: '🎉',
        category: 'special',
        requirement: { type: 'weekend', value: 1 },
        reward: { points: 30, badge: 'special' }
      }
    };
    
    this.init();
    console.log('🏆 成就系统初始化完成');
  }
  
  init() {
    // 初始化用户进度
    const progress = this.getUserProgress();
    if (!progress.initialized) {
      this.saveUserProgress({
        initialized: true,
        sessions: 0,
        totalDuration: 0,
        streak: 0,
        lastSessionDate: null,
        battles: 0,
        battleWins: 0,
        perfectSessions: 0,
        perfectStreak: 0,
        unlockedAchievements: [],
        totalPoints: 0
      });
    }
  }
  
  /**
   * 获取用户进度
   */
  getUserProgress() {
    try {
      const data = localStorage.getItem(this.userProgressKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('获取用户进度失败:', error);
      return {};
    }
  }
  
  /**
   * 保存用户进度
   */
  saveUserProgress(progress) {
    try {
      localStorage.setItem(this.userProgressKey, JSON.stringify(progress));
    } catch (error) {
      console.error('保存用户进度失败:', error);
    }
  }
  
  /**
   * 记录监测完成
   */
  recordSession(sessionData) {
    const progress = this.getUserProgress();
    
    // 更新基础数据
    progress.sessions = (progress.sessions || 0) + 1;
    progress.totalDuration = (progress.totalDuration || 0) + (sessionData.duration || 0);
    
    // 更新连续打卡
    const today = new Date().toDateString();
    const lastDate = progress.lastSessionDate;
    if (lastDate) {
      const lastDay = new Date(lastDate).toDateString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
      if (lastDay === yesterday) {
        progress.streak = (progress.streak || 0) + 1;
      } else if (lastDay !== today) {
        progress.streak = 1;
      }
    } else {
      progress.streak = 1;
    }
    progress.lastSessionDate = today;
    
    // 检查完美监测
    const isPerfect = (sessionData.distanceViolations || 0) === 0 && 
                      (sessionData.postureViolations || 0) === 0;
    if (isPerfect) {
      progress.perfectSessions = (progress.perfectSessions || 0) + 1;
      progress.perfectStreak = (progress.perfectStreak || 0) + 1;
    } else {
      progress.perfectStreak = 0;
    }
    
    // 检查特殊时间
    const hour = new Date().getHours();
    const day = new Date().getDay();
    
    this.saveUserProgress(progress);
    
    // 检查成就
    const newAchievements = [];
    
    // 监测次数成就
    this.checkAchievement('first_session', progress, newAchievements);
    this.checkAchievement('sessions_10', progress, newAchievements);
    this.checkAchievement('sessions_50', progress, newAchievements);
    this.checkAchievement('sessions_100', progress, newAchievements);
    
    // 时长成就
    this.checkAchievement('duration_1h', progress, newAchievements);
    this.checkAchievement('duration_10h', progress, newAchievements);
    this.checkAchievement('duration_50h', progress, newAchievements);
    
    // 连续打卡成就
    this.checkAchievement('streak_3', progress, newAchievements);
    this.checkAchievement('streak_7', progress, newAchievements);
    this.checkAchievement('streak_30', progress, newAchievements);
    
    // 健康习惯成就
    if ((sessionData.postureViolations || 0) === 0) {
      this.checkAchievement('perfect_posture', progress, newAchievements);
    }
    if ((sessionData.distanceViolations || 0) === 0) {
      this.checkAchievement('perfect_distance', progress, newAchievements);
    }
    if (isPerfect) {
      this.checkAchievement('perfect_session', progress, newAchievements);
      this.checkAchievement('perfect_10', progress, newAchievements);
    }
    
    // 特殊时间成就
    if (hour < 6) {
      this.checkAchievement('early_bird', progress, newAchievements);
    }
    if (hour >= 23) {
      this.checkAchievement('night_owl', progress, newAchievements);
    }
    if (day === 0 || day === 6) {
      this.checkAchievement('weekend_warrior', progress, newAchievements);
    }
    
    // 显示新解锁的成就
    newAchievements.forEach(achievement => {
      this.showAchievementUnlocked(achievement);
    });
    
    return newAchievements;
  }
  
  /**
   * 记录对战完成
   */
  recordBattle(battleData) {
    const progress = this.getUserProgress();
    
    progress.battles = (progress.battles || 0) + 1;
    if (battleData.isWinner) {
      progress.battleWins = (progress.battleWins || 0) + 1;
    }
    
    this.saveUserProgress(progress);
    
    // 检查对战成就
    const newAchievements = [];
    this.checkAchievement('first_battle', progress, newAchievements);
    if (battleData.isWinner) {
      this.checkAchievement('battle_winner', progress, newAchievements);
      this.checkAchievement('battle_master', progress, newAchievements);
    }
    
    newAchievements.forEach(achievement => {
      this.showAchievementUnlocked(achievement);
    });
    
    return newAchievements;
  }
  
  /**
   * 检查成就是否解锁
   */
  checkAchievement(achievementId, progress, newAchievements) {
    const achievement = this.achievements[achievementId];
    if (!achievement) return false;
    
    // 检查是否已解锁
    if (progress.unlockedAchievements && progress.unlockedAchievements.includes(achievementId)) {
      return false;
    }
    
    // 检查是否满足条件
    const req = achievement.requirement;
    let isUnlocked = false;
    
    switch (req.type) {
      case 'sessions':
        isUnlocked = (progress.sessions || 0) >= req.value;
        break;
      case 'duration':
        isUnlocked = (progress.totalDuration || 0) >= req.value;
        break;
      case 'streak':
        isUnlocked = (progress.streak || 0) >= req.value;
        break;
      case 'battles':
        isUnlocked = (progress.battles || 0) >= req.value;
        break;
      case 'battle_wins':
        isUnlocked = (progress.battleWins || 0) >= req.value;
        break;
      case 'perfect_posture':
      case 'perfect_distance':
      case 'perfect_session':
        isUnlocked = (progress.perfectSessions || 0) >= req.value;
        break;
      case 'perfect_streak':
        isUnlocked = (progress.perfectStreak || 0) >= req.value;
        break;
      case 'early_morning':
      case 'late_night':
      case 'weekend':
        isUnlocked = true; // 这些成就在触发时立即解锁
        break;
    }
    
    if (isUnlocked) {
      // 解锁成就
      if (!progress.unlockedAchievements) {
        progress.unlockedAchievements = [];
      }
      progress.unlockedAchievements.push(achievementId);
      progress.totalPoints = (progress.totalPoints || 0) + achievement.reward.points;
      this.saveUserProgress(progress);
      
      newAchievements.push(achievement);
      return true;
    }
    
    return false;
  }
  
  /**
   * 显示成就解锁动画
   */
  showAchievementUnlocked(achievement) {
    // 创建成就解锁弹窗
    const overlay = document.createElement('div');
    overlay.className = 'achievement-unlock-overlay';
    
    overlay.innerHTML = `
      <div class="achievement-unlock-content">
        <div class="achievement-unlock-icon">${achievement.icon}</div>
        <div class="achievement-unlock-badge ${achievement.reward.badge}"></div>
        <div class="achievement-unlock-title">成就解锁！</div>
        <div class="achievement-unlock-name">${achievement.name}</div>
        <div class="achievement-unlock-description">${achievement.description}</div>
        <div class="achievement-unlock-reward">
          <span class="reward-points">+${achievement.reward.points}</span>
          <span class="reward-label">积分</span>
        </div>
      </div>
      <div class="achievement-confetti"></div>
    `;
    
    document.body.appendChild(overlay);
    
    // 触发动画
    setTimeout(() => {
      overlay.classList.add('show');
    }, 10);
    
    // 3秒后自动关闭
    setTimeout(() => {
      overlay.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 300);
    }, 3000);
    
    // 播放语音
    if (window.voiceReminder) {
      window.voiceReminder.playCustom(`恭喜解锁成就：${achievement.name}！`);
    }
  }
  
  /**
   * 获取所有成就列表
   */
  getAllAchievements() {
    const progress = this.getUserProgress();
    const unlockedIds = progress.unlockedAchievements || [];
    
    return Object.values(this.achievements).map(achievement => ({
      ...achievement,
      isUnlocked: unlockedIds.includes(achievement.id),
      progress: this.getAchievementProgress(achievement.id, progress)
    }));
  }
  
  /**
   * 获取成就进度
   */
  getAchievementProgress(achievementId, progress) {
    const achievement = this.achievements[achievementId];
    if (!achievement) return 0;
    
    const req = achievement.requirement;
    let current = 0;
    
    switch (req.type) {
      case 'sessions':
        current = progress.sessions || 0;
        break;
      case 'duration':
        current = progress.totalDuration || 0;
        break;
      case 'streak':
        current = progress.streak || 0;
        break;
      case 'battles':
        current = progress.battles || 0;
        break;
      case 'battle_wins':
        current = progress.battleWins || 0;
        break;
      case 'perfect_streak':
        current = progress.perfectStreak || 0;
        break;
      default:
        current = 0;
    }
    
    return Math.min(100, Math.floor((current / req.value) * 100));
  }
  
  /**
   * 获取统计数据
   */
  getStatistics() {
    const progress = this.getUserProgress();
    const allAchievements = Object.values(this.achievements);
    const unlockedCount = (progress.unlockedAchievements || []).length;
    
    return {
      totalAchievements: allAchievements.length,
      unlockedAchievements: unlockedCount,
      totalPoints: progress.totalPoints || 0,
      completionRate: Math.floor((unlockedCount / allAchievements.length) * 100)
    };
  }
}

// 创建全局实例
window.achievementSystem = new AchievementSystem();
console.log('🏆 AchievementSystem v1.0 已加载');
