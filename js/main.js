/**
 * 游戏主入口 - Phaser 3 配置
 * 初始化游戏实例，设置物理引擎
 */

const config = {
    type: Phaser.AUTO,  // 自动选择WebGL或Canvas
    width: 1024,        // 游戏宽度
    height: 768,        // 游戏高度
    parent: 'game-container', // 父容器ID
    backgroundColor: '#1a1a2e', // 深色背景
    
    // 物理引擎配置
    physics: {
        default: 'arcade',  // 使用Arcade物理引擎
        arcade: {
            gravity: { y: 0, x: 0 },  // 无重力（俯视视角）
            debug: false,              // 是否显示调试边框
            // 物理引擎优化
            fps: 60,
            timeScale: 1,
            maxSubSteps: 5,
            tileBias: 16
        }
    },
    
    // 启用输入系统
    input: {
        mouse: {
            preventDefaultWheel: false,
            preventDefaultDown: false,
            preventDefaultMove: false
        }
    },
    
    // 场景列表
    scene: [MenuScene, DungeonScene],
    
    // 渲染配置
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    
    // 像素艺术风格（如果使用像素图）
    pixelArt: false,
    antialias: true
};

// 创建游戏实例
const game = new Phaser.Game(config);

// 全局游戏状态（可选，用于跨场景数据共享）
game.global = {
    playerHealth: 100,
    score: 0,
    level: 1,
    weapons: [],
    currentWeapon: null
};

// 游戏启动完成回调
game.events.on('ready', () => {
    console.log('🎮 地牢射击游戏已启动！');
    console.log('操作说明：');
    console.log('- WASD: 8方向移动');
    console.log('- 鼠标移动: 瞄准方向');
    console.log('- 鼠标左键: 射击');
});

// 窗口大小改变时重新调整
game.events.on('resize', (gameSize) => {
    console.log('窗口大小改变:', gameSize.width, 'x', gameSize.height);
});
