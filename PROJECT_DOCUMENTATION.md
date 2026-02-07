# 🎮 地牢射击游戏 - 详细项目文档

## 📋 项目概述

基于 Phaser 3 开发的 2D Roguelike 地牢射击游戏，具有随机地图生成、多种武器系统、敌人AI、小地图等功能。

---

## 📁 项目结构

```
dungeon-game/
├── index.html                    # 游戏入口页面
├── README.md                     # 基础说明文档
├── PROJECT_DOCUMENTATION.md      # 详细项目文档（本文件）
└── js/
    ├── main.js                   # Phaser配置和游戏初始化
    ├── scenes/
    │   ├── MenuScene.js          # 开始菜单场景
    │   └── DungeonScene.js       # 主游戏场景
    ├── entities/
    │   ├── Player.js             # 玩家类
    │   ├── Bullet.js             # 子弹类
    │   └── Enemy.js              # 敌人类
    └── systems/
        ├── Weapon.js             # 武器系统
        └── DungeonGenerator.js   # 地牢生成器
```

---

## 🎯 核心功能模块

### 1. 场景系统 (Scenes)

#### MenuScene.js - 开始菜单场景
**职责**: 游戏入口界面，显示标题、操作说明和开始按钮

**关键方法**:
- `create()` - 初始化菜单界面
- `createBackground()` - 创建网格背景和粒子效果
- `createTitle()` - 创建游戏标题和副标题
- `createInstructions()` - 创建操作说明面板
- `createStartButton()` - 创建开始游戏按钮
- `createDecorations()` - 创建装饰性粒子动画

**可扩展点**:
```javascript
// 添加新的菜单选项（如设置、排行榜）
createSettingsButton() {
    // 创建设置按钮
}

createLeaderboardButton() {
    // 创建排行榜按钮
}
```

#### DungeonScene.js - 主游戏场景
**职责**: 游戏主逻辑，包含地图生成、实体管理、UI更新

**关键属性**:
```javascript
this.mapWidth = 60;           // 地图宽度（格子数）
this.mapHeight = 45;          // 地图高度（格子数）
this.tileSize = 32;           // 每个格子的大小（像素）
this.difficulty = 1;          // 当前难度
this.score = 0;               // 当前分数
```

**关键方法**:
- `create()` - 初始化游戏场景
- `generateDungeon()` - 生成地牢地图
- `createPlayer()` - 创建玩家
- `spawnEnemy()` - 生成敌人
- `setupUI()` - 设置游戏UI
- `setupMinimap()` - 设置小地图
- `updateMinimap()` - 更新小地图
- `update()` - 每帧更新

---

### 2. 实体系统 (Entities)

#### Player.js - 玩家类
**继承**: `Phaser.GameObjects.Container`

**关键属性**:
```javascript
this.speed = 200;                    // 移动速度
this.maxHealth = 100;                // 最大生命值
this.currentHealth = 100;            // 当前生命值
this.currentWeapon = null;           // 当前武器
this.weapons = [];                   // 武器列表
this.isInvulnerable = false;         // 是否无敌
this.invulnerableTime = 1000;        // 无敌时间（毫秒）
```

**关键方法**:
- `createVisual()` - 创建玩家视觉效果
- `setupWeapons()` - 初始化武器
- `update(time, delta)` - 每帧更新
- `handleMovement()` - 处理移动输入
- `handleWeaponSwitch()` - 处理武器切换
- `handleShooting()` - 处理射击
- `takeDamage(damage)` - 受到伤害
- `switchWeapon(index)` - 切换武器

**扩展指南**:
```javascript
// 添加新技能系统
activateSkill(skillType) {
    switch(skillType) {
        case 'dash':
            this.performDash();
            break;
        case 'heal':
            this.heal(20);
            break;
    }
}

// 添加升级系统
levelUp() {
    this.maxHealth += 10;
    this.speed += 10;
    // 显示升级UI
}
```

#### Enemy.js - 敌人类
**继承**: `Phaser.GameObjects.Container`

**关键属性**:
```javascript
this.config = {
    health: 30,              // 生命值
    maxHealth: 30,           // 最大生命值
    speed: 100,              // 移动速度
    damage: 10,              // 攻击力
    detectionRange: 300,     // 检测范围
    attackRange: 40,         // 攻击范围
    color: 0xe74c3c,         // 颜色
    size: 20,                // 大小
    scoreValue: 10           // 击败得分
};
this.aiState = 'IDLE';       // AI状态: IDLE, CHASE, ATTACK
this.isDead = false;         // 是否死亡
```

**关键方法**:
- `createVisual()` - 创建视觉效果
- `update(player)` - 每帧更新
- `chase(player, dx, dy, distance)` - 追击玩家
- `attack(player)` - 攻击玩家
- `detectObstacle(dirX, dirY)` - 检测障碍物
- `calculateSeparationForce()` - 计算分离力（避免聚集）
- `takeDamage(damage)` - 受到伤害
- `die()` - 死亡处理

**AI状态机**:
```
IDLE (空闲) → 检测到玩家 → CHASE (追击)
CHASE (追击) → 进入攻击范围 → ATTACK (攻击)
ATTACK (攻击) → 玩家离开范围 → CHASE (追击)
```

**扩展指南**:
```javascript
// 添加新AI行为
patrol() {
    // 巡逻行为
}

flee() {
    // 逃跑行为
}

// 添加特殊能力
activateShield() {
    this.hasShield = true;
    // 显示护盾效果
}
```

#### Bullet.js - 子弹类
**继承**: `Phaser.GameObjects.Container`

**关键属性**:
```javascript
this.weaponConfig = config;          // 武器配置
this.damage = config.damage;         // 伤害值
this.speed = config.projectileSpeed; // 速度
this.piercing = config.piercing;     // 是否穿透
this.lifetime = 2000;                // 生命周期（毫秒）
```

**关键方法**:
- `createVisual()` - 创建子弹视觉效果
- `update(time, delta)` - 每帧更新
- `hit(target)` - 命中目标
- `hitWall()` - 命中墙壁

---

### 3. 系统模块 (Systems)

#### Weapon.js - 武器系统
**职责**: 管理武器配置和射击逻辑

**武器预设**:
```javascript
WeaponPresets = {
    PISTOL: {      // 手枪 - 平衡型
        name: '手枪',
        damage: 15,
        fireRate: 400,
        projectileSpeed: 600,
        projectileSize: 4,
        spread: 3,
        piercing: false,
        autoFire: false,
        projectileCount: 1
    },
    MACHINE_GUN: { // 机枪 - 高射速
        name: '机枪',
        damage: 8,
        fireRate: 100,
        projectileSpeed: 700,
        projectileSize: 3,
        spread: 8,
        piercing: false,
        autoFire: true,
        projectileCount: 1
    },
    SHOTGUN: {     // 霰弹枪 - 散射
        name: '霰弹枪',
        damage: 12,
        fireRate: 800,
        projectileSpeed: 500,
        projectileSize: 4,
        spread: 15,
        piercing: false,
        autoFire: false,
        projectileCount: 5
    },
    SNIPER: {      // 狙击枪 - 高伤害穿透
        name: '狙击枪',
        damage: 50,
        fireRate: 1200,
        projectileSpeed: 1000,
        projectileSize: 5,
        spread: 0,
        piercing: true,
        autoFire: false,
        projectileCount: 1
    },
    LASER: {       // 激光枪 - 超高速
        name: '激光枪',
        damage: 20,
        fireRate: 200,
        projectileSpeed: 1200,
        projectileSize: 3,
        spread: 2,
        piercing: true,
        autoFire: true,
        projectileCount: 1
    },
    ROCKET_LAUNCHER: {  // 火箭筒 - 爆炸伤害
        name: '火箭筒',
        damage: 100,
        fireRate: 1500,
        projectileSpeed: 400,
        projectileSize: 12,
        spread: 5,
        piercing: false,
        autoFire: false,
        projectileCount: 1,
        explosive: true,
        explosionRadius: 100
    }
}
```

**扩展指南**:
```javascript
// 添加新武器
ROCKET_LAUNCHER: {
    name: '火箭筒',
    damage: 100,
    fireRate: 1500,
    projectileSpeed: 400,
    projectileSize: 12,
    spread: 5,
    piercing: false,
    autoFire: false,
    projectileCount: 1,
    explosive: true,        // 爆炸效果
    explosionRadius: 100
}
```

#### DungeonGenerator.js - 地牢生成器
**职责**: 使用 Random Walker 算法生成随机地牢

**关键属性**:
```javascript
this.roomCount = 20;              // 房间数量
this.roomMinSize = 5;             // 房间最小尺寸
this.roomMaxSize = 10;            // 房间最大尺寸
this.extraCorridorChance = 0.5;   // 额外走廊概率
this.corridorWidth = 2;           // 走廊宽度
```

**地图图块类型**:
- `0` - 墙壁（不可通行）
- `1` - 房间地板
- `2` - 走廊

**关键方法**:
- `generate()` - 生成完整地图
- `generateRooms()` - 生成房间
- `connectRooms()` - 连接房间
- `createHorizontalCorridor()` - 创建水平走廊
- `createVerticalCorridor()` - 创建垂直走廊
- `getRandomEmptyPosition()` - 获取随机空位

**扩展指南**:
```javascript
// 添加特殊房间
generateSpecialRoom(type) {
    switch(type) {
        case 'treasure':
            // 生成宝藏房
            break;
        case 'boss':
            // 生成Boss房
            break;
        case 'shop':
            // 生成商店
            break;
    }
}

// 添加陷阱
generateTraps() {
    // 在地图上随机生成陷阱
}
```

---

## 🎨 视觉系统

### 颜色配置

| 元素 | 颜色值 | 说明 |
|------|--------|------|
| 玩家 | `0x3498db` (蓝色) | 玩家角色 |
| 敌人-普通 | `0xe74c3c` (红色) | 普通敌人 |
| 敌人-坦克 | `0x8e44ad` (紫色) | 高血量敌人 |
| 敌人-快速 | `0xf39c12` (橙色) | 高速敌人 |
| 敌人-精英 | `0x27ae60` (绿色) | 平衡型敌人 |
| 墙壁 | `0x1a1a2e` (深蓝黑) | 墙壁主体 |
| 房间地板 | `0x4a5a6a` (灰蓝) | 房间地面 |
| 走廊 | `0x5a6a7a` (浅灰蓝) | 走廊地面 |
| 子弹-手枪 | `0xf1c40f` (黄色) | 手枪子弹 |
| 子弹-机枪 | `0xe67e22` (橙色) | 机枪子弹 |
| 子弹-霰弹 | `0xc0392b` (深红) | 霰弹 |
| 子弹-狙击 | `0x9b59b6` (紫色) | 狙击子弹 |
| 子弹-激光 | `0x00ff00` (绿色) | 激光 |
| 子弹-火箭筒 | `0xff4400` (橙红) | 火箭弹 |

### 小地图颜色

| 元素 | 颜色值 |
|------|--------|
| 墙壁 | `0x333333` |
| 房间 | `0x666666` |
| 走廊 | `0x888888` |
| 玩家 | `0x00ff00` |
| 敌人 | `0xff0000` |

---

## 🎮 游戏机制详解

### 难度系统

```javascript
// 初始设置
const enemyCount = 5 + this.difficulty * 2;  // 初始敌人数量

// 难度增长
每 30 秒 difficulty++
敌人属性增长:
- 生命值: health * (1 + difficulty * 0.2)
- 攻击力: damage * (1 + difficulty * 0.1)
```

### 分数系统

| 敌人类型 | 基础分数 |
|----------|----------|
| 普通 (红色) | 10 |
| 坦克 (紫色) | 20 |
| 快速 (橙色) | 15 |
| 精英 (绿色) | 18 |

### 生成系统

```javascript
// 敌人生成间隔
this.enemySpawnTimer = this.time.addEvent({
    delay: 10000,  // 每10秒
    callback: () => { this.spawnEnemy(); }
});

// 难度提升间隔
每 30000ms (30秒) difficulty++
```

---

## 🔧 扩展开发指南

### 1. 添加新场景

创建新场景文件 `js/scenes/NewScene.js`:

```javascript
class NewScene extends Phaser.Scene {
    constructor() {
        super({ key: 'NewScene' });
    }

    create() {
        // 场景初始化
    }

    update(time, delta) {
        // 每帧更新
    }
}
```

在 `index.html` 中添加引用:
```html
<script src="js/scenes/NewScene.js"></script>
```

在 `main.js` 中注册场景:
```javascript
scene: [MenuScene, DungeonScene, NewScene]
```

### 2. 添加道具系统

创建 `js/entities/Item.js`:

```javascript
class Item extends Phaser.GameObjects.Container {
    constructor(scene, x, y, type) {
        super(scene, x, y);
        this.itemType = type;
        this.createVisual();
    }

    createVisual() {
        // 根据类型创建不同外观
        switch(this.itemType) {
            case 'health':
                // 生命药水 - 红色十字
                break;
            case 'ammo':
                // 弹药包 - 黄色子弹
                break;
            case 'speed':
                // 速度提升 - 蓝色靴子
                break;
        }
    }

    applyEffect(player) {
        switch(this.itemType) {
            case 'health':
                player.heal(25);
                break;
            case 'ammo':
                // 补充弹药
                break;
            case 'speed':
                player.speedBoost(1.5, 5000); // 1.5倍速，持续5秒
                break;
        }
    }
}
```

在 `DungeonScene.js` 中添加生成逻辑:

```javascript
spawnItem() {
    const pos = this.getRandomSpawnPosition();
    const itemTypes = ['health', 'ammo', 'speed'];
    const type = itemTypes[Phaser.Math.Between(0, itemTypes.length - 1)];
    
    const item = new Item(this, pos.x, pos.y, type);
    this.items.add(item);
}

// 在 setupPhysicsGroups 中添加碰撞检测
this.physics.add.overlap(this.player, this.items, (player, item) => {
    item.applyEffect(player);
    item.destroy();
});
```

### 3. 添加Boss战

在 `Enemy.js` 中添加Boss类型:

```javascript
// 在 spawnEnemy 中添加Boss生成逻辑
spawnBoss() {
    const bossConfig = {
        health: 500,
        maxHealth: 500,
        speed: 80,
        damage: 30,
        color: 0x8e44ad,
        size: 40,
        scoreValue: 100,
        isBoss: true
    };
    
    const boss = new Enemy(this, pos.x, pos.y, bossConfig);
    boss.bossPhase = 1;
    this.enemies.add(boss);
}

// 在 Enemy.js 中添加Boss特殊行为
bossBehavior() {
    if (this.config.isBoss) {
        // 根据血量切换阶段
        const healthPercent = this.currentHealth / this.config.maxHealth;
        
        if (healthPercent < 0.3 && this.bossPhase === 2) {
            this.bossPhase = 3;
            this.enterPhase3();
        } else if (healthPercent < 0.6 && this.bossPhase === 1) {
            this.bossPhase = 2;
            this.enterPhase2();
        }
    }
}
```

### 4. 添加存档系统

```javascript
// 保存游戏
saveGame() {
    const saveData = {
        score: this.score,
        difficulty: this.difficulty,
        playerHealth: this.player.currentHealth,
        unlockedWeapons: this.unlockedWeapons,
        timestamp: Date.now()
    };
    
    localStorage.setItem('dungeonGameSave', JSON.stringify(saveData));
}

// 加载游戏
loadGame() {
    const saveData = JSON.parse(localStorage.getItem('dungeonGameSave'));
    if (saveData) {
        this.score = saveData.score;
        this.difficulty = saveData.difficulty;
        // 恢复其他数据
    }
}
```

### 5. 添加音效系统

```javascript
// 在 main.js 中配置音频
const config = {
    // ... 其他配置
    audio: {
        disableWebAudio: false
    }
};

// 创建音频管理器
class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.sounds = {};
        this.loadSounds();
    }

    loadSounds() {
        this.scene.load.audio('shoot', 'assets/sounds/shoot.mp3');
        this.scene.load.audio('hit', 'assets/sounds/hit.mp3');
        this.scene.load.audio('explosion', 'assets/sounds/explosion.mp3');
        this.scene.load.audio('bgm', 'assets/sounds/background.mp3');
    }

    play(key, config = {}) {
        if (this.sounds[key]) {
            this.sounds[key].play(config);
        }
    }

    playBGM() {
        this.sounds['bgm'].play({ loop: true, volume: 0.5 });
    }
}
```

---

## 🐛 调试技巧

### 启用物理调试

```javascript
// 在 main.js 中
physics: {
    arcade: {
        debug: true,  // 显示碰撞框
        // ...
    }
}
```

### 显示FPS

```javascript
// 在 create 方法中
this.fpsText = this.add.text(10, 10, 'FPS: 0', {
    fontSize: '16px',
    fill: '#00ff00'
});
this.fpsText.setScrollFactor(0);

// 在 update 方法中
this.fpsText.setText('FPS: ' + Math.round(this.game.loop.actualFps));
```

### 地图调试输出

```javascript
// 在 DungeonGenerator.js 中
debugPrint() {
    let output = '';
    for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
            const tile = this.map[y][x];
            if (tile === 0) output += '#';
            else if (tile === 1) output += '.';
            else if (tile === 2) output += '+';
        }
        output += '\n';
    }
    console.log(output);
}
```

---

## 📊 性能优化建议

1. **对象池**: 对于频繁创建销毁的对象（子弹、敌人），使用对象池复用
2. **视锥剔除**: 只渲染屏幕内的对象
3. **减少物理体**: 合并相邻的墙壁为一个大的物理体
4. **纹理图集**: 如果使用图片资源，使用纹理图集减少 draw call
5. **延迟加载**: 大场景可以分块加载

---

## 📝 版本历史

### v1.1.0 (当前版本)
- ✅ 新增火箭筒武器
  - 爆炸伤害机制
  - 范围伤害效果
  - 屏幕震动反馈
  - 烟雾拖尾视觉效果
- ✅ 6种武器系统（原5种+火箭筒）
- ✅ 武器切换支持数字键1-6

### v1.0.0 
- ✅ 基础游戏框架
- ✅ 5种武器系统
- ✅ 敌人AI和追击系统
- ✅ 随机地牢生成
- ✅ 小地图功能
- ✅ 开始菜单界面
- ✅ 难度和分数系统

### 计划功能
- [ ] 道具系统
- [ ] Boss战
- [ ] 存档系统
- [ ] 音效和音乐
- [ ] 多人联机
- [ ] 成就系统

---

## 🤝 开发建议

1. **代码规范**: 遵循现有代码风格，使用 JSDoc 注释
2. **模块化**: 新功能尽量封装成独立模块
3. **测试**: 在添加新功能后进行全面测试
4. **文档**: 更新本文档记录新功能
5. **版本控制**: 建议使用 Git 进行版本管理

---

**享受开发！🎮⚔️**




## 更多肉鸽元素设计（新增）

在现有 Roguelike 地牢射击基础上，补充更“肉鸽化”的成长、随机、取舍与长线推进机制。

### 1) 祝福 / 遗物系统（Run 内永久生效）
**目标**：用随机祝福与遗物构建 Build，多次 Run 保持高重玩。

**机制要点**：
- 祝福（Blessing）：每次房间奖励 3 选 1
- 遗物（Relic）：稀有掉落或商店购买，强力且稀有
- 标签与触发：`onHit` / `onKill` / `onCrit` / `onTakeDamage`
- 稀有度：`common` / `rare` / `legend`

**建议结构**：
```javascript
// js/systems/BlessingSystem.js
const BlessingPresets = {
  CRIT_CHAIN: { name: '连锁暴击', rarity: 'rare', tags: ['crit','chain'], onCrit: { extraShots: 1 } },
  BULLET_SPLIT: { name: '弹裂', rarity: 'common', tags: ['projectile'], onHit: { split: 2 } },
  BLOOD_OATH: { name: '血契', rarity: 'legend', tags: ['risk','power'], onTakeDamage: { dmgBoost: 0.2 } }
};
```

### 2) 武器模块 / 组件改造
**目标**：让武器不是固定数值，而是可改造的成长路径。

**机制要点**：
- 每把武器有 2-3 个模块槽位
- 模块修改 `fireRate` / `damage` / `projectileCount` / `onHit`
- 模块可从房间奖励或商店获得

**接口建议**：
```javascript
// js/systems/Weapon.js
this.modules = []; // 2-3 个模块
applyModule(module) {
  // 改写 fireRate / damage / projectileCount / onHit
}
```

### 3) 房间类型 / 事件房
**目标**：让关卡节奏更有变化，不只是战斗房。

**建议房间**：
- 事件房（文字选择+奖励/惩罚）
- 祭坛房（献祭生命换强力增益）
- 诅咒房（随机负面换更高奖励）
- 宝箱房（资源/模块/遗物）
- 商店房（金币购买）

**实现方向**：
- `DungeonGenerator.js` 增加房间类型字段
- 进入房间后触发 UI 事件选择

### 4) 精英 / 词缀系统
**目标**：强化难度波动与战斗差异化。

**机制要点**：
- Boss 30% 血量变招
- 精英怪带 1-2 个词缀（如狂怒、护盾、吸血）

**接口建议**：
```javascript
// js/entities/Enemy.js
this.affixes = ['RAGE', 'SHIELD'];
applyAffixes() { /* 强化数值 / 行为 */ }
```

### 5) 风险与取舍体系
**目标**：肉鸽核心“强风险 / 强收益”体验。

**可选机制**：
- 生命换火力（低血状态输出更高）
- 诅咒祝福（获得强祝福但引入负面）
- 金币与血量二选一奖励

### 6) 元进程 / 解锁
**目标**：Run 之间保留长期目标与成长。

**方向**：
- 永久解锁祝福池 / 模块池
- 初始武器与角色天赋解锁
- 失败仍可获得材料用于解锁

---

## 技术落点（建议新增文件）

1. **新系统**
   - `js/systems/BlessingSystem.js`
   - `js/systems/RelicSystem.js`
   - `js/systems/RoomTypeSystem.js`

2. **场景扩展**
   - `js/scenes/DungeonScene.js` 增加房间类型 + 事件 UI + 奖励 UI

3. **实体扩展**
   - `js/entities/Player.js` 增加 onHit / onKill / onCrit 回调
   - `js/systems/Weapon.js` 支持模块应用
   - `js/entities/Enemy.js` 支持精英词缀

4. **UI**
   - 祝福 3 选 1 面板
   - 事件选择弹窗 / 商店 UI

---
