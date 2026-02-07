/**
 * 开始菜单场景
 * 显示游戏标题、操作说明和开始按钮
 */

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // 创建背景效果
        this.createBackground();
        
        // 创建游戏标题
        this.createTitle();
        
        // 创建操作说明
        this.createInstructions();
        
        // 创建开始按钮
        this.createStartButton();
        
        // 创建装饰元素
        this.createDecorations();
    }

    /**
     * 创建背景效果
     */
    createBackground() {
        // 深色背景
        const bg = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            this.cameras.main.width,
            this.cameras.main.height,
            0x1a1a2e
        );

        // 添加网格背景效果
        const gridSize = 40;
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x2a2a4e, 0.3);
        
        for (let x = 0; x < this.cameras.main.width; x += gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, this.cameras.main.height);
        }
        
        for (let y = 0; y < this.cameras.main.height; y += gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(this.cameras.main.width, y);
        }
        
        graphics.strokePath();

        // 添加渐变遮罩效果
        const gradient = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000,
            0
        );
        gradient.setAlpha(0.3);
    }

    /**
     * 创建游戏标题
     */
    createTitle() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY - 150;

        // 主标题 - 使用更大更醒目的字体
        const title = this.add.text(centerX, centerY, '⚔️ 地牢射击游戏', {
            fontSize: '64px',
            fontFamily: '"Microsoft YaHei", "SimHei", "Helvetica Neue", Arial, sans-serif',
            fill: '#e94560',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 8,
            shadow: {
                offsetX: 4,
                offsetY: 4,
                color: '#000000',
                blur: 10,
                stroke: true,
                fill: true
            }
        });
        title.setOrigin(0.5);

        // 副标题 - 使用优雅的字体
        const subtitle = this.add.text(centerX, centerY + 80, 'Roguelike Dungeon Shooter', {
            fontSize: '28px',
            fontFamily: '"Helvetica Neue", Arial, sans-serif',
            fill: '#95a5a6',
            fontStyle: 'italic',
            letterSpacing: 2
        });
        subtitle.setOrigin(0.5);

        // 标题动画
        this.tweens.add({
            targets: title,
            scale: { from: 0.8, to: 1 },
            alpha: { from: 0, to: 1 },
            duration: 800,
            ease: 'Power2'
        });

        this.tweens.add({
            targets: subtitle,
            alpha: { from: 0, to: 1 },
            y: { from: centerY + 50, to: centerY + 70 },
            duration: 800,
            delay: 300,
            ease: 'Power2'
        });
    }

    /**
     * 创建操作说明
     */
    createInstructions() {
        const centerX = this.cameras.main.centerX;
        const startY = this.cameras.main.centerY + 20;

        // 说明框背景
        const boxWidth = 400;
        const boxHeight = 180;
        const box = this.add.rectangle(centerX, startY + boxHeight / 2, boxWidth, boxHeight, 0x000000, 0.5);
        box.setStrokeStyle(2, 0x4a5a6a);

        // 操作说明标题
        const instructionTitle = this.add.text(centerX, startY + 20, '🎮 操作说明', {
            fontSize: '26px',
            fontFamily: '"Microsoft YaHei", "SimHei", sans-serif',
            fill: '#f1c40f',
            fontStyle: 'bold',
            letterSpacing: 4
        });
        instructionTitle.setOrigin(0.5);

        // 操作说明内容
        const instructions = [
            { key: 'W A S D', desc: '8方向移动' },
            { key: '鼠标移动', desc: '瞄准方向' },
            { key: '鼠标左键', desc: '射击' },
            { key: '数字键 1-6', desc: '切换武器' }
        ];

        let currentY = startY + 60;
        instructions.forEach((item, index) => {
            // 按键
            const keyText = this.add.text(centerX - 80, currentY, item.key, {
                fontSize: '18px',
                fontFamily: '"Consolas", "Monaco", monospace',
                fill: '#3498db',
                fontStyle: 'bold'
            });
            keyText.setOrigin(0, 0.5);

            // 分隔符
            const separator = this.add.text(centerX - 10, currentY, '|', {
                fontSize: '18px',
                fontFamily: '"Helvetica Neue", Arial, sans-serif',
                fill: '#7f8c8d'
            });
            separator.setOrigin(0.5);

            // 描述
            const descText = this.add.text(centerX + 20, currentY, item.desc, {
                fontSize: '18px',
                fontFamily: '"Microsoft YaHei", "SimHei", sans-serif',
                fill: '#ecf0f1'
            });
            descText.setOrigin(0, 0.5);

            // 动画 - 淡入效果
            this.tweens.add({
                targets: [keyText, separator, descText],
                alpha: { from: 0, to: 1 },
                duration: 500,
                delay: 600 + index * 100,
                ease: 'Power2'
            });

            currentY += 30;
        });
    }

    /**
     * 创建开始按钮
     */
    createStartButton() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY + 220;

        // 按钮背景
        const buttonWidth = 200;
        const buttonHeight = 50;
        const button = this.add.rectangle(centerX, centerY, buttonWidth, buttonHeight, 0xe74c3c);
        button.setInteractive({ useHandCursor: true });

        // 按钮边框
        const buttonBorder = this.add.rectangle(centerX, centerY, buttonWidth, buttonHeight);
        buttonBorder.setStrokeStyle(3, 0xc0392b);

        // 按钮文字
        const buttonText = this.add.text(centerX, centerY, '开始游戏', {
            fontSize: '28px',
            fontFamily: '"Microsoft YaHei", "SimHei", "Helvetica Neue", Arial, sans-serif',
            fill: '#ffffff',
            fontStyle: 'bold',
            letterSpacing: 6,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 4,
                stroke: true,
                fill: true
            }
        });
        buttonText.setOrigin(0.5);

        // 按钮动画
        this.tweens.add({
            targets: [button, buttonBorder, buttonText],
            scale: { from: 0, to: 1 },
            duration: 500,
            delay: 1000,
            ease: 'Back.out'
        });

        // 按钮交互效果
        button.on('pointerover', () => {
            button.setFillStyle(0xff6b6b);
            this.tweens.add({
                targets: [button, buttonBorder, buttonText],
                scale: 1.05,
                duration: 100
            });
        });

        button.on('pointerout', () => {
            button.setFillStyle(0xe74c3c);
            this.tweens.add({
                targets: [button, buttonBorder, buttonText],
                scale: 1,
                duration: 100
            });
        });

        button.on('pointerdown', () => {
            // 按钮点击效果
            this.tweens.add({
                targets: [button, buttonBorder, buttonText],
                scale: 0.95,
                duration: 50,
                yoyo: true,
                onComplete: () => {
                    // 切换到游戏场景
                    this.scene.start('DungeonScene');
                }
            });
        });
    }

    /**
     * 创建装饰元素
     */
    createDecorations() {
        // 添加一些漂浮的粒子效果
        const particles = this.add.particles(0, 0, 'particle', {
            x: { min: 0, max: this.cameras.main.width },
            y: { min: 0, max: this.cameras.main.height },
            lifespan: 4000,
            speedY: { min: -20, max: -50 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.3, end: 0 },
            quantity: 1,
            frequency: 500,
            blendMode: 'ADD'
        });

        // 由于没有粒子纹理，我们使用圆形代替
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(0, this.cameras.main.width);
            const y = Phaser.Math.Between(0, this.cameras.main.height);
            const size = Phaser.Math.Between(2, 5);
            
            const particle = this.add.circle(x, y, size, 0xe94560, 0.3);
            
            // 漂浮动画
            this.tweens.add({
                targets: particle,
                y: y - Phaser.Math.Between(100, 300),
                alpha: 0,
                duration: Phaser.Math.Between(3000, 6000),
                repeat: -1,
                delay: Phaser.Math.Between(0, 3000),
                onRepeat: () => {
                    particle.x = Phaser.Math.Between(0, this.cameras.main.width);
                    particle.y = this.cameras.main.height + 50;
                    particle.alpha = 0.3;
                }
            });
        }

        // 版本号
        const versionText = this.add.text(
            this.cameras.main.width - 20,
            this.cameras.main.height - 20,
            'v1.0.0',
            {
                fontSize: '12px',
                fill: '#7f8c8d'
            }
        );
        versionText.setOrigin(1, 1);
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MenuScene;
}
