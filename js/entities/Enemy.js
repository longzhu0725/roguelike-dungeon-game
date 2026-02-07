/**
 * 敌人实体类
 * 简单的AI行为、血条和伤害系统
 */

class Enemy extends Phaser.GameObjects.Container {
     constructor(scene, x, y, config = {}) {
        super(scene, x, y);
        
        // 防御性检查 - 确保 config 是对象
        if (!config || typeof config !== 'object') {
            console.error('Enemy: config is not an object:', config);
            config = {};
        }
        
        // 配置 - 使用更安全的方式设置默认值
        this.config = {};
        this.config.health = config.health !== undefined ? config.health : 30;
        this.config.maxHealth = config.maxHealth !== undefined ? config.maxHealth : (config.health || 30);
        this.config.speed = config.speed !== undefined ? config.speed : 100;
        this.config.damage = config.damage !== undefined ? config.damage : 10;
        this.config.detectionRange = config.detectionRange !== undefined ? config.detectionRange : 300;
        this.config.attackRange = config.attackRange !== undefined ? config.attackRange : 40;
        this.config.color = config.color !== undefined ? config.color : 0xe74c3c;
        this.config.size = config.size !== undefined ? config.size : 20;
        this.config.scoreValue = config.scoreValue !== undefined ? config.scoreValue : 10;
        this.config.knockbackResistance = config.knockbackResistance !== undefined ? config.knockbackResistance : 0.5; // 击退抗性
        
        this.currentHealth = this.config.health;
        this.isDead = false;
        this.isStunned = false;
        this.lastAttackTime = 0;
        this.attackCooldown = 1000; // 攻击间隔（毫秒）
        
        // AI相关属性
        this.aiState = 'IDLE'; // IDLE, CHASE, ATTACK
        this.targetPlayer = null;
        this.stateChangeTime = 0; // 上次状态变化时间
        this.stateChangeDelay = 100; // 状态变化延迟（毫秒）
        
        // 创建视觉
        this.createVisual();
        
        // 设置容器大小（使用防御性检查）
        const safeSize = this.config?.size || 20;
        this.setSize(safeSize, safeSize);
        
        // 添加到场景
        scene.add.existing(this);
        
        // 添加物理体
        scene.physics.add.existing(this);
        if (this.body) {
            this.body.setCircle(safeSize / 2);
        }
        this.body.setCollideWorldBounds(true);
        
        // AI状态
        this.aiState = 'IDLE'; // IDLE, CHASE, ATTACK
        this.targetPlayer = null;
        
        // 存储原始颜色（用于受伤闪烁效果）
        this.originalColor = this.config.color;
    }
    
    /**
     * 创建敌人视觉
     */
    createVisual() {
        this.removeAll(true);
        
        // 防御性检查
        if (!this.config) {
            console.error('Enemy: config is undefined!');
            this.config = {};
        }
        
        const size = this.config.size || 20;
        const color = this.config.color || 0xe74c3c;
        
        // 身体（几何形状）
        this.bodyGraphics = this.scene.add.rectangle(0, 0, size, size, color);
        this.bodyGraphics.setOrigin(0.5);
        this.add(this.bodyGraphics);
        
        // 眼睛（方向指示）
        this.eye = this.scene.add.circle(size * 0.3, 0, size * 0.15, 0xffffff);
        this.add(this.eye);
        
        this.pupil = this.scene.add.circle(size * 0.35, 0, size * 0.07, 0x000000);
        this.add(this.pupil);
        
        // 血条背景
        this.healthBarBg = this.scene.add.rectangle(0, -size * 0.8, size * 1.2, 4, 0x333333);
        this.healthBarBg.setOrigin(0.5);
        this.add(this.healthBarBg);
        
        // 血条
        this.healthBar = this.scene.add.rectangle(0, -size * 0.8, size * 1.2, 4, 0xe74c3c);
        this.healthBar.setOrigin(0.5, 0.5);
        this.healthBar.x = -size * 0.6; // 左对齐起点
        this.healthBar.setOrigin(0, 0.5); // 从左开始填充
        this.add(this.healthBar);
        
        // 初始隐藏血条
        this.healthBar.setVisible(false);
        this.healthBarBg.setVisible(false);
    }
    
     /**
     * 更新（每帧调用）
     */
    update(player) {
        if (this.isDead || !player || !player.active || !this.config) return;
        
        this.targetPlayer = player;
        
        // 计算到玩家的距离
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 更新朝向
        const angle = Math.atan2(dy, dx);
        this.setRotation(angle);
        
        // AI决策
        const attackRange = this.config.attackRange || 40;
        const detectionRange = this.config.detectionRange || 300;
        
        // 添加AI状态转换延迟，避免频繁切换状态
        if (distance <= attackRange) {
            if (this.aiState !== 'ATTACK') {
                this.aiState = 'ATTACK';
                this.stateChangeTime = this.scene.time.now;
                this.body.setVelocity(0, 0); // 立即停止移动
            }
            this.attack(player);
        } else if (distance <= detectionRange) {
            if (this.aiState !== 'CHASE') {
                this.aiState = 'CHASE';
                this.stateChangeTime = this.scene.time.now;
            }
            this.chase(player, dx, dy, distance);
        } else {
            if (this.aiState !== 'IDLE') {
                this.aiState = 'IDLE';
                this.stateChangeTime = this.scene.time.now;
                this.body.setVelocity(0, 0); // 停止移动
            }
            this.idle();
        }
        
        // 处理击退状态，避免在被击退时立即转向
        if (this.body && Math.abs(this.body.velocity.x) > 1 || Math.abs(this.body.velocity.y) > 1) {
            // 正在被击退，稍微减弱击退效果
            this.body.setVelocity(
                this.body.velocity.x * 0.95,
                this.body.velocity.y * 0.95
            );
        }
    }
    
     /**
     * 追击玩家
     */
    chase(player, dx, dy, distance) {
        if (!this.config || !this.body) return;
        
        // 基础速度配置
        const baseSpeed = this.config.speed || 100;
        const maxSpeed = baseSpeed * 1.8;
        
        // 计算目标方向（归一化）
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // 检测前方是否有障碍物
        const obstacleAvoidance = this.detectObstacle(dirX, dirY);
        
        // 如果检测到障碍物，使用绕行方向
        let moveDirX = dirX;
        let moveDirY = dirY;
        
        if (obstacleAvoidance.hasObstacle) {
            // 混合原始方向和绕行方向
            moveDirX = dirX * 0.3 + obstacleAvoidance.dirX * 0.7;
            moveDirY = dirY * 0.3 + obstacleAvoidance.dirY * 0.7;
            
            // 重新归一化
            const moveLen = Math.sqrt(moveDirX * moveDirX + moveDirY * moveDirY);
            if (moveLen > 0) {
                moveDirX /= moveLen;
                moveDirY /= moveLen;
            }
        }
        
        // 计算期望速度
        const desiredVelocityX = moveDirX * maxSpeed;
        const desiredVelocityY = moveDirY * maxSpeed;
        
        // 获取当前速度
        const currentVelocityX = this.body.velocity.x;
        const currentVelocityY = this.body.velocity.y;
        
        // 计算转向力（平滑转向）
        const steerX = desiredVelocityX - currentVelocityX;
        const steerY = desiredVelocityY - currentVelocityY;
        
        // 添加群体分离力
        const separationForce = this.calculateSeparationForce();
        
        // 合并转向力和分离力
        const newVelocityX = currentVelocityX + steerX * 0.1 + separationForce.x * 50;
        const newVelocityY = currentVelocityY + steerY * 0.1 + separationForce.y * 50;
        
        // 限制最大速度
        const newSpeedSq = newVelocityX * newVelocityX + newVelocityY * newVelocityY;
        if (newSpeedSq > maxSpeed * maxSpeed) {
            const scale = maxSpeed / Math.sqrt(newSpeedSq);
            this.body.setVelocity(newVelocityX * scale, newVelocityY * scale);
        } else {
            this.body.setVelocity(newVelocityX, newVelocityY);
        }
        
        // 显示血条
        if (this.healthBar && this.healthBarBg) {
            this.healthBar.setVisible(true);
            this.healthBarBg.setVisible(true);
        }
    }
    
    /**
     * 检测前方障碍物
     */
    detectObstacle(dirX, dirY) {
        if (!this.scene?.dungeonData?.map) {
            return { hasObstacle: false, dirX: 0, dirY: 0 };
        }
        
        const map = this.scene.dungeonData.map;
        const tileSize = this.scene.tileSize;
        
        // 当前位置对应的地图坐标
        const currentTileX = Math.floor(this.x / tileSize);
        const currentTileY = Math.floor(this.y / tileSize);
        
        // 检测前方几个位置
        const checkDistance = 3; // 检测前方3格
        let hasObstacle = false;
        let avoidX = 0;
        let avoidY = 0;
        
        for (let i = 1; i <= checkDistance; i++) {
            const checkX = Math.floor((this.x + dirX * tileSize * i) / tileSize);
            const checkY = Math.floor((this.y + dirY * tileSize * i) / tileSize);
            
            // 检查边界
            if (checkY < 0 || checkY >= map.length || checkX < 0 || checkX >= map[0].length) {
                continue;
            }
            
            // 0 表示墙壁
            if (map[checkY][checkX] === 0) {
                hasObstacle = true;
                
                // 计算绕行方向（垂直于原方向）
                // 尝试左右两个方向，选择可以通行的
                const leftDirX = -dirY;
                const leftDirY = dirX;
                const rightDirX = dirY;
                const rightDirY = -dirX;
                
                // 检查左侧是否可行
                const leftX = Math.floor((this.x + leftDirX * tileSize * 2) / tileSize);
                const leftY = Math.floor((this.y + leftDirY * tileSize * 2) / tileSize);
                const leftValid = leftY >= 0 && leftY < map.length && leftX >= 0 && leftX < map[0].length && map[leftY][leftX] !== 0;
                
                // 检查右侧是否可行
                const rightX = Math.floor((this.x + rightDirX * tileSize * 2) / tileSize);
                const rightY = Math.floor((this.y + rightDirY * tileSize * 2) / tileSize);
                const rightValid = rightY >= 0 && rightY < map.length && rightX >= 0 && rightX < map[0].length && map[rightY][rightX] !== 0;
                
                if (leftValid && !rightValid) {
                    avoidX = leftDirX;
                    avoidY = leftDirY;
                } else if (rightValid && !leftValid) {
                    avoidX = rightDirX;
                    avoidY = rightDirY;
                } else if (leftValid && rightValid) {
                    // 两侧都可行，随机选择一个
                    if (Math.random() < 0.5) {
                        avoidX = leftDirX;
                        avoidY = leftDirY;
                    } else {
                        avoidX = rightDirX;
                        avoidY = rightDirY;
                    }
                } else {
                    // 两侧都不可行，尝试后退
                    avoidX = -dirX;
                    avoidY = -dirY;
                }
                
                break;
            }
        }
        
        return { hasObstacle, dirX: avoidX, dirY: avoidY };
    }
    
    /**
     * 攻击玩家
     */
    attack(player) {
        if (!this.config) return;
        
        this.body.setVelocity(0, 0);
        
        const currentTime = this.scene.time.now;
        if (currentTime - this.lastAttackTime >= this.attackCooldown) {
            this.lastAttackTime = currentTime;
            
            // 对玩家造成伤害
            if (player.takeDamage) {
                const damage = this.config.damage || 10;
                player.takeDamage(damage);
            }
            
            // 攻击动画效果
            this.attackAnimation();
        }
    }
    
    /**
     * 攻击动画
     */
    attackAnimation() {
        // 攻击时的缩放效果
        this.scene.tweens.add({
            targets: this.bodyGraphics,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 100,
            yoyo: true
        });
    }
    
     /**
     * 空闲状态
     */
    idle() {
        this.body.setVelocity(0, 0);
        // 可以在这里添加巡逻行为
        // 如需添加巡逻，可在此处实现随机移动或路径点移动逻辑
    }
    
    /**
     * 计算与其他敌人的分离力，避免聚集
     */
    calculateSeparationForce() {
        if (!this.scene?.enemies || !this.config) return { x: 0, y: 0 };
        
        let separationX = 0;
        let separationY = 0;
        let count = 0;
        
        const separationDistance = (this.config.size || 20) * 2; // 分离距离阈值
        const enemies = this.scene.enemies.getChildren();
        
        for (let i = 0; i < enemies.length; i++) {
            const otherEnemy = enemies[i];
            if (otherEnemy !== this && otherEnemy.active && !otherEnemy.isDead) {
                const dx = this.x - otherEnemy.x;
                const dy = this.y - otherEnemy.y;
                const distanceSq = dx * dx + dy * dy;
                
                // 使用平方距离避免开方运算，提高性能
                if (distanceSq > 0 && distanceSq < separationDistance * separationDistance) {
                    const distance = Math.sqrt(distanceSq);
                    // 距离越近，分离力越大
                    const force = (separationDistance - distance) / separationDistance;
                    separationX += (dx / distance) * force;
                    separationY += (dy / distance) * force;
                    count++;
                }
            }
        }
        
        // 平均分离力
        if (count > 0) {
            separationX /= count;
            separationY /= count;
        }
        
        return { x: separationX, y: separationY };
    }
    
     /**
     * 受到伤害
     */
    takeDamage(damage) {
        if (this.isDead || !this.config) return;
        
        this.currentHealth -= damage;
        
        // 显示血条
        if (this.healthBar && this.healthBarBg) {
            this.healthBar.setVisible(true);
            this.healthBarBg.setVisible(true);
            
            // 更新血条
            const maxHealth = this.config.maxHealth || 30;
            const healthPercent = Math.max(0, this.currentHealth / maxHealth);
            const size = this.config.size || 20;
            this.healthBar.width = size * 1.2 * healthPercent;
        }
        
        // 受伤闪烁效果
        this.flashDamage();
        
        // 击退效果（考虑击退抗性）
        if (this.targetPlayer && this.body) {
            const knockbackResistance = this.config.knockbackResistance || 0.5;
            const baseKnockback = 200;
            const effectiveKnockback = baseKnockback * (1 - knockbackResistance);
            
            const dx = this.x - this.targetPlayer.x;
            const dy = this.y - this.targetPlayer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 0) {
                this.body.setVelocity(
                    (dx / distance) * effectiveKnockback,
                    (dy / distance) * effectiveKnockback
                );
            }
        }
        
        // 检查死亡
        if (this.currentHealth <= 0) {
            this.die();
        }
    }
    
    /**
     * 受伤闪烁效果
     */
    flashDamage() {
        this.bodyGraphics.setFillStyle(0xffffff);
        
        this.scene.time.delayedCall(100, () => {
            if (this.bodyGraphics && this.bodyGraphics.active) {
                this.bodyGraphics.setFillStyle(this.originalColor);
            }
        });
    }
    
    /**
     * 死亡处理
     */
    die() {
        if (this.isDead) return;
        
        this.isDead = true;
        
        // 创建死亡效果
        this.createDeathEffect();
        
        // 增加分数
        if (this.scene.addScore && this.config) {
            const scoreValue = this.config.scoreValue || 10;
            this.scene.addScore(scoreValue);
        }

        if (this.scene.onEnemyKilled) {
            this.scene.onEnemyKilled(this);
        }
        
        // 销毁敌人
        this.destroy();
    }
    
    /**
     * 死亡视觉效果
     */
    createDeathEffect() {
        // 爆炸效果
        for (let i = 0; i < 8; i++) {
            const particle = this.scene.add.circle(
                this.x,
                this.y,
                Phaser.Math.Between(3, 6),
                this.originalColor
            );
            
            const angle = (Math.PI * 2 / 8) * i;
            const speed = Phaser.Math.Between(50, 100);
            
            this.scene.tweens.add({
                targets: particle,
                x: this.x + Math.cos(angle) * 50,
                y: this.y + Math.sin(angle) * 50,
                alpha: 0,
                scale: 0,
                duration: 400,
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }
    
    /**
     * 销毁方法
     */
    destroy(fromScene) {
        // 调用父类销毁
        super.destroy(fromScene);
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Enemy;
}
