// ============================================
// MARIO BROS BTS - VERSIÓN WEB (JavaScript)
// ============================================

// Seleccionar canvas y contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Constantes
const GRAVITY = 0.5;
const JUMP_POWER = -12;
const SCREEN_WIDTH = canvas.width;
const SCREEN_HEIGHT = canvas.height;
const FPS = 60;

// Variables globales
let game;
let keys = {};

// ============================================
// CLASE: Particle (Partículas)
// ============================================
class Particle {
    constructor(x, y, color = '#FFD700') {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = Math.random() * -3 - 2;
        this.color = color;
        this.lifetime = 30;
        this.maxLifetime = 30;
    }

    update() {
        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime--;
    }

    draw(ctx, cameraX) {
        const opacity = this.lifetime / this.maxLifetime;
        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - cameraX, this.y, 4, 4);
        ctx.globalAlpha = 1;
    }

    isAlive() {
        return this.lifetime > 0;
    }
}

// ============================================
// CLASE: PowerUp
// ============================================
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 20;
        this.height = 20;
        this.rotating = 0;

        if (type === 'shield') {
            this.color = [0, 150, 255];
        } else if (type === 'speed') {
            this.color = [255, 215, 0];
        } else if (type === 'health') {
            this.color = [255, 50, 50];
        }
    }

    draw(ctx, cameraX) {
        this.rotating += 5;
        ctx.save();
        ctx.translate(this.x - cameraX + 10, this.y + 10);
        ctx.rotate((this.rotating * Math.PI) / 180);

        ctx.fillStyle = `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
        ctx.fillRect(-10, -10, 20, 20);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-10, -10, 20, 20);

        ctx.restore();
    }
}

// ============================================
// CLASE: Coin (Moneda)
// ============================================
class Coin {
    constructor(x, y, special = false) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.special = special;
        this.bobbing = 0;
        this.value = special ? 50 : 10;
    }

    update() {
        this.bobbing += 0.05;
    }

    draw(ctx, cameraX) {
        ctx.fillStyle = this.special ? '#FFD700' : '#FFB800';
        ctx.beginPath();
        ctx.arc(this.x - cameraX, this.y + Math.sin(this.bobbing) * 2, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

// ============================================
// CLASE: Platform (Plataforma)
// ============================================
class Platform {
    constructor(x, y, width, height, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.moving = 0;
        this.moveDir = 1;
        this.moveRange = 100;
    }

    update() {
        if (this.type === 'moving') {
            this.moving += 1 * this.moveDir;
            if (Math.abs(this.moving) > this.moveRange) {
                this.moveDir *= -1;
            }
        }
    }

    draw(ctx, cameraX) {
        if (this.type === 'normal') {
            ctx.fillStyle = '#4CAF50';
        } else if (this.type === 'moving') {
            ctx.fillStyle = '#2196F3';
        } else if (this.type === 'spike') {
            ctx.fillStyle = '#FF1744';
        }

        const x = this.x - cameraX + this.moving;
        ctx.fillRect(x, this.y, this.width, this.height);

        if (this.type === 'spike') {
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, this.y, this.width, this.height);
        }
    }

    getRect() {
        return {
            x: this.x + this.moving,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// ============================================
// CLASE: Enemy (Enemigo)
// ============================================
class Enemy {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.type = type;

        if (type === 'normal') {
            this.speed = 2;
            this.color = [220, 50, 50];
        } else if (type === 'fast') {
            this.speed = 4;
            this.color = [150, 20, 20];
        } else if (type === 'flying') {
            this.speed = 2.5;
            this.vspeed = 0.5;
            this.color = [200, 100, 50];
            this.minY = Math.max(0, y - 80);
            this.maxY = y + 80;
        } else if (type === 'shooter') {
            this.speed = 1.5;
            this.color = [100, 50, 150];
        } else if (type === 'teleport') {
            this.speed = 3;
            this.color = [220, 50, 220];
            this.teleportTimer = 180;
            this.teleportCooldown = 180;
        }

        this.direction = Math.random() > 0.5 ? 1 : -1;
    }

    update(platforms) {
        if (this.type === 'normal' || this.type === 'fast' || this.type === 'shooter') {
            this.x += this.speed * this.direction;

            // Rebotar en los bordes de plataformas
            for (let platform of platforms) {
                const rect = platform.getRect();
                if (this.x < rect.x - 100 || this.x > rect.x + rect.width + 100) {
                    this.direction *= -1;
                }
            }
        }

        if (this.type === 'flying') {
            this.x += this.speed * this.direction;
            this.y += this.vspeed;

            if (this.y <= this.minY || this.y >= this.maxY) {
                this.vspeed *= -1;
            }

            for (let platform of platforms) {
                const rect = platform.getRect();
                if (this.x < rect.x - 200 || this.x > rect.x + rect.width + 200) {
                    this.direction *= -1;
                }
            }
        }

        if (this.type === 'teleport') {
            this.teleportTimer--;
            if (this.teleportTimer <= 0) {
                this.x = Math.random() * (SCREEN_WIDTH - 100) + 50;
                this.y = Math.random() * 100 + 100;
                this.teleportTimer = this.teleportCooldown;
            }

            this.x += this.speed * this.direction;
            if (Math.random() > 0.99) {
                this.direction *= -1;
            }
        }
    }

    draw(ctx, cameraX) {
        const r = this.color[0];
        const g = this.color[1];
        const b = this.color[2];

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);

        // Ojos
        ctx.fillStyle = '#FFF';
        ctx.fillRect(this.x - cameraX + 5, this.y + 8, 6, 6);
        ctx.fillRect(this.x - cameraX + 19, this.y + 8, 6, 6);
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - cameraX + 7, this.y + 10, 2, 2);
        ctx.fillRect(this.x - cameraX + 21, this.y + 10, 2, 2);

        // Alas para enemigos voladores
        if (this.type === 'flying') {
            ctx.fillStyle = 'rgba(200, 100, 50, 0.7)';
            ctx.fillRect(this.x - cameraX - 5, this.y + 10, 5, 8);
            ctx.fillRect(this.x - cameraX + 30, this.y + 10, 5, 8);
        }

        // Parpadeo para teletransportadores
        if (this.type === 'teleport') {
            const alpha = Math.sin(this.teleportTimer / 30) * 0.3 + 0.7;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
            ctx.globalAlpha = 1;
        }
    }
}

// ============================================
// CLASE: Player (Jugador)
// ============================================
class Player {
    constructor() {
        this.x = 100;
        this.y = 200;
        this.width = 30;
        this.height = 35;
        this.vx = 0;
        this.vy = 0;
        this.speed = 4;
        this.onGround = false;
        this.particles = [];

        // Power-ups
        this.shieldTime = 0;
        this.speedTime = 0;
        this.lives = 3;
    }

    handleInput() {
        this.vx = 0;
        if (keys['ArrowLeft'] || keys['a']) this.vx = -this.speed;
        if (keys['ArrowRight'] || keys['d']) this.vx = this.speed;
        if ((keys[' '] || keys['w']) && this.onGround) {
            this.vy = JUMP_POWER;
            this.onGround = false;

            // Crear partículas de salto
            for (let i = 0; i < 5; i++) {
                this.particles.push(new Particle(this.x + 15, this.y + 35, '#FFD700'));
            }
        }
    }

    update(platforms) {
        this.handleInput();

        // Gravedad
        this.vy += GRAVITY;
        if (this.vy > 15) this.vy = 15;

        // Movimiento horizontal
        this.x += this.vx;
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > 10000) this.x = 10000 - this.width;

        // Colisión con plataformas
        this.onGround = false;
        for (let platform of platforms) {
            const rect = platform.getRect();
            if (
                this.x + this.width > rect.x &&
                this.x < rect.x + rect.width &&
                this.y + this.height >= rect.y &&
                this.y + this.height <= rect.y + rect.height + 10 &&
                this.vy >= 0
            ) {
                this.y = rect.y - this.height;
                this.vy = 0;
                this.onGround = true;

                if (platform.type === 'spike') {
                    if (this.shieldTime <= 0) {
                        this.lives--;
                        this.shieldTime = 0;
                    } else {
                        this.shieldTime = 0;
                    }
                    this.y -= 20;
                }
            }
        }

        // Muerte por caída
        if (this.y > SCREEN_HEIGHT + 100) {
            this.lives--;
            this.reset();
        }

        // Actualizar power-ups
        this.shieldTime--;
        this.speedTime--;

        // Actualizar partículas
        for (let particle of this.particles) {
            particle.update();
        }
        this.particles = this.particles.filter(p => p.isAlive());

        // Movimiento vertical
        this.y += this.vy;
    }

    draw(ctx, cameraX) {
        // Cuerpo
        if (this.speedTime > 0) {
            ctx.fillStyle = '#C77DFF';
        } else {
            ctx.fillStyle = '#FFEB3B';
        }
        ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);

        // Ojos
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - cameraX + 7, this.y + 8, 4, 4);
        ctx.fillRect(this.x - cameraX + 19, this.y + 8, 4, 4);

        // Escudo
        if (this.shieldTime > 0) {
            ctx.strokeStyle = 'rgba(0, 150, 255, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x - cameraX + 15, this.y + 17, 25, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Partículas
        for (let particle of this.particles) {
            particle.draw(ctx, cameraX);
        }
    }

    reset() {
        this.x = 100;
        this.y = 200;
        this.vy = 0;
        this.vx = 0;
    }
}

// ============================================
// CLASE: Level (Niveles)
// ============================================
class Level {
    constructor(levelNumber) {
        this.levelNumber = levelNumber;
        this.platforms = [];
        this.enemies = [];
        this.coins = [];
        this.powerups = [];
        this.goalX = 0;
        this.goalY = 0;
        this.members = ['Jin', 'Suga', 'J-Hope', 'RM', 'Jungkook', 'V'];
        this.memberName = this.members[levelNumber - 1];

        this.generateLevel();
    }

    generateLevel() {
        if (this.levelNumber === 1) this.generateLevelJin();
        else if (this.levelNumber === 2) this.generateLevelSuga();
        else if (this.levelNumber === 3) this.generateLevelJhope();
        else if (this.levelNumber === 4) this.generateLevelRM();
        else if (this.levelNumber === 5) this.generateLevelJungkook();
        else if (this.levelNumber === 6) this.generateLevelV();
    }

    generateLevelJin() {
        // Suelo
        this.platforms.push(new Platform(0, 550, 3000, 50, 'normal'));

        // Plataformas
        this.platforms.push(new Platform(150, 450, 150, 20, 'normal'));
        this.platforms.push(new Platform(400, 380, 150, 20, 'normal'));
        this.platforms.push(new Platform(650, 300, 150, 20, 'normal'));
        this.platforms.push(new Platform(900, 380, 150, 20, 'normal'));
        this.platforms.push(new Platform(1150, 450, 150, 20, 'normal'));
        this.platforms.push(new Platform(1400, 380, 150, 20, 'normal'));
        this.platforms.push(new Platform(1650, 300, 150, 20, 'normal'));
        this.platforms.push(new Platform(1900, 380, 150, 20, 'normal'));
        this.platforms.push(new Platform(2150, 450, 150, 20, 'normal'));
        this.platforms.push(new Platform(2400, 200, 200, 20, 'normal'));

        // Monedas
        for (let i = 0; i < 8; i++) {
            this.coins.push(new Coin(500 + i * 150, 350, i % 2 === 0));
        }

        // Enemigos
        this.enemies.push(new Enemy(400, 350, 'normal'));
        this.enemies.push(new Enemy(900, 350, 'normal'));
        this.enemies.push(new Enemy(1400, 350, 'normal'));

        // Meta
        this.goalX = 2450;
        this.goalY = 150;
    }

    generateLevelSuga() {
        this.platforms.push(new Platform(0, 550, 3500, 50, 'normal'));

        // Plataformas normales y móviles
        this.platforms.push(new Platform(100, 480, 100, 20, 'normal'));
        this.platforms.push(new Platform(250, 400, 100, 20, 'moving'));
        this.platforms.push(new Platform(450, 350, 120, 20, 'normal'));
        this.platforms.push(new Platform(650, 420, 100, 20, 'moving'));
        this.platforms.push(new Platform(850, 300, 120, 20, 'normal'));
        this.platforms.push(new Platform(1050, 400, 100, 20, 'moving'));
        this.platforms.push(new Platform(1250, 380, 120, 20, 'normal'));
        this.platforms.push(new Platform(1450, 300, 100, 20, 'moving'));
        this.platforms.push(new Platform(1650, 420, 120, 20, 'normal'));
        this.platforms.push(new Platform(1850, 350, 100, 20, 'moving'));
        this.platforms.push(new Platform(2050, 280, 150, 20, 'normal'));
        this.platforms.push(new Platform(2300, 200, 200, 20, 'normal'));

        // Monedas
        for (let i = 0; i < 10; i++) {
            this.coins.push(new Coin(400 + i * 170, 300 + (i % 2) * 50, i % 3 === 0));
        }

        // Enemigos
        this.enemies.push(new Enemy(400, 320, 'normal'));
        this.enemies.push(new Enemy(850, 270, 'fast'));
        this.enemies.push(new Enemy(1250, 350, 'normal'));
        this.enemies.push(new Enemy(1650, 390, 'fast'));

        this.goalX = 2350;
        this.goalY = 150;
    }

    generateLevelJhope() {
        this.platforms.push(new Platform(0, 550, 4000, 50, 'normal'));

        // Plataformas con spikes
        this.platforms.push(new Platform(100, 480, 120, 20, 'normal'));
        this.platforms.push(new Platform(300, 420, 80, 20, 'spike'));
        this.platforms.push(new Platform(450, 400, 150, 20, 'normal'));
        this.platforms.push(new Platform(700, 350, 80, 20, 'spike'));
        this.platforms.push(new Platform(850, 380, 150, 20, 'normal'));
        this.platforms.push(new Platform(1100, 300, 100, 20, 'spike'));
        this.platforms.push(new Platform(1250, 350, 150, 20, 'normal'));
        this.platforms.push(new Platform(1500, 280, 80, 20, 'spike'));
        this.platforms.push(new Platform(1650, 350, 150, 20, 'normal'));
        this.platforms.push(new Platform(1900, 250, 100, 20, 'spike'));
        this.platforms.push(new Platform(2050, 320, 150, 20, 'normal'));
        this.platforms.push(new Platform(2300, 200, 200, 20, 'normal'));

        // Monedas
        for (let i = 0; i < 12; i++) {
            this.coins.push(new Coin(300 + i * 140, 300 + (i % 3) * 40, i % 4 === 0));
        }

        // Power-ups
        this.powerups.push(new PowerUp(650, 350, 'shield'));
        this.powerups.push(new PowerUp(1400, 300, 'speed'));

        // Enemigos
        this.enemies.push(new Enemy(450, 370, 'normal'));
        this.enemies.push(new Enemy(850, 350, 'fast'));
        this.enemies.push(new Enemy(1250, 320, 'normal'));
        this.enemies.push(new Enemy(1650, 320, 'fast'));

        this.goalX = 2350;
        this.goalY = 150;
    }

    generateLevelRM() {
        this.platforms.push(new Platform(0, 550, 5000, 50, 'normal'));

        // Plataformas normales
        this.platforms.push(new Platform(100, 480, 120, 20, 'normal'));
        this.platforms.push(new Platform(300, 420, 100, 20, 'normal'));
        this.platforms.push(new Platform(500, 350, 120, 20, 'normal'));
        this.platforms.push(new Platform(750, 400, 100, 20, 'normal'));
        this.platforms.push(new Platform(950, 300, 130, 20, 'normal'));
        this.platforms.push(new Platform(1200, 380, 100, 20, 'normal'));
        this.platforms.push(new Platform(1400, 320, 120, 20, 'normal'));
        this.platforms.push(new Platform(1650, 380, 100, 20, 'moving'));
        this.platforms.push(new Platform(1850, 280, 120, 20, 'normal'));
        this.platforms.push(new Platform(2100, 350, 100, 20, 'normal'));
        this.platforms.push(new Platform(2350, 250, 150, 20, 'normal'));

        // Monedas
        for (let i = 0; i < 16; i++) {
            this.coins.push(new Coin(250 + i * 180, 280 + (i % 4) * 50, i % 3 === 0));
        }

        // Power-ups
        this.powerups.push(new PowerUp(500, 320, 'shield'));
        this.powerups.push(new PowerUp(1200, 250, 'speed'));

        // Enemigos voladores - NIVEL 4
        this.enemies.push(new Enemy(500, 250, 'flying'));
        this.enemies.push(new Enemy(950, 200, 'flying'));
        this.enemies.push(new Enemy(1400, 200, 'flying'));
        this.enemies.push(new Enemy(1850, 200, 'flying'));
        this.enemies.push(new Enemy(2350, 150, 'flying'));
        this.enemies.push(new Enemy(800, 450, 'normal'));

        this.goalX = 2400;
        this.goalY = 200;
    }

    generateLevelJungkook() {
        this.platforms.push(new Platform(0, 550, 5500, 50, 'normal'));

        // Plataformas con muchos spikes
        this.platforms.push(new Platform(100, 480, 120, 20, 'normal'));
        this.platforms.push(new Platform(300, 400, 80, 20, 'spike'));
        this.platforms.push(new Platform(450, 420, 100, 20, 'normal'));
        this.platforms.push(new Platform(650, 350, 80, 20, 'spike'));
        this.platforms.push(new Platform(800, 380, 120, 20, 'normal'));
        this.platforms.push(new Platform(1000, 300, 80, 20, 'spike'));
        this.platforms.push(new Platform(1150, 350, 120, 20, 'normal'));
        this.platforms.push(new Platform(1350, 280, 100, 20, 'spike'));
        this.platforms.push(new Platform(1500, 340, 120, 20, 'normal'));
        this.platforms.push(new Platform(1700, 250, 80, 20, 'spike'));
        this.platforms.push(new Platform(1850, 320, 120, 20, 'normal'));
        this.platforms.push(new Platform(2050, 200, 100, 20, 'spike'));
        this.platforms.push(new Platform(2200, 300, 150, 20, 'normal'));

        // Monedas
        for (let i = 0; i < 13; i++) {
            this.coins.push(new Coin(250 + i * 170, 300 + (i % 3) * 60, i % 3 === 0));
        }

        // Power-ups
        this.powerups.push(new PowerUp(450, 390, 'shield'));
        this.powerups.push(new PowerUp(1150, 320, 'speed'));
        this.powerups.push(new PowerUp(1850, 290, 'health'));

        // Enemigos disparadores - NIVEL 5
        this.enemies.push(new Enemy(450, 390, 'shooter'));
        this.enemies.push(new Enemy(800, 350, 'shooter'));
        this.enemies.push(new Enemy(1150, 320, 'shooter'));
        this.enemies.push(new Enemy(1500, 310, 'shooter'));
        this.enemies.push(new Enemy(1850, 290, 'shooter'));
        this.enemies.push(new Enemy(300, 450, 'normal'));

        this.goalX = 2250;
        this.goalY = 250;
    }

    generateLevelV() {
        this.platforms.push(new Platform(0, 550, 6000, 50, 'normal'));

        // Plataformas complejas
        this.platforms.push(new Platform(100, 480, 120, 20, 'normal'));
        this.platforms.push(new Platform(300, 400, 100, 20, 'moving'));
        this.platforms.push(new Platform(500, 350, 120, 20, 'normal'));
        this.platforms.push(new Platform(700, 280, 80, 20, 'spike'));
        this.platforms.push(new Platform(850, 380, 120, 20, 'normal'));
        this.platforms.push(new Platform(1050, 300, 100, 20, 'moving'));
        this.platforms.push(new Platform(1250, 380, 120, 20, 'normal'));
        this.platforms.push(new Platform(1450, 250, 80, 20, 'spike'));
        this.platforms.push(new Platform(1600, 350, 120, 20, 'normal'));
        this.platforms.push(new Platform(1800, 280, 100, 20, 'moving'));
        this.platforms.push(new Platform(2000, 380, 120, 20, 'normal'));
        this.platforms.push(new Platform(2200, 220, 100, 20, 'spike'));
        this.platforms.push(new Platform(2350, 300, 150, 20, 'normal'));
        this.platforms.push(new Platform(2600, 200, 100, 20, 'moving'));
        this.platforms.push(new Platform(2800, 300, 150, 20, 'normal'));
        this.platforms.push(new Platform(3050, 150, 200, 20, 'normal'));

        // Monedas (20 total)
        for (let i = 0; i < 20; i++) {
            this.coins.push(new Coin(200 + i * 190, 250 + (i % 4) * 50, i % 2 === 0));
        }

        // Power-ups (4 total)
        this.powerups.push(new PowerUp(500, 320, 'shield'));
        this.powerups.push(new PowerUp(1250, 350, 'speed'));
        this.powerups.push(new PowerUp(2000, 250, 'health'));
        this.powerups.push(new PowerUp(2800, 270, 'shield'));

        // Enemigos teletransportadores - NIVEL 6 (¡El más difícil!)
        for (let i = 0; i < 8; i++) {
            this.enemies.push(new Enemy(300 + i * 350, 200 + Math.random() * 200, 'teleport'));
        }

        this.goalX = 3100;
        this.goalY = 100;
    }

    update() {
        for (let platform of this.platforms) {
            platform.update();
        }

        for (let enemy of this.enemies) {
            enemy.update(this.platforms);
        }

        for (let coin of this.coins) {
            coin.update();
        }
    }

    draw(ctx) {
        // Fondo estrellado
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let platform of this.platforms) platform.draw(ctx, game.cameraX);
        for (let coin of this.coins) coin.draw(ctx, game.cameraX);
        for (let powerup of this.powerups) powerup.draw(ctx, game.cameraX);
        for (let enemy of this.enemies) enemy.draw(ctx, game.cameraX);

        // Meta
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.goalX - game.cameraX - 20, this.goalY - 20, 40, 40);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✓', this.goalX - game.cameraX, this.goalY);
    }
}

// ============================================
// CLASE: Game (Juego Principal)
// ============================================
class Game {
    constructor() {
        this.state = 'menu'; // menu, playing, levelComplete, gameOver, ending
        this.currentLevel = 1;
        this.level = null;
        this.player = null;
        this.score = 0;
        this.bestScore = this.loadBestScore();
        this.cameraX = 0;
        this.message = '';
        this.messageTimer = 0;

        this.playGame();
    }

    playGame() {
        this.loadLevel(1);
        this.state = 'playing';
    }

    loadLevel(levelNumber) {
        this.currentLevel = levelNumber;
        this.level = new Level(levelNumber);
        this.player = new Player();
        this.player.x = 50;
        this.player.y = 400;
    }

    update() {
        if (this.state !== 'playing') return;

        this.player.update(this.level.platforms);

        // Cámara
        this.cameraX = Math.max(0, this.player.x - 300);

        // Colisión con enemigos
        for (let enemy of this.level.enemies) {
            if (
                this.player.x + this.player.width > enemy.x &&
                this.player.x < enemy.x + enemy.width &&
                this.player.y + this.player.height > enemy.y &&
                this.player.y < enemy.y + enemy.height
            ) {
                if (this.player.shieldTime <= 0) {
                    this.player.lives--;
                    this.player.reset();
                    if (this.player.lives < 0) {
                        this.state = 'gameOver';
                        this.saveBestScore();
                    }
                } else {
                    this.player.shieldTime = 0;
                }
            }
        }

        // Colisión con monedas
        for (let i = this.level.coins.length - 1; i >= 0; i--) {
            let coin = this.level.coins[i];
            if (
                this.player.x + this.player.width > coin.x - 10 &&
                this.player.x < coin.x + 10 &&
                this.player.y + this.player.height > coin.y - 10 &&
                this.player.y < coin.y + 10
            ) {
                this.score += coin.value;
                this.level.coins.splice(i, 1);
            }
        }

        // Colisión con power-ups
        for (let i = this.level.powerups.length - 1; i >= 0; i--) {
            let powerup = this.level.powerups[i];
            if (
                this.player.x + this.player.width > powerup.x &&
                this.player.x < powerup.x + powerup.width &&
                this.player.y + this.player.height > powerup.y &&
                this.player.y < powerup.y + powerup.height
            ) {
                if (powerup.type === 'shield') {
                    this.player.shieldTime = 300;
                } else if (powerup.type === 'speed') {
                    this.player.speedTime = 300;
                } else if (powerup.type === 'health') {
                    this.player.lives++;
                }
                this.level.powerups.splice(i, 1);
            }
        }

        // Meta
        if (
            this.player.x + this.player.width > this.level.goalX &&
            this.player.x < this.level.goalX + 40 &&
            this.player.y + this.player.height > this.level.goalY &&
            this.player.y < this.level.goalY + 40
        ) {
            this.score += 500;
            if (this.currentLevel < 6) {
                this.state = 'levelComplete';
                this.messageTimer = 120;
            } else {
                this.state = 'ending';
                this.messageTimer = 300;
            }
        }

        this.level.update();
    }

    draw() {
        this.level.draw(ctx);
        this.player.draw(ctx, this.cameraX);

        // HUD
        this.updateHUD();

        // Mensajes
        if (this.messageTimer > 0) {
            this.messageTimer--;
            const messageElement = document.getElementById('message');

            if (this.state === 'levelComplete') {
                messageElement.style.display = 'block';
                messageElement.textContent = '✓ ¡NIVEL COMPLETO!';
                if (this.messageTimer === 0) {
                    this.loadLevel(this.currentLevel + 1);
                    this.state = 'playing';
                    messageElement.style.display = 'none';
                }
            } else if (this.state === 'ending') {
                messageElement.style.display = 'block';
                messageElement.textContent = '🎉 ¡GANASTE! 💜';
                if (this.messageTimer === 0) {
                    this.state = 'gameOver';
                    messageElement.style.display = 'none';
                }
            } else if (this.state === 'gameOver') {
                messageElement.style.display = 'block';
                messageElement.textContent = '💀 GAME OVER';
            }
        }
    }

    updateHUD() {
        document.getElementById('hudLevel').textContent = `${this.currentLevel}/6`;
        document.getElementById('hudMember').textContent = this.level.memberName;
        document.getElementById('hudScore').textContent = this.score;
        document.getElementById('hudBest').textContent = this.bestScore;
        document.getElementById('hudLives').textContent = this.player.lives;
        document.getElementById('hudShield').textContent = this.player.shieldTime > 0 ? 'Sí ✓' : 'No';
        document.getElementById('hudSpeed').textContent = this.player.speedTime > 0 ? 'Boost ⚡' : 'Normal';
    }

    loadBestScore() {
        const saved = localStorage.getItem('btsGameBestScore');
        return saved ? parseInt(saved) : 0;
    }

    saveBestScore() {
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('btsGameBestScore', this.bestScore);
        }
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'Escape') {
        location.reload();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// ============================================
// LOOP PRINCIPAL
// ============================================
function gameLoop() {
    game.update();
    game.draw();
    setTimeout(gameLoop, 1000 / FPS);
}

// Iniciar juego cuando la página carga
window.addEventListener('load', () => {
    game = new Game();
    gameLoop();
});
