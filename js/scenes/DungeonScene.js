/**
 * 地牢场景 - 主游戏场景
 * 整合地牢生成、玩家控制、敌人、碰撞检测等所有系统
 */

class DungeonScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DungeonScene' });
        
        // 地图配置（这些不需要重置）
        this.mapWidth = 60;
        this.mapHeight = 45;
        this.tileSize = 32;
    }
    
    init() {
        // 初始化游戏状态（每次场景启动时都会调用）
        this.score = 0;
        this.isGameOver = false;
        this.difficulty = 1;
        this.lastDifficultyIncrease = 0;
        this.enemySpawnTimer = null;
        this.killCount = 0;
        this.moduleRewardInterval = 8;
        this.isRewarding = false;
        this.rewardOverlay = null;
        this.rewardButtons = [];
    }
    
    preload() {
        console.log('游戏场景初始化中...');
    }
    
    create() {
        // 恢复物理引擎（如果之前被暂停）
        if (this.physics && this.physics.world) {
            this.physics.world.resume();
        }
        
        // 生成地牢
        this.generateDungeon();
        
        // 创建玩家
        this.createPlayer();
        
        // 创建物理组
        this.setupPhysicsGroups();
        
        // 设置碰撞检测
        this.setupCollisions();
        
        // 创建敌人
        this.spawnInitialEnemies();
        
        // 设置UI
        this.setupUI();
        
        // 设置相机
        this.setupCamera();
        
        // 设置定时生成敌人
        this.setupEnemySpawner();

        this.input.keyboard.on('keydown-M', () => {
            if (!this.isGameOver) this.showModuleReward();
        });
        
        console.log('🎮 游戏开始！');
    }

    onEnemyKilled(enemy) {
        if (this.isGameOver || this.isRewarding) return;
        this.killCount++;
        if (this.killText) {
            const next = this.moduleRewardInterval - (this.killCount % this.moduleRewardInterval);
            const remain = next === this.moduleRewardInterval ? 0 : next;
            this.killText.setText(`击杀: ${this.killCount} | 下一次模块: ${remain}`);
        }
        if (this.killCount % this.moduleRewardInterval === 0) {
            this.showModuleReward();
        }
    }
    
    generateDungeon() {
        const generator = new DungeonGenerator(
            this.mapWidth,
            this.mapHeight,
            this.tileSize
        );
        
        this.dungeonData = generator.generate();
        this.mapContainer = this.add.container(0, 0);
        this.walls = this.physics.add.staticGroup();
        this.floors = this.add.group();
        
        this.renderMap();
        this.playerStartPos = this.dungeonData.playerStart;
    }
    
    renderMap() {
        const map = this.dungeonData.map;
        
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tileType = map[y][x];
                const pixelX = x * this.tileSize + this.tileSize / 2;
                const pixelY = y * this.tileSize + this.tileSize / 2;
                
                if (tileType === 0) {
                    this.createWall(pixelX, pixelY);
                } else {
                    this.createFloor(pixelX, pixelY, tileType);
                }
            }
        }
    }
    
    createWall(x, y) {
        // 墙壁主体 - 使用更深的颜色增强对比度
        const wall = this.add.rectangle(x, y, this.tileSize, this.tileSize, 0x1a1a2e);
        wall.setStrokeStyle(3, 0x0f0f1a); // 更深的边框
        this.mapContainer.add(wall);
        
        // 添加内部高光效果，增强立体感
        const innerHighlight = this.add.rectangle(x - 2, y - 2, this.tileSize - 6, this.tileSize - 6, 0x252538);
        this.mapContainer.add(innerHighlight);
        
        // 添加阴影效果
        const shadow = this.add.rectangle(x + 3, y + 3, this.tileSize, this.tileSize, 0x000000, 0.3);
        shadow.setDepth(-1); // 确保阴影在墙壁下方
        this.mapContainer.add(shadow);
        
        const wallBody = this.physics.add.staticBody(x - this.tileSize/2, y - this.tileSize/2, this.tileSize, this.tileSize);
        this.walls.add(wall);
    }
    
    createFloor(x, y, type) {
        // 使用更亮的颜色增强对比度
        const color = type === 1 ? 0x4a5a6a : 0x5a6a7a; // 房间和走廊使用不同的亮色
        const floor = this.add.rectangle(x, y, this.tileSize - 2, this.tileSize - 2, color);
        this.mapContainer.add(floor);
        this.floors.add(floor);
        
        // 添加地板纹理/网格线效果
        const gridLine = this.add.rectangle(x, y, this.tileSize - 2, 1, 0x6a7a8a, 0.3);
        this.mapContainer.add(gridLine);
        
        const gridLine2 = this.add.rectangle(x, y, 1, this.tileSize - 2, 0x6a7a8a, 0.3);
        this.mapContainer.add(gridLine2);
    }
    
    createPlayer() {
        const startPos = this.playerStartPos;
        this.player = new Player(this, startPos.x, startPos.y);
        this.physics.world.setBounds(0, 0, this.mapWidth * this.tileSize, this.mapHeight * this.tileSize);
    }
    
    setupPhysicsGroups() {
        this.bullets = this.add.group();
        this.enemies = this.add.group();
    }
    
    setupCollisions() {
        this.physics.add.collider(this.bullets, this.walls, (bullet, wall) => {
            if (bullet.hitWall) bullet.hitWall();
        });
        
        this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
            if (bullet.hit) bullet.hit(enemy);
        });
        
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.enemies, this.enemies);
    }
    
    spawnInitialEnemies() {
        const enemyCount = 5 + this.difficulty * 2;
        for (let i = 0; i < enemyCount; i++) {
            this.spawnEnemy();
        }
    }
    
    getRandomSpawnPosition() {
        if (this.dungeonData.rooms.length < 2) return null;
        const randomRoom = this.dungeonData.rooms[Phaser.Math.Between(1, this.dungeonData.rooms.length - 1)];
        return {
            x: (randomRoom.centerX + Phaser.Math.Between(-1, 1)) * this.tileSize + this.tileSize / 2,
            y: (randomRoom.centerY + Phaser.Math.Between(-1, 1)) * this.tileSize + this.tileSize / 2
        };
    }
    
    spawnEnemy() {
        const pos = this.getRandomSpawnPosition();
        if (!pos) return;
        
        const enemyTypes = [
            { health: 30, speed: 100, damage: 10, color: 0xe74c3c, size: 20, scoreValue: 10 },
            { health: 50, speed: 80, damage: 15, color: 0x8e44ad, size: 24, scoreValue: 20 },
            { health: 20, speed: 150, damage: 8, color: 0xf39c12, size: 16, scoreValue: 15 },
            { health: 40, speed: 120, damage: 12, color: 0x27ae60, size: 22, scoreValue: 18 }
        ];
        
        const baseType = enemyTypes[Phaser.Math.Between(0, enemyTypes.length - 1)];
        const type = { ...baseType };
        type.health *= (1 + this.difficulty * 0.2);
        type.damage *= (1 + this.difficulty * 0.1);
        
        const enemy = new Enemy(this, pos.x, pos.y, type);
        this.enemies.add(enemy);
    }
    
    setupUI() {
        this.scoreText = this.add.text(20, 20, '分数: 0', {
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        this.scoreText.setScrollFactor(0);
        this.scoreText.setDepth(1000);
        
        this.weaponText = this.add.text(20, 50, '武器: 手枪 (按1-5切换)', {
            fontSize: '16px',
            fill: '#f1c40f'
        });
        this.weaponText.setScrollFactor(0);
        this.weaponText.setDepth(1000);

        this.killText = this.add.text(20, 75, `击杀: ${this.killCount} | 下一次模块: ${this.moduleRewardInterval}`, {
            fontSize: '14px',
            fill: '#9b59b6'
        });
        this.killText.setScrollFactor(0);
        this.killText.setDepth(1000);
        
        this.controlsText = this.add.text(20, this.scale.height - 60, 
            'WASD移动 | 鼠标瞄准 | 左键射击', {
            fontSize: '14px',
            fill: '#95a5a6'
        });
        this.controlsText.setScrollFactor(0);
        this.controlsText.setDepth(1000);
        
        this.difficultyText = this.add.text(this.scale.width - 150, 20, `难度: ${this.difficulty}`, {
            fontSize: '18px',
            fill: '#e74c3c',
            fontStyle: 'bold'
        });
        this.difficultyText.setScrollFactor(0);
        this.difficultyText.setDepth(1000);
        
        // 初始化小地图
        this.setupMinimap();
    }
    
    /**
     * 设置小地图
     */
    setupMinimap() {
        // 小地图配置
        this.minimapSize = 150; // 小地图显示区域大小（像素）
        this.minimapScale = 0.15; // 缩放比例
        this.minimapRange = 15; // 显示的格子范围（半径）
        
        // 小地图位置（右上角）
        const minimapX = this.scale.width - this.minimapSize / 2 - 20;
        const minimapY = this.minimapSize / 2 + 60;
        
        // 小地图背景
        this.minimapBg = this.add.rectangle(minimapX, minimapY, this.minimapSize + 10, this.minimapSize + 10, 0x000000, 0.8);
        this.minimapBg.setScrollFactor(0);
        this.minimapBg.setDepth(900);
        
        // 小地图边框
        this.minimapBorder = this.add.rectangle(minimapX, minimapY, this.minimapSize + 10, this.minimapSize + 10);
        this.minimapBorder.setStrokeStyle(3, 0xffffff);
        this.minimapBorder.setScrollFactor(0);
        this.minimapBorder.setDepth(901);
        
        // 小地图容器（用于存放所有小地图元素）
        this.minimapContainer = this.add.container(minimapX, minimapY);
        this.minimapContainer.setScrollFactor(0);
        this.minimapContainer.setDepth(902);
        
        // 小地图标题
        this.minimapTitle = this.add.text(minimapX, minimapY - this.minimapSize / 2 - 15, '小地图', {
            fontSize: '12px',
            fill: '#ffffff'
        });
        this.minimapTitle.setOrigin(0.5);
        this.minimapTitle.setScrollFactor(0);
        this.minimapTitle.setDepth(903);
    }
    
    setupCamera() {
        this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
        this.cameras.main.setBounds(0, 0, this.mapWidth * this.tileSize, this.mapHeight * this.tileSize);
        this.cameras.main.setViewport(0, 0, this.scale.width, this.scale.height);
        this.cameras.main.setBackgroundColor('#1a1a2e');
    }
    
    setupEnemySpawner() {
        this.lastDifficultyIncrease = 0;
        this.enemySpawnTimer = this.time.addEvent({
            delay: 10000,
            callback: () => {
                if (!this.isGameOver) {
                    this.spawnEnemy();
                    if (this.time.now - this.lastDifficultyIncrease >= 30000) {
                        this.difficulty++;
                        this.difficultyText.setText(`难度: ${this.difficulty}`);
                        this.lastDifficultyIncrease = this.time.now;
                    }
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    showModuleReward() {
        if (this.isRewarding || !this.player || !this.player.currentWeapon) return;
        if (typeof WeaponModulePresets === 'undefined') return;

        this.isRewarding = true;
        if (this.physics && this.physics.world) {
            this.physics.world.pause();
        }
        if (this.enemySpawnTimer) {
            this.enemySpawnTimer.paused = true;
        }

        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        this.rewardOverlay = this.add.rectangle(
            centerX,
            centerY,
            this.scale.width,
            this.scale.height,
            0x000000,
            0.7
        );
        this.rewardOverlay.setScrollFactor(0);
        this.rewardOverlay.setDepth(3000);
        this.rewardOverlay.setInteractive();

        const title = this.add.text(
            centerX,
            centerY - 140,
            '选择一个武器模块',
            { fontSize: '28px', fill: '#ffffff', fontStyle: 'bold' }
        );
        title.setOrigin(0.5);
        title.setScrollFactor(0);
        title.setDepth(3001);
        this.rewardButtons.push(title);

        const weaponName = this.player.currentWeapon.config.name;
        const subTitle = this.add.text(
            centerX,
            centerY - 110,
            `当前武器: ${weaponName}`,
            { fontSize: '16px', fill: '#f1c40f' }
        );
        subTitle.setOrigin(0.5);
        subTitle.setScrollFactor(0);
        subTitle.setDepth(3001);
        this.rewardButtons.push(subTitle);

        const keys = Object.keys(WeaponModulePresets);
        Phaser.Utils.Array.Shuffle(keys);
        const options = keys.slice(0, Math.min(3, keys.length));

        const buttonWidth = 260;
        const buttonHeight = 80;
        const startX = centerX - (options.length - 1) * 150;
        const y = centerY - 20;

        options.forEach((key, index) => {
            const module = WeaponModulePresets[key];
            const x = startX + index * 300;
            this.createModuleButton(x, y, buttonWidth, buttonHeight, module);
        });
    }

    createModuleButton(x, y, w, h, module) {
        const bg = this.add.rectangle(x, y, w, h, 0x1f2a44, 0.95);
        bg.setStrokeStyle(2, 0xffffff, 0.6);
        bg.setScrollFactor(0);
        bg.setDepth(3002);
        bg.setInteractive({ useHandCursor: true });

        const title = this.add.text(x, y - 26, module.name, {
            fontSize: '18px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);
        title.setScrollFactor(0);
        title.setDepth(3003);

        const effectText = this.add.text(x, y, this.formatModuleEffects(module), {
            fontSize: '12px',
            fill: '#ecf0f1',
            align: 'center',
            wordWrap: { width: w - 16 }
        });
        effectText.setOrigin(0.5);
        effectText.setScrollFactor(0);
        effectText.setDepth(3003);

        const recommendText = this.add.text(x, y + 26, this.formatModuleRecommendation(module), {
            fontSize: '12px',
            fill: '#f1c40f',
            align: 'center',
            wordWrap: { width: w - 16 }
        });
        recommendText.setOrigin(0.5);
        recommendText.setScrollFactor(0);
        recommendText.setDepth(3003);

        bg.on('pointerdown', () => {
            this.applyModuleToCurrentWeapon(module);
            this.hideModuleReward();
        });

        this.rewardButtons.push(bg, title, effectText, recommendText);
    }

    formatModuleEffects(module) {
        const parts = [];
        if (module.add) {
            for (const key of Object.keys(module.add)) {
                const val = module.add[key];
                const sign = val >= 0 ? '+' : '';
                parts.push(`${this.mapStatLabel(key)}${sign}${val}`);
            }
        }
        if (module.mul) {
            for (const key of Object.keys(module.mul)) {
                const val = module.mul[key];
                parts.push(`${this.mapStatLabel(key)}x${val}`);
            }
        }
        if (module.set) {
            for (const key of Object.keys(module.set)) {
                parts.push(`${this.mapStatLabel(key)}=${module.set[key]}`);
            }
        }
        return parts.length ? `效果: ${parts.join(' | ')}` : '效果: 无额外属性';
    }

    formatModuleRecommendation(module) {
        const weaponName = this.player?.currentWeapon?.config?.name || '';
        const list = module.recommend || [];
        if (list.length === 0) {
            return weaponName ? `适用: ${weaponName}` : '适用: 任意武器';
        }
        const match = weaponName && list.includes(weaponName);
        const label = list.join(' / ');
        return match ? `适用: ${label}（当前匹配）` : `适用: ${label}`;
    }

    mapStatLabel(key) {
        const labels = {
            fireRate: '射速间隔',
            damage: '伤害',
            projectileCount: '子弹数量',
            projectileSpeed: '弹速',
            projectileSize: '弹体尺寸',
            range: '射程',
            spread: '散射',
            piercing: '穿透'
        };
        return labels[key] || key;
    }

    applyModuleToCurrentWeapon(module) {
        if (!this.player || !this.player.currentWeapon) return;
        const weapon = this.player.currentWeapon;
        let replaced = null;

        if (!weapon.hasModuleSlot()) {
            if (weapon.modules.length > 0) {
                replaced = weapon.modules[0];
                weapon.removeModule(replaced.id);
            }
        }

        const ok = weapon.applyModule(module);
        if (ok) {
            if (replaced) {
                this.showToast(`替换模块: ${replaced.name} -> ${module.name}`);
            } else {
                this.showToast(`获得模块: ${module.name}`);
            }
        }
    }

    hideModuleReward() {
        if (this.rewardOverlay) {
            this.rewardOverlay.destroy();
            this.rewardOverlay = null;
        }
        this.rewardButtons.forEach(obj => obj.destroy());
        this.rewardButtons = [];

        this.isRewarding = false;
        if (this.physics && this.physics.world) {
            this.physics.world.resume();
        }
        if (this.enemySpawnTimer) {
            this.enemySpawnTimer.paused = false;
        }
    }

    showToast(message) {
        const text = this.add.text(this.cameras.main.centerX, 80, message, {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 6 }
        });
        text.setOrigin(0.5);
        text.setScrollFactor(0);
        text.setDepth(3100);

        this.tweens.add({
            targets: text,
            y: 60,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });
    }
    
    update(time, delta) {
        if (this.isGameOver) return;
        if (this.isRewarding) {
            this.updateMinimap();
            return;
        }
        
        if (this.player && this.player.active) {
            this.player.update(time, delta);
        }
        
        if (this.enemies) {
            this.enemies.getChildren().forEach(enemy => {
                if (enemy && enemy.active) enemy.update(this.player);
            });
        }
        
        if (this.bullets) {
            this.bullets.getChildren().forEach(bullet => {
                if (bullet && bullet.active && bullet.update) bullet.update(time, delta);
            });
        }
        
        if (this.player && this.player.currentWeapon) {
            this.weaponText.setText(`武器: ${this.player.currentWeapon.config.name}`);
        }
        
        // 更新小地图
        this.updateMinimap();
    }
    
    /**
     * 更新小地图
     */
    updateMinimap() {
        if (!this.player || !this.player.active || !this.dungeonData) return;
        
        // 清除旧的小地图元素
        this.minimapContainer.removeAll(true);
        
        // 获取玩家当前位置对应的地图坐标
        const playerTileX = Math.floor(this.player.x / this.tileSize);
        const playerTileY = Math.floor(this.player.y / this.tileSize);
        
        // 计算每个格子在小地图上的大小
        const tileSize = this.minimapSize / (this.minimapRange * 2 + 1);
        
        // 绘制地形
        const map = this.dungeonData.map;
        for (let y = -this.minimapRange; y <= this.minimapRange; y++) {
            for (let x = -this.minimapRange; x <= this.minimapRange; x++) {
                const mapX = playerTileX + x;
                const mapY = playerTileY + y;
                
                // 检查边界
                if (mapY < 0 || mapY >= map.length || mapX < 0 || mapX >= map[0].length) {
                    continue;
                }
                
                const tileType = map[mapY][mapX];
                const minimapX = x * tileSize;
                const minimapY = y * tileSize;
                
                // 根据地形类型绘制不同颜色
                let color;
                if (tileType === 0) {
                    color = 0x333333; // 墙壁 - 深灰色
                } else if (tileType === 1) {
                    color = 0x666666; // 房间 - 中灰色
                } else {
                    color = 0x888888; // 走廊 - 浅灰色
                }
                
                const tile = this.add.rectangle(minimapX, minimapY, tileSize - 1, tileSize - 1, color);
                this.minimapContainer.add(tile);
            }
        }
        
        // 绘制敌人
        if (this.enemies) {
            this.enemies.getChildren().forEach(enemy => {
                if (enemy && enemy.active) {
                    const enemyTileX = Math.floor(enemy.x / this.tileSize);
                    const enemyTileY = Math.floor(enemy.y / this.tileSize);
                    
                    // 检查敌人是否在小地图范围内
                    const dx = enemyTileX - playerTileX;
                    const dy = enemyTileY - playerTileY;
                    
                    if (Math.abs(dx) <= this.minimapRange && Math.abs(dy) <= this.minimapRange) {
                        const minimapX = dx * tileSize;
                        const minimapY = dy * tileSize;
                        
                        // 敌人用红色圆点表示
                        const enemyDot = this.add.circle(minimapX, minimapY, tileSize / 2, 0xff0000);
                        this.minimapContainer.add(enemyDot);
                    }
                }
            });
        }
        
        // 绘制玩家（用绿色圆点表示，始终在小地图中心）
        const playerDot = this.add.circle(0, 0, tileSize / 1.5, 0x00ff00);
        this.minimapContainer.add(playerDot);
        
        // 绘制玩家朝向指示器
        const angle = this.player.rotation;
        const indicatorLength = tileSize;
        const indicatorX = Math.cos(angle) * indicatorLength;
        const indicatorY = Math.sin(angle) * indicatorLength;
        const directionLine = this.add.line(0, 0, 0, 0, indicatorX, indicatorY, 0x00ff00, 1);
        directionLine.setLineWidth(2);
        this.minimapContainer.add(directionLine);
    }
    
    addScore(points) {
        this.score += points;
        this.scoreText.setText(`分数: ${this.score}`);
        
        this.tweens.add({
            targets: this.scoreText,
            scale: 1.2,
            duration: 100,
            yoyo: true
        });
    }
    
    gameOver() {
        this.isGameOver = true;
        
        if (this.enemySpawnTimer) {
            this.enemySpawnTimer.remove();
            this.enemySpawnTimer = null;
        }
        
        this.physics.world.pause();
        
        // 显示游戏结束界面
        const overlay = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            this.scale.width,
            this.scale.height,
            0x000000,
            0.8
        );
        overlay.setScrollFactor(0);
        overlay.setDepth(2000);
        
        const gameOverText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 50,
            '游戏结束',
            {
                fontSize: '48px',
                fill: '#e74c3c',
                fontStyle: 'bold'
            }
        );
        gameOverText.setOrigin(0.5);
        gameOverText.setScrollFactor(0);
        gameOverText.setDepth(2001);
        
        const finalScoreText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 20,
            `最终分数: ${this.score}`,
            {
                fontSize: '28px',
                fill: '#ffffff'
            }
        );
        finalScoreText.setOrigin(0.5);
        finalScoreText.setScrollFactor(0);
        finalScoreText.setDepth(2001);
        
        const restartText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 80,
            '按空格键重新开始',
            {
                fontSize: '20px',
                fill: '#f1c40f'
            }
        );
        restartText.setOrigin(0.5);
        restartText.setScrollFactor(0);
        restartText.setDepth(2001);
        
        // 只监听一次空格键
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.restart();
        });
        
        // 也支持点击重新开始
        overlay.setInteractive();
        overlay.once('pointerdown', () => {
            this.scene.restart();
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DungeonScene;
}
