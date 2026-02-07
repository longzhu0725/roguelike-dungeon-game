# 🎮 2D Roguelike 地牢射击游戏

基于 Phaser 3 开发的 Roguelike 地牢射击游戏，类似于《元气骑士》的玩法。

## 🚀 快速开始

### 方法一：直接打开（推荐本地服务器）
1. 进入 `dungeon-game` 目录
2. 使用本地服务器运行（因为使用了 ES6 模块）：
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (需要安装 http-server)
   npx http-server -p 8000
   
   # VS Code Live Server 插件
   # 直接在 VS Code 中右键 index.html → "Open with Live Server"
   ```
3. 浏览器访问 `http://localhost:8000`

### 方法二：本地直接打开（可能有跨域限制）
双击 `index.html` 文件直接在浏览器中打开。
**注意**：由于浏览器安全策略，直接打开可能会有跨域问题，推荐使用本地服务器方式。

## 🎯 游戏操作

| 操作 | 按键/动作 |
|------|-----------|
| **移动** | `W`, `A`, `S`, `D` 或方向键 ↑↓←→ |
| **瞄准** | 鼠标移动 |
| **射击** | 鼠标左键 |
| **切换武器** | 数字键 `1-5` |

## ⚔️ 武器系统

游戏包含5种预设武器，每种都有不同的特点：

1. **手枪** (`1`) - 平衡型武器，适合入门
2. **机枪** (`2`) - 高射速连发，按住鼠标连续射击
3. **霰弹枪** (`3`) - 多发散射，近距离伤害高
4. **狙击枪** (`4`) - 高伤害穿透型，一枪多敌
5. **激光枪** (`5`) - 超高速穿透，激光效果

### 武器属性
- **伤害 (Damage)**: 每次命中造成的伤害值
- **射速 (Fire Rate)**: 每次射击的间隔时间（毫秒）
- **弹道速度 (Projectile Speed)**: 子弹飞行速度
- **散射 (Spread)**: 子弹的随机偏移角度
- **穿透 (Piercing)**: 是否能穿透多个敌人

## 🏰 地牢生成

使用 **Random Walker 算法** 随机生成地牢：

- 地图尺寸：60×45 图块
- 随机生成 15 个房间
- 房间大小：3-6 图块
- L形走廊连接房间
- 随机添加额外走廊增加连通性

### 地图图块类型
- **# 墙壁** - 不可通过，阻挡子弹和移动
- **. 房间地板** - 可通行，深灰色
- **+ 走廊** - 可通行，稍浅灰色

## 🎨 美术风格

由于使用几何图形代替图片资源：

- **玩家**: 蓝色圆形 + 眼睛 + 武器
- **敌人**: 彩色方形 + 眼睛
  - 红色：普通敌人
  - 紫色：坦克型（血多速度慢）
  - 橙色：快速型（血少速度快）
  - 绿色：精英型（平衡）
- **子弹**: 不同颜色的细长矩形
- **墙壁**: 深蓝灰色方块

## 🧩 项目结构

```
dungeon-game/
├── index.html                    # 游戏入口
├── README.md                     # 说明文档
└── js/
    ├── main.js                   # Phaser配置和游戏初始化
    ├── scenes/
    │   └── DungeonScene.js       # 主游戏场景
    ├── entities/
    │   ├── Player.js             # 玩家类（8方向移动+鼠标瞄准）
    │   ├── Bullet.js             # 子弹类
    │   └── Enemy.js              # 敌人类（简单AI）
    └── systems/
        ├── Weapon.js             # 武器系统（可配置）
        └── DungeonGenerator.js   # 地牢生成器（Random Walker）
```

## 🎮 游戏机制

### 玩家
- 8方向移动（支持斜向）
- 基于鼠标位置的武器旋转
- 血条显示和受伤无敌时间
- 武器冷却可视化

### 敌人AI
- **空闲 (IDLE)**: 原地不动
- **追击 (CHASE)**: 检测到玩家后追击
- **攻击 (ATTACK)**: 进入攻击范围后造成伤害
- 简单的寻路和碰撞避免

### 难度系统
- 初始生成 5 个敌人
- 每 10 秒生成新敌人
- 每 30 秒增加难度（敌人数值提升）

### 分数系统
- 击败敌人获得分数
- 不同类型敌人分数不同
- 游戏结束后显示最终分数

## 🔧 扩展建议

### 添加新武器
在 `Weapon.js` 中的 `WeaponPresets` 对象添加：

```javascript
MY_NEW_WEAPON: {
    name: '新武器',
    damage: 25,
    fireRate: 500,
    projectileSpeed: 800,
    projectileSize: 5,
    spread: 5,
    piercing: false,
    autoFire: false,
    projectileCount: 1
}
```

### 调整地牢大小
在 `DungeonScene.js` 中修改：
```javascript
this.mapWidth = 80;      // 增加宽度
this.mapHeight = 60;     // 增加高度
this.tileSize = 24;      // 减小图块大小
```

### 添加更多敌人类型
在 `DungeonScene.js` 的 `spawnEnemy` 方法中添加新配置：

```javascript
const enemyTypes = [
    // ... 现有类型
    { 
        health: 100, 
        speed: 60, 
        damage: 20, 
        color: 0x000000, 
        size: 30, 
        scoreValue: 50 
    }, // Boss型
];
```

### 添加道具系统
1. 创建 `Item.js` 类
2. 在 `DungeonScene` 中添加道具生成逻辑
3. 实现碰撞检测和效果应用

## 📚 技术栈

- **Phaser 3** - 游戏引擎（v3.70.0）
- **Arcade Physics** - 物理引擎
- **原生 JavaScript** - 无框架依赖
- **Canvas API** - 图形渲染

## 🐛 已知问题

1. **本地文件限制**: 直接打开 HTML 可能无法加载 JS 模块（需要本地服务器）
2. **移动设备**: 未适配触摸屏操作（仅支持键盘+鼠标）
3. **音效**: 未添加音效系统（可自行扩展）

## 📝 许可证

本项目仅供学习参考。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🎉 享受游戏！

开始你的地牢冒险吧！🏰⚔️
