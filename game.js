// ============================================
// MARIO BROS BTS - VERSIÓN WEB v2.0 (MEJORADO)
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Constantes de Física
const GRAVITY = 0.6;
const JUMP_POWER = -13;
const MAX_FALL_SPEED = 16;
const FRICTION = 0.85;
const ACCELERATION = 0.5;
const SCREEN_WIDTH = canvas.width;
const SCREEN_HEIGHT = canvas.height;
const FPS = 60;

// Variables globales
let game;
let keys = {};

// ============================================
// CLASE: Particle (Partículas mejoradas)
// ============================================
class Particle {
    constructor(x, y, color = '#FFD700', vx = 0, vy = 0) {
        this.x = x;
        this.y = y;
        this.vx = vx || (Math.random() - 0.5) * 6;
        this.vy = vy || (Math.random() * -4 - 1);
        this.color = color;
        this.lifetime = 35;
        this.maxLifetime = 35;
        this.size = Math.random() * 3 + 2;
    }

    update() {
        this.vy += GRAVITY * 0.5;
        this.vx *= FRICTION;
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime--;
        this.size *= 0.97;
    }

    draw(ctx, cameraX) {
        const opacity = this.lifetime / this.maxLifetime;
        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - cameraX - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.globalAlpha = 1;
    }

    isAlive() {
        return this.lifetime > 0;
    }
}

// ============================================
// CLASE: PowerUp (Mejorado)
// ============================================
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 24;
        this.height = 24;
        this.rotating = 0;
        this.bobbing = 0;

        if (type === 'shield') {
            this.color = [0, 150, 255];
            this.icon = '🛡️';
        } else if (type === 'speed') {
            this.color = [255, 215, 0];
            this.icon = '⚡';
        } else if (type === 'health') {
            this.color = [255, 50, 100];
            this.icon = '❤️';
        }
    }

    draw(ctx, cameraX) {
        this.rotating += 6;
        this.bobbing += 0.05;
        
        const x = this.x - cameraX;
        const y = this.y + Math.sin(this.bobbing) * 3;

        ctx.save();
        ctx.translate(x + 12, y + 12);
        ctx.rotate((this.rotating * Math.PI) / 180);

        // Cuadro externo
        ctx.strokeStyle = `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
        ctx.lineWidth = 3;
        ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.3)`;
        ctx.fillRect(-12, -12, 24, 24);
        ctx.strokeRect(-12, -12, 24, 24);

        // Brillo externo
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-14, -14, 28, 28);

        ctx.restore();
    }
}

// ============================================
// CLASE: Coin (Moneda mejorada)
// ============================================
class Coin {
    constructor(x, y, special = false) {
        this.x = x;
        this.y = y;
        this.radius = special ? 7 : 5;
        this.special = special;
        this.bobbing = Math.random() * Math.PI * 2;
        this.value = special ? 50 : 10;
        this.collected = false;
    }

    update() {
        this.bobbing += 0.08;
    }

    draw(ctx, cameraX) {
        const x = this.x - cameraX;
        const y = this.y + Math.sin(this.bobbing) * 3;

        if (this.special) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(x, y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Brillo especial
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(x - 2, y - 2, this.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = '#FFB800';
            ctx.beginPath();
            ctx.arc(x, y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 165, 0, 0.7)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
}

// ============================================
// CLASE: Platform (Plataforma mejorada con tipos)
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
        this.color = this.getColor();
    }

    getColor() {
        switch(this.type) {
            case 'normal': return [76, 175, 80];
            case 'moving': return [33, 150, 243];
            case 'spike': return [244, 67, 54];
            default: return [100, 100, 100];
        }
    }

    update() {
        if (this.type === 'moving') {
            this.moving += 1.5 * this.moveDir;
            if (Math.abs(this.moving) > this.moveRange) {
                this.moveDir *= -1;
            }
        }
    }

    draw(ctx, cameraX) {
        const x = this.x - cameraX + this.moving;
        const [r, g, b] = this.color;

        // Plataforma principal
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, this.y, this.width, this.height);

        // Borde oscuro
        ctx.strokeStyle = `rgb(${Math.max(0, r-50)}, ${Math.max(0, g-50)}, ${Math.max(0, b-50)})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, this.y, this.width, this.height);

        // Luz superior
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, this.y);
        ctx.lineTo(x + this.width, this.y);
        ctx.stroke();

        // Spikes
        if (this.type === 'spike') {
            ctx.fillStyle = 'rgb(200, 30, 30)';
            for (let i = 0; i < this.width; i += 15) {
                ctx.beginPath();
                ctx.moveTo(x + i, this.y);
                ctx.lineTo(x + i + 7, this.y - 8);
                ctx.lineTo(x + i + 14, this.y);
                ctx.fill();
            }
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
// CLASE: FireTrap (Trampa de fuego giratorio)
// ============================================
class FireTrap {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 30;
        this.rotation = 0;
        this.rotationSpeed = 0.08;
        this.fireSize = 12;
        this.flames = [];
        
        // Crear llamas alrededor
        for (let i = 0; i < 4; i++) {
            this.flames.push({
                angle: (i * Math.PI / 2),
                distance: this.radius
            });
        }
    }

    update() {
        this.rotation += this.rotationSpeed;
    }

    draw(ctx, cameraX) {
        const x = this.x - cameraX;
        const y = this.y;

        // Centro del mecanismo
        ctx.fillStyle = '#404040';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dibujar llamas giratorias
        for (let flame of this.flames) {
            const flameAngle = flame.angle + this.rotation;
            const fx = x + Math.cos(flameAngle) * flame.distance;
            const fy = y + Math.sin(flameAngle) * flame.distance;

            // Llama naranja
            ctx.fillStyle = '#FF6F00';
            ctx.beginPath();
            ctx.ellipse(fx, fy, this.fireSize * 1.2, this.fireSize * 1.5, flameAngle, 0, Math.PI * 2);
            ctx.fill();

            // Interior amarillo
            ctx.fillStyle = '#FFD600';
            ctx.beginPath();
            ctx.ellipse(fx, fy, this.fireSize * 0.6, this.fireSize * 0.9, flameAngle, 0, Math.PI * 2);
            ctx.fill();

            // Luz
            ctx.fillStyle = 'rgba(255, 200, 0, 0.6)';
            ctx.beginPath();
            ctx.arc(fx - 3, fy - 3, this.fireSize * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    getFlamePositions() {
        const positions = [];
        for (let flame of this.flames) {
            const flameAngle = flame.angle + this.rotation;
            const fx = this.x + Math.cos(flameAngle) * flame.distance;
            const fy = this.y + Math.sin(flameAngle) * flame.distance;
            positions.push({ x: fx, y: fy, radius: this.fireSize });
        }
        return positions;
    }
}

// ============================================
// CLASE: Enemy (Enemigo mejorado)
// ============================================
class Enemy {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.type = type;
        this.vx = 0;
        this.vy = 0;

        this.setupType();
        this.direction = Math.random() > 0.5 ? 1 : -1;
    }

    setupType() {
        switch(this.type) {
            case 'normal':
                this.speed = 2;
                this.color = [220, 50, 50];
                break;
            case 'fast':
                this.speed = 4;
                this.color = [150, 20, 20];
                break;
            case 'flying':
                this.speed = 2.5;
                this.vspeed = 0.5;
                this.color = [200, 100, 50];
                this.minY = this.y - 80;
                this.maxY = this.y + 80;
                break;
            case 'shooter':
                this.speed = 1.5;
                this.color = [100, 50, 150];
                break;
            case 'teleport':
                this.speed = 3;
                this.color = [220, 50, 220];
                this.teleportTimer = 180;
                this.teleportCooldown = 180;
                break;
        }
    }

    update(platforms) {
        if (this.type === 'flying') {
            this.x += this.speed * this.direction;
            this.y += this.vspeed;
            if (this.y <= this.minY || this.y >= this.maxY) this.vspeed *= -1;
        } else if (this.type === 'teleport') {
            this.teleportTimer--;
            if (this.teleportTimer <= 0) {
                this.x = Math.random() * (SCREEN_WIDTH - 100) + 50;
                this.y = Math.random() * 100 + 100;
                this.teleportTimer = this.teleportCooldown;
            }
            this.x += this.speed * this.direction;
            if (Math.random() > 0.99) this.direction *= -1;
        } else {
            this.x += this.speed * this.direction;
        }

        // Rebotar
        for (let platform of platforms) {
            const rect = platform.getRect();
            if (this.x < rect.x - 150 || this.x > rect.x + rect.width + 150) {
                this.direction *= -1;
            }
        }
    }

    draw(ctx, cameraX) {
        const [r, g, b] = this.color;
        const x = this.x - cameraX;
        const y = this.y;

        // Cuerpo principal
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, y, this.width, this.height);

        // Borde
        ctx.strokeStyle = `rgb(${Math.max(0, r-80)}, ${Math.max(0, g-80)}, ${Math.max(0, b-80)})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, this.width, this.height);

        // Ojos
        ctx.fillStyle = '#FFF';
        ctx.fillRect(x + 5, y + 8, 6, 6);
        ctx.fillRect(x + 19, y + 8, 6, 6);
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 7, y + 10, 2, 2);
        ctx.fillRect(x + 21, y + 10, 2, 2);

        // Alas volador
        if (this.type === 'flying') {
            ctx.fillStyle = 'rgba(200, 100, 50, 0.8)';
            ctx.fillRect(x - 8, y + 8, 6, 12);
            ctx.fillRect(x + 32, y + 8, 6, 12);
        }

        // Parpadeo teletransportador
        if (this.type === 'teleport') {
            const alpha = Math.sin(this.teleportTimer / 30) * 0.4 + 0.6;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(x, y, this.width, this.height);
            ctx.globalAlpha = 1;
        }
    }
}

// ============================================
// CLASE: Player (Jugador mejorado)
// ============================================
class Player {
    constructor() {
        this.x = 100;
        this.y = 200;
        this.width = 30;
        this.height = 35;
        this.vx = 0;
        this.vy = 0;
        this.speed = 0;
        this.maxSpeed = 5;
        this.onGround = false;
        this.particles = [];
        this.jumpBuffer = 0;

        // Power-ups
        this.shieldTime = 0;
        this.speedTime = 0;
        this.damageTimer = 0;
        this.lives = 3;
    }

    handleInput() {
        // Aceleración horizontal mejorada
        if (keys['ArrowLeft'] || keys['a']) {
            this.speed = Math.max(this.speed - ACCELERATION, -this.maxSpeed);
        } else if (keys['ArrowRight'] || keys['d']) {
            this.speed = Math.min(this.speed + ACCELERATION, this.maxSpeed);
        } else {
            this.speed *= FRICTION;
        }

        this.vx = this.speed;

        // Jump buffering
        if ((keys[' '] || keys['w']) && this.jumpBuffer < 4) {
            this.jumpBuffer++;
            if (this.jumpBuffer === 1 && this.onGround) {
                this.vy = JUMP_POWER;
                this.onGround = false;

                // Partículas de salto
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 * i) / 8;
                    const vx = Math.cos(angle) * 3;
                    const vy = Math.sin(angle) * 3;
                    this.particles.push(new Particle(this.x + 15, this.y + 35, '#FFD700', vx, vy));
                }
            }
        } else {
            this.jumpBuffer = 0;
        }
    }

    update(platforms) {
        this.handleInput();

        // Gravedad mejorada
        this.vy += GRAVITY;
        if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;

        // Movimiento horizontal
        this.x += this.vx;
        if (this.x < 30) this.x = 30;
        if (this.x + this.width > 10000) this.x = 10000 - this.width;

        // Colisión con plataformas
        this.onGround = false;
        for (let platform of platforms) {
            const rect = platform.getRect();
            
            // Colisión superior/inferior
            if (this.x + this.width > rect.x && this.x < rect.x + rect.width) {
                if (this.vy >= 0 && this.y + this.height >= rect.y && this.y + this.height <= rect.y + rect.height + 15) {
                    this.y = rect.y - this.height;
                    this.vy = 0;
                    this.onGround = true;

                    if (platform.type === 'spike') {
                        this.takeDamage();
                        this.y -= 20;
                        this.vy = -8;
                    }
                }
            }
        }

        // Muerte por caída
        if (this.y > SCREEN_HEIGHT + 100) {
            this.lives--;
            this.reset();
            this.damageTimer = 60;
        }

        // Power-ups y sistema de daño
        this.shieldTime--;
        this.damageTimer--;
        this.speedTime--;

        // Partículas
        for (let p of this.particles) p.update();
        this.particles = this.particles.filter(p => p.isAlive());

        // Movimiento vertical
        this.y += this.vy;
    }

    takeDamage() {
        if (this.damageTimer <= 0) {
            if (this.shieldTime <= 0) {
                this.lives--;
                this.shieldTime = 0;
            } else {
                this.shieldTime = 0;
                for (let i = 0; i < 15; i++) {
                    this.particles.push(new Particle(this.x + 15, this.y + 17, '#0096FF'));
                }
            }
            this.damageTimer = 60;
        }
    }

    draw(ctx, cameraX) {
        const x = this.x - cameraX;
        const y = this.y;

        // Cuerpo
        const bodyColor = this.speedTime > 0 ? [199, 125, 255] : [255, 235, 59];
        ctx.fillStyle = `rgb(${bodyColor[0]}, ${bodyColor[1]}, ${bodyColor[2]})`;
        ctx.fillRect(x, y, this.width, this.height);

        // Borde
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, this.width, this.height);

        // Ojos
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 7, y + 8, 5, 5);
        ctx.fillRect(x + 18, y + 8, 5, 5);
        ctx.fillStyle = '#FFF';
        ctx.fillRect(x + 8, y + 9, 2, 2);
        ctx.fillRect(x + 19, y + 9, 2, 2);

        // Boca
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x + 15, y + 22, 4, 0, Math.PI);
        ctx.stroke();

        // Escudo
        if (this.shieldTime > 0) {
            ctx.strokeStyle = `rgba(0, 150, 255, ${0.3 + (this.shieldTime % 10) * 0.07})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x + 15, y + 17, 28, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Partículas
        for (let p of this.particles) p.draw(ctx, cameraX);
    }

    reset() {
        this.x = 100;
        this.y = 200;
        this.vy = 0;
        this.vx = 0;
        this.speed = 0;
    }
}

// ============================================
// CLASE: Level (Niveles mejorados)
// ============================================
class Level {
    constructor(levelNumber) {
        this.levelNumber = levelNumber;
        this.platforms = [];
        this.enemies = [];
        this.coins = [];
        this.powerups = [];
        this.fireTraps = [];
        this.goalX = 0;
        this.goalY = 0;
        this.members = ['Jin', 'Suga', 'J-Hope', 'RM', 'Jungkook', 'V'];
        this.memberName = this.members[levelNumber - 1];

        this.generateLevel();
    }

    generateLevel() {
        const methods = [
            () => this.generateLevelJin(),
            () => this.generateLevelSuga(),
            () => this.generateLevelJhope(),
            () => this.generateLevelRM(),
            () => this.generateLevelJungkook(),
            () => this.generateLevelV()
        ];
        methods[this.levelNumber - 1]();
        this.cleanupLayout();
    }

    cleanupLayout() {
        const items = [];
        const addItem = (item, type) => items.push({ item, type });

        for (const coin of this.coins) addItem(coin, 'coin');
        for (const powerup of this.powerups) addItem(powerup, 'powerup');
        for (const enemy of this.enemies) addItem(enemy, 'enemy');
        for (const trap of this.fireTraps) addItem(trap, 'trap');

        const getBox = (obj, type) => {
            if (type === 'coin') return { x: obj.x - 8, y: obj.y - 8, width: 16, height: 16 };
            if (type === 'powerup') return { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
            if (type === 'enemy') return { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
            return { x: obj.x - obj.radius, y: obj.y - obj.radius, width: obj.radius * 2, height: obj.radius * 2 };
        };

        const intersects = (a, b) =>
            a.x < b.x + b.width + 12 &&
            a.x + a.width + 12 > b.x &&
            a.y < b.y + b.height + 12 &&
            a.y + a.height + 12 > b.y;

        for (let i = 0; i < items.length; i++) {
            for (let j = 0; j < i; j++) {
                const current = items[i];
                const other = items[j];
                let a = getBox(current.item, current.type);
                const b = getBox(other.item, other.type);
                let safety = 0;

                while (intersects(a, b) && safety < 10) {
                    if (current.type === 'trap') {
                        current.item.x += 90;
                        current.item.y -= 24;
                    } else {
                        current.item.x += 42;
                        current.item.y += (safety % 2 === 0) ? -14 : 14;
                    }
                    a = getBox(current.item, current.type);
                    safety++;
                }
            }
        }
    }

    generateLevelJin() {
        // Piso base
        this.platforms.push(new Platform(0, 550, 3000, 50, 'normal'));
        
        // Escalera progresiva hacia la meta
        this.platforms.push(new Platform(200, 480, 150, 20, 'normal'));
        this.platforms.push(new Platform(450, 420, 150, 20, 'normal'));
        this.platforms.push(new Platform(700, 360, 150, 20, 'normal'));
        this.platforms.push(new Platform(950, 300, 150, 20, 'normal'));
        this.platforms.push(new Platform(1200, 380, 150, 20, 'normal'));
        this.platforms.push(new Platform(1450, 320, 150, 20, 'normal'));
        this.platforms.push(new Platform(1700, 400, 150, 20, 'normal'));
        this.platforms.push(new Platform(1950, 340, 150, 20, 'normal'));
        this.platforms.push(new Platform(2200, 280, 150, 20, 'normal'));
        this.platforms.push(new Platform(2400, 200, 200, 20, 'normal'));

        // Monedas ARRIBA de plataformas
        this.coins.push(new Coin(225, 450, true));
        this.coins.push(new Coin(475, 390, false));
        this.coins.push(new Coin(725, 330, true));
        this.coins.push(new Coin(975, 270, false));
        this.coins.push(new Coin(1225, 350, true));
        this.coins.push(new Coin(1475, 290, false));
        this.coins.push(new Coin(1725, 370, true));
        this.coins.push(new Coin(1975, 310, false));

        // Enemigos separados en plataformas
        this.enemies.push(new Enemy(450, 390, 'normal'));
        this.enemies.push(new Enemy(950, 270, 'normal'));
        this.enemies.push(new Enemy(1700, 370, 'fast'));

        this.goalX = 2450;
        this.goalY = 200;
    }

    generateLevelSuga() {
        // Piso base
        this.platforms.push(new Platform(0, 550, 3500, 50, 'normal'));
        
        // Escalera con plataformas móviles
        this.platforms.push(new Platform(150, 480, 120, 20, 'normal'));
        this.platforms.push(new Platform(350, 420, 100, 20, 'moving'));
        this.platforms.push(new Platform(550, 380, 120, 20, 'normal'));
        this.platforms.push(new Platform(750, 450, 100, 20, 'moving'));
        this.platforms.push(new Platform(950, 380, 120, 20, 'normal'));
        this.platforms.push(new Platform(1150, 440, 100, 20, 'moving'));
        this.platforms.push(new Platform(1350, 360, 120, 20, 'normal'));
        this.platforms.push(new Platform(1550, 420, 100, 20, 'moving'));
        this.platforms.push(new Platform(1750, 340, 120, 20, 'normal'));
        this.platforms.push(new Platform(1950, 400, 100, 20, 'moving'));
        this.platforms.push(new Platform(2150, 300, 150, 20, 'normal'));
        this.platforms.push(new Platform(2350, 240, 200, 20, 'normal'));

        // Monedas bien posicionadas
        this.coins.push(new Coin(150, 450, true));
        this.coins.push(new Coin(350, 390, false));
        this.coins.push(new Coin(550, 350, true));
        this.coins.push(new Coin(750, 420, false));
        this.coins.push(new Coin(950, 350, true));
        this.coins.push(new Coin(1150, 410, false));
        this.coins.push(new Coin(1350, 330, true));
        this.coins.push(new Coin(1550, 390, false));
        this.coins.push(new Coin(1750, 310, true));
        this.coins.push(new Coin(1950, 370, false));

        // Enemigos en espacios
        this.enemies.push(new Enemy(550, 350, 'normal'));
        this.enemies.push(new Enemy(950, 350, 'fast'));
        this.enemies.push(new Enemy(1350, 330, 'normal'));
        this.enemies.push(new Enemy(1750, 310, 'fast'));

        this.goalX = 2350;
        this.goalY = 240;
    }

    generateLevelJhope() {
        // Piso base
        this.platforms.push(new Platform(0, 550, 4000, 50, 'normal'));
        
        // Escalera mixta: subidas con descansos
        this.platforms.push(new Platform(200, 480, 120, 20, 'normal'));
        this.platforms.push(new Platform(450, 460, 120, 20, 'normal'));
        this.platforms.push(new Platform(700, 400, 100, 20, 'normal'));
        this.platforms.push(new Platform(950, 440, 120, 20, 'normal'));
        this.platforms.push(new Platform(1200, 360, 100, 20, 'normal'));
        this.platforms.push(new Platform(1450, 420, 120, 20, 'normal'));
        this.platforms.push(new Platform(1700, 340, 100, 20, 'normal'));
        this.platforms.push(new Platform(1950, 400, 120, 20, 'normal'));
        this.platforms.push(new Platform(2200, 300, 150, 20, 'normal'));
        this.platforms.push(new Platform(2400, 360, 200, 20, 'normal'));

        // Monedas en diferentes alturas
        this.coins.push(new Coin(200, 450, true));
        this.coins.push(new Coin(450, 430, false));
        this.coins.push(new Coin(700, 370, true));
        this.coins.push(new Coin(950, 410, false));
        this.coins.push(new Coin(1200, 330, true));
        this.coins.push(new Coin(1450, 390, false));
        this.coins.push(new Coin(1700, 310, true));
        this.coins.push(new Coin(1950, 370, false));
        this.coins.push(new Coin(2200, 270, true));
        this.coins.push(new Coin(2400, 330, false));
        this.coins.push(new Coin(2550, 330, true));
        this.coins.push(new Coin(2300, 330, false));

        // Power-ups separados de monedas
        this.powerups.push(new PowerUp(650, 370, 'shield'));
        this.powerups.push(new PowerUp(1600, 350, 'speed'));

        this.enemies.push(new Enemy(450, 430, 'normal'));
        this.enemies.push(new Enemy(950, 410, 'fast'));
        this.enemies.push(new Enemy(1450, 390, 'normal'));
        this.enemies.push(new Enemy(1950, 370, 'fast'));

        this.goalX = 2350;
        this.goalY = 300;
    }

    generateLevelRM() {
        // Piso base amplio
        this.platforms.push(new Platform(0, 550, 5000, 50, 'normal'));
        
        // Escalera progresiva con enemigos voladores que rodean
        this.platforms.push(new Platform(200, 480, 120, 20, 'normal'));
        this.platforms.push(new Platform(450, 410, 100, 20, 'normal'));
        this.platforms.push(new Platform(700, 470, 120, 20, 'normal'));
        this.platforms.push(new Platform(950, 390, 100, 20, 'normal'));
        this.platforms.push(new Platform(1200, 450, 120, 20, 'normal'));
        this.platforms.push(new Platform(1450, 360, 100, 20, 'normal'));
        this.platforms.push(new Platform(1700, 430, 120, 20, 'moving'));
        this.platforms.push(new Platform(1950, 330, 100, 20, 'normal'));
        this.platforms.push(new Platform(2200, 410, 120, 20, 'normal'));
        this.platforms.push(new Platform(2400, 280, 150, 20, 'normal'));

        // Monedas dispersas - bien separadas
        for (let i = 0; i < 16; i++) {
            const x = 250 + i * 180;
            const special = i % 3 === 0;
            this.coins.push(new Coin(x, 350, special));
        }

        // Power-ups EN DIFERENTES POSICIONES que monedas
        this.powerups.push(new PowerUp(450, 380, 'shield'));
        this.powerups.push(new PowerUp(1200, 420, 'speed'));
        this.powerups.push(new PowerUp(1950, 300, 'health'));

        // Enemigos voladores a diferentes alturas
        this.enemies.push(new Enemy(500, 250, 'flying'));
        this.enemies.push(new Enemy(950, 280, 'flying'));
        this.enemies.push(new Enemy(1450, 240, 'flying'));
        this.enemies.push(new Enemy(1950, 200, 'flying'));
        // Normales en plataformas
        this.enemies.push(new Enemy(700, 440, 'normal'));
        this.enemies.push(new Enemy(1450, 330, 'fast'));

        this.goalX = 2400;
        this.goalY = 280;
    }

    generateLevelJungkook() {
        // Piso base
        this.platforms.push(new Platform(0, 550, 5500, 50, 'normal'));
        
        // Escalera de dificultad con protección para trampas
        this.platforms.push(new Platform(200, 480, 120, 20, 'normal'));
        this.platforms.push(new Platform(450, 400, 100, 20, 'normal'));
        this.platforms.push(new Platform(700, 450, 100, 20, 'normal'));
        this.platforms.push(new Platform(950, 350, 100, 20, 'normal'));
        this.platforms.push(new Platform(1200, 420, 120, 20, 'normal'));
        this.platforms.push(new Platform(1450, 300, 100, 20, 'normal'));
        this.platforms.push(new Platform(1700, 380, 120, 20, 'normal'));
        this.platforms.push(new Platform(1950, 280, 100, 20, 'normal'));
        this.platforms.push(new Platform(2200, 360, 150, 20, 'normal'));
        this.platforms.push(new Platform(2350, 240, 150, 20, 'normal'));
        
        // Plataformas de protección bajo trampas
        this.platforms.push(new Platform(400, 450, 100, 20, 'normal'));
        this.platforms.push(new Platform(1150, 450, 100, 20, 'normal'));

        // Trampas EN ALTURA PROTEGIDAS
        this.fireTraps.push(new FireTrap(520, 350));
        this.fireTraps.push(new FireTrap(1280, 370));

        // Monedas en lugares seguros
        this.coins.push(new Coin(200, 450, true));
        this.coins.push(new Coin(500, 370, false));
        this.coins.push(new Coin(700, 420, true));
        this.coins.push(new Coin(950, 320, false));
        this.coins.push(new Coin(1200, 390, true));
        this.coins.push(new Coin(1450, 270, false));
        this.coins.push(new Coin(1700, 350, true));
        this.coins.push(new Coin(1950, 250, false));
        this.coins.push(new Coin(2200, 330, true));
        this.coins.push(new Coin(2350, 210, false));
        this.coins.push(new Coin(2450, 210, true));
        this.coins.push(new Coin(2250, 210, false));
        this.coins.push(new Coin(2350, 280, true));

        // Power-ups separados
        this.powerups.push(new PowerUp(700, 420, 'shield'));
        this.powerups.push(new PowerUp(1550, 270, 'speed'));
        this.powerups.push(new PowerUp(2000, 250, 'health'));

        // Enemigos normales evitables
        this.enemies.push(new Enemy(450, 370, 'normal'));
        this.enemies.push(new Enemy(950, 320, 'normal'));
        this.enemies.push(new Enemy(1450, 270, 'normal'));
        this.enemies.push(new Enemy(1700, 350, 'fast'));
        this.enemies.push(new Enemy(300, 450, 'fast'));

        this.goalX = 2250;
        this.goalY = 240;
    }

    generateLevelV() {
        // Piso base muy amplio
        this.platforms.push(new Platform(0, 550, 6000, 50, 'normal'));
        
        // Escalera final: progresiva con desafios
        this.platforms.push(new Platform(200, 480, 120, 20, 'normal'));
        this.platforms.push(new Platform(450, 390, 100, 20, 'moving'));
        this.platforms.push(new Platform(700, 460, 120, 20, 'normal'));
        this.platforms.push(new Platform(950, 340, 100, 20, 'normal'));
        this.platforms.push(new Platform(1200, 420, 120, 20, 'moving'));
        this.platforms.push(new Platform(1450, 300, 100, 20, 'normal'));
        this.platforms.push(new Platform(1700, 380, 120, 20, 'normal'));
        this.platforms.push(new Platform(1950, 280, 100, 20, 'moving'));
        this.platforms.push(new Platform(2200, 360, 120, 20, 'normal'));
        this.platforms.push(new Platform(2450, 240, 100, 20, 'normal'));
        this.platforms.push(new Platform(2700, 320, 120, 20, 'moving'));
        this.platforms.push(new Platform(2950, 200, 150, 20, 'normal'));
        this.platforms.push(new Platform(3100, 280, 200, 20, 'normal'));
        
        // Protección bajo trampas
        this.platforms.push(new Platform(900, 450, 100, 20, 'normal'));
        this.platforms.push(new Platform(1400, 450, 100, 20, 'normal'));
        this.platforms.push(new Platform(2150, 450, 100, 20, 'normal'));

        // Trampas de fuego al final - protegidas
        this.fireTraps.push(new FireTrap(950, 280));
        this.fireTraps.push(new FireTrap(1450, 250));
        this.fireTraps.push(new FireTrap(2200, 300));

        // Monedas bien distribuidas
        let coinPositions = [
            [200, 450], [450, 360], [700, 430], [950, 310], [1200, 390],
            [1450, 270], [1700, 350], [1950, 250], [2200, 330], [2450, 210],
            [2700, 290], [2950, 170], [3100, 250], [3200, 250], [3000, 250],
            [255, 450], [500, 360], [750, 430], [1100, 310], [1350, 390]
        ];
        for (let i = 0; i < 20; i++) {
            if (coinPositions[i]) {
                this.coins.push(new Coin(coinPositions[i][0], coinPositions[i][1], i % 2 === 0));
            }
        }

        // Power-ups estratégicos
        this.powerups.push(new PowerUp(650, 430, 'shield'));
        this.powerups.push(new PowerUp(1500, 270, 'speed'));
        this.powerups.push(new PowerUp(2500, 210, 'health'));
        this.powerups.push(new PowerUp(3000, 170, 'shield'));

        // Enemigos en nivel jugable - distribuidos
        this.enemies.push(new Enemy(300, 450, 'normal'));
        this.enemies.push(new Enemy(650, 430, 'normal'));
        this.enemies.push(new Enemy(1000, 310, 'normal'));
        this.enemies.push(new Enemy(1350, 390, 'fast'));
        this.enemies.push(new Enemy(1700, 350, 'normal'));
        this.enemies.push(new Enemy(2100, 450, 'fast'));
        this.enemies.push(new Enemy(2550, 210, 'fast'));
        this.enemies.push(new Enemy(2900, 450, 'normal'));

        this.goalX = 3100;
        this.goalY = 240;
    }

    update() {
        for (let platform of this.platforms) platform.update();
        for (let enemy of this.enemies) enemy.update(this.platforms);
        for (let trap of this.fireTraps) trap.update();
        for (let coin of this.coins) coin.update();
    }

    draw(ctx) {
        ctx.fillStyle = '#0d1b2a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let platform of this.platforms) platform.draw(ctx, game.cameraX);
        for (let trap of this.fireTraps) trap.draw(ctx, game.cameraX);
        for (let coin of this.coins) coin.draw(ctx, game.cameraX);
        for (let powerup of this.powerups) powerup.draw(ctx, game.cameraX);
        for (let enemy of this.enemies) enemy.draw(ctx, game.cameraX);

        // Meta mejorada
        const goalX = this.goalX - game.cameraX;
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(goalX - 20, this.goalY - 20, 40, 40);
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 3;
        ctx.strokeRect(goalX - 20, this.goalY - 20, 40, 40);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✓', goalX, this.goalY + 8);
    }
}

// ============================================
// CLASE: Game (Juego principal mejorado)
// ============================================
class Game {
    constructor() {
        this.state = 'loading';
        this.currentLevel = 1;
        this.level = null;
        this.player = null;
        this.score = 0;
        this.bestScore = this.loadBestScore();
        this.cameraX = 0;
        this.message = '';
        this.messageTimer = 0;
        this.loadingTimer = 90;
    }

    playGame() {
        this.loadLevel(1);
        this.state = 'playing';
    }

    loadLevel(levelNumber) {
        this.currentLevel = levelNumber;
        this.level = new Level(levelNumber);
        this.player = new Player();
    }

    update() {
        if (this.state === 'loading') {
            this.loadingTimer--;
            if (this.loadingTimer <= 0) this.state = 'menu';
            this.syncOverlays();
            return;
        }

        this.syncOverlays();

        if (this.state !== 'playing') return;

        this.player.update(this.level.platforms);
        this.cameraX = Math.max(0, this.player.x - 300);

        // Colisión con enemigos
        for (let enemy of this.level.enemies) {
            if (this.checkCollision(this.player, enemy) && this.player.damageTimer <= 0) {
                this.player.takeDamage();
                if (this.player.lives <= 0) {
                    this.state = 'gameOver';
                    this.saveBestScore();
                }
            }
        }

        // Colisión con trampas de fuego
        for (let trap of this.level.fireTraps) {
            for (let flame of trap.getFlamePositions()) {
                if (this.checkCircleCollision(this.player, flame) && this.player.damageTimer <= 0) {
                    this.player.takeDamage();
                    if (this.player.lives <= 0) {
                        this.state = 'gameOver';
                        this.saveBestScore();
                    }
                }
            }
        }

        // Monedas
        for (let i = this.level.coins.length - 1; i >= 0; i--) {
            let coin = this.level.coins[i];
            if (this.checkCircleCollision(this.player, coin)) {
                this.score += coin.value;
                this.level.coins.splice(i, 1);
            }
        }

        // Power-ups
        for (let i = this.level.powerups.length - 1; i >= 0; i--) {
            let powerup = this.level.powerups[i];
            if (this.checkCollision(this.player, powerup)) {
                if (powerup.type === 'shield') this.player.shieldTime = 300;
                else if (powerup.type === 'speed') this.player.speedTime = 300;
                else if (powerup.type === 'health') this.player.lives++;
                this.level.powerups.splice(i, 1);
            }
        }

        // Meta
        if (this.checkCircleCollision(this.player, { x: this.level.goalX, y: this.level.goalY, radius: 30 })) {
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

    checkCollision(a, b) {
        return a.x + a.width > b.x && a.x < b.x + b.width && a.y + a.height > b.y && a.y < b.y + b.height;
    }

    checkCircleCollision(player, circle) {
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;
        const dist = Math.sqrt((px - circle.x) ** 2 + (py - circle.y) ** 2);
        return dist < player.width / 2 + circle.radius;
    }

    draw() {
        this.syncOverlays();

        if (this.state === 'loading') {
            this.drawLoading();
            return;
        }

        if (this.state === 'menu') {
            this.drawMenu();
            return;
        }

        if (this.state === 'gameOver') {
            this.drawGameOver();
            return;
        }

        if (this.state === 'playing' || this.state === 'levelComplete' || this.state === 'ending') {
            this.level.draw(ctx);
            this.player.draw(ctx, this.cameraX);
            this.drawHUD();

            if (this.messageTimer > 0) {
                this.messageTimer--;
                if (this.state === 'levelComplete') {
                    this.drawMessage('✓ ¡NIVEL COMPLETO!', '#FFD700');
                    if (this.messageTimer === 0) {
                        this.loadLevel(this.currentLevel + 1);
                        this.state = 'playing';
                    }
                } else if (this.state === 'ending') {
                    this.drawMessage('🎉 ¡GANASTE! 💜', '#FF1493');
                    if (this.messageTimer === 0) this.state = 'gameOver';
                }
            }
        }
    }

    drawHUD() {
        if (this.state !== 'playing' && this.state !== 'levelComplete' && this.state !== 'ending') return;
        
        const hud = document.getElementById('hud');
        let html = `<div class="hud-line"><span class="hud-label">Nivel:</span> <span class="hud-value">${this.currentLevel}/6</span></div>
                   <div class="hud-line"><span class="hud-label">Miembro:</span> <span class="hud-value">${this.level.memberName}</span></div>
                   <div class="hud-line"><span class="hud-label">Puntuación:</span> <span class="hud-value">${this.score}</span></div>
                   <div class="hud-line"><span class="hud-label">Mejor:</span> <span class="hud-value">${this.bestScore}</span></div>
                   <div class="hud-line hud-lives"><span class="hud-label">Vidas:</span> `;
        
        for (let i = 0; i < Math.max(0, this.player.lives); i++) {
            html += '<span class="life-icon">❤️</span>';
        }
        html += `</div>
                 <div class="hud-line"><span class="hud-label">Escudo:</span> <span class="hud-value">${this.player.shieldTime > 0 ? '🛡️' : '—'}</span></div>
                 <div class="hud-line"><span class="hud-label">Velocidad:</span> <span class="hud-value">${this.player.speedTime > 0 ? '⚡' : '—'}</span></div>`;
        
        hud.innerHTML = html;
    }

    drawMessage(text, color) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        ctx.fillStyle = color;
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 10;
        ctx.fillText(text, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    }

    drawLoading() {
        ctx.fillStyle = '#0d1b2a';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        ctx.fillStyle = '#FF1493';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CARGANDO...', SCREEN_WIDTH / 2, 230);

        ctx.fillStyle = '#FFD700';
        ctx.font = '28px Arial';
        ctx.fillText('Preparando la aventura BTS', SCREEN_WIDTH / 2, 285);

        const barWidth = 420;
        const barX = SCREEN_WIDTH / 2 - barWidth / 2;
        const barY = 340;
        const progress = 1 - Math.max(0, this.loadingTimer) / 90;

        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(barX, barY, barWidth, 26);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(barX, barY, barWidth * progress, 26);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(barX, barY, barWidth, 26);
    }

    drawMenu() {
        ctx.fillStyle = '#0d1b2a';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        
        // Título
        ctx.fillStyle = '#FF1493';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BTS GAME', SCREEN_WIDTH / 2, 120);
        
        // Subtítulo
        ctx.fillStyle = '#FFD700';
        ctx.font = '30px Arial';
        ctx.fillText('Acompaña a Alexandra en su aventura', SCREEN_WIDTH / 2, 170);
        
        // Descripción
        ctx.fillStyle = '#FFF';
        ctx.font = '20px Arial';
        ctx.fillText('Recoge monedas • Evita enemigos • Llega a la meta', SCREEN_WIDTH / 2, 220);
        
        // Botón Play
        const playButtonY = 350;
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(SCREEN_WIDTH / 2 - 100, playButtonY, 200, 60);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 30px Arial';
        ctx.fillText('PLAY', SCREEN_WIDTH / 2, playButtonY + 42);
        
        // Instrucciones
        ctx.fillStyle = '#AAA';
        ctx.font = '16px Arial';
        ctx.fillText('Flechas/WASD para movimiento • Espacio para saltar', SCREEN_WIDTH / 2, 500);
        ctx.fillText('ESC para recargar', SCREEN_WIDTH / 2, 530);
    }

    drawGameOver() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        
        // Título
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', SCREEN_WIDTH / 2, 150);
        
        // Puntuación
        ctx.fillStyle = '#FFD700';
        ctx.font = '40px Arial';
        ctx.fillText(`Puntuación: ${this.score}`, SCREEN_WIDTH / 2, 250);
        ctx.fillText(`Mejor: ${this.bestScore}`, SCREEN_WIDTH / 2, 310);
        
        // Botón Retry
        const retryButtonY = 400;
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(SCREEN_WIDTH / 2 - 100, retryButtonY, 200, 60);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 30px Arial';
        ctx.fillText('REINTENTAR', SCREEN_WIDTH / 2, retryButtonY + 42);
    }

    syncOverlays() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const menuOverlay = document.getElementById('menuOverlay');
        const gameOverOverlay = document.getElementById('gameOverOverlay');
        const gameOverScore = document.getElementById('gameOverScore');

        if (!loadingOverlay || !menuOverlay || !gameOverOverlay) return;

        loadingOverlay.classList.toggle('hidden', this.state !== 'loading');
        menuOverlay.classList.toggle('hidden', this.state !== 'menu');
        gameOverOverlay.classList.toggle('hidden', this.state !== 'gameOver');

        if (gameOverScore) gameOverScore.textContent = `Puntuación: ${this.score}`;
    }

    loadBestScore() {
        return localStorage.getItem('btsGameBest') ? parseInt(localStorage.getItem('btsGameBest')) : 0;
    }

    saveBestScore() {
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('btsGameBest', this.bestScore);
        }
    }

    retry() {
        this.currentLevel = 1;
        this.score = 0;
        this.loadLevel(1);
        this.state = 'playing';
        this.messageTimer = 0;
        this.cameraX = 0;
        document.getElementById('hud').innerHTML = '';
        this.syncOverlays();
    }

    startGame() {
        this.state = 'playing';
        this.loadLevel(this.currentLevel);
        this.syncOverlays();
    }
}

// ============================================
// MANEJADOR DE CLICKS
// ============================================
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (game.state === 'menu') {
        // Botón Play: x entre 450-550, y entre 350-410
        if (x >= SCREEN_WIDTH / 2 - 100 && x <= SCREEN_WIDTH / 2 + 100 && y >= 350 && y <= 410) {
            game.startGame();
        }
    } else if (game.state === 'gameOver') {
        // Botón Retry: x entre 450-550, y entre 400-460
        if (x >= SCREEN_WIDTH / 2 - 100 && x <= SCREEN_WIDTH / 2 + 100 && y >= 400 && y <= 460) {
            game.retry();
        }
    }
});

// ============================================
// EVENT LISTENERS
// ============================================
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'Escape') location.reload();
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

window.addEventListener('load', () => {
    game = new Game();
    const playButton = document.getElementById('playButton');
    const retryButton = document.getElementById('retryButton');

    if (playButton) playButton.addEventListener('click', () => game.startGame());
    if (retryButton) retryButton.addEventListener('click', () => game.retry());

    game.syncOverlays();
    gameLoop();
});
