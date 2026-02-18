# 距离校准功能测试验证文档

## 测试环境
- 浏览器：Chrome/Safari/Firefox（推荐Chrome）
- 摄像头：必须
- 测量工具：尺子或卷尺
- 光线条件：充足的室内光线

## 代码验证结果 ✅

### 1. 后端逻辑验证
**文件**: `public/visiondist/monitor.js`

#### 校准系数应用（第462行）
```javascript
return distanceCM * this.settings.calibrationFactor;
```
✅ **验证通过**：距离计算正确应用了校准系数

#### 校准方法（第169-189行）
```javascript
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
  
  return true;
}
```
✅ **验证通过**：
- 校准公式正确：`新系数 = 实际距离 / 原始计算距离`
- 错误处理完善：检查人脸检测状态
- 数据持久化：通过 `updateSettings()` 保存到 localStorage

#### 重置方法（第192-198行）
```javascript
resetCalibration() {
  this.updateSettings({
    calibrationFactor: 1.0,
    isCalibrated: false
  });
}
```
✅ **验证通过**：重置逻辑正确

### 2. UI交互验证
**文件**: `public/visiondist/index.html`

#### 打开校准弹窗（第2709-2739行）
✅ **验证通过**：
- 检查监测系统是否启动
- 检查是否检测到人脸
- 实时更新距离显示（500ms间隔）

#### 执行校准（第2749-2780行）
✅ **验证通过**：
- 输入验证：20-100cm范围
- 调用后端校准方法
- 更新状态显示
- 语音提示反馈

#### 重置校准（第2782-2798行）
✅ **验证通过**：
- 确认对话框
- 调用后端重置方法
- 更新状态显示

#### 状态更新（第2800-2807行）
✅ **验证通过**：页面加载时自动更新校准状态

### 3. HTML结构验证
**文件**: `public/visiondist/index.html`

#### 设置面板入口（第1515-1522行）
✅ **验证通过**：
- 状态显示区域
- "开始校准"按钮
- 提示文本

#### 校准弹窗（第1567-1616行）
✅ **验证通过**：
- 三步操作指引（带编号）
- 实时距离显示卡片
- 输入框（type=number, min=20, max=100）
- 提示信息
- 重置和确认按钮

### 4. CSS样式验证
**文件**: `public/visiondist/styles.css`

✅ **验证通过**：所有校准相关样式已定义（第3327-3475行）：
- `.calibration-status` - 状态容器
- `.btn-calibrate` - 校准按钮
- `.calibration-modal` - 弹窗样式
- `.calibration-steps` - 步骤指引
- `.calibration-current` - 距离显示卡片
- `.calibration-input` - 输入框样式
- `.calibration-hint` - 提示框样式

---

## 手动测试步骤

### 前置条件
1. 启动应用：`npm run dev`
2. 访问护眼小屋监测页面
3. 准备尺子或卷尺

### 测试用例 1：基本校准流程
**步骤**：
1. 点击"开始监测"按钮
2. 等待摄像头启动，确保画面中有人脸框
3. 点击设置按钮（⚙️）
4. 在"距离校准"区域，点击"开始校准"
5. 观察弹窗中"当前计算距离"是否实时更新
6. 用尺子量好实际距离（例如40cm）
7. 在输入框中输入实际距离（40）
8. 点击"确认校准"

**预期结果**：
- ✅ 弹窗显示"当前计算距离"每500ms更新
- ✅ 输入40后点击确认，弹窗关闭
- ✅ 设置中显示"已校准 (系数: X.XX)"
- ✅ 语音提示"距离校准成功！"
- ✅ 弹出提示框显示校准系数

### 测试用例 2：精度验证
**步骤**：
1. 完成校准后，继续监测
2. 用尺子量好30cm、40cm、50cm三个距离
3. 在每个距离保持5秒，观察显示的距离

**预期结果**：
- ✅ 30cm位置：显示 30±3cm
- ✅ 40cm位置：显示 40±3cm
- ✅ 50cm位置：显示 50±3cm

### 测试用例 3：持久化验证
**步骤**：
1. 完成校准
2. 刷新页面（F5）
3. 点击设置按钮，查看"距离校准"状态

**预期结果**：
- ✅ 状态显示"已校准 (系数: X.XX)"
- ✅ 校准系数与刷新前一致
- ✅ 监测时距离显示仍然准确

### 测试用例 4：重置校准
**步骤**：
1. 在校准弹窗中点击"重置校准"
2. 确认对话框中点击"确定"

**预期结果**：
- ✅ 弹窗关闭
- ✅ 设置中显示"未校准"
- ✅ 语音提示"校准已重置"
- ✅ 距离显示恢复为原始计算值

### 测试用例 5：边界条件
**步骤**：
1. 未启动监测时点击"开始校准"
2. 启动监测但未检测到人脸时点击"开始校准"
3. 输入无效距离（如10、150、abc）后点击确认

**预期结果**：
- ✅ 未启动监测：提示"请先启动监测系统"
- ✅ 未检测到人脸：提示"请先开始监测，让系统检测到您的人脸"
- ✅ 无效距离：提示"请输入有效的距离（20-100厘米）"

---

## 调试方法

### 浏览器控制台调试
打开浏览器控制台（F12），输入以下命令：

```javascript
// 查看当前设置
console.log(window.postureMonitor.settings);

// 查看当前距离
console.log(window.postureMonitor.estimatedDistance);

// 查看校准状态
console.log({
  isCalibrated: window.postureMonitor.settings.isCalibrated,
  calibrationFactor: window.postureMonitor.settings.calibrationFactor
});

// 手动校准（测试用）
window.postureMonitor.calibrateDistance(40);

// 手动重置
window.postureMonitor.resetCalibration();

// 查看localStorage数据
console.log(JSON.parse(localStorage.getItem('visiondist_settings')));
```

### 常见问题排查

#### 问题1：弹窗打不开
**原因**：监测系统未启动
**解决**：先点击"开始监测"按钮

#### 问题2：距离不更新
**原因**：摄像头未检测到人脸
**解决**：调整光线，确保人脸在画面中央

#### 问题3：校准后距离仍不准
**可能原因**：
1. 光线条件变化
2. 摄像头角度变化
3. 人脸姿势不一致

**解决**：
1. 保持稳定的光线条件
2. 固定摄像头位置
3. 多次校准取平均值

#### 问题4：刷新后丢失校准数据
**原因**：浏览器禁用了localStorage
**解决**：检查浏览器隐私设置，允许网站存储数据

---

## 技术细节

### 距离计算原理
```javascript
// 基于瞳距的距离估算
const AVERAGE_PUPIL_DISTANCE_MM = 63;  // 平均瞳距63mm
const FOCAL_LENGTH_NORMALIZED = 1.2;   // 归一化焦距

const distanceMM = (AVERAGE_PUPIL_DISTANCE_MM * FOCAL_LENGTH_NORMALIZED) / pupilDistNormalized;
const distanceCM = distanceMM / 10;

// 应用校准系数
return distanceCM * this.settings.calibrationFactor;
```

### 校准原理
```
校准系数 = 实际距离 / 原始计算距离

例如：
- 原始计算距离：35cm
- 实际测量距离：40cm
- 校准系数 = 40 / 35 = 1.14

后续所有距离 × 1.14 = 校准后距离
```

### 数据持久化
```javascript
// 保存到localStorage
localStorage.setItem('visiondist_settings', JSON.stringify({
  calibrationFactor: 1.14,
  isCalibrated: true,
  // ... 其他设置
}));

// 页面加载时自动恢复
const saved = localStorage.getItem('visiondist_settings');
if (saved) {
  this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
}
```

---

## 验证结论

### 代码层面 ✅
- ✅ 后端逻辑正确（校准计算、数据持久化）
- ✅ UI交互完善（错误处理、状态更新）
- ✅ HTML结构完整（弹窗、输入框、按钮）
- ✅ CSS样式齐全（布局、颜色、动画）

### 功能层面 ⏳
- ⏳ 需要真实环境测试（摄像头 + 尺子）
- ⏳ 需要验证精度（误差应在 ±3cm）
- ⏳ 需要验证持久化（刷新后数据保留）

### 建议
1. **立即测试**：在真实环境中执行上述测试用例
2. **多次校准**：在不同距离（30cm、40cm、50cm）分别校准，验证精度
3. **长期验证**：使用一段时间后，观察校准数据是否稳定
4. **边界测试**：测试极端情况（很近、很远、侧脸、低光）

---

## 测试记录表

| 测试用例 | 测试时间 | 测试人 | 结果 | 备注 |
|---------|---------|--------|------|------|
| 基本校准流程 | - | - | ⏳ 待测试 | - |
| 精度验证（30cm） | - | - | ⏳ 待测试 | - |
| 精度验证（40cm） | - | - | ⏳ 待测试 | - |
| 精度验证（50cm） | - | - | ⏳ 待测试 | - |
| 持久化验证 | - | - | ⏳ 待测试 | - |
| 重置校准 | - | - | ⏳ 待测试 | - |
| 边界条件 | - | - | ⏳ 待测试 | - |

---

**生成时间**: 2026-02-10 06:49 AM
**验证人**: Sisyphus (AI Agent)
**状态**: 代码验证完成 ✅，等待真实环境测试 ⏳
