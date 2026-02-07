/**
 * 玩家实体类
 * 8方向移动 + 鼠标瞄准 + 武器系统
 */

class Player extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        
        // 玩家属性
        this.speed = 200;
        this.maxHealth = 100;
        this.currentHealth = 100;
        this.invulnerable = false;
        this.invulnerableTime = 500;
        
        this.moveDirection = { x: 0, y: 0 };
        this.mousePosition = { x: 0, y: 0 };
        
        this.createVisual();
        this.setSize(32, 32);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setCircle(16);
        this.body.setCollideWorldBounds(true);
        this.body.setDrag(0);
        
        this.weapons = [];
        this.currentWeaponIndex = 0;
        this.setupWeapons();
        
        this.cooldownBar = this.scene.add.graphics();
        this.cooldownBar.setDepth(100);
        
        this.setupInput();
        this.lastDamageTime = 0;
    }
    
    createVisual() {
        this.removeAll(true);
        
        this.bodySprite = this.scene.add.circle(0, 0, 16, 0x3498db);
        this.add(this.bodySprite);
        
        this.border = this.scene.add.circle(0, 0, 16, 0x2980b9);
        this.border.setStrokeStyle(3, 0x1a5276);
        this.add(this.border);
        
        this.weaponLine = this.scene.add.rectangle(20, 0, 24, 6, 0xf1c40f);
        this.weaponLine.setOrigin(0, 0.5);
        this.add(this.weaponLine);
        
        this.eyeLeft = this.scene.add.circle(6, -5, 4, 0xffffff);
        this.add(this.eyeLeft);
        
        this.eyeRight = this.scene.add.circle(6, 5, 4, 0xffffff);
        this.add(this.eyeRight);
        
        this.pupilLeft = this.scene.add.circle(7, -5, 2, 0x000000);
        this.add(this.pupilLeft);
        
        this.pupilRight = this.scene.add.circle(7, 5, 2, 0x000000);
        this.add(this.pupilRight);
        
        this.createHealthBar();
    }
    
    createHealthBar() {
        const barY = -28;
        const barWidth = 40;
        const barHeight = 6;
        
        this.healthBarBg = this.scene.add.rectangle(0, barY, barWidth, barHeight, 0x333333);
        this.healthBarBg.setOrigin(0.5);
        this.add(this.healthBarBg);
        
        this.healthBar = this.scene.add.rectangle(-barWidth/2, barY, barWidth, barHeight, 0x2ecc71);
        this.healthBar.setOrigin(0, 0.5);
        this.add(this.healthBar);
        
        this.updateHealthBar();
    }
    
    updateHealthBar() {
        const healthPercent = Math.max(0, this.currentHealth / this.maxHealth);
        const barWidth = 40;
        
        this.healthBar.width = barWidth * healthPercent;
        
        if (healthPercent > 0.6) {
            this.healthBar.setFillStyle(0x2ecc71);
        } else if (healthPercent > 0.3) {
            this.healthBar.setFillStyle(0xf1c40f);
        } else {
            this.healthBar.setFillStyle(0xe74c3c);
        }
    }
    
    setupInput() {
        this.keys = this.scene.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            one: Phaser.Input.Keyboard.KeyCodes.ONE,
            two: Phaser.Input.Keyboard.KeyCodes.TWO,
            three: Phaser.Input.Keyboard.KeyCodes.THREE,
            four: Phaser.Input.Keyboard.KeyCodes.FOUR,
            five: Phaser.Input.Keyboard.KeyCodes.FIVE,
            six: Phaser.Input.Keyboard.KeyCodes.SIX
        });
        
        this.scene.input.on('pointermove', (pointer) => {
            this.mousePosition.x = pointer.worldX;
            this.mousePosition.y = pointer.worldY;
        });
        
        this.scene.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.fire();
            }
        });
        
        this.scene.input.keyboard.on('keydown-ONE', () => this.switchWeapon(0));
        this.scene.input.keyboard.on('keydown-TWO', () => this.switchWeapon(1));
        this.scene.input.keyboard.on('keydown-THREE', () => this.switchWeapon(2));
        this.scene.input.keyboard.on('keydown-FOUR', () => this.switchWeapon(3));
        this.scene.input.keyboard.on('keydown-FIVE', () => this.switchWeapon(4));
        this.scene.input.keyboard.on('keydown-SIX', () => this.switchWeapon(5));
    }
    
    setupWeapons() {
        this.weapons.push(new Weapon(this.scene, WeaponPresets.PISTOL));
        this.weapons.push(new Weapon(this.scene, WeaponPresets.MACHINE_GUN));
        this.weapons.push(new Weapon(this.scene, WeaponPresets.SHOTGUN));
        this.weapons.push(new Weapon(this.scene, WeaponPresets.SNIPER));
        this.weapons.push(new Weapon(this.scene, WeaponPresets.LASER));
        this.weapons.push(new Weapon(this.scene, WeaponPresets.ROCKET_LAUNCHER));
        
        this.currentWeapon = this.weapons[0];
    }
    
    switchWeapon(index) {
        if (index >= 0 && index < this.weapons.length) {
            this.currentWeaponIndex = index;
            this.currentWeapon = this.weapons[index];
            this.showWeaponSwitchNotification();
        }
    }
    
    showWeaponSwitchNotification() {
        const weaponName = this.currentWeapon.config.name;
        const text = this.scene.add.text(
            this.x,
            this.y - 50,
            `武器: ${weaponName}`,
            {
                fontSize: '14px',
                fill: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 8, y: 4 }
            }
        );
        text.setOrigin(0.5);
        text.setDepth(500);
        text.setScrollFactor(0);
        
        this.scene.tweens.add({
            targets: text,
            y: this.y - 70,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                text.destroy();
            }
        });
    }
    
    fire() {
        if (!this.currentWeapon || !this.active) return;
        
        const dx = this.mousePosition.x - this.x;
        const dy = this.mousePosition.y - this.y;
        const angle = Math.atan2(dy, dx);
        
        const weaponLength = 32;
        const startX = this.x + Math.cos(angle) * weaponLength;
        const startY = this.y + Math.sin(angle) * weaponLength;
        
        this.currentWeapon.fire(startX, startY, angle);
    }
    
    updateCooldownBar() {
        if (!this.cooldownBar || !this.currentWeapon) return;
        
        this.cooldownBar.clear();
        
        const currentTime = this.scene.time.now;
        const cooldownProgress = Math.min(
            1,
            (currentTime - this.currentWeapon.lastFireTime) / this.currentWeapon.config.fireRate
        );
        
        this.cooldownBar.fillStyle(0x333333, 0.5);
        this.cooldownBar.fillRect(this.x - 15, this.y + 25, 30, 4);
        
        const color = cooldownProgress >= 1 ? 0x00ff00 : 0xffff00;
        this.cooldownBar.fillStyle(color, 0.8);
        this.cooldownBar.fillRect(this.x - 15, this.y + 25, 30 * cooldownProgress, 4);
    }
    
    update(time, delta) {
        if (!this.active) return;
        
        this.handleMovement();
        this.handleAiming();
        
        if (this.currentWeapon) {
            this.currentWeapon.update(time, delta);
        }
        
        this.updateCooldownBar();
        
        if (this.currentWeapon && this.currentWeapon.config.autoFire) {
            const pointer = this.scene.input.activePointer;
            if (pointer.leftButtonDown()) {
                this.fire();
            }
        }
    }
    
    handleMovement() {
        this.moveDirection.x = 0;
        this.moveDirection.y = 0;
        
        if (this.keys.w.isDown || this.keys.up.isDown) {
            this.moveDirection.y = -1;
        }
        if (this.keys.s.isDown || this.keys.down.isDown) {
            this.moveDirection.y = 1;
        }
        if (this.keys.a.isDown || this.keys.left.isDown) {
            this.moveDirection.x = -1;
        }
        if (this.keys.d.isDown || this.keys.right.isDown) {
            this.moveDirection.x = 1;
        }
        
        if (this.moveDirection.x !== 0 || this.moveDirection.y !== 0) {
            if (this.moveDirection.x !== 0 && this.moveDirection.y !== 0) {
                const factor = 1 / Math.sqrt(2);
                this.body.setVelocity(
                    this.moveDirection.x * this.speed * factor,
                    this.moveDirection.y * this.speed * factor
                );
            } else {
                this.body.setVelocity(
                    this.moveDirection.x * this.speed,
                    this.moveDirection.y * this.speed
                );
            }
            
            this.playMoveAnimation();
        } else {
            this.body.setVelocity(0, 0);
        }
    }
    
    playMoveAnimation() {
        const time = this.scene.time.now / 200;
        const scale = 1 + Math.sin(time) * 0.05;
        this.bodySprite.setScale(scale);
    }
    
    handleAiming() {
        const dx = this.mousePosition.x - this.x;
        const dy = this.mousePosition.y - this.y;
        const angle = Math.atan2(dy, dx);
        
        this.setRotation(angle);
        
        if (this.weaponLine) {
            this.weaponLine.setRotation(0);
        }
    }
    
    takeDamage(damage) {
        const currentTime = this.scene.time.now;
        
        if (this.invulnerable || currentTime - this.lastDamageTime < this.invulnerableTime) {
            return;
        }
        
        this.lastDamageTime = currentTime;
        this.currentHealth -= damage;
        
        this.updateHealthBar();
        this.playDamageEffect();
        
        this.invulnerable = true;
        this.scene.time.delayedCall(this.invulnerableTime, () => {
            this.invulnerable = false;
        });
        
        if (this.currentHealth <= 0) {
            this.die();
        }
    }
    
    playDamageEffect() {
        this.scene.tweens.add({
            targets: this.bodySprite,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 3
        });
        
        this.scene.cameras.main.shake(200, 0.01);
        
        const flash = this.scene.add.rectangle(
            this.x,
            this.y,
            32,
            32,
            0xff0000,
            0.5
        );
        this.add(flash);
        
        this.scene.time.delayedCall(200, () => {
            flash.destroy();
        });
    }
    
    heal(amount) {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
        this.updateHealthBar();
        
        const healText = this.scene.add.text(
            this.x,
            this.y - 40,
            `+${amount}`,
            {
                fontSize: '16px',
                fill: '#2ecc71',
                fontStyle: 'bold'
            }
        );
        healText.setOrigin(0.5);
        healText.setDepth(500);
        healText.setScrollFactor(0);
        
        this.scene.tweens.add({
            targets: healText,
            y: this.y - 60,
            alpha: 0,
            duration: 800,
            onComplete: () => {
                healText.destroy();
            }
        });
    }
    
    die() {
        this.createDeathEffect();
        
        if (this.cooldownBar) {
            this.cooldownBar.destroy();
            this.cooldownBar = null;
        }
        
        if (this.scene && this.scene.gameOver) {
            this.scene.gameOver();
        }
    }
    
    createDeathEffect() {
        for (let i = 0; i < 12; i++) {
            const particle = this.scene.add.circle(
                this.x,
                this.y,
                Phaser.Math.Between(5, 10),
                0x3498db
            );
            
            const angle = (Math.PI * 2 / 12) * i;
            const speed = Phaser.Math.Between(100, 200);
            
            this.scene.tweens.add({
                targets: particle,
                x: this.x + Math.cos(angle) * 60,
                y: this.y + Math.sin(angle) * 60,
                alpha: 0,
                scale: 0,
                duration: 500,
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
}
