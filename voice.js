/**
 * 视距佳 - 卡通风格语音提醒系统 v5.2
 * 支持阿里云TTS真人语音 + 浏览器合成语音降级
 * 包含多种卡通角色风格：哆啦A梦、皮卡丘、大力水手、阿拉丁精灵
 */

class CartoonVoiceReminder {
  constructor() {
    this.enabled = true;
    this.volume = 0.8;
    this.currentStyle = 'random';
    this.synth = window.speechSynthesis;
    this.lastWarningTime = 0;
    this.warningCooldown = 5000; // 5秒冷却时间

    // 语音队列管理
    this.voiceQueue = [];
    this.isSpeaking = false;

    // TTS API 配置
    this.ttsApiUrl = '/api/v1/tts/speak'; // 后端TTS接口
    this.useTtsApi = true; // 是否使用TTS API（自动检测）
    this.ttsVoice = 'ninger'; // 阿里云音色：ninger(宁儿-可爱童声)
    this.audioCache = new Map(); // 音频缓存

    // 检测TTS API是否可用
    this.checkTtsApiAvailability();

    
    // 卡通角色风格配置
    this.styles = {
      // 哆啦A梦风格 - 温柔可爱，喜欢用"呐呐"开头
      doraemon: {
        name: '哆啦A梦',
        pitch: 1.15,
        rate: 1.0,
        prefix: ['呐呐~', '大雄~', '哎呀~', '嘿嘿~'],
        suffix: ['喵~', '呢~', '哦~', '啦~'],
        distanceWarnings: [
          '呐呐~眼睛离屏幕太近啦，要保护好眼睛哦',
          '大雄~你又凑太近了，这样眼睛会坏掉的喵',
          '哎呀~距离太近了，让我用时光机帮你调整一下吧',
          '嘿嘿~记得保持距离哦，不然我要拿出道具啦'
        ],
        postureWarnings: [
          '呐呐~坐姿歪了哦，挺直腰背才健康喵',
          '大雄~你的头歪了，要像我一样端正坐好',
          '哎呀~姿势不对啦，我来帮你矫正一下',
          '嘿嘿~坐直一点嘛，不然我要用竹蜻蜓带你飞走了'
        ],
        rewards: [
          '太棒啦~你做得很好喵！继续保持哦',
          '呐呐~奖励你一个铜锣烧！做得真棒',
          '哇~你真厉害！比大雄强多了喵',
          '嘿嘿~恭喜恭喜！你是护眼小达人'
        ],
        encouragements: [
          '加油加油~我相信你可以的喵',
          '呐呐~坚持就是胜利哦',
          '大雄都能做到，你一定也行的',
          '嘿嘿~继续努力，你最棒了'
        ],
        greetings: [
          '呐呐~欢迎回来！今天也要好好保护眼睛哦喵',
          '嘿嘿~我是哆啦A梦，来守护你的视力健康啦',
          '大雄~不对，是你呀！一起来护眼吧喵'
        ],
        startMonitor: [
          '呐呐~开始监测啦！我会好好守护你的眼睛喵',
          '嘿嘿~监测开始！让我们一起保护视力吧',
          '好的好的~我来帮你看着，放心交给我喵'
        ],
        endMonitor: [
          '呐呐~监测结束啦！你做得很棒喵',
          '辛苦啦~休息一下吧，眼睛也要放松哦',
          '嘿嘿~完成任务！你是护眼小英雄喵'
        ],
        interact: [
          '呐呐~你戳我干嘛喵',
          '嘿嘿~想要什么道具吗',
          '哎呀~好痒痒呀',
          '大雄~不对，你不是大雄啦'
        ]
      },
      
      // 皮卡丘风格 - 活泼可爱，喜欢用"皮卡"
      pikachu: {
        name: '皮卡丘',
        pitch: 1.2,
        rate: 1.05,
        prefix: ['皮卡~', '皮卡皮~', '皮~', '卡丘~'],
        suffix: ['皮卡！', '丘~', '皮！', '卡~'],
        distanceWarnings: [
          '皮卡~眼睛离太近了皮卡！快退后一点丘',
          '皮卡皮~距离警报！十万伏特提醒你远离屏幕',
          '卡丘~你凑太近啦！皮卡丘很担心你的眼睛',
          '皮~快退后！不然我要放电电你了皮卡'
        ],
        postureWarnings: [
          '皮卡~坐姿歪了丘！挺直身体皮卡',
          '皮卡皮~头歪了头歪了！快调整姿势丘',
          '卡丘~姿势不对皮卡！要像我一样精神抖擞',
          '皮~坐直坐直！不然我要用电击帮你矫正了'
        ],
        rewards: [
          '皮卡皮卡~太厉害了！奖励你一个皮卡丘贴纸',
          '皮卡~恭喜恭喜！你是最棒的训练师丘',
          '卡丘~好棒好棒！继续保持皮卡',
          '皮~你赢得了皮卡丘的认可！超级厉害'
        ],
        encouragements: [
          '皮卡皮卡~加油加油！我支持你丘',
          '皮卡~坚持住！胜利就在眼前皮',
          '卡丘~你可以的！皮卡丘相信你',
          '皮~冲冲冲！像十万伏特一样充满能量'
        ],
        greetings: [
          '皮卡皮卡~欢迎回来！今天也要元气满满丘',
          '皮卡~我是皮卡丘！来帮你守护眼睛健康皮',
          '卡丘~见到你真开心！一起来护眼吧皮卡'
        ],
        startMonitor: [
          '皮卡~监测开始！皮卡丘会一直陪着你丘',
          '皮卡皮~出发！让我们一起保护视力皮卡',
          '卡丘~准备好了！皮卡丘的护眼行动开始'
        ],
        endMonitor: [
          '皮卡皮卡~完成啦！你做得超级棒丘',
          '皮卡~辛苦了！休息一下吧皮',
          '卡丘~任务完成！皮卡丘为你骄傲'
        ],
        interact: [
          '皮卡~你戳我干嘛皮卡',
          '卡丘~好痒痒丘',
          '皮卡皮~嘿嘿嘿',
          '皮~要放电了哦皮卡'
        ]
      },
      
      // 大力水手风格 - 强壮有力，喜欢用"嘿嘿"和"菠菜"
      popeye: {
        name: '大力水手',
        pitch: 0.9,
        rate: 0.95,
        prefix: ['嘿嘿~', '水手来啦~', '听好了~', '伙计~'],
        suffix: ['嘿！', '懂了吗！', '加油！', '冲！'],
        distanceWarnings: [
          '嘿嘿~伙计，眼睛离太近了！像我一样保持距离',
          '水手来啦~你的眼睛需要保护！快退后一点嘿',
          '听好了~距离太近会伤眼睛的！吃点菠菜补补',
          '伙计~这距离可不行！大力水手命令你退后'
        ],
        postureWarnings: [
          '嘿嘿~坐姿不对啊伙计！挺起胸膛像个水手',
          '水手来啦~你的姿势歪了！快调整过来嘿',
          '听好了~坐直身体！像我一样强壮有力',
          '伙计~这姿势可不行！吃菠菜然后坐直'
        ],
        rewards: [
          '嘿嘿~太棒了伙计！你赢得了一罐菠菜',
          '水手来啦~恭喜你！你是真正的英雄嘿',
          '听好了~你做得很好！大力水手为你骄傲',
          '伙计~厉害厉害！继续保持这股劲头'
        ],
        encouragements: [
          '嘿嘿~加油伙计！吃了菠菜什么都能做到',
          '水手来啦~坚持住！胜利属于勇敢的人',
          '听好了~你可以的！像大力水手一样强大',
          '伙计~冲啊！展现你的力量'
        ],
        greetings: [
          '嘿嘿~欢迎回来伙计！大力水手来守护你的眼睛了',
          '水手来啦~我是大力水手！一起来护眼吧嘿',
          '听好了~今天也要像吃了菠菜一样精神抖擞'
        ],
        startMonitor: [
          '嘿嘿~监测开始！大力水手会保护你的眼睛',
          '水手来啦~出发！像航海一样勇往直前',
          '听好了~准备好了！让我们开始护眼行动'
        ],
        endMonitor: [
          '嘿嘿~完成了伙计！你做得很棒嘿',
          '水手来啦~辛苦了！休息一下吃点菠菜',
          '听好了~任务完成！你是真正的水手'
        ],
        interact: [
          '嘿嘿~你戳我干嘛伙计',
          '水手来啦~需要帮忙吗',
          '听好了~我可是很强壮的',
          '伙计~要不要一起吃菠菜'
        ]
      },
      
      // 阿拉丁精灵风格 - 神秘幽默，喜欢用"主人"和"愿望"
      genie: {
        name: '阿拉丁精灵',
        pitch: 1.2,
        rate: 1.05,
        prefix: ['叮~', '主人~', '神灯精灵来啦~', '哈哈~'],
        suffix: ['~愿望达成！', '~精灵保证！', '~魔法生效！', '~叮咚！'],
        distanceWarnings: [
          '叮~主人，眼睛离太近了！让精灵帮你调整距离吧',
          '神灯精灵来啦~距离警报！我可以变出一把尺子帮你测量',
          '哈哈~主人你凑太近了！这可不是许愿的距离哦',
          '主人~快退后一点！不然精灵要施展魔法推你了'
        ],
        postureWarnings: [
          '叮~主人，坐姿歪了！让精灵帮你矫正姿势吧',
          '神灯精灵来啦~姿势不对！我来变个魔法椅子给你',
          '哈哈~主人你的头歪了！精灵可以帮你扶正哦',
          '主人~坐直身体！这是精灵的第一个建议'
        ],
        rewards: [
          '叮~恭喜主人！你获得了精灵的神奇奖励',
          '神灯精灵来啦~太棒了！你的愿望实现了',
          '哈哈~主人真厉害！精灵为你变出一颗星星',
          '主人~你做得很好！精灵决定多送你一个愿望'
        ],
        encouragements: [
          '叮~加油主人！精灵会一直支持你的',
          '神灯精灵来啦~坚持住！魔法正在生效',
          '哈哈~主人你可以的！相信精灵的魔力',
          '主人~继续努力！你的愿望即将实现'
        ],
        greetings: [
          '叮~主人好！神灯精灵来守护你的眼睛啦',
          '神灯精灵来啦~欢迎回来！今天想许什么愿望呢',
          '哈哈~主人！精灵已经准备好为你服务了'
        ],
        startMonitor: [
          '叮~监测开始！精灵会用魔法守护你的视力',
          '神灯精灵来啦~出发！让魔法保护你的眼睛',
          '哈哈~准备好了主人！精灵的护眼魔法启动'
        ],
        endMonitor: [
          '叮~监测结束！主人做得很棒，精灵很满意',
          '神灯精灵来啦~辛苦了主人！休息一下吧',
          '哈哈~任务完成！精灵为你骄傲'
        ],
        interact: [
          '叮~主人召唤我了吗',
          '神灯精灵来啦~有什么愿望',
          '哈哈~主人你好调皮',
          '主人~精灵随时为你服务'
        ]
      },
      
      // 小黄人风格 - 搞怪可爱，喜欢用"Banana"和奇怪的语气词
      minion: {
        name: '小黄人',
        pitch: 1.25,
        rate: 1.1,
        prefix: ['Bello~', 'Banana~', 'Poopaye~', 'Tulaliloo~'],
        suffix: ['Banana！', 'Bello！', 'Hahaha！', 'Poopaye！'],
        distanceWarnings: [
          'Bello~眼睛离太近啦Banana！快退后退后',
          'Banana~距离警报！Poopaye你要保护眼睛',
          'Tulaliloo~太近太近！小黄人很担心你Bello',
          'Poopaye~快退后！不然我要扔香蕉了Banana'
        ],
        postureWarnings: [
          'Bello~坐姿歪了Banana！挺直身体Poopaye',
          'Banana~头歪了头歪了！Tulaliloo快调整',
          'Poopaye~姿势不对Bello！要像小黄人一样精神',
          'Tulaliloo~坐直坐直！Banana我来帮你'
        ],
        rewards: [
          'Bello Bello~太棒了Banana！奖励你一根香蕉',
          'Banana~恭喜恭喜Poopaye！你是最棒的',
          'Tulaliloo~好厉害Bello！继续保持Banana',
          'Poopaye~你赢了Banana！小黄人为你骄傲'
        ],
        encouragements: [
          'Bello~加油加油Banana！我支持你Poopaye',
          'Banana~坚持住Tulaliloo！胜利就在眼前',
          'Poopaye~你可以的Bello！小黄人相信你',
          'Tulaliloo~冲冲冲Banana！像香蕉一样充满能量'
        ],
        greetings: [
          'Bello Bello~欢迎回来Banana！今天也要开心Poopaye',
          'Banana~我是小黄人Bello！来帮你守护眼睛',
          'Poopaye~见到你真开心Tulaliloo！一起来护眼Banana'
        ],
        startMonitor: [
          'Bello~监测开始Banana！小黄人会陪着你Poopaye',
          'Banana~出发Tulaliloo！让我们保护视力Bello',
          'Poopaye~准备好了Banana！护眼行动开始'
        ],
        endMonitor: [
          'Bello Bello~完成啦Banana！你做得超级棒Poopaye',
          'Banana~辛苦了Tulaliloo！休息一下吃香蕉',
          'Poopaye~任务完成Bello！小黄人为你骄傲Banana'
        ],
        interact: [
          'Bello~你戳我干嘛Banana',
          'Poopaye~好痒痒Tulaliloo',
          'Banana~嘿嘿嘿Bello',
          'Tulaliloo~要香蕉吗Poopaye'
        ]
      },
      
      // 海绵宝宝风格 - 乐观积极，喜欢用"哈哈"和"准备好了吗"
      spongebob: {
        name: '海绵宝宝',
        pitch: 1.2,
        rate: 1.0,
        prefix: ['哈哈~', '准备好了吗~', '我准备好了~', '耶~'],
        suffix: ['哈哈！', '耶！', '太好了！', '棒棒哒！'],
        distanceWarnings: [
          '哈哈~眼睛离太近了！快退后到比奇堡的安全距离',
          '准备好了吗~距离警报！海绵宝宝提醒你远离屏幕',
          '我准备好了~你凑太近啦！要保护好眼睛哦',
          '耶~快退后！不然我要用泡泡包围你了'
        ],
        postureWarnings: [
          '哈哈~坐姿歪了！挺直身体像海绵一样有弹性',
          '准备好了吗~头歪了！快调整姿势耶',
          '我准备好了~姿势不对！要像我一样精神抖擞',
          '耶~坐直坐直！海绵宝宝来帮你矫正'
        ],
        rewards: [
          '哈哈哈~太厉害了！奖励你一个蟹黄堡',
          '准备好了吗~恭喜恭喜！你是最棒的朋友',
          '我准备好了~好棒好棒！继续保持耶',
          '耶~你赢得了海绵宝宝的认可！超级厉害'
        ],
        encouragements: [
          '哈哈~加油加油！海绵宝宝支持你',
          '准备好了吗~坚持住！胜利就在眼前',
          '我准备好了~你可以的！我相信你',
          '耶~冲冲冲！像吹泡泡一样轻松愉快'
        ],
        greetings: [
          '哈哈哈~欢迎来到比奇堡！今天也要开心护眼',
          '准备好了吗~我是海绵宝宝！来帮你守护眼睛',
          '我准备好了~见到你真开心！一起来护眼吧耶'
        ],
        startMonitor: [
          '哈哈~监测开始！海绵宝宝会一直陪着你',
          '准备好了吗~出发！让我们一起保护视力',
          '我准备好了~护眼行动开始！耶'
        ],
        endMonitor: [
          '哈哈哈~完成啦！你做得超级棒',
          '准备好了吗~辛苦了！休息一下吃个蟹黄堡',
          '我准备好了~任务完成！海绵宝宝为你骄傲耶'
        ],
        interact: [
          '哈哈~你戳我干嘛',
          '准备好了吗~好痒痒',
          '我准备好了~嘿嘿嘿',
          '耶~要一起吹泡泡吗'
        ]
      },
      
      // 功夫熊猫风格 - 武术大师，喜欢用"师父"和功夫术语
      kungfupanda: {
        name: '功夫熊猫',
        pitch: 1.0,
        rate: 1.0,
        prefix: ['嘿呀~', '师父说~', '功夫~', '阿宝来了~'],
        suffix: ['嘿！', '呼！', '哈！', '耶！'],
        distanceWarnings: [
          '嘿呀~眼睛离太近了！保持距离是功夫的第一课',
          '师父说~距离太近会伤眼睛！快用功夫退后',
          '功夫~你凑太近啦！让阿宝教你正确的距离',
          '阿宝来了~快退后！不然我要用熊猫功夫推你了'
        ],
        postureWarnings: [
          '嘿呀~坐姿不对！挺直身体像练功夫一样',
          '师父说~姿势歪了！功夫讲究身正心正',
          '功夫~头歪了！让阿宝帮你矫正姿势',
          '阿宝来了~坐直身体！这是功夫的基本功'
        ],
        rewards: [
          '嘿呀~太棒了！你获得了神龙大侠的认可',
          '师父说~恭喜你！你已经掌握了护眼功夫',
          '功夫~好厉害！阿宝为你骄傲',
          '阿宝来了~你做得很好！奖励你一个包子'
        ],
        encouragements: [
          '嘿呀~加油！功夫需要坚持和毅力',
          '师父说~相信自己！你可以做到的',
          '功夫~坚持住！阿宝支持你',
          '阿宝来了~继续努力！你是最棒的'
        ],
        greetings: [
          '嘿呀~欢迎回来！功夫熊猫来守护你的眼睛',
          '师父说~今天也要好好护眼！阿宝陪你一起',
          '功夫~我是阿宝！让我们一起练习护眼功夫'
        ],
        startMonitor: [
          '嘿呀~监测开始！功夫熊猫会保护你的视力',
          '师父说~出发！让我们开始护眼修炼',
          '功夫~准备好了！阿宝的护眼功夫启动'
        ],
        endMonitor: [
          '嘿呀~完成了！你的功夫进步了',
          '师父说~辛苦了！休息一下吃个包子',
          '功夫~任务完成！阿宝为你骄傲'
        ],
        interact: [
          '嘿呀~你戳我干嘛',
          '师父说~要尊重功夫大师',
          '功夫~好痒痒呀',
          '阿宝来了~要一起练功夫吗'
        ]
      },
      
      // 小猪佩奇风格 - 可爱礼貌，喜欢用"哼哼"和家庭称呼
      peppapig: {
        name: '小猪佩奇',
        pitch: 1.2,
        rate: 1.0,
        prefix: ['哼哼~', '佩奇说~', '嘿~', '哦~'],
        suffix: ['哼哼！', '呢~', '哦！', '耶！'],
        distanceWarnings: [
          '哼哼~眼睛离太近了！佩奇提醒你要保持距离哦',
          '佩奇说~距离太近会伤眼睛的！快退后一点呢',
          '嘿~你凑太近啦！让佩奇帮你调整距离',
          '哦~快退后！不然佩奇要告诉猪妈妈了'
        ],
        postureWarnings: [
          '哼哼~坐姿歪了！挺直身体才是好孩子哦',
          '佩奇说~头歪了！快调整姿势呢',
          '嘿~姿势不对！要像佩奇一样坐得端正',
          '哦~坐直坐直！猪妈妈说要保持好姿势'
        ],
        rewards: [
          '哼哼哼~太棒了！佩奇给你一个大大的赞',
          '佩奇说~恭喜你！你做得真好呢',
          '嘿~好厉害！继续保持哦',
          '哦~你赢得了佩奇的小红花！超级棒'
        ],
        encouragements: [
          '哼哼~加油加油！佩奇支持你哦',
          '佩奇说~坚持住！你可以做到的呢',
          '嘿~相信自己！佩奇相信你',
          '哦~继续努力！你是最棒的朋友'
        ],
        greetings: [
          '哼哼~欢迎回来！佩奇来帮你守护眼睛啦',
          '佩奇说~今天也要好好护眼哦！一起加油呢',
          '嘿~我是佩奇！让我们一起保护视力吧'
        ],
        startMonitor: [
          '哼哼~监测开始！佩奇会一直陪着你哦',
          '佩奇说~出发！让我们一起保护眼睛呢',
          '嘿~准备好了！佩奇的护眼行动开始'
        ],
        endMonitor: [
          '哼哼哼~完成啦！你做得超级棒哦',
          '佩奇说~辛苦了！休息一下吧呢',
          '嘿~任务完成！佩奇为你骄傲'
        ],
        interact: [
          '哼哼~你戳我干嘛',
          '佩奇说~好痒痒呢',
          '嘿~嘻嘻嘻',
          '哦~要一起玩泥巴吗'
        ]
      }
    };
    
    // 初始化语音
    this.initVoice();
  }
  
  initVoice() {
    // 等待语音列表加载
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth.getVoices();
        this.selectBestVoice();
      };
    }
    
    // 立即尝试获取
    setTimeout(() => {
      this.voices = this.synth.getVoices();
      this.selectBestVoice();
    }, 100);
  }
  
  selectBestVoice() {
    if (!this.voices || this.voices.length === 0) return;

    // 优先选择中文语音
    const chineseVoices = this.voices.filter(v =>
      v.lang.includes('zh') || v.lang.includes('CN') || v.lang.includes('TW')
    );

    if (chineseVoices.length > 0) {
      // 优先选择高质量语音（通常名称中包含 Premium、Enhanced、Natural 等）
      const premiumVoice = chineseVoices.find(v =>
        v.name.includes('Premium') ||
        v.name.includes('Enhanced') ||
        v.name.includes('Natural') ||
        v.name.includes('Neural') ||
        v.name.includes('Tingting') ||
        v.name.includes('Xiaoxiao') ||
        v.name.includes('Yunxi')
      );

      if (premiumVoice) {
        this.selectedVoice = premiumVoice;
      } else {
        // 其次选择女声（通常更适合卡通风格）
        this.selectedVoice = chineseVoices.find(v =>
          v.name.includes('Female') || v.name.includes('女')
        ) || chineseVoices[0];
      }
    } else {
      this.selectedVoice = this.voices[0];
    }

    console.log('🎤 选择语音:', this.selectedVoice?.name);
    console.log('🎤 可用中文语音:', chineseVoices.map(v => v.name).join(', '));
  }
  
  // 获取当前使用的风格
  getCurrentStyle() {
    if (this.currentStyle === 'random') {
      const styleKeys = Object.keys(this.styles);
      return this.styles[styleKeys[Math.floor(Math.random() * styleKeys.length)]];
    }
    return this.styles[this.currentStyle] || this.styles.doraemon;
  }
  
  // 设置语音风格
  setStyle(style) {
    if (style === 'random' || this.styles[style]) {
      this.currentStyle = style;
      console.log('🎭 语音风格切换为:', style === 'random' ? '随机' : this.styles[style].name);
    }
  }
  
  // 设置音量
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }
  
  // 启用/禁用语音
  setEnabled(enabled) {
    this.enabled = enabled;
  }
  
  // 更新设置（兼容旧接口）
  updateSettings(newSettings) {
    if (newSettings.enabled !== undefined) this.enabled = newSettings.enabled;
    if (newSettings.volume !== undefined) this.volume = newSettings.volume;
    if (newSettings.style !== undefined) this.setStyle(newSettings.style);
    if (newSettings.useTtsApi !== undefined) this.useTtsApi = newSettings.useTtsApi;
    if (newSettings.ttsVoice !== undefined) this.ttsVoice = newSettings.ttsVoice;
  }

  // 检测TTS API是否可用
  async checkTtsApiAvailability() {
    try {
      const response = await fetch('/api/v1/tts/status');
      const result = await response.json();
      // API返回格式: { data: { configured: true } } 或 { configured: true }
      const data = result.data || result;
      this.useTtsApi = data.configured === true;
      console.log('🎤 TTS API状态:', this.useTtsApi ? '可用（阿里云真人语音）' : '不可用（使用浏览器合成语音）');
    } catch (error) {
      this.useTtsApi = false;
      console.log('🎤 TTS API检测失败，使用浏览器合成语音', error);
    }
  }

  // 使用TTS API播放语音
  async speakWithTtsApi(text) {
    // 检查缓存
    const cacheKey = `${text}_${this.ttsVoice}`;
    let audioUrl = this.audioCache.get(cacheKey);

    if (!audioUrl) {
      // 构建API URL
      const params = new URLSearchParams({
        text: text,
        voice: this.ttsVoice
      });
      audioUrl = `${this.ttsApiUrl}?${params.toString()}`;
      console.log('🎤 TTS API请求:', audioUrl);

      // 预加载并缓存
      try {
        const response = await fetch(audioUrl);
        console.log('🎤 TTS API响应状态:', response.status, response.headers.get('content-type'));
        if (response.ok) {
          const blob = await response.blob();
          console.log('🎤 TTS音频大小:', blob.size, 'bytes');
          audioUrl = URL.createObjectURL(blob);
          this.audioCache.set(cacheKey, audioUrl);
        } else {
          const errorText = await response.text();
          console.error('🎤 TTS API返回错误:', response.status, errorText);
          throw new Error('TTS API返回错误');
        }
      } catch (error) {
        console.warn('🎤 TTS API调用失败，降级到浏览器合成语音:', error);
        return false;
      }
    } else {
      console.log('🎤 使用缓存的TTS音频');
    }

    return new Promise((resolve) => {
      const audio = new Audio(audioUrl);
      audio.volume = this.volume;

      audio.onended = () => {
        this.isSpeaking = false;
        // 语音结束时隐藏气泡
        if (window.mascotManager && typeof window.mascotManager.hideSyncBubble === 'function') {
          window.mascotManager.hideSyncBubble();
        }
        // 播放队列中的下一条
        if (this.voiceQueue.length > 0) {
          const next = this.voiceQueue.shift();
          setTimeout(() => this.speak(next.text, next.style), 300);
        }
        resolve(true);
      };

      audio.onerror = () => {
        console.warn('🎤 音频播放失败');
        this.isSpeaking = false;
        if (window.mascotManager && typeof window.mascotManager.hideSyncBubble === 'function') {
          window.mascotManager.hideSyncBubble();
        }
        resolve(false);
      };

      audio.play().catch((error) => {
        console.warn('🎤 音频播放被阻止:', error);
        this.isSpeaking = false;
        resolve(false);
      });
    });
  }

  // 播放语音（主方法）
  async speak(text, style = null) {
    if (!this.enabled) return;

    // 如果正在播放，加入队列
    if (this.isSpeaking) {
      // 限制队列大小为3，防止堆积
      if (this.voiceQueue.length < 3) {
        this.voiceQueue.push({ text, style });
      }
      return;
    }

    this.isSpeaking = true;

    // 同步显示气泡（如果 mascotManager 存在）
    if (window.mascotManager && typeof window.mascotManager.showSyncBubble === 'function') {
      window.mascotManager.showSyncBubble(text);
    }

    console.log('🎤 准备播放语音, useTtsApi:', this.useTtsApi, ', 文本:', text.substring(0, 30));

    // 优先使用TTS API
    if (this.useTtsApi) {
      const success = await this.speakWithTtsApi(text);
      if (success) {
        console.log(`🎤 TTS真人语音播放成功: ${text.substring(0, 20)}...`);
        return;
      }
      console.warn('🎤 TTS播放失败，降级到浏览器合成语音');
      // TTS失败，降级到浏览器合成语音
    }

    // 使用浏览器合成语音
    console.log('🎤 使用浏览器合成语音');
    this.speakWithSynthesis(text, style);
  }

  // 使用浏览器合成语音播放
  speakWithSynthesis(text, style = null) {
    if (!this.synth) {
      this.isSpeaking = false;
      return;
    }

    const currentStyle = style || this.getCurrentStyle();
    const utterance = new SpeechSynthesisUtterance(text);

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.pitch = currentStyle.pitch;
    utterance.rate = currentStyle.rate;
    utterance.volume = this.volume;
    utterance.lang = 'zh-CN';

    utterance.onend = () => {
      this.isSpeaking = false;
      // 语音结束时隐藏气泡
      if (window.mascotManager && typeof window.mascotManager.hideSyncBubble === 'function') {
        window.mascotManager.hideSyncBubble();
      }
      // 播放队列中的下一条
      if (this.voiceQueue.length > 0) {
        const next = this.voiceQueue.shift();
        setTimeout(() => this.speak(next.text, next.style), 300);
      }
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      // 出错时也隐藏气泡
      if (window.mascotManager && typeof window.mascotManager.hideSyncBubble === 'function') {
        window.mascotManager.hideSyncBubble();
      }
      // 出错时也尝试播放下一条
      if (this.voiceQueue.length > 0) {
        const next = this.voiceQueue.shift();
        setTimeout(() => this.speak(next.text, next.style), 300);
      }
    };

    console.log(`🔊 播放语音 [${currentStyle.name}]:`, text);

    this.synth.speak(utterance);
  }
  
  // 从数组中随机选择一条消息
  getRandomMessage(messages) {
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  // 获取时间段问候语
  getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 9) {
      return ['早上好', '早安', '新的一天开始啦'];
    } else if (hour >= 9 && hour < 12) {
      return ['上午好', '今天精神不错哦', '加油工作'];
    } else if (hour >= 12 && hour < 14) {
      return ['中午好', '午餐时间到', '该休息一下了'];
    } else if (hour >= 14 && hour < 18) {
      return ['下午好', '下午也要保持精神', '继续加油'];
    } else if (hour >= 18 && hour < 22) {
      return ['晚上好', '晚上也要注意用眼', '辛苦一天了'];
    } else {
      return ['夜深了', '该休息了', '不要熬夜哦'];
    }
  }
  
  // 根据违规次数调整语气
  getWarningByCount(count, type = 'distance') {
    const style = this.getCurrentStyle();
    let messages;
    
    if (type === 'distance') {
      if (count === 1) {
        // 第一次：温柔提醒
        messages = [
          '注意一下距离哦~',
          '稍微离远一点会更好~',
          '距离有点近了呢~'
        ];
      } else if (count <= 3) {
        // 2-3次：加强提醒
        messages = [
          '又凑近了！要保护好眼睛哦！',
          '这已经是第' + count + '次提醒啦，快调整！',
          '距离真的太近了，快退后！'
        ];
      } else {
        // 4次以上：严肃警告
        messages = [
          '这样下去眼睛会坏掉的！必须调整！',
          '已经提醒' + count + '次了！请认真对待！',
          '非常严重！立刻调整距离！'
        ];
      }
    } else if (type === 'posture') {
      if (count === 1) {
        messages = [
          '坐姿有点歪哦~',
          '调整一下姿势吧~',
          '头有点斜了呢~'
        ];
      } else if (count <= 3) {
        messages = [
          '姿势又歪了！要坐直哦！',
          '第' + count + '次提醒坐姿了！',
          '坐姿不对会影响脊椎的！'
        ];
      } else {
        messages = [
          '坐姿问题很严重！必须改正！',
          '已经' + count + '次了！请重视坐姿！',
          '这样的姿势对身体很不好！'
        ];
      }
    }
    
    const prefix = this.getRandomMessage(style.prefix);
    const suffix = this.getRandomMessage(style.suffix);
    return prefix + this.getRandomMessage(messages) + suffix;
  }
  
  // 根据保持良好习惯的时长给予鼓励
  getEncouragementByDuration(minutes) {
    const style = this.getCurrentStyle();
    let messages;
    
    if (minutes < 5) {
      messages = [
        '不错哦！继续保持~',
        '做得很好！加油~',
        '很棒！就是这样~'
      ];
    } else if (minutes < 15) {
      messages = [
        '已经坚持' + minutes + '分钟了！太棒了！',
        '保持得很好！你真厉害！',
        '继续加油！你是最棒的！'
      ];
    } else if (minutes < 30) {
      messages = [
        '哇！' + minutes + '分钟了！你是护眼小能手！',
        '坚持了这么久！真是太厉害了！',
        '你的毅力让我佩服！继续保持！'
      ];
    } else {
      messages = [
        '天哪！' + minutes + '分钟！你是护眼大师！',
        '不可思议！你的自律性太强了！',
        '你已经是传说级别的护眼达人了！'
      ];
    }
    
    const prefix = this.getRandomMessage(style.prefix);
    return prefix + this.getRandomMessage(messages);
  }
  
  // ===== 各种场景的语音 =====
  
  // 距离警告（支持违规次数参数）
  playDistanceWarning(count = 1) {
    const now = Date.now();
    if (now - this.lastWarningTime < this.warningCooldown) return { text: null };
    this.lastWarningTime = now;
    
    const style = this.getCurrentStyle();
    let message;
    
    // 如果提供了违规次数，使用动态语气
    if (count > 1) {
      message = this.getWarningByCount(count, 'distance');
    } else {
      message = this.getRandomMessage(style.distanceWarnings);
    }
    
    this.speak(message, style);
    return { text: message, style: style.name };
  }
  
  // 姿势警告（支持违规次数参数）
  playPostureWarning(count = 1) {
    const now = Date.now();
    if (now - this.lastWarningTime < this.warningCooldown) return { text: null };
    this.lastWarningTime = now;
    
    const style = this.getCurrentStyle();
    let message;
    
    // 如果提供了违规次数，使用动态语气
    if (count > 1) {
      message = this.getWarningByCount(count, 'posture');
    } else {
      message = this.getRandomMessage(style.postureWarnings);
    }
    
    this.speak(message, style);
    return { text: message, style: style.name };
  }
  
  // 奖励（支持时长参数）
  playReward(minutes = 0) {
    const style = this.getCurrentStyle();
    let message;
    
    // 如果提供了保持时长，使用动态鼓励
    if (minutes > 0) {
      message = this.getEncouragementByDuration(minutes);
    } else {
      message = this.getRandomMessage(style.rewards);
    }
    
    this.speak(message, style);
    return { text: message, style: style.name };
  }
  
  // 鼓励
  playEncouragement(minutes = 0) {
    const style = this.getCurrentStyle();
    let message;
    
    if (minutes > 0) {
      message = this.getEncouragementByDuration(minutes);
    } else {
      message = this.getRandomMessage(style.encouragements);
    }
    
    this.speak(message, style);
    return { text: message, style: style.name };
  }
  
  // 问候（根据时间段）
  playGreeting() {
    const style = this.getCurrentStyle();
    const timeGreeting = this.getRandomMessage(this.getTimeBasedGreeting());
    const styleGreeting = this.getRandomMessage(style.greetings);
    const message = timeGreeting + '！' + styleGreeting;
    this.speak(message, style);
    return { text: message, style: style.name };
  }
  
  // 开始监测
  playStartMonitor() {
    const style = this.getCurrentStyle();
    const message = this.getRandomMessage(style.startMonitor);
    this.speak(message, style);
    return { text: message, style: style.name };
  }
  
  // 结束监测
  playEndMonitor() {
    const style = this.getCurrentStyle();
    const message = this.getRandomMessage(style.endMonitor);
    this.speak(message, style);
    return { text: message, style: style.name };
  }
  
  // 点击互动
  playInteract() {
    const style = this.getCurrentStyle();
    const message = this.getRandomMessage(style.interact);
    this.speak(message, style);
    return { text: message, style: style.name };
  }
  
  // 休息提醒
  playBreakReminder() {
    const style = this.getCurrentStyle();
    const messages = [
      '该休息一下啦！让眼睛放松放松',
      '休息时间到！看看远处，活动活动',
      '辛苦啦！休息一会儿再继续吧'
    ];
    const prefix = this.getRandomMessage(style.prefix);
    const message = prefix + this.getRandomMessage(messages);
    this.speak(message, style);
    return { text: message, style: style.name };
  }
  
  // 自定义消息
  playCustom(text, options = {}) {
    const style = this.getCurrentStyle();
    this.speak(text, style);
    return { text, style: style.name };
  }
  
  // 停止语音
  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

// 创建全局实例
window.voiceReminder = new CartoonVoiceReminder();
console.log('🎤 CartoonVoiceReminder v5.2 已加载 - 支持阿里云TTS真人语音');
