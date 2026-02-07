/**
 * Weapon system with module support.
 * Modules can modify base weapon stats via add/mul/set rules.
 */

class Weapon {
    constructor(scene, config = {}) {
        this.scene = scene;

        this.baseConfig = {
            name: config.name || '普通手枪',
            damage: config.damage || 10,
            fireRate: config.fireRate || 300,             // ms between shots
            projectileSpeed: config.projectileSpeed || 600,
            projectileSize: config.projectileSize || 4,
            range: config.range || 500,
            spread: config.spread || 0,
            piercing: config.piercing || false,
            autoFire: config.autoFire || false,
            projectileCount: config.projectileCount || 1,
            moduleSlots: config.moduleSlots || 2,
            ...config
        };

        this.modules = [];
        this.config = {};

        this.lastFireTime = 0;
        this.canFire = true;

        this.recalculateConfig();
    }

    getModuleSlots() {
        return this.baseConfig.moduleSlots || 0;
    }

    hasModuleSlot() {
        return this.modules.length < this.getModuleSlots();
    }

    /**
     * Apply a module to this weapon.
     * @param {object|string} module - module object or preset id
     * @returns {boolean} success
     */
    applyModule(module) {
        const resolved = this.resolveModule(module);
        if (!resolved) return false;
        if (!this.hasModuleSlot()) return false;

        this.modules.push(resolved);
        this.recalculateConfig();
        return true;
    }

    removeModule(moduleId) {
        const before = this.modules.length;
        this.modules = this.modules.filter(m => m.id !== moduleId);
        if (this.modules.length !== before) {
            this.recalculateConfig();
            return true;
        }
        return false;
    }

    clearModules() {
        if (this.modules.length === 0) return;
        this.modules = [];
        this.recalculateConfig();
    }

    resolveModule(module) {
        if (!module) return null;
        if (typeof module === 'string') {
            return WeaponModulePresets[module] || null;
        }
        if (typeof module === 'object') return module;
        return null;
    }

    recalculateConfig() {
        const cfg = { ...this.baseConfig };

        for (const module of this.modules) {
            if (!module) continue;

            // additive
            if (module.add) {
                for (const key of Object.keys(module.add)) {
                    cfg[key] = (cfg[key] || 0) + module.add[key];
                }
            }

            // multiplicative
            if (module.mul) {
                for (const key of Object.keys(module.mul)) {
                    const base = cfg[key] || 0;
                    cfg[key] = base * module.mul[key];
                }
            }

            // set/override
            if (module.set) {
                for (const key of Object.keys(module.set)) {
                    cfg[key] = module.set[key];
                }
            }

            // custom hook
            if (typeof module.apply === 'function') {
                module.apply(cfg);
            }
        }

        this.config = this.clampConfig(cfg);
    }

    clampConfig(cfg) {
        const limits = {
            fireRate: [60, 2000],
            damage: [1, 999],
            projectileSpeed: [100, 5000],
            projectileSize: [2, 24],
            range: [100, 2000],
            spread: [0, 60],
            projectileCount: [1, 20]
        };

        const out = { ...cfg };
        for (const key of Object.keys(limits)) {
            if (typeof out[key] !== 'number') continue;
            const [min, max] = limits[key];
            out[key] = Math.max(min, Math.min(max, out[key]));
        }
        return out;
    }

    /**
     * Try to fire.
     */
    fire(x, y, angle) {
        const currentTime = this.scene.time.now;
        if (currentTime - this.lastFireTime < this.config.fireRate) {
            return false;
        }

        this.lastFireTime = currentTime;
        this.canFire = false;

        this.createProjectiles(x, y, angle);

        this.scene.time.delayedCall(this.config.fireRate, () => {
            this.canFire = true;
        });

        return true;
    }

    /**
     * Create bullets.
     */
    createProjectiles(startX, startY, angle) {
        const count = this.config.projectileCount;

        for (let i = 0; i < count; i++) {
            let finalAngle = angle;
            if (this.config.spread > 0) {
                const spreadRad = Phaser.Math.DegToRad(this.config.spread / 2);
                finalAngle += Phaser.Math.FloatBetween(-spreadRad, spreadRad);
            }

            if (count > 1) {
                const spreadRad = Phaser.Math.DegToRad(this.config.spread);
                const angleStep = spreadRad / (count - 1);
                finalAngle = angle - spreadRad / 2 + angleStep * i;
            }

            const bullet = new Bullet(
                this.scene,
                startX,
                startY,
                finalAngle,
                this.config
            );

            if (this.scene.bullets) {
                this.scene.bullets.add(bullet);
            } else {
                console.warn('Warning: bullets group not initialized.');
            }
        }

        this.onFireEffect(startX, startY);
    }

    onFireEffect(x, y) {
        const flash = this.scene.add.circle(x, y, 8, 0xffff00, 0.8);
        flash.setDepth(99);

        this.scene.tweens.add({
            targets: flash,
            scale: 0,
            alpha: 0,
            duration: 100,
            onComplete: () => {
                flash.destroy();
            }
        });
    }

    update(time, delta) {
        // reserved for future weapon logic
    }
}

const WeaponPresets = {
    PISTOL: {
        name: '手枪',
        damage: 15,
        fireRate: 400,
        projectileSpeed: 700,
        projectileSize: 5,
        spread: 2,
        moduleSlots: 2
    },
    MACHINE_GUN: {
        name: '机枪',
        damage: 8,
        fireRate: 100,
        projectileSpeed: 900,
        projectileSize: 4,
        spread: 8,
        autoFire: true,
        moduleSlots: 3
    },
    SHOTGUN: {
        name: '霰弹枪',
        damage: 12,
        fireRate: 800,
        projectileSpeed: 500,
        projectileSize: 4,
        projectileCount: 5,
        spread: 25,
        moduleSlots: 2
    },
    SNIPER: {
        name: '狙击枪',
        damage: 50,
        fireRate: 1200,
        projectileSpeed: 1500,
        projectileSize: 6,
        piercing: true,
        spread: 0,
        moduleSlots: 2
    },
    LASER: {
        name: '激光枪',
        damage: 20,
        fireRate: 200,
        projectileSpeed: 2000,
        projectileSize: 3,
        piercing: true,
        spread: 1,
        moduleSlots: 2
    },
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
        explosive: true,
        explosionRadius: 100,
        moduleSlots: 1
    }
};

const WeaponModulePresets = {
    RAPID_COIL: {
        id: 'RAPID_COIL',
        name: '快速线圈',
        rarity: 'common',
        add: { fireRate: -80, spread: 2 },
        recommend: ['手枪', '机枪', '激光枪']
    },
    HEAVY_CALIBER: {
        id: 'HEAVY_CALIBER',
        name: '大口径',
        rarity: 'rare',
        add: { damage: 8, projectileSize: 2, fireRate: 120 },
        recommend: ['狙击枪', '霰弹枪']
    },
    SPLIT_CHAMBER: {
        id: 'SPLIT_CHAMBER',
        name: '分裂膛室',
        rarity: 'rare',
        add: { projectileCount: 2, spread: 8, fireRate: 150 },
        recommend: ['霰弹枪', '机枪']
    },
    PIERCING_CORE: {
        id: 'PIERCING_CORE',
        name: '穿透核心',
        rarity: 'common',
        set: { piercing: true },
        recommend: ['狙击枪', '激光枪']
    },
    LONG_BARREL: {
        id: 'LONG_BARREL',
        name: '加长枪管',
        rarity: 'common',
        add: { range: 300, projectileSpeed: 200 },
        recommend: ['狙击枪', '手枪']
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Weapon, WeaponPresets, WeaponModulePresets };
}
