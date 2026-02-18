/**
 * 视距佳 - 对战历史记录系统 v1.0
 * 记录和管理本地对战和在线对战的历史数据
 */

class ChallengeHistoryManager {
  constructor() {
    this.storageKey = 'visionDist_challengeHistory';
    this.maxRecords = 100; // 最多保存100条记录
    console.log('📚 对战历史记录系统初始化');
  }

  /**
   * 保存对战记录
   * @param {Object} battleData - 对战数据
   * @param {string} battleData.type - 对战类型: 'local' 或 'online'
   * @param {string} battleData.player1Name - 玩家1昵称
   * @param {string} battleData.player2Name - 玩家2昵称
   * @param {number} battleData.player1Score - 玩家1得分
   * @param {number} battleData.player2Score - 玩家2得分
   * @param {Object} battleData.player1Violations - 玩家1违规次数 {distance, posture}
   * @param {Object} battleData.player2Violations - 玩家2违规次数 {distance, posture}
   * @param {number} battleData.duration - 对战时长（秒）
   * @param {string} battleData.winner - 获胜者: 'player1', 'player2', 或 'draw'
   */
  saveBattle(battleData) {
    try {
      const history = this.getHistory();
      
      // 创建记录对象
      const record = {
        id: this.generateId(),
        timestamp: Date.now(),
        date: new Date().toISOString(),
        type: battleData.type,
        player1: {
          name: battleData.player1Name,
          score: battleData.player1Score,
          violations: battleData.player1Violations
        },
        player2: {
          name: battleData.player2Name,
          score: battleData.player2Score,
          violations: battleData.player2Violations
        },
        duration: battleData.duration,
        winner: battleData.winner
      };
      
      // 添加到历史记录开头
      history.unshift(record);
      
      // 限制记录数量
      if (history.length > this.maxRecords) {
        history.splice(this.maxRecords);
      }
      
      // 保存到 localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(history));
      
      console.log('✅ 对战记录已保存:', record);
      return record;
      
    } catch (error) {
      console.error('❌ 保存对战记录失败:', error);
      return null;
    }
  }

  /**
   * 获取所有历史记录
   * @returns {Array} 历史记录数组
   */
  getHistory() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ 读取历史记录失败:', error);
      return [];
    }
  }

  /**
   * 获取分页历史记录
   * @param {number} page - 页码（从1开始）
   * @param {number} pageSize - 每页数量
   * @returns {Object} {records, total, totalPages}
   */
  getHistoryPaged(page = 1, pageSize = 10) {
    const history = this.getHistory();
    const total = history.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const records = history.slice(start, end);
    
    return {
      records,
      total,
      totalPages,
      currentPage: page
    };
  }

  /**
   * 根据类型筛选历史记录
   * @param {string} type - 'local' 或 'online' 或 'all'
   * @returns {Array} 筛选后的记录
   */
  getHistoryByType(type = 'all') {
    const history = this.getHistory();
    if (type === 'all') return history;
    return history.filter(record => record.type === type);
  }

  /**
   * 根据日期范围筛选
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Array} 筛选后的记录
   */
  getHistoryByDateRange(startDate, endDate) {
    const history = this.getHistory();
    const start = startDate.getTime();
    const end = endDate.getTime();
    
    return history.filter(record => {
      return record.timestamp >= start && record.timestamp <= end;
    });
  }

  /**
   * 获取统计数据
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const history = this.getHistory();
    
    const stats = {
      total: history.length,
      local: 0,
      online: 0,
      totalDuration: 0,
      avgScore: 0,
      totalViolations: 0,
      winRate: 0, // 如果记录了当前用户的胜率
      recentBattles: history.slice(0, 5) // 最近5场
    };
    
    let totalScore = 0;
    let totalViolations = 0;
    
    history.forEach(record => {
      // 统计类型
      if (record.type === 'local') stats.local++;
      if (record.type === 'online') stats.online++;
      
      // 统计时长
      stats.totalDuration += record.duration;
      
      // 统计得分
      totalScore += record.player1.score + record.player2.score;
      
      // 统计违规
      totalViolations += 
        record.player1.violations.distance + 
        record.player1.violations.posture +
        record.player2.violations.distance + 
        record.player2.violations.posture;
    });
    
    // 计算平均值
    if (history.length > 0) {
      stats.avgScore = Math.round(totalScore / (history.length * 2));
      stats.totalViolations = totalViolations;
    }
    
    return stats;
  }

  /**
   * 删除指定记录
   * @param {string} id - 记录ID
   * @returns {boolean} 是否成功
   */
  deleteRecord(id) {
    try {
      const history = this.getHistory();
      const index = history.findIndex(record => record.id === id);
      
      if (index !== -1) {
        history.splice(index, 1);
        localStorage.setItem(this.storageKey, JSON.stringify(history));
        console.log('✅ 记录已删除:', id);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ 删除记录失败:', error);
      return false;
    }
  }

  /**
   * 清空所有历史记录
   * @returns {boolean} 是否成功
   */
  clearHistory() {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('✅ 历史记录已清空');
      return true;
    } catch (error) {
      console.error('❌ 清空历史记录失败:', error);
      return false;
    }
  }

  /**
   * 导出历史记录为 JSON
   * @returns {string} JSON 字符串
   */
  exportToJSON() {
    const history = this.getHistory();
    return JSON.stringify(history, null, 2);
  }

  /**
   * 导出历史记录为 CSV
   * @returns {string} CSV 字符串
   */
  exportToCSV() {
    const history = this.getHistory();
    
    // CSV 表头
    let csv = '日期,类型,玩家1,玩家1得分,玩家1距离违规,玩家1姿势违规,玩家2,玩家2得分,玩家2距离违规,玩家2姿势违规,时长(秒),获胜者\n';
    
    // 数据行
    history.forEach(record => {
      const date = new Date(record.timestamp).toLocaleString('zh-CN');
      const type = record.type === 'local' ? '本地对战' : '在线对战';
      const winner = record.winner === 'player1' ? record.player1.name : 
                     record.winner === 'player2' ? record.player2.name : '平局';
      
      csv += `${date},${type},${record.player1.name},${record.player1.score},${record.player1.violations.distance},${record.player1.violations.posture},${record.player2.name},${record.player2.score},${record.player2.violations.distance},${record.player2.violations.posture},${record.duration},${winner}\n`;
    });
    
    return csv;
  }

  /**
   * 生成唯一ID
   * @returns {string} 唯一ID
   */
  generateId() {
    return 'battle_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 格式化时长
   * @param {number} seconds - 秒数
   * @returns {string} 格式化的时长
   */
  formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * 格式化日期
   * @param {number} timestamp - 时间戳
   * @returns {string} 格式化的日期
   */
  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // 今天
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
      return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    
    // 昨天
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.getDate() === yesterday.getDate()) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    
    // 其他
    return date.toLocaleString('zh-CN', { 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}

// 创建全局实例
window.challengeHistory = new ChallengeHistoryManager();
console.log('📚 ChallengeHistoryManager v1.0 已加载');
