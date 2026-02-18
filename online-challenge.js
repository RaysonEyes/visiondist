/**
 * 视距佳 - 在线对战系统 v2.0
 * 使用 PeerJS 实现 P2P 连接
 * 支持房间列表和快速匹配
 */

class OnlineChallengeManager {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.peerId = null;
    this.isHost = false;
    this.opponentId = null;
    this.opponentName = null;

    // 房间列表（使用localStorage模拟，实际生产环境应使用服务器）
    this.roomListKey = 'rseyes_online_rooms';
    this.roomHeartbeatInterval = null;

    // 对战状态
    this.battleState = {
      myScore: 0,
      opponentScore: 0,
      myViolations: { distance: 0, posture: 0 },
      opponentViolations: { distance: 0, posture: 0 },
      startTime: null,
      duration: 5 * 60, // 5分钟
      isActive: false
    };

    // 计时器
    this.timer = null;
    this.scoreInterval = null;
    this.syncInterval = null;

    console.log('🌐 在线对战系统初始化 v2.0');
  }
  
  // 初始化 PeerJS
  async initPeer() {
    return new Promise((resolve, reject) => {
      try {
        // 使用公共的 PeerJS 服务器
        this.peer = new Peer({
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });
        
        this.peer.on('open', (id) => {
          this.peerId = id;
          console.log('🆔 我的对战ID:', id);
          resolve(id);
        });
        
        this.peer.on('error', (err) => {
          console.error('❌ PeerJS 错误:', err);
          reject(err);
        });
        
        // 监听连接请求
        this.peer.on('connection', (conn) => {
          this.handleIncomingConnection(conn);
        });
        
      } catch (error) {
        console.error('❌ 初始化 Peer 失败:', error);
        reject(error);
      }
    });
  }
  
  // 创建房间（作为主机）
  async createRoom(playerName) {
    try {
      if (!this.peer) {
        await this.initPeer();
      }

      this.isHost = true;
      this.myName = playerName;

      // 将房间添加到房间列表
      this.registerRoom(playerName);

      // 启动心跳，保持房间在线状态
      this.startRoomHeartbeat();

      console.log('🏠 房间创建成功，房间ID:', this.peerId);

      return {
        success: true,
        roomId: this.peerId,
        message: '房间创建成功！'
      };

    } catch (error) {
      console.error('❌ 创建房间失败:', error);
      return {
        success: false,
        message: '创建房间失败：' + error.message
      };
    }
  }

  // 注册房间到列表
  registerRoom(playerName) {
    const rooms = this.getRoomList();
    const room = {
      id: this.peerId,
      hostName: playerName,
      createdAt: Date.now(),
      lastHeartbeat: Date.now(),
      status: 'waiting' // waiting, playing, closed
    };

    // 移除同ID的旧房间
    const filteredRooms = rooms.filter(r => r.id !== this.peerId);
    filteredRooms.push(room);

    this.saveRoomList(filteredRooms);
    console.log('📝 房间已注册到列表');
  }

  // 启动房间心跳
  startRoomHeartbeat() {
    // 清除之前的心跳
    if (this.roomHeartbeatInterval) {
      clearInterval(this.roomHeartbeatInterval);
    }

    // 每10秒更新一次心跳
    this.roomHeartbeatInterval = setInterval(() => {
      this.updateRoomHeartbeat();
    }, 10000);
  }

  // 更新房间心跳
  updateRoomHeartbeat() {
    const rooms = this.getRoomList();
    const roomIndex = rooms.findIndex(r => r.id === this.peerId);

    if (roomIndex !== -1) {
      rooms[roomIndex].lastHeartbeat = Date.now();
      this.saveRoomList(rooms);
    }
  }

  // 更新房间状态
  updateRoomStatus(status) {
    const rooms = this.getRoomList();
    const roomIndex = rooms.findIndex(r => r.id === this.peerId);

    if (roomIndex !== -1) {
      rooms[roomIndex].status = status;
      rooms[roomIndex].lastHeartbeat = Date.now();
      this.saveRoomList(rooms);
    }
  }

  // 从列表移除房间
  removeRoom() {
    const rooms = this.getRoomList();
    const filteredRooms = rooms.filter(r => r.id !== this.peerId);
    this.saveRoomList(filteredRooms);

    if (this.roomHeartbeatInterval) {
      clearInterval(this.roomHeartbeatInterval);
      this.roomHeartbeatInterval = null;
    }

    console.log('🗑️ 房间已从列表移除');
  }

  // 获取房间列表
  getRoomList() {
    try {
      const data = localStorage.getItem(this.roomListKey);
      if (!data) return [];

      const rooms = JSON.parse(data);

      // 过滤掉超过30秒没有心跳的房间（视为离线）
      const now = Date.now();
      const activeRooms = rooms.filter(r => {
        return (now - r.lastHeartbeat) < 30000 && r.status === 'waiting';
      });

      return activeRooms;
    } catch (error) {
      console.error('获取房间列表失败:', error);
      return [];
    }
  }

  // 获取所有房间（包括正在游戏的）
  getAllRooms() {
    try {
      const data = localStorage.getItem(this.roomListKey);
      if (!data) return [];

      const rooms = JSON.parse(data);
      const now = Date.now();

      // 过滤掉超过30秒没有心跳的房间
      return rooms.filter(r => (now - r.lastHeartbeat) < 30000);
    } catch (error) {
      return [];
    }
  }

  // 保存房间列表
  saveRoomList(rooms) {
    try {
      localStorage.setItem(this.roomListKey, JSON.stringify(rooms));
    } catch (error) {
      console.error('保存房间列表失败:', error);
    }
  }

  // 刷新房间列表（清理过期房间）
  refreshRoomList() {
    const rooms = this.getAllRooms();
    const now = Date.now();

    // 只保留30秒内有心跳的房间
    const activeRooms = rooms.filter(r => (now - r.lastHeartbeat) < 30000);
    this.saveRoomList(activeRooms);

    // 返回等待中的房间
    return activeRooms.filter(r => r.status === 'waiting');
  }

  // 快速匹配（随机加入一个等待中的房间）
  async quickMatch(playerName) {
    const rooms = this.refreshRoomList();

    if (rooms.length === 0) {
      // 没有可用房间，创建一个新房间
      console.log('🔍 没有可用房间，创建新房间等待匹配...');
      return await this.createRoom(playerName);
    }

    // 随机选择一个房间加入
    const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
    console.log('🎯 找到房间，正在加入:', randomRoom.id);

    return await this.joinRoom(randomRoom.id, playerName);
  }
  
  // 加入房间
  async joinRoom(roomId, playerName) {
    try {
      if (!this.peer) {
        await this.initPeer();
      }
      
      this.isHost = false;
      this.myName = playerName;
      this.opponentId = roomId;
      
      // 连接到主机
      this.conn = this.peer.connect(roomId, {
        reliable: true
      });
      
      return new Promise((resolve, reject) => {
        this.conn.on('open', () => {
          console.log('✅ 成功连接到房间:', roomId);
          
          // 发送加入消息
          this.sendMessage({
            type: 'join',
            playerName: playerName,
            peerId: this.peerId
          });
          
          this.setupConnectionHandlers(this.conn);
          
          resolve({
            success: true,
            message: '成功加入房间！'
          });
        });
        
        this.conn.on('error', (err) => {
          console.error('❌ 连接失败:', err);
          reject({
            success: false,
            message: '连接失败：' + err.message
          });
        });
      });
      
    } catch (error) {
      console.error('❌ 加入房间失败:', error);
      return {
        success: false,
        message: '加入房间失败：' + error.message
      };
    }
  }
  
  // 处理传入的连接
  handleIncomingConnection(conn) {
    console.log('📥 收到连接请求:', conn.peer);
    
    this.conn = conn;
    this.opponentId = conn.peer;
    
    this.setupConnectionHandlers(conn);
  }
  
  // 设置连接处理器
  setupConnectionHandlers(conn) {
    conn.on('data', (data) => {
      this.handleMessage(data);
    });
    
    conn.on('close', () => {
      console.log('🔌 连接已断开');
      this.handleDisconnect();
    });
    
    conn.on('error', (err) => {
      console.error('❌ 连接错误:', err);
    });
  }
  
  // 处理消息
  handleMessage(data) {
    console.log('📨 收到消息:', data);
    
    switch (data.type) {
      case 'join':
        // 对手加入
        this.opponentName = data.playerName;
        this.opponentId = data.peerId;
        
        // 通知UI
        if (window.onOpponentJoined) {
          window.onOpponentJoined(data.playerName);
        }
        
        // 主机发送确认
        if (this.isHost) {
          this.sendMessage({
            type: 'join_confirm',
            playerName: this.myName
          });
        }
        break;
        
      case 'join_confirm':
        // 收到主机确认
        this.opponentName = data.playerName;
        
        if (window.onOpponentJoined) {
          window.onOpponentJoined(data.playerName);
        }
        break;
        
      case 'start_battle':
        // 开始对战
        this.startBattle();
        break;
        
      case 'score_update':
        // 更新对手分数
        this.battleState.opponentScore = data.score;
        this.battleState.opponentViolations = data.violations;
        
        if (window.onOpponentScoreUpdate) {
          window.onOpponentScoreUpdate(data);
        }
        break;
        
      case 'battle_end':
        // 对战结束
        this.endBattle(data);
        break;
        
      case 'chat':
        // 聊天消息
        if (window.onChatMessage) {
          window.onChatMessage(data.message, data.sender);
        }
        break;
    }
  }
  
  // 发送消息
  sendMessage(data) {
    if (this.conn && this.conn.open) {
      this.conn.send(data);
    } else {
      console.warn('⚠️ 连接未建立，无法发送消息');
    }
  }
  
  // 开始对战
  startBattle() {
    console.log('🎮 对战开始！');
    
    this.battleState = {
      myScore: 0,
      opponentScore: 0,
      myViolations: { distance: 0, posture: 0 },
      opponentViolations: { distance: 0, posture: 0 },
      startTime: Date.now(),
      duration: 5 * 60,
      isActive: true
    };
    
    // 启动监测
    if (window.postureMonitor && !window.postureMonitor.isMonitoring) {
      window.postureMonitor.startMonitoring();
    }
    
    // 启动计时器
    this.startTimer();
    
    // 启动得分计算
    this.startScoring();
    
    // 启动数据同步
    this.startSync();
    
    // 通知UI
    if (window.onBattleStart) {
      window.onBattleStart();
    }
  }
  
  // 启动计时器
  startTimer() {
    let remaining = this.battleState.duration;
    
    this.timer = setInterval(() => {
      remaining--;
      
      if (window.onTimerUpdate) {
        window.onTimerUpdate(remaining);
      }
      
      if (remaining <= 0) {
        this.endBattle();
      }
    }, 1000);
  }
  
  // 启动得分计算
  startScoring() {
    this.scoreInterval = setInterval(() => {
      if (!this.battleState.isActive) return;
      
      // 检查当前状态
      if (window.postureMonitor && window.postureMonitor.isMonitoring) {
        const distance = window.postureMonitor.estimatedDistance;
        const tilt = Math.abs(window.postureMonitor.currentTiltAngle);
        const minDistance = window.postureMonitor.settings.minDistance;
        
        // 距离违规
        if (distance > 0 && distance < minDistance) {
          this.battleState.myScore -= 10;
          this.battleState.myViolations.distance++;
        }
        // 姿势违规
        else if (tilt > 15) {
          this.battleState.myScore -= 5;
          this.battleState.myViolations.posture++;
        }
        // 保持良好
        else if (distance > 0) {
          this.battleState.myScore += 1;
        }
      }
      
      // 更新UI
      if (window.onMyScoreUpdate) {
        window.onMyScoreUpdate({
          score: this.battleState.myScore,
          violations: this.battleState.myViolations
        });
      }
    }, 1000);
  }
  
  // 启动数据同步
  startSync() {
    this.syncInterval = setInterval(() => {
      if (!this.battleState.isActive) return;
      
      // 发送我的分数给对手
      this.sendMessage({
        type: 'score_update',
        score: this.battleState.myScore,
        violations: this.battleState.myViolations
      });
    }, 2000); // 每2秒同步一次
  }
  
  // 结束对战
  endBattle(opponentData = null) {
    console.log('🏁 对战结束！');
    
    this.battleState.isActive = false;
    
    // 停止所有计时器
    if (this.timer) clearInterval(this.timer);
    if (this.scoreInterval) clearInterval(this.scoreInterval);
    if (this.syncInterval) clearInterval(this.syncInterval);
    
    // 停止监测
    if (window.postureMonitor && window.postureMonitor.isMonitoring) {
      window.postureMonitor.stopMonitoring();
    }
    
    // 发送结束消息
    if (!opponentData) {
      this.sendMessage({
        type: 'battle_end',
        score: this.battleState.myScore,
        violations: this.battleState.myViolations
      });
    }
    
    // 显示结果
    if (window.onBattleEnd) {
      window.onBattleEnd({
        myScore: this.battleState.myScore,
        myViolations: this.battleState.myViolations,
        opponentScore: opponentData ? opponentData.score : this.battleState.opponentScore,
        opponentViolations: opponentData ? opponentData.violations : this.battleState.opponentViolations
      });
    }
  }
  
  // 处理断开连接
  handleDisconnect() {
    if (this.battleState.isActive) {
      this.endBattle();
    }
    
    if (window.onOpponentDisconnect) {
      window.onOpponentDisconnect();
    }
  }
  
  // 发送聊天消息
  sendChat(message) {
    this.sendMessage({
      type: 'chat',
      message: message,
      sender: this.myName
    });
  }
  
  // 断开连接
  disconnect() {
    // 从房间列表移除
    this.removeRoom();

    if (this.conn) {
      this.conn.close();
    }

    if (this.peer) {
      this.peer.destroy();
    }

    this.battleState.isActive = false;

    if (this.timer) clearInterval(this.timer);
    if (this.scoreInterval) clearInterval(this.scoreInterval);
    if (this.syncInterval) clearInterval(this.syncInterval);

    console.log('👋 已断开连接');
  }
}

// 创建全局实例
window.onlineChallengeManager = new OnlineChallengeManager();
console.log('🌐 OnlineChallengeManager v2.0 已加载 - 支持房间列表');
