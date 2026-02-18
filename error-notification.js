/**
 * 视距佳 - 错误提示管理系统 v1.0
 * 统一管理各种错误场景的提示信息
 */

class ErrorNotificationManager {
  constructor() {
    this.container = null;
    this.currentNotification = null;
    this.queue = [];
    this.isShowing = false;
    
    // 错误类型配置
    this.errorTypes = {
      // 摄像头相关错误
      camera: {
        permission_denied: {
          icon: '📷',
          title: '摄像头权限被拒绝',
          message: '请在浏览器设置中允许访问摄像头，然后刷新页面重试',
          type: 'error',
          duration: 5000,
          actions: [
            { text: '查看帮助', callback: () => this.showCameraHelp() },
            { text: '刷新页面', callback: () => location.reload() }
          ]
        },
        not_found: {
          icon: '🔍',
          title: '未检测到摄像头',
          message: '请确保设备已连接摄像头，或检查摄像头是否被其他应用占用',
          type: 'error',
          duration: 5000,
          actions: [
            { text: '重试', callback: () => this.retryCameraAccess() }
          ]
        },
        not_readable: {
          icon: '⚠️',
          title: '摄像头无法访问',
          message: '摄像头可能被其他应用占用，请关闭其他使用摄像头的程序后重试',
          type: 'error',
          duration: 5000,
          actions: [
            { text: '重试', callback: () => this.retryCameraAccess() }
          ]
        },
        overconstrained: {
          icon: '🎥',
          title: '摄像头配置不支持',
          message: '当前摄像头不支持所需的分辨率，将尝试使用默认配置',
          type: 'warning',
          duration: 4000
        },
        unknown: {
          icon: '❌',
          title: '摄像头错误',
          message: '启动摄像头时发生未知错误，请刷新页面重试',
          type: 'error',
          duration: 5000,
          actions: [
            { text: '刷新页面', callback: () => location.reload() }
          ]
        }
      },
      
      // 网络相关错误
      network: {
        connection_failed: {
          icon: '🌐',
          title: '网络连接失败',
          message: '无法连接到服务器，请检查网络连接后重试',
          type: 'error',
          duration: 5000,
          actions: [
            { text: '重试', callback: () => this.retryConnection() }
          ]
        },
        peer_connection_failed: {
          icon: '🔗',
          title: 'P2P连接失败',
          message: '无法建立点对点连接，可能是网络环境限制，请尝试更换网络',
          type: 'error',
          duration: 5000
        },
        disconnected: {
          icon: '📡',
          title: '连接已断开',
          message: '与对手的连接已断开，对战将自动结束',
          type: 'warning',
          duration: 4000
        },
        timeout: {
          icon: '⏱️',
          title: '连接超时',
          message: '连接超时，请检查网络状况后重试',
          type: 'error',
          duration: 4000,
          actions: [
            { text: '重试', callback: () => this.retryConnection() }
          ]
        }
      },
      
      // 数据相关错误
      data: {
        save_failed: {
          icon: '💾',
          title: '数据保存失败',
          message: '无法保存数据，可能是存储空间不足，请清理浏览器缓存后重试',
          type: 'error',
          duration: 5000
        },
        load_failed: {
          icon: '📂',
          title: '数据加载失败',
          message: '无法加载历史数据，将使用默认设置',
          type: 'warning',
          duration: 4000
        },
        export_failed: {
          icon: '📤',
          title: '数据导出失败',
          message: '导出数据时发生错误，请重试',
          type: 'error',
          duration: 4000,
          actions: [
            { text: '重试', callback: () => this.retryExport() }
          ]
        },
        corrupted: {
          icon: '🔧',
          title: '数据损坏',
          message: '检测到数据损坏，已自动修复并使用默认设置',
          type: 'warning',
          duration: 4000
        }
      },
      
      // 功能相关错误
      feature: {
        not_supported: {
          icon: '🚫',
          title: '功能不支持',
          message: '当前浏览器不支持此功能，建议使用最新版Chrome或Firefox',
          type: 'error',
          duration: 5000
        },
        mediapipe_load_failed: {
          icon: '🤖',
          title: 'AI模型加载失败',
          message: '无法加载面部识别模型，请检查网络连接后刷新页面',
          type: 'error',
          duration: 5000,
          actions: [
            { text: '刷新页面', callback: () => location.reload() }
          ]
        },
        voice_not_available: {
          icon: '🔊',
          title: '语音功能不可用',
          message: '当前浏览器不支持语音合成，将使用静音模式',
          type: 'warning',
          duration: 4000
        }
      },
      
      // 用户操作错误
      user: {
        invalid_input: {
          icon: '✏️',
          title: '输入无效',
          message: '请输入有效的内容',
          type: 'warning',
          duration: 3000
        },
        room_not_found: {
          icon: '🏠',
          title: '房间不存在',
          message: '找不到指定的房间，请检查房间ID是否正确',
          type: 'error',
          duration: 4000
        },
        room_full: {
          icon: '👥',
          title: '房间已满',
          message: '该房间已有其他玩家，请创建新房间或加入其他房间',
          type: 'warning',
          duration: 4000
        },
        already_in_room: {
          icon: '🚪',
          title: '已在房间中',
          message: '您已经在一个房间中，请先退出当前房间',
          type: 'warning',
          duration: 3000
        }
      }
    };
    
    this.init();
    console.log('✅ 错误提示管理系统初始化完成');
  }
  
  init() {
    // 创建通知容器
    this.container = document.createElement('div');
    this.container.id = 'errorNotificationContainer';
    this.container.className = 'error-notification-container';
    document.body.appendChild(this.container);
  }
  
  /**
   * 显示错误提示
   * @param {string} category - 错误类别
   * @param {string} type - 错误类型
   * @param {Object} customOptions - 自定义选项
   */
  show(category, type, customOptions = {}) {
    const errorConfig = this.errorTypes[category]?.[type];
    
    if (!errorConfig) {
      console.error('未知的错误类型:', category, type);
      return;
    }
    
    const options = { ...errorConfig, ...customOptions };
    
    // 如果正在显示通知，加入队列
    if (this.isShowing) {
      this.queue.push({ category, type, options });
      return;
    }
    
    this.displayNotification(options);
  }
  
  /**
   * 显示自定义错误
   * @param {Object} options - 自定义选项
   */
  showCustom(options) {
    const defaultOptions = {
      icon: '💡',
      title: '提示',
      message: '',
      type: 'info',
      duration: 3000,
      actions: []
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    if (this.isShowing) {
      this.queue.push({ options: finalOptions });
      return;
    }
    
    this.displayNotification(finalOptions);
  }
  
  /**
   * 显示通知
   * @param {Object} options - 通知选项
   */
  displayNotification(options) {
    this.isShowing = true;
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `error-notification error-notification-${options.type}`;
    
    // 构建HTML
    let html = `
      <div class="error-notification-icon">${options.icon}</div>
      <div class="error-notification-content">
        <div class="error-notification-title">${options.title}</div>
        <div class="error-notification-message">${options.message}</div>
    `;
    
    // 添加操作按钮
    if (options.actions && options.actions.length > 0) {
      html += '<div class="error-notification-actions">';
      options.actions.forEach((action, index) => {
        html += `<button class="error-notification-btn" data-action="${index}">${action.text}</button>`;
      });
      html += '</div>';
    }
    
    html += `
      </div>
      <button class="error-notification-close">×</button>
    `;
    
    notification.innerHTML = html;
    
    // 绑定事件
    const closeBtn = notification.querySelector('.error-notification-close');
    closeBtn.addEventListener('click', () => this.hideNotification(notification));
    
    // 绑定操作按钮事件
    if (options.actions) {
      const actionBtns = notification.querySelectorAll('.error-notification-btn');
      actionBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
          options.actions[index].callback();
          this.hideNotification(notification);
        });
      });
    }
    
    // 添加到容器
    this.container.appendChild(notification);
    this.currentNotification = notification;
    
    // 触发动画
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // 自动隐藏
    if (options.duration > 0) {
      setTimeout(() => {
        this.hideNotification(notification);
      }, options.duration);
    }
    
    // 播放语音提示
    if (window.voiceReminder && options.voiceMessage) {
      window.voiceReminder.playCustom(options.voiceMessage);
    }
  }
  
  /**
   * 隐藏通知
   * @param {HTMLElement} notification - 通知元素
   */
  hideNotification(notification) {
    if (!notification) return;
    
    notification.classList.remove('show');
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      
      this.isShowing = false;
      this.currentNotification = null;
      
      // 显示队列中的下一个通知
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        if (next.category && next.type) {
          this.show(next.category, next.type, next.options);
        } else {
          this.displayNotification(next.options);
        }
      }
    }, 300);
  }
  
  /**
   * 清空所有通知
   */
  clearAll() {
    if (this.currentNotification) {
      this.hideNotification(this.currentNotification);
    }
    this.queue = [];
  }
  
  // ===== 辅助方法 =====
  
  showCameraHelp() {
    const helpText = `
摄像头权限设置帮助：

Chrome浏览器：
1. 点击地址栏左侧的锁图标
2. 找到"摄像头"选项
3. 选择"允许"
4. 刷新页面

Firefox浏览器：
1. 点击地址栏左侧的图标
2. 找到"使用摄像头"
3. 选择"允许"
4. 刷新页面

Safari浏览器：
1. 打开Safari偏好设置
2. 选择"网站"标签
3. 找到"摄像头"
4. 允许此网站访问
    `;
    alert(helpText);
  }
  
  retryCameraAccess() {
    if (window.postureMonitor) {
      window.postureMonitor.startMonitoring();
    }
  }
  
  retryConnection() {
    // 由具体功能模块实现
    console.log('重试连接...');
  }
  
  retryExport() {
    // 由具体功能模块实现
    console.log('重试导出...');
  }
}

// 创建全局实例
window.errorNotification = new ErrorNotificationManager();
console.log('✅ ErrorNotificationManager v1.0 已加载');
