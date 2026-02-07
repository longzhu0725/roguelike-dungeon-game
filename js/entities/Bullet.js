/**
 * 子弹实体类
 * 处理弹道飞行、碰撞和销毁
 */

class Bullet extends Phaser.GameObjects.Container {
    constructor(scene, x, y, angle, weaponConfig) {
        super(scene, x, y);
        
        this.weaponConfig = weaponConfig || {};
        this.startPos = { x, y };
        this.damage = weaponConfig.damage || 10;
        this.piercing = weaponConfig.piercing || false;
        this.maxRange = weaponConfig.range || 500;
        
        // 创建子弹视觉
        this.createVisual();
        
        // 设置容器大小（用于物理碰撞）
        const projectileSize = weaponConfig.projectileSize || 4;
        this.setSize(projectileSize * 2, projectileSize * 2);
        
        // 添加到场景
        scene.add.existing(this);
        
        // 添加物理体
        scene.physics.add.existing(this);
        
        // 设置物理体属性（Container 默认 immovable，需要设置为 false）
        this.body.setImmovable(false);
        this.body.setAllowGravity(false);
        
        // 设置速度
        const speed = weaponConfig.projectileSpeed || 600;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        this.body.setVelocity(vx, vy);
        

        
        // 旋转子弹朝向飞行方向
        this.setRotation(angle);
        
        // 发射时间
        this.fireTime = scene.time.now;
        
        // 已穿透的敌人列表（用于穿透武器）
        this.piercedEnemies = [];
        
        // 生命周期（确保子弹最终会被销毁）
        this.lifeTime = (this.maxRange / speed) * 1000 + 1000;
        scene.time.delayedCall(this.lifeTime, () => {
            if (this.active) {
                this.destroy();
            }
        });
    }
    
    /**
     * 创建子弹视觉效果
     */
    createVisual() {
        // 清除旧图形
        this.removeAll(true);
        
        const size = this.weaponConfig?.projectileSize || 4;
        const color = this.getBulletColor();
        
        // 如果是火箭筒，创建特殊视觉效果
        if (this.weaponConfig.name === '火箭筒') {
            this.createRocketVisual(size);
        } else {
            // 主体
            const body = this.scene.add.rectangle(0, 0, size * 2, size, color);
            body.setOrigin(0.5);
            this.add(body);
            
            // 发光效果（拖尾）
            const trail = this.scene.add.rectangle(-size, 0, size * 1.5, size * 0.5, color, 0.5);
            trail.setOrigin(0.5);
            this.add(trail);
            
            // 如果是狙击枪，添加特殊效果
            if (this.weaponConfig.name === '狙击枪') {
                const glow = this.scene.add.circle(0, 0, size * 2, 0x00ffff, 0.3);
                this.add(glow);
            }
        }
    }
    
    /**
     * 创建火箭弹视觉效果
     */
    createRocketVisual(size) {
        // 火箭弹主体 - 圆柱形
        const body = this.scene.add.rectangle(0, 0, size * 2.5, size * 0.8, 0x4a4a4a);
        body.setOrigin(0.5);
        this.add(body);
        
        // 火箭弹头 - 红色
        const head = this.scene.add.circle(size, 0, size * 0.5, 0xff3333);
        this.add(head);
        
        // 火箭尾焰
        const flame = this.scene.add.circle(-size * 1.2, 0, size * 0.6, 0xff6600, 0.8);
        this.add(flame);
        
        // 尾焰动画
        this.scene.tweens.add({
            targets: flame,
            scaleX: { from: 1, to: 1.3 },
            scaleY: { from: 1, to: 0.8 },
            duration: 100,
            yoyo: true,
            repeat: -1
        });
        
        // 烟雾粒子效果
        this.smokeTimer = this.scene.time.addEvent({
            delay: 50,
            callback: () => {
                if (this.active) {
                    this.createSmokeParticle();
                }
            },
            loop: true
        });
    }
    
    /**
     * 创建烟雾粒子
     */
    createSmokeParticle() {
        const smoke = this.scene.add.circle(
            this.x - Math.cos(this.rotation) * 20,
            this.y - Math.sin(this.rotation) * 20,
            Phaser.Math.Between(3, 6),
            0x888888,
            0.4
        );
        smoke.setDepth(50);
        
        this.scene.tweens.add({
            targets: smoke,
            scale: { from: 1, to: 2 },
            alpha: { from: 0.4, to: 0 },
            duration: 500,
            onComplete: () => {
                smoke.destroy();
            }
        });
    }
    
    /**
     * 根据武器类型获取子弹颜色
     */
    getBulletColor() {
        const colors = {
            '手枪': 0xffff00,
            '机枪': 0xff6600,
            '霰弹枪': 0xff3333,
            '狙击枪': 0x00ffff,
            '激光枪': 0xff00ff,
            '火箭筒': 0xff4400
        };
        return colors[this.weaponConfig?.name] || 0xffff00;
    }
    
    /**
     * 更新（每帧调用）
     */
    update(time, delta) {
        // 检查射程
        const dx = this.x - this.startPos.x;
        const dy = this.y - this.startPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.maxRange) {
            this.destroy();
            return;
        }
        
        // 检查是否超出地图边界（注意：mapWidth/mapHeight 是以图块为单位，需要转换为像素）
        const mapWidthPixels = this.scene.mapWidth * this.scene.tileSize;
        const mapHeightPixels = this.scene.mapHeight * this.scene.tileSize;
        if (
            this.x < 0 || 
            this.x > mapWidthPixels || 
            this.y < 0 || 
            this.y > mapHeightPixels
        ) {
            this.destroy();
        }
    }

    /**
     * 击中敌人
     * @param {Enemy} enemy - 被击中的敌人
     * @returns {boolean} 是否成功造成伤害
     */
    hit(enemy) {
        // 检查是否已经穿透过这个敌人
        if (this.piercing && this.piercedEnemies.includes(enemy)) {
            return false;
        }
        
        // 如果是火箭筒，直接命中也触发爆炸
        if (this.weaponConfig.explosive) {
            this.createExplosion();
            this.destroy();
            return false;
        }
        
        // 造成伤害
        enemy.takeDamage(this.damage);
        
        // 记录已穿透的敌人
        if (this.piercing) {
            this.piercedEnemies.push(enemy);
            return true; // 继续飞行
        } else {
            this.destroy(); // 非穿透武器销毁子弹
            return false;
        }
    }
    
    /**
     * 击中墙壁
     */
    hitWall() {
        // 墙壁碰撞效果
        this.createImpactEffect();
        this.destroy();
    }
    
    /**
     * 创建击中墙壁的效果
     */
    createImpactEffect() {
        // 如果是火箭筒，创建爆炸效果
        if (this.weaponConfig.explosive) {
            this.createExplosion();
        } else {
            const impact = this.scene.add.circle(this.x, this.y, 5, 0x888888, 0.8);
            
            this.scene.tweens.add({
                targets: impact,
                scale: 2,
                alpha: 0,
                duration: 150,
                onComplete: () => {
                    impact.destroy();
                }
            });
        }
    }
    
    /**
     * 创建爆炸效果（用于火箭筒）
     */
    createExplosion() {
        const radius = this.weaponConfig.explosionRadius || 100;
        
        // 爆炸中心
        const explosion = this.scene.add.circle(this.x, this.y, radius, 0xff6600, 0.6);
        explosion.setDepth(100);
        
        // 爆炸内核
        const core = this.scene.add.circle(this.x, this.y, radius * 0.5, 0xffff00, 0.8);
        core.setDepth(101);
        
        // 爆炸动画
        this.scene.tweens.add({
            targets: explosion,
            scale: 1.5,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        this.scene.tweens.add({
            targets: core,
            scale: 2,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                core.destroy();
            }
        });
        
        // 对爆炸范围内的敌人造成伤害
        if (this.scene.enemies) {
            this.scene.enemies.getChildren().forEach(enemy => {
                if (enemy && enemy.active) {
                    const dx = enemy.x - this.x;
                    const dy = enemy.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance <= radius) {
                        // 距离越近伤害越高
                        const damageMultiplier = 1 - (distance / radius) * 0.5;
                        const explosionDamage = Math.floor(this.damage * damageMultiplier);
                        enemy.takeDamage(explosionDamage);
                    }
                }
            });
        }
        
        // 屏幕震动效果
        this.scene.cameras.main.shake(200, 0.02);
    }
    
    /**
     * 销毁子弹
     */
    destroy(fromScene) {
        // 清理烟雾定时器
        if (this.smokeTimer) {
            this.smokeTimer.remove();
            this.smokeTimer = null;
        }
        
        // 调用父类销毁
        super.destroy(fromScene);
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Bullet;
}
