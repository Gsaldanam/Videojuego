// ============================================
// MARIO BROS BTS - VERSIÓN WEB v2.0 (MEJORADO)
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

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
let spriteManager;

class TiledSpriteManager {
    constructor() {
        this.tilesets = {};
        this.backgroundLayers = [];
        this.memberPortraits = {};
        this.memberPortraitSources = {};
        this.basicPointSprite = null;
        this.specialPointSprite = null;
        this.defaultTilesets = {
            tiles: {
                tsxPath: 'tileset-tiles.tsx',
                tileWidth: 18,
                tileHeight: 18,
                columns: 20,
                imageCandidates: [
                    '../Tilemap/tilemap_packed.png',
                    './Tilemap/tilemap_packed.png',
                    'tilemap_packed.png'
                ]
            },
            characters: {
                tsxPath: 'tileset-characters.tsx',
                tileWidth: 24,
                tileHeight: 24,
                columns: 9,
                imageCandidates: [
                    '../Tilemap/tilemap-characters_packed.png',
                    './Tilemap/tilemap-characters_packed.png',
                    'tilemap-characters_packed.png'
                ]
            }
        };
        this.loadAll();
    }

    async loadAll() {
        await Promise.all([
            ...Object.entries(this.defaultTilesets).map(([key, config]) => this.loadTileset(key, config)),
            this.loadBackgroundLayers(),
            this.loadMemberPortraits(),
            this.loadBasicPointSprite(),
            this.loadSpecialPointSprite()
        ]);
    }

    async loadBasicPointSprite() {
        const image = await this.loadImageWithFallbacks([
            'assets/items/mike.png',
            './assets/items/mike.png'
        ]);

        if (image) {
            this.basicPointSprite = image;
            console.log('[Sprites] Punto básico cargado desde assets/items/mike.png');
        } else {
            this.basicPointSprite = null;
            console.warn('[Sprites] No se pudo cargar assets/items/mike.png para puntos básicos');
        }
    }

    drawBasicPoint(ctx, centerX, centerY, radius) {
        if (!this.basicPointSprite) return false;

        const size = Math.max(28, radius * 5.2);
        const dx = Math.round(centerX - size / 2);
        const dy = Math.round(centerY - size / 2);

        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(this.basicPointSprite, dx, dy, size, size);
        ctx.restore();
        return true;
    }

    async loadSpecialPointSprite() {
        const image = await this.loadImageWithFallbacks([
            'assets/items/morado.png',
            './assets/items/morado.png'
        ]);

        if (image) {
            this.specialPointSprite = image;
            console.log('[Sprites] Punto grande cargado desde assets/items/morado.png');
        } else {
            this.specialPointSprite = null;
            console.warn('[Sprites] No se pudo cargar assets/items/morado.png para puntos grandes');
        }
    }

    drawSpecialPoint(ctx, centerX, centerY, radius) {
        if (!this.specialPointSprite) return false;

        const size = Math.max(34, radius * 5.9);
        const dx = Math.round(centerX - size / 2);
        const dy = Math.round(centerY - size / 2);

        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(this.specialPointSprite, dx, dy, size, size);
        ctx.restore();
        return true;
    }

    async loadMemberPortraits() {
        const members = {
            jin: [
                'assets/members/jin.png'
            ],
            suga: [
                'assets/members/suga.png'
            ],
            'j-hope': [
                'assets/members/jhope.png'
            ],
            jimin: [
                'assets/members/jimin.png'
            ],
            jungkook: [
                'assets/members/jungkook.png'
            ],
            rm: [
                'assets/members/rm.png'
            ],
            v: [
                'assets/members/v.png'
            ]
        };

        const entries = await Promise.all(
            Object.entries(members).map(async ([name, paths]) => {
                const image = await this.loadImageWithFallbacks(paths);
                return [name, image];
            })
        );

        for (const [name, image] of entries) {
            if (image) {
                this.memberPortraits[name] = image;
                this.memberPortraitSources[name] = image.currentSrc || image.src || 'unknown';
            }
        }

        console.log(`[Members] Retratos cargados: ${Object.keys(this.memberPortraits).join(', ') || 'ninguno'}`);
    }

    getMemberPortrait(memberName) {
        const normalized = (memberName || '').toLowerCase();
        const aliases = {
            jin: 'jin',
            suga: 'suga',
            'j-hope': 'j-hope',
            jhope: 'j-hope',
            jimin: 'jimin',
            jungkook: 'jungkook',
            rm: 'rm',
            v: 'v'
        };

        const key = aliases[normalized] || normalized;
        return this.memberPortraits[key] || null;
    }

    getMemberPortraitSource(memberName) {
        const normalized = (memberName || '').toLowerCase();
        const aliases = {
            jin: 'jin',
            suga: 'suga',
            'j-hope': 'j-hope',
            jhope: 'j-hope',
            jimin: 'jimin',
            jungkook: 'jungkook',
            rm: 'rm',
            v: 'v'
        };

        const key = aliases[normalized] || normalized;
        return this.memberPortraitSources[key] || null;
    }

    drawMemberPortrait(ctx, memberName, dx, dy, dw, dh) {
        const portrait = this.getMemberPortrait(memberName);
        if (!portrait) return false;

        const scale = Math.min(dw / portrait.width, dh / portrait.height);
        const imageW = Math.max(1, Math.round(portrait.width * scale));
        const imageH = Math.max(1, Math.round(portrait.height * scale));
        const imageX = Math.round(dx + (dw - imageW) / 2);
        const imageY = Math.round(dy + (dh - imageH) / 2);

        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(portrait, imageX, imageY, imageW, imageH);
        ctx.restore();
        return true;
    }

    async loadBackgroundLayers() {
        const candidates = [
            {
                speed: 0.05,
                alpha: 0.72,
                scale: 5,
                yOffset: 40,
                srcPad: 1,
                cropTop: 14,
                fixedSrcX: 64,
                fixedSrcW: 64,
                filter: 'saturate(1.2) contrast(1.18) brightness(1.02)',
                paths: [
                    'tilemap-backgrounds_packed.png',
                    './Tilemap/tilemap-backgrounds_packed.png',
                    '../Tilemap/tilemap-backgrounds_packed.png'
                ]
            },
            {
                speed: 0.12,
                alpha: 0.86,
                scale: 6,
                yOffset: 95,
                srcPad: 1,
                cropTop: 10,
                fixedSrcX: 128,
                fixedSrcW: 64,
                filter: 'saturate(1.28) contrast(1.24) brightness(1.04)',
                paths: [
                    'tilemap-backgrounds_packed.png',
                    './Tilemap/tilemap-backgrounds_packed.png',
                    '../Tilemap/tilemap-backgrounds_packed.png'
                ]
            }
        ];

        const loaded = await Promise.all(
            candidates.map(async (layer) => {
                const image = await this.loadImageWithFallbacks(layer.paths);
                if (!image) return null;
                return {
                    image,
                    speed: layer.speed,
                    alpha: layer.alpha,
                    scale: layer.scale,
                    yOffset: layer.yOffset,
                    srcPad: layer.srcPad || 0,
                    cropTop: layer.cropTop || 0,
                    fixedSrcX: layer.fixedSrcX,
                    fixedSrcW: layer.fixedSrcW,
                    cropLeftRatio: layer.cropLeftRatio ?? 0,
                    cropWidthRatio: layer.cropWidthRatio ?? 1,
                    filter: layer.filter || 'none'
                };
            })
        );

        this.backgroundLayers = loaded.filter(Boolean);
        console.log(`[Background] Capas cargadas: ${this.backgroundLayers.length}`);
        this.backgroundLayers.forEach((layer, index) => {
            const left = Math.round((layer.cropLeftRatio ?? 0) * 100);
            const width = Math.round((layer.cropWidthRatio ?? 1) * 100);
            console.log(`[Background] Capa ${index + 1}: zona X ${left}% -> ${left + width}%`);
        });
        console.log('[Members] Jin -> assets/members/jin.png | Jimin -> assets/members/jimin.png');
    }

    async loadTileset(key, config) {
        let metadata = null;

        try {
            metadata = await this.readTilesetMetadataFromTsx(config.tsxPath);
        } catch {
            metadata = null;
        }

        const finalMetadata = metadata || {
            tileWidth: config.tileWidth,
            tileHeight: config.tileHeight,
            columns: config.columns,
            imageCandidates: config.imageCandidates
        };

        const image = await this.loadImageWithFallbacks(finalMetadata.imageCandidates);
        if (!image) {
            console.warn(`[Sprites] No se pudo cargar tileset "${key}". Rutas probadas:`, finalMetadata.imageCandidates);
            return;
        }

        this.tilesets[key] = {
            image,
            tileWidth: finalMetadata.tileWidth,
            tileHeight: finalMetadata.tileHeight,
            columns: finalMetadata.columns
        };
    }

    async readTilesetMetadataFromTsx(tsxPath) {
        const response = await fetch(tsxPath);
        if (!response.ok) return null;

        const xmlText = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, 'application/xml');
        const parserError = xml.querySelector('parsererror');
        if (parserError) return null;

        const tilesetNode = xml.querySelector('tileset');
        const imageNode = xml.querySelector('image');
        if (!tilesetNode || !imageNode) return null;

        const tileWidth = parseInt(tilesetNode.getAttribute('tilewidth') || '0', 10);
        const tileHeight = parseInt(tilesetNode.getAttribute('tileheight') || '0', 10);
        const columns = parseInt(tilesetNode.getAttribute('columns') || '0', 10);
        const source = imageNode.getAttribute('source') || '';
        if (!tileWidth || !tileHeight || !columns || !source) return null;

        return {
            tileWidth,
            tileHeight,
            columns,
            imageCandidates: this.getImageCandidates(tsxPath, source)
        };
    }

    getImageCandidates(tsxPath, source) {
        const normalized = source.replace(/\\/g, '/');
        const fileName = normalized.split('/').pop();
        const tsxDir = tsxPath.includes('/') ? tsxPath.slice(0, tsxPath.lastIndexOf('/') + 1) : '';

        return [...new Set([
            `${tsxDir}${normalized}`,
            `./${normalized}`,
            normalized,
            fileName
        ].filter(Boolean))];
    }

    loadImageWithFallbacks(candidates) {
        return new Promise((resolve) => {
            const tryNext = (index) => {
                if (index >= candidates.length) {
                    resolve(null);
                    return;
                }

                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = () => tryNext(index + 1);
                image.src = candidates[index];
            };

            tryNext(0);
        });
    }

    getFrame(tilesetKey, localTileId) {
        const tileset = this.tilesets[tilesetKey];
        if (!tileset || !tileset.image) return null;
        if (!Number.isFinite(localTileId) || localTileId < 0) return null;

        const sx = (localTileId % tileset.columns) * tileset.tileWidth;
        const sy = Math.floor(localTileId / tileset.columns) * tileset.tileHeight;
        return {
            image: tileset.image,
            sx,
            sy,
            sw: tileset.tileWidth,
            sh: tileset.tileHeight
        };
    }

    drawTile(ctx, tilesetKey, localTileId, dx, dy, dw, dh, options = {}) {
        const frame = this.getFrame(tilesetKey, localTileId);
        if (!frame) return false;

        const alpha = options.alpha ?? 1;
        const flipX = !!options.flipX;

        ctx.save();
        ctx.globalAlpha = alpha;
        if (flipX) {
            ctx.translate(dx + dw, dy);
            ctx.scale(-1, 1);
            ctx.drawImage(frame.image, frame.sx, frame.sy, frame.sw, frame.sh, 0, 0, dw, dh);
        } else {
            ctx.drawImage(frame.image, frame.sx, frame.sy, frame.sw, frame.sh, dx, dy, dw, dh);
        }
        ctx.restore();
        return true;
    }

    drawTiledRect(ctx, tilesetKey, localTileId, x, y, width, height) {
        const frame = this.getFrame(tilesetKey, localTileId);
        if (!frame) return false;

        for (let py = 0; py < height; py += frame.sh) {
            for (let px = 0; px < width; px += frame.sw) {
                const partW = Math.min(frame.sw, width - px);
                const partH = Math.min(frame.sh, height - py);
                ctx.drawImage(
                    frame.image,
                    frame.sx,
                    frame.sy,
                    partW,
                    partH,
                    x + px,
                    y + py,
                    partW,
                    partH
                );
            }
        }
        return true;
    }

    drawParallaxBackground(ctx, cameraX) {
        const gradient = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
        gradient.addColorStop(0, '#1f3442');
        gradient.addColorStop(0.55, '#2d4853');
        gradient.addColorStop(1, '#415f60');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        if (!this.backgroundLayers.length) return false;

        for (const layer of this.backgroundLayers) {
            const source = layer.image;
            if (!source?.width || !source?.height) continue;

            const srcPad = Math.max(0, Math.min(layer.srcPad || 0, 2));
            const cropTop = Math.max(0, Math.min(layer.cropTop || 0, source.height - 2));
            const usableW = Math.max(1, source.width - srcPad * 2);
            const fixedSrcW = Number.isFinite(layer.fixedSrcW) ? Math.max(1, Math.min(layer.fixedSrcW, usableW)) : null;
            const fixedSrcX = Number.isFinite(layer.fixedSrcX) ? Math.max(srcPad, Math.min(layer.fixedSrcX, source.width - 1)) : null;
            const cropWidthRatio = Math.max(0.15, Math.min(layer.cropWidthRatio ?? 1, 1));
            const cropLeftRatio = Math.max(0, Math.min(layer.cropLeftRatio ?? 0, 1 - cropWidthRatio));
            const srcX = fixedSrcX ?? (srcPad + Math.floor(usableW * cropLeftRatio));
            const srcW = fixedSrcW ?? Math.max(1, Math.floor(usableW * cropWidthRatio));
            const srcH = Math.max(1, source.height - srcPad * 2 - cropTop);
            const scale = layer.scale || 3;
            const drawW = srcW * scale;
            const drawH = srcH * scale;
            const rawOffsetX = -((cameraX * layer.speed) % drawW);
            const offsetX = Math.floor(rawOffsetX);
            const y = Math.round(SCREEN_HEIGHT - drawH - (layer.yOffset || 0));

            ctx.save();
            ctx.globalAlpha = layer.alpha;
            ctx.imageSmoothingEnabled = false;
            ctx.filter = layer.filter || 'none';

            for (let x = offsetX - drawW; x < SCREEN_WIDTH + drawW; x += drawW) {
                const drawX = Math.round(x);
                ctx.drawImage(
                    source,
                    srcX,
                    srcPad + cropTop,
                    srcW,
                    srcH,
                    drawX,
                    y,
                    drawW + 2,
                    drawH
                );
            }

            ctx.restore();
        }

        return true;
    }
}

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
            const specialPointSpriteDrawn = spriteManager?.drawSpecialPoint(ctx, x, y, this.radius);
            if (specialPointSpriteDrawn) return;

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
            const basicPointSpriteDrawn = spriteManager?.drawBasicPoint(ctx, x, y, this.radius);
            if (basicPointSpriteDrawn) return;

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

    isMoving() {
        return this.type === 'moving';
    }

    draw(ctx, cameraX) {
        const x = this.x - cameraX + this.moving;
        const spriteTileByType = {
            normal: 122,
            moving: 101,
            spike: 154
        };

        const spriteDrawn = spriteManager?.drawTiledRect(
            ctx,
            'tiles',
            spriteTileByType[this.type] ?? spriteTileByType.normal,
            x,
            this.y,
            this.width,
            this.height
        );

        if (spriteDrawn) {
            if (this.type === 'spike') {
                for (let i = 0; i < this.width; i += 15) {
                    ctx.fillStyle = 'rgba(160, 20, 20, 0.8)';
                    ctx.beginPath();
                    ctx.moveTo(x + i, this.y);
                    ctx.lineTo(x + i + 7, this.y - 8);
                    ctx.lineTo(x + i + 14, this.y);
                    ctx.fill();
                }
            }
            return;
        }

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
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.radius = options.radius || 90;
        this.rotation = 0;
        this.rotationSpeed = options.rotationSpeed || 0.06;
        this.fireSize = options.fireSize || 15;
        this.segmentSpacing = options.segmentSpacing || 20;
        this.segmentCount = options.segmentCount || 6;
        this.arms = options.arms || 1;
        this.flames = [];

        for (let arm = 0; arm < this.arms; arm++) {
            const armBase = (arm * Math.PI * 2) / this.arms;
            for (let i = 1; i <= this.segmentCount; i++) {
                this.flames.push({
                    angle: armBase,
                    distance: i * this.segmentSpacing
                });
            }
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
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Brazos metálicos
        for (let arm = 0; arm < this.arms; arm++) {
            const armAngle = (arm * Math.PI * 2) / this.arms + this.rotation;
            const endX = x + Math.cos(armAngle) * (this.segmentCount * this.segmentSpacing);
            const endY = y + Math.sin(armAngle) * (this.segmentCount * this.segmentSpacing);
            ctx.strokeStyle = 'rgba(180, 180, 180, 0.4)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        // Dibujar llamas giratorias
        for (let flame of this.flames) {
            const flameAngle = flame.angle + this.rotation;
            const fx = x + Math.cos(flameAngle) * flame.distance;
            const fy = y + Math.sin(flameAngle) * flame.distance;

            // Fuego exterior
            ctx.fillStyle = '#FF6F00';
            ctx.beginPath();
            ctx.ellipse(fx, fy, this.fireSize * 1.25, this.fireSize * 1.4, flameAngle, 0, Math.PI * 2);
            ctx.fill();

            // Núcleo amarillo
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

class CannonShot {
    constructor(y, speed = 9, size = 22) {
        this.x = SCREEN_WIDTH + 200;
        this.y = y;
        this.width = size;
        this.height = size;
        this.speed = speed;
        this.color = '#1b1b1b';
    }

    reset(cameraX) {
        this.x = cameraX + SCREEN_WIDTH + 120 + Math.random() * 500;
    }

    update(cameraX) {
        this.x -= this.speed * 0.68;
        if (this.x + this.width < cameraX - 60) {
            this.reset(cameraX);
        }
    }

    draw(ctx, cameraX) {
        const x = this.x - cameraX;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#5b5b5b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + this.width / 2, this.y + this.height / 2, this.width / 2 - 1, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ff3b30';
        ctx.beginPath();
        ctx.arc(x + this.width / 2 - 3, this.y + this.height / 2 - 3, 4, 0, Math.PI * 2);
        ctx.fill();
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
        this.patrolDistance = this.type === 'fast' ? 180 : 140;
        if (this.type === 'flying') this.patrolDistance = 220;
        if (this.type === 'teleport') this.patrolDistance = 260;
        this.patrolMinX = this.x - this.patrolDistance;
        this.patrolMaxX = this.x + this.patrolDistance;
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
                this.patrolMinX = this.x - this.patrolDistance;
                this.patrolMaxX = this.x + this.patrolDistance;
                this.teleportTimer = this.teleportCooldown;
            }
            this.x += this.speed * this.direction;
            if (Math.random() > 0.99) this.direction *= -1;
        } else {
            this.x += this.speed * this.direction;
        }

        // Patrulla estable por rango propio
        if (this.x <= this.patrolMinX) {
            this.x = this.patrolMinX;
            this.direction = 1;
        } else if (this.x + this.width >= this.patrolMaxX) {
            this.x = this.patrolMaxX - this.width;
            this.direction = -1;
        }

        // Seguridad de límites globales
        if (this.x < 20) {
            this.x = 20;
            this.direction = 1;
        }
    }

    draw(ctx, cameraX) {
        const x = this.x - cameraX;
        const y = this.y;

        const spriteByType = {
            normal: 1,
            fast: 4,
            flying: 7,
            shooter: 10,
            teleport: 13
        };
        const teleportAlpha = this.type === 'teleport'
            ? Math.sin(this.teleportTimer / 30) * 0.4 + 0.6
            : 1;

        const spriteDrawn = spriteManager?.drawTile(
            ctx,
            'characters',
            spriteByType[this.type] ?? spriteByType.normal,
            x,
            y,
            this.width,
            this.height,
            {
                flipX: this.direction < 0,
                alpha: teleportAlpha
            }
        );

        if (spriteDrawn) {
            if (this.type === 'flying') {
                ctx.fillStyle = 'rgba(200, 100, 50, 0.8)';
                ctx.fillRect(x - 8, y + 8, 6, 12);
                ctx.fillRect(x + 32, y + 8, 6, 12);
            }
            return;
        }

        const [r, g, b] = this.color;

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

        const spriteDrawn = spriteManager?.drawTile(
            ctx,
            'characters',
            0,
            x,
            y,
            this.width,
            this.height,
            { flipX: this.vx < -0.1 }
        );

        if (spriteDrawn) {
            if (this.speedTime > 0) {
                ctx.fillStyle = 'rgba(199, 125, 255, 0.35)';
                ctx.fillRect(x, y, this.width, this.height);
            }

            if (this.shieldTime > 0) {
                ctx.strokeStyle = `rgba(0, 150, 255, ${0.3 + (this.shieldTime % 10) * 0.07})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(x + 15, y + 17, 28, 0, Math.PI * 2);
                ctx.stroke();
            }

            for (let p of this.particles) p.draw(ctx, cameraX);
            return;
        }

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
    constructor(levelNumber, options = {}) {
        this.levelNumber = levelNumber;
        this.mode = options.mode || 'normal';
        this.isInfinite = this.mode === 'infinito';
        this.difficultyTier = options.difficultyTier || levelNumber;
        this.platforms = [];
        this.staticPlatforms = [];
        this.dynamicPlatforms = [];
        this.staticPlatformCanvas = null;
        this.levelWidth = SCREEN_WIDTH;
        this.enemies = [];
        this.coins = [];
        this.powerups = [];
        this.fireTraps = [];
        this.cannonShots = [];
        this.goalX = 0;
        this.goalY = 0;
        this.goalWidth = 34;
        this.goalHeight = 42;
        this.members = this.mode === 'normal'
            ? ['Jin', 'Suga', 'J-Hope', 'Jungkook', 'V', 'RM', 'Jimin']
            : ['Jin', 'Suga', 'J-Hope', 'Jimin', 'Jungkook', 'V', 'RM'];
        this.memberName = this.members[(levelNumber - 1) % this.members.length];

        this.generateLevel();
        this.buildPlatformRenderCache();
    }

    generateLevel() {
        if (this.isInfinite) {
            this.generateLevelInfinite(this.difficultyTier);
            return;
        }

        const methods = [
            () => this.generateLevelJin(),
            () => this.generateLevelSuga(),
            () => this.generateLevelJhope(),
            () => this.generateLevelJimin(),
            () => this.generateLevelJungkook(),
            () => this.generateLevelV(),
            () => this.generateLevelRM()
        ];
        const methodIndex = Math.max(0, Math.min(methods.length - 1, this.levelNumber - 1));
        methods[methodIndex]();
    }

    createSeededRandom(seed) {
        let state = seed >>> 0;
        return () => {
            state = (state * 1664525 + 1013904223) >>> 0;
            return state / 4294967296;
        };
    }

    randomRange(random, min, max) {
        return min + random() * (max - min);
    }

    generateLevelInfinite(tier) {
        const random = this.createSeededRandom(7919 + tier * 104729);
        const hazardFactor = Math.min(1, tier / 22);
        const movingChance = Math.min(0.15 + hazardFactor * 0.45, 0.65);
        const enemyCount = 4 + Math.floor(tier * 0.7);
        const trapCount = Math.min(2 + Math.floor(tier * 0.35), 10);
        const shotCount = tier >= 4 ? Math.min(1 + Math.floor((tier - 2) / 4), 6) : 0;
        const levelLength = Math.min(3600 + tier * 180, 9200);

        this.platforms.push(new Platform(0, 550, levelLength, 50, 'normal'));

        let platformX = 170;
        let platformY = 500;
        const elevatedPlatforms = 11 + Math.floor(tier * 0.75);

        for (let i = 0; i < elevatedPlatforms; i++) {
            const jumpStep = Math.floor(this.randomRange(random, 130, 220));
            const prevX = platformX;
            const prevY = platformY;
            platformX += jumpStep;
            if (platformX > levelLength - 520) break;

            const deltaY = Math.floor(this.randomRange(random, -40, 40));
            platformY = Math.max(270, Math.min(510, platformY + deltaY));

            const width = Math.floor(this.randomRange(random, 130, 190));
            const type = random() < movingChance ? 'moving' : 'normal';

            if (jumpStep > 185 || Math.abs(platformY - prevY) > 28) {
                const bridgeX = prevX + Math.floor((platformX - prevX) * 0.5) - 55;
                const bridgeY = Math.max(290, Math.min(505, Math.round((prevY + platformY) / 2)));
                this.platforms.push(new Platform(bridgeX, bridgeY, 110, 20, random() < 0.25 ? 'moving' : 'normal'));
            }

            this.platforms.push(new Platform(platformX, platformY, width, 20, type));

            if (random() < 0.92) {
                this.coins.push(new Coin(platformX + width / 2, platformY - 28, random() < 0.28));
            }
        }

        const finalPlatformX = levelLength - 300;
        const finalPlatformY = Math.max(280, Math.min(470, platformY - 5));
        this.platforms.push(new Platform(finalPlatformX, finalPlatformY, 230, 20, 'normal'));

        const beforeFinalX = finalPlatformX - 250;
        const beforeFinalY = Math.max(300, Math.min(500, finalPlatformY + (random() < 0.5 ? -20 : 20)));
        this.platforms.push(new Platform(beforeFinalX, beforeFinalY, 170, 20, random() < 0.3 ? 'moving' : 'normal'));

        for (let i = 0; i < enemyCount; i++) {
            const ex = this.randomRange(random, 350, levelLength - 420);
            const ey = this.randomRange(random, 260, 470);
            let type = 'normal';
            const roll = random();
            if (tier > 5 && roll > 0.74) type = 'fast';
            if (tier > 9 && roll > 0.86) type = 'flying';
            if (tier > 13 && roll > 0.93) type = 'teleport';
            this.enemies.push(new Enemy(ex, ey, type));
        }

        for (let i = 0; i < trapCount; i++) {
            const tx = this.randomRange(random, 420, levelLength - 520);
            const baseSpacing = this.randomRange(random, 18, 22);
            this.fireTraps.push(new FireTrap(tx, 500, {
                segmentCount: 4 + Math.floor(this.randomRange(random, 0, 4 + hazardFactor * 2)),
                segmentSpacing: baseSpacing,
                fireSize: 14 + Math.floor(this.randomRange(random, 0, 3)),
                arms: random() < Math.min(0.2 + hazardFactor * 0.35, 0.6) ? 2 : 1,
                rotationSpeed: this.randomRange(random, 0.045, 0.08) * (random() < 0.5 ? 1 : -1)
            }));
        }

        for (let i = 0; i < shotCount; i++) {
            const y = this.randomRange(random, 320, 500);
            const speed = this.randomRange(random, 8.6, 10.4 + hazardFactor * 2.4);
            const size = this.randomRange(random, 20, 26);
            this.cannonShots.push(new CannonShot(y, speed, size));
        }

        this.powerups.push(new PowerUp(this.randomRange(random, 600, 1300), this.randomRange(random, 280, 440), 'shield'));
        this.powerups.push(new PowerUp(this.randomRange(random, 1600, 2800), this.randomRange(random, 260, 420), 'speed'));
        if (tier % 3 === 0) {
            this.powerups.push(new PowerUp(this.randomRange(random, 2800, levelLength - 620), this.randomRange(random, 240, 400), 'health'));
        }

        this.goalX = finalPlatformX + 140;
        this.goalY = finalPlatformY;
    }

    buildPlatformRenderCache() {
        this.dynamicPlatforms = this.platforms.filter(platform => platform.isMoving());
        this.staticPlatforms = this.platforms.filter(platform => !platform.isMoving());

        const maxPlatformX = this.platforms.reduce(
            (maxX, platform) => Math.max(maxX, platform.x + platform.width),
            SCREEN_WIDTH
        );
        this.levelWidth = Math.ceil(maxPlatformX + 120);

        if (!this.staticPlatforms.length) {
            this.staticPlatformCanvas = null;
            return;
        }

        const cacheCanvas = document.createElement('canvas');
        cacheCanvas.width = this.levelWidth;
        cacheCanvas.height = SCREEN_HEIGHT;
        const cacheCtx = cacheCanvas.getContext('2d');
        cacheCtx.imageSmoothingEnabled = false;

        for (const platform of this.staticPlatforms) {
            platform.draw(cacheCtx, 0);
        }

        this.staticPlatformCanvas = cacheCanvas;
    }

    isRectVisible(worldX, worldY, width, height, cameraX, padding = 120) {
        const screenX = worldX - cameraX;
        return (
            screenX + width >= -padding &&
            screenX <= SCREEN_WIDTH + padding &&
            worldY + height >= -padding &&
            worldY <= SCREEN_HEIGHT + padding
        );
    }

    isCircleVisible(worldX, worldY, radius, cameraX, padding = 120) {
        const diameter = radius * 2;
        return this.isRectVisible(worldX - radius, worldY - radius, diameter, diameter, cameraX, padding);
    }

    drawStaticPlatforms(ctx, cameraX) {
        if (!this.staticPlatformCanvas) return;

        const srcX = Math.max(0, Math.floor(cameraX));
        const srcW = Math.min(SCREEN_WIDTH, this.staticPlatformCanvas.width - srcX);
        if (srcW <= 0) return;

        ctx.drawImage(
            this.staticPlatformCanvas,
            srcX,
            0,
            srcW,
            SCREEN_HEIGHT,
            0,
            0,
            srcW,
            SCREEN_HEIGHT
        );
    }

    generateLevelJin() {
        this.platforms.push(new Platform(0, 550, 3200, 50, 'normal'));
        this.platforms.push(new Platform(180, 470, 140, 20, 'normal'));
        this.platforms.push(new Platform(410, 420, 140, 20, 'normal'));
        this.platforms.push(new Platform(640, 380, 150, 20, 'normal'));
        this.platforms.push(new Platform(900, 430, 140, 20, 'normal'));
        this.platforms.push(new Platform(1140, 360, 150, 20, 'normal'));
        this.platforms.push(new Platform(1400, 410, 140, 20, 'normal'));
        this.platforms.push(new Platform(1640, 330, 150, 20, 'normal'));
        this.platforms.push(new Platform(1910, 380, 150, 20, 'normal'));
        this.platforms.push(new Platform(2180, 300, 160, 20, 'normal'));
        this.platforms.push(new Platform(2450, 250, 180, 20, 'normal'));

        this.coins.push(new Coin(220, 440, true));
        this.coins.push(new Coin(450, 390, false));
        this.coins.push(new Coin(680, 350, false));
        this.coins.push(new Coin(940, 400, true));
        this.coins.push(new Coin(1180, 330, false));
        this.coins.push(new Coin(1440, 380, false));
        this.coins.push(new Coin(1680, 300, true));
        this.coins.push(new Coin(1950, 350, false));
        this.coins.push(new Coin(2220, 270, true));

        this.enemies.push(new Enemy(430, 390, 'normal'));
        this.enemies.push(new Enemy(1140, 330, 'normal'));
        this.enemies.push(new Enemy(1910, 350, 'fast'));

        this.goalX = 2520;
        this.goalY = 250;
    }

    generateLevelSuga() {
        this.platforms.push(new Platform(0, 550, 3600, 50, 'normal'));
        this.platforms.push(new Platform(160, 480, 120, 20, 'normal'));
        this.platforms.push(new Platform(360, 430, 110, 20, 'moving'));
        this.platforms.push(new Platform(560, 390, 130, 20, 'normal'));
        this.platforms.push(new Platform(790, 450, 110, 20, 'moving'));
        this.platforms.push(new Platform(1020, 380, 130, 20, 'normal'));
        this.platforms.push(new Platform(1260, 430, 110, 20, 'moving'));
        this.platforms.push(new Platform(1490, 350, 130, 20, 'normal'));
        this.platforms.push(new Platform(1740, 410, 110, 20, 'moving'));
        this.platforms.push(new Platform(1980, 330, 140, 20, 'normal'));
        this.platforms.push(new Platform(2240, 290, 160, 20, 'normal'));
        this.platforms.push(new Platform(2500, 250, 180, 20, 'normal'));

        this.coins.push(new Coin(180, 450, true));
        this.coins.push(new Coin(390, 400, false));
        this.coins.push(new Coin(600, 360, true));
        this.coins.push(new Coin(830, 420, false));
        this.coins.push(new Coin(1060, 350, true));
        this.coins.push(new Coin(1300, 400, false));
        this.coins.push(new Coin(1530, 320, true));
        this.coins.push(new Coin(1780, 380, false));
        this.coins.push(new Coin(2020, 300, true));
        this.coins.push(new Coin(2280, 260, false));

        this.enemies.push(new Enemy(600, 360, 'normal'));
        this.enemies.push(new Enemy(1060, 350, 'fast'));
        this.enemies.push(new Enemy(1530, 320, 'normal'));
        this.enemies.push(new Enemy(2020, 300, 'fast'));

        this.goalX = 2570;
        this.goalY = 250;
    }

    generateLevelJhope() {
        this.platforms.push(new Platform(0, 550, 4200, 50, 'normal'));
        this.platforms.push(new Platform(180, 480, 120, 20, 'normal'));
        this.platforms.push(new Platform(420, 450, 120, 20, 'normal'));
        this.platforms.push(new Platform(680, 390, 110, 20, 'normal'));
        this.platforms.push(new Platform(930, 440, 120, 20, 'normal'));
        this.platforms.push(new Platform(1180, 360, 110, 20, 'normal'));
        this.platforms.push(new Platform(1420, 420, 120, 20, 'normal'));
        this.platforms.push(new Platform(1670, 330, 120, 20, 'normal'));
        this.platforms.push(new Platform(1930, 390, 120, 20, 'normal'));
        this.platforms.push(new Platform(2190, 300, 140, 20, 'normal'));
        this.platforms.push(new Platform(2440, 360, 140, 20, 'normal'));
        this.platforms.push(new Platform(2700, 270, 160, 20, 'normal'));

        this.coins.push(new Coin(200, 450, true));
        this.coins.push(new Coin(450, 420, false));
        this.coins.push(new Coin(700, 360, true));
        this.coins.push(new Coin(950, 410, false));
        this.coins.push(new Coin(1200, 330, true));
        this.coins.push(new Coin(1450, 390, false));
        this.coins.push(new Coin(1700, 300, true));
        this.coins.push(new Coin(1950, 360, false));
        this.coins.push(new Coin(2220, 270, true));
        this.coins.push(new Coin(2470, 330, false));
        this.coins.push(new Coin(2660, 240, true));
        this.coins.push(new Coin(2550, 330, false));

        this.powerups.push(new PowerUp(660, 360, 'shield'));
        this.powerups.push(new PowerUp(1680, 300, 'speed'));

        this.enemies.push(new Enemy(450, 420, 'normal'));
        this.enemies.push(new Enemy(950, 410, 'fast'));
        this.enemies.push(new Enemy(1450, 390, 'normal'));
        this.enemies.push(new Enemy(1950, 360, 'fast'));
        this.enemies.push(new Enemy(2470, 330, 'normal'));

        this.goalX = 2760;
        this.goalY = 270;
    }

    generateLevelJimin() {
        this.platforms.push(new Platform(0, 550, 5000, 50, 'normal'));
        this.platforms.push(new Platform(180, 480, 120, 20, 'normal'));
        this.platforms.push(new Platform(430, 420, 110, 20, 'normal'));
        this.platforms.push(new Platform(670, 470, 120, 20, 'normal'));
        this.platforms.push(new Platform(920, 390, 110, 20, 'normal'));
        this.platforms.push(new Platform(1180, 450, 120, 20, 'normal'));
        this.platforms.push(new Platform(1430, 360, 110, 20, 'normal'));
        this.platforms.push(new Platform(1680, 430, 120, 20, 'moving'));
        this.platforms.push(new Platform(1940, 330, 120, 20, 'normal'));
        this.platforms.push(new Platform(2200, 400, 120, 20, 'normal'));
        this.platforms.push(new Platform(2460, 300, 150, 20, 'normal'));
        this.platforms.push(new Platform(2720, 250, 170, 20, 'normal'));

        this.platforms.push(new Platform(1580, 500, 180, 20, 'normal'));
        this.platforms.push(new Platform(1880, 500, 180, 20, 'normal'));

        this.fireTraps.push(new FireTrap(1660, 455, { segmentCount: 5, segmentSpacing: 20, fireSize: 15, arms: 1, rotationSpeed: 0.05 }));
        this.fireTraps.push(new FireTrap(1970, 455, { segmentCount: 4, segmentSpacing: 20, fireSize: 14, arms: 1, rotationSpeed: -0.055 }));

        this.coins.push(new Coin(210, 450, true));
        this.coins.push(new Coin(460, 390, false));
        this.coins.push(new Coin(700, 440, false));
        this.coins.push(new Coin(950, 360, true));
        this.coins.push(new Coin(1210, 420, false));
        this.coins.push(new Coin(1460, 330, true));
        this.coins.push(new Coin(1600, 470, false));
        this.coins.push(new Coin(1900, 470, false));
        this.coins.push(new Coin(1960, 300, true));
        this.coins.push(new Coin(2220, 370, false));
        this.coins.push(new Coin(2480, 270, true));
        this.coins.push(new Coin(2620, 270, true));

        this.powerups.push(new PowerUp(460, 390, 'shield'));
        this.powerups.push(new PowerUp(1460, 330, 'speed'));
        this.powerups.push(new PowerUp(2480, 270, 'health'));

        this.enemies.push(new Enemy(700, 440, 'normal'));
        this.enemies.push(new Enemy(950, 360, 'fast'));
        this.enemies.push(new Enemy(1460, 330, 'normal'));
        this.enemies.push(new Enemy(2220, 370, 'fast'));
        this.enemies.push(new Enemy(1100, 260, 'flying'));

        this.goalX = 2860;
        this.goalY = 250;
    }

    generateLevelJungkook() {
        this.platforms.push(new Platform(0, 550, 5600, 50, 'normal'));
        this.platforms.push(new Platform(200, 480, 120, 20, 'normal'));
        this.platforms.push(new Platform(430, 410, 120, 20, 'normal'));
        this.platforms.push(new Platform(680, 460, 110, 20, 'normal'));
        this.platforms.push(new Platform(930, 360, 120, 20, 'normal'));
        this.platforms.push(new Platform(1180, 430, 120, 20, 'normal'));
        this.platforms.push(new Platform(1430, 340, 120, 20, 'normal'));
        this.platforms.push(new Platform(1680, 410, 120, 20, 'normal'));
        this.platforms.push(new Platform(1940, 320, 120, 20, 'normal'));
        this.platforms.push(new Platform(2200, 390, 140, 20, 'normal'));
        this.platforms.push(new Platform(2460, 300, 140, 20, 'normal'));
        this.platforms.push(new Platform(2720, 250, 160, 20, 'normal'));

        this.platforms.push(new Platform(540, 510, 200, 20, 'normal'));
        this.platforms.push(new Platform(1540, 510, 200, 20, 'normal'));

        this.fireTraps.push(new FireTrap(640, 470, { segmentCount: 5, segmentSpacing: 19, fireSize: 15, arms: 1, rotationSpeed: 0.055 }));
        this.fireTraps.push(new FireTrap(1640, 470, { segmentCount: 5, segmentSpacing: 19, fireSize: 15, arms: 1, rotationSpeed: -0.05 }));

        this.coins.push(new Coin(220, 450, true));
        this.coins.push(new Coin(450, 380, false));
        this.coins.push(new Coin(700, 430, false));
        this.coins.push(new Coin(950, 330, true));
        this.coins.push(new Coin(1200, 400, false));
        this.coins.push(new Coin(1450, 310, true));
        this.coins.push(new Coin(1740, 380, false));
        this.coins.push(new Coin(1960, 290, true));
        this.coins.push(new Coin(2220, 360, false));
        this.coins.push(new Coin(2480, 270, true));
        this.coins.push(new Coin(2740, 220, true));

        this.powerups.push(new PowerUp(950, 330, 'shield'));
        this.powerups.push(new PowerUp(1960, 290, 'speed'));
        this.powerups.push(new PowerUp(2480, 270, 'health'));

        this.enemies.push(new Enemy(450, 380, 'normal'));
        this.enemies.push(new Enemy(950, 330, 'normal'));
        this.enemies.push(new Enemy(1450, 310, 'fast'));
        this.enemies.push(new Enemy(1960, 290, 'fast'));
        this.enemies.push(new Enemy(2480, 270, 'normal'));

        this.goalX = 2760;
        this.goalY = 250;
    }

    generateLevelV() {
        this.platforms.push(new Platform(0, 550, 6400, 50, 'normal'));
        this.platforms.push(new Platform(220, 480, 130, 20, 'normal'));
        this.platforms.push(new Platform(470, 420, 120, 20, 'moving'));
        this.platforms.push(new Platform(730, 470, 130, 20, 'normal'));
        this.platforms.push(new Platform(980, 360, 120, 20, 'normal'));
        this.platforms.push(new Platform(1240, 430, 130, 20, 'moving'));
        this.platforms.push(new Platform(1510, 320, 120, 20, 'normal'));
        this.platforms.push(new Platform(1770, 400, 130, 20, 'normal'));
        this.platforms.push(new Platform(2030, 300, 120, 20, 'moving'));
        this.platforms.push(new Platform(2290, 380, 130, 20, 'normal'));
        this.platforms.push(new Platform(2550, 280, 120, 20, 'normal'));
        this.platforms.push(new Platform(2810, 340, 130, 20, 'moving'));
        this.platforms.push(new Platform(3070, 240, 150, 20, 'normal'));
        this.platforms.push(new Platform(3330, 300, 150, 20, 'normal'));
        this.platforms.push(new Platform(3590, 220, 180, 20, 'normal'));

        this.platforms.push(new Platform(1160, 500, 180, 20, 'normal'));
        this.platforms.push(new Platform(2170, 500, 180, 20, 'normal'));
        this.platforms.push(new Platform(3190, 500, 180, 20, 'normal'));

        this.fireTraps.push(new FireTrap(1250, 455, { segmentCount: 5, segmentSpacing: 20, fireSize: 15, arms: 1, rotationSpeed: 0.055 }));
        this.fireTraps.push(new FireTrap(2260, 455, { segmentCount: 6, segmentSpacing: 19, fireSize: 15, arms: 1, rotationSpeed: -0.05 }));
        this.fireTraps.push(new FireTrap(3280, 455, { segmentCount: 5, segmentSpacing: 20, fireSize: 15, arms: 1, rotationSpeed: 0.06 }));

        const coinPositions = [
            [240, 450], [490, 390], [750, 440], [1000, 330], [1260, 400],
            [1530, 290], [1790, 370], [2050, 270], [2310, 350], [2570, 250],
            [2830, 310], [3090, 210], [3350, 270], [3610, 190], [3490, 260],
            [540, 390], [1300, 470], [2210, 470], [3220, 470], [2660, 250]
        ];
        for (let i = 0; i < coinPositions.length; i++) {
            this.coins.push(new Coin(coinPositions[i][0], coinPositions[i][1], i % 3 === 0));
        }

        this.powerups.push(new PowerUp(1000, 330, 'shield'));
        this.powerups.push(new PowerUp(2050, 270, 'speed'));
        this.powerups.push(new PowerUp(3090, 210, 'health'));

        this.enemies.push(new Enemy(500, 390, 'normal'));
        this.enemies.push(new Enemy(1000, 330, 'fast'));
        this.enemies.push(new Enemy(1530, 290, 'normal'));
        this.enemies.push(new Enemy(2050, 270, 'fast'));
        this.enemies.push(new Enemy(2570, 250, 'normal'));
        this.enemies.push(new Enemy(3090, 210, 'fast'));
        this.enemies.push(new Enemy(3350, 270, 'normal'));
        this.enemies.push(new Enemy(3610, 190, 'fast'));

        this.goalX = 3660;
        this.goalY = 220;
    }

    generateLevelRM() {
        this.platforms.push(new Platform(0, 550, 7600, 50, 'normal'));
        this.platforms.push(new Platform(220, 490, 160, 20, 'normal'));
        this.platforms.push(new Platform(520, 430, 160, 20, 'normal'));
        this.platforms.push(new Platform(860, 380, 170, 20, 'normal'));
        this.platforms.push(new Platform(1220, 330, 180, 20, 'normal'));
        this.platforms.push(new Platform(1600, 290, 180, 20, 'normal'));
        this.platforms.push(new Platform(1980, 320, 180, 20, 'normal'));
        this.platforms.push(new Platform(2360, 280, 190, 20, 'normal'));
        this.platforms.push(new Platform(2750, 250, 200, 20, 'normal'));
        this.platforms.push(new Platform(3170, 290, 190, 20, 'normal'));
        this.platforms.push(new Platform(3590, 240, 190, 20, 'normal'));
        this.platforms.push(new Platform(4030, 280, 180, 20, 'normal'));
        this.platforms.push(new Platform(4480, 230, 180, 20, 'normal'));
        this.platforms.push(new Platform(4950, 270, 180, 20, 'normal'));
        this.platforms.push(new Platform(5430, 220, 190, 20, 'normal'));
        this.platforms.push(new Platform(5900, 260, 180, 20, 'normal'));
        this.platforms.push(new Platform(240, 470, 130, 20, 'moving'));
        this.platforms.push(new Platform(520, 410, 120, 20, 'normal'));
        this.platforms.push(new Platform(820, 350, 120, 20, 'moving'));
        this.platforms.push(new Platform(1160, 430, 130, 20, 'normal'));
        this.platforms.push(new Platform(1490, 320, 130, 20, 'moving'));
        this.platforms.push(new Platform(1840, 400, 140, 20, 'normal'));
        this.platforms.push(new Platform(2220, 280, 130, 20, 'moving'));
        this.platforms.push(new Platform(2600, 360, 140, 20, 'normal'));
        this.platforms.push(new Platform(3000, 250, 150, 20, 'moving'));
        this.platforms.push(new Platform(3430, 330, 150, 20, 'normal'));
        this.platforms.push(new Platform(3890, 220, 160, 20, 'normal'));
        this.platforms.push(new Platform(4350, 300, 150, 20, 'moving'));
        this.platforms.push(new Platform(4580, 260, 170, 20, 'normal'));
        this.platforms.push(new Platform(4820, 210, 170, 20, 'normal'));
        this.platforms.push(new Platform(5330, 300, 170, 20, 'moving'));
        this.platforms.push(new Platform(5600, 245, 170, 20, 'normal'));
        this.platforms.push(new Platform(5850, 200, 190, 20, 'normal'));

        this.fireTraps.push(new FireTrap(1280, 500, { segmentCount: 6, segmentSpacing: 20, fireSize: 15, arms: 1, rotationSpeed: 0.07 }));
        this.fireTraps.push(new FireTrap(2730, 500, { segmentCount: 7, segmentSpacing: 19, fireSize: 15, arms: 1, rotationSpeed: -0.065 }));
        this.fireTraps.push(new FireTrap(4470, 500, { segmentCount: 6, segmentSpacing: 20, fireSize: 15, arms: 1, rotationSpeed: 0.07 }));

        this.cannonShots.push(new CannonShot(470, 8.8, 22));
        this.cannonShots.push(new CannonShot(410, 10.2, 24));
        this.cannonShots.push(new CannonShot(340, 11.2, 20));

        this.coins.push(new Coin(260, 440, true));
        this.coins.push(new Coin(540, 380, false));
        this.coins.push(new Coin(860, 320, true));
        this.coins.push(new Coin(1190, 400, false));
        this.coins.push(new Coin(1520, 290, true));
        this.coins.push(new Coin(1870, 370, false));
        this.coins.push(new Coin(2250, 250, true));
        this.coins.push(new Coin(2630, 330, false));
        this.coins.push(new Coin(3030, 220, true));
        this.coins.push(new Coin(3460, 300, false));
        this.coins.push(new Coin(3920, 190, true));
        this.coins.push(new Coin(4380, 270, false));
        this.coins.push(new Coin(4850, 180, true));
        this.coins.push(new Coin(5360, 270, false));
        this.coins.push(new Coin(5880, 170, true));

        this.powerups.push(new PowerUp(1190, 400, 'shield'));
        this.powerups.push(new PowerUp(3030, 220, 'speed'));
        this.powerups.push(new PowerUp(4850, 180, 'health'));

        this.enemies.push(new Enemy(560, 380, 'fast'));
        this.enemies.push(new Enemy(1220, 400, 'normal'));
        this.enemies.push(new Enemy(1890, 370, 'fast'));
        this.enemies.push(new Enemy(2660, 330, 'normal'));
        this.enemies.push(new Enemy(3470, 300, 'fast'));
        this.enemies.push(new Enemy(4390, 270, 'flying'));
        this.enemies.push(new Enemy(5380, 270, 'teleport'));

        this.goalX = 5930;
        this.goalY = 200;
    }

    update() {
        for (let platform of this.dynamicPlatforms) platform.update();
        for (let enemy of this.enemies) enemy.update(this.platforms);
        for (let trap of this.fireTraps) trap.update();
        for (let shot of this.cannonShots) shot.update(game?.cameraX || 0);
        for (let coin of this.coins) coin.update();
    }

    draw(ctx) {
        if (!spriteManager?.drawParallaxBackground(ctx, game.cameraX)) {
            ctx.fillStyle = '#0d1b2a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        this.drawStaticPlatforms(ctx, game.cameraX);
        for (let platform of this.dynamicPlatforms) {
            if (this.isRectVisible(platform.x + platform.moving, platform.y, platform.width, platform.height, game.cameraX)) {
                platform.draw(ctx, game.cameraX);
            }
        }

        for (let trap of this.fireTraps) {
            const trapRadius = trap.segmentCount * trap.segmentSpacing + trap.fireSize;
            if (this.isCircleVisible(trap.x, trap.y, trapRadius, game.cameraX, 160)) {
                trap.draw(ctx, game.cameraX);
            }
        }

        for (let coin of this.coins) {
            if (this.isCircleVisible(coin.x, coin.y, coin.radius, game.cameraX)) {
                coin.draw(ctx, game.cameraX);
            }
        }

        for (let powerup of this.powerups) {
            if (this.isRectVisible(powerup.x, powerup.y, powerup.width, powerup.height, game.cameraX)) {
                powerup.draw(ctx, game.cameraX);
            }
        }

        for (let enemy of this.enemies) {
            if (this.isRectVisible(enemy.x, enemy.y, enemy.width, enemy.height, game.cameraX)) {
                enemy.draw(ctx, game.cameraX);
            }
        }

        for (let shot of this.cannonShots) {
            if (this.isRectVisible(shot.x, shot.y, shot.width, shot.height, game.cameraX, 220)) {
                shot.draw(ctx, game.cameraX);
            }
        }

        // Meta: integrante BTS
        const goalX = this.goalX - game.cameraX;
        const goalLeft = goalX - this.goalWidth / 2;
        const goalTop = this.goalY - this.goalHeight;

        const goalPortraitDrawn = spriteManager?.drawMemberPortrait(
            ctx,
            this.memberName,
            goalLeft,
            goalTop,
            this.goalWidth,
            this.goalHeight
        );

        const goalSpriteByLevel = [20, 21, 22, 23, 24, 25];
        const goalSpriteDrawn = goalPortraitDrawn || spriteManager?.drawTile(
            ctx,
            'characters',
            goalSpriteByLevel[Math.max(0, Math.min(goalSpriteByLevel.length - 1, this.levelNumber - 1))],
            goalLeft,
            goalTop,
            this.goalWidth,
            this.goalHeight
        );

        if (!goalSpriteDrawn) {
            ctx.fillStyle = '#2a2f7a';
            ctx.fillRect(goalLeft, goalTop + 14, this.goalWidth, this.goalHeight - 14);

            ctx.fillStyle = '#f2d2b6';
            ctx.beginPath();
            ctx.arc(goalX, goalTop + 11, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#1b1b1b';
            ctx.fillRect(goalX - 7, goalTop + 3, 14, 5);
            ctx.fillStyle = '#000';
            ctx.fillRect(goalX - 4, goalTop + 10, 2, 2);
            ctx.fillRect(goalX + 2, goalTop + 10, 2, 2);

            ctx.strokeStyle = '#ff66c4';
            ctx.lineWidth = 2;
            ctx.strokeRect(goalLeft, goalTop + 14, this.goalWidth, this.goalHeight - 14);
        }

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.memberName, goalX, goalTop + this.goalHeight + 12);
    }
}

// ============================================
// CLASE: Game (Juego principal mejorado)
// ============================================
class Game {
    constructor() {
        this.mode = 'normal';
        this.playerName = this.loadPlayerName();
        this.state = this.playerName ? 'menu' : 'nameEntry';
        this.currentLevel = 1;
        this.level = null;
        this.player = null;
        this.score = 0;
        this.bestScore = this.loadBestScore();
        this.volume = this.loadVolume();
        this.cameraX = 0;
        this.message = '';
        this.messageTimer = 0;
        this.lastHudHtml = '';
        this.lastOverlayState = '';
        this.lastOverlayScore = -1;
        this.lastOverlayVolume = -1;
        this.lastHudKey = '';
        this.hudFrameThrottle = 0;
        this.supabaseUrl = (window.BTS_SUPABASE_URL || '').trim();
        this.supabaseAnonKey = (window.BTS_SUPABASE_ANON_KEY || '').trim();
        this.supabaseClient = this.createSupabaseClient();
        this.remoteLeaderboardApi = (window.BTS_LEADERBOARD_API || '').trim();
        this.leaderboards = { normal: [], infinito: [] };
        this.clearLegacyLocalLeaderboardCache();
    }

    clearLegacyLocalLeaderboardCache() {
        localStorage.removeItem('btsGameLeaderboard');
        localStorage.removeItem('btsGameLeaderboardInfinite');
        localStorage.removeItem('btsGameBest');
    }

    createSupabaseClient() {
        if (!this.supabaseUrl || !this.supabaseAnonKey) return null;
        if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;

        let normalizedUrl = this.supabaseUrl.trim();
        if (!/^https?:\/\//i.test(normalizedUrl)) {
            normalizedUrl = `https://${normalizedUrl}`;
        }
        normalizedUrl = normalizedUrl.replace('supabase.com', 'supabase.co').replace(/\/+$/, '');

        try {
            return window.supabase.createClient(normalizedUrl, this.supabaseAnonKey);
        } catch {
            return null;
        }
    }

    setMode(mode) {
        const validModes = ['normal', 'hardcore', 'infinito'];
        if (!validModes.includes(mode)) return;
        this.mode = mode;

        const modeDescription = document.getElementById('menuModeDescription');
        if (modeDescription) {
            if (mode === 'normal') modeDescription.textContent = 'Normal: experiencia equilibrada';
            else if (mode === 'hardcore') modeDescription.textContent = 'Hardcore: menos margen de error y más velocidad';
            else modeDescription.textContent = 'Infinito: niveles generados automáticamente con dificultad creciente';
        }

        const normalBtn = document.getElementById('modeNormal');
        const hardcoreBtn = document.getElementById('modeHardcore');
        const infiniteBtn = document.getElementById('modeInfinite');

        if (normalBtn) normalBtn.classList.toggle('active', mode === 'normal');
        if (hardcoreBtn) hardcoreBtn.classList.toggle('active', mode === 'hardcore');
        if (infiniteBtn) infiniteBtn.classList.toggle('active', mode === 'infinito');

        const pauseModeNote = document.getElementById('pauseModeNote');
        if (pauseModeNote) {
            const modeLabel = mode === 'normal' ? 'Normal' : mode === 'hardcore' ? 'Hardcore' : 'Infinito';
            pauseModeNote.textContent = `Modo actual: ${modeLabel}`;
        }
    }

    setState(nextState) {
        if (this.state === nextState) return;
        this.state = nextState;

        if (nextState === 'gameOver' && this.mode === 'infinito' && this.score > 0) {
            this.saveLeaderboardScore(this.playerName || 'Jugador', { mode: 'infinito', levelReached: this.currentLevel });
        }

        this.syncOverlays();
    }

    playGame() {
        this.loadLevel(1);
        this.setState('playing');
    }

    loadLevel(levelNumber) {
        this.currentLevel = levelNumber;
        this.level = new Level(levelNumber, {
            mode: this.mode,
            difficultyTier: this.mode === 'infinito' ? levelNumber : Math.min(levelNumber, 7)
        });
        this.player = new Player();

        if (this.mode === 'hardcore') {
            this.player.lives = 1;
            for (let enemy of this.level.enemies) {
                enemy.speed *= 1.25;
            }
            for (let shot of this.level.cannonShots) {
                shot.speed *= 1.2;
            }
        }

        this.cameraX = 0;
        this.lastHudHtml = '';
        this.lastHudKey = '';
        this.hudFrameThrottle = 0;

        if (this.level) {
            console.log(
                `[LEVEL ${levelNumber}] static=${this.level.staticPlatforms.length} moving=${this.level.dynamicPlatforms.length} ` +
                `enemies=${this.level.enemies.length} traps=${this.level.fireTraps.length} coins=${this.level.coins.length} powerups=${this.level.powerups.length} width=${this.level.levelWidth}`
            );

            const portraitSource = spriteManager?.getMemberPortraitSource(this.level.memberName);
            console.log(`[LEVEL ${levelNumber}] miembro=${this.level.memberName} retrato=${portraitSource || 'tileset-fallback'}`);
        }
    }

    update() {
        if (this.state !== 'playing') return;

        this.player.update(this.level.platforms);
        if (this.player.lives <= 0) {
            this.setState('gameOver');
            this.saveBestScore();
            return;
        }
        this.cameraX = Math.max(0, this.player.x - 300);

        // Colisión con enemigos
        for (let enemy of this.level.enemies) {
            if (this.checkCollision(this.player, enemy) && this.player.damageTimer <= 0) {
                this.player.takeDamage();
                if (this.player.lives <= 0) {
                    this.setState('gameOver');
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
                        this.setState('gameOver');
                        this.saveBestScore();
                    }
                }
            }
        }

        // Colisión con disparos de cañón (muerte instantánea)
        for (let shot of this.level.cannonShots) {
            if (this.checkCollision(this.player, shot) && this.player.damageTimer <= 0) {
                this.player.takeDamage();
                this.player.vy = -7;
                this.player.y -= 10;
                if (this.player.lives <= 0) {
                    this.setState('gameOver');
                    this.saveBestScore();
                    return;
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
                else if (powerup.type === 'health' && this.mode !== 'hardcore') this.player.lives++;
                this.level.powerups.splice(i, 1);
            }
        }

        // Meta
        if (this.checkCollision(this.player, {
            x: this.level.goalX - this.level.goalWidth / 2,
            y: this.level.goalY - this.level.goalHeight,
            width: this.level.goalWidth,
            height: this.level.goalHeight
        })) {
            this.score += 500 + Math.max(0, this.player.lives) * 500;
            if (this.mode === 'infinito') {
                this.setState('levelComplete');
            } else {
                const totalLevels = this.level?.members?.length || 7;
                if (this.currentLevel < totalLevels) {
                    this.setState('levelComplete');
                } else {
                    this.setState('victory');
                    this.saveBestScore();
                }
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
        if (this.state === 'menu') {
            this.drawOverlayBackground();
            return;
        }

        if (this.state === 'paused') {
            this.level.draw(ctx);
            this.player.draw(ctx, this.cameraX);
            this.drawHUD();
            return;
        }

        if (this.state === 'gameOver') {
            this.drawOverlayBackground();
            return;
        }

        if (this.state === 'victory') {
            this.drawOverlayBackground();
            return;
        }

        if (this.state === 'playing' || this.state === 'levelComplete') {
            this.level.draw(ctx);
            this.player.draw(ctx, this.cameraX);
            this.drawHUD();
        }
    }

    drawOverlayBackground() {
        ctx.fillStyle = '#0d1b2a';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }

    drawHUD() {
        if (this.state !== 'playing' && this.state !== 'levelComplete' && this.state !== 'victory') return;
        
        const hud = document.getElementById('hud');
        if (!hud) return;

        this.hudFrameThrottle = (this.hudFrameThrottle + 1) % 4;
        const hudKey = `${this.currentLevel}|${this.level.memberName}|${this.score}|${this.bestScore}|${this.player.lives}|${this.player.shieldTime > 0}|${this.player.speedTime > 0}`;
        if (this.hudFrameThrottle !== 0 && hudKey === this.lastHudKey) {
            return;
        }
        this.lastHudKey = hudKey;

        const totalLevels = this.level?.members?.length || 7;
        const levelDisplay = this.mode === 'infinito' ? `${this.currentLevel}/∞` : `${this.currentLevel}/${totalLevels}`;
        let html = `<div class="hud-line"><span class="hud-label">Nivel:</span> <span class="hud-value">${levelDisplay}</span></div>
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

        if (html !== this.lastHudHtml) {
            hud.innerHTML = html;
            this.lastHudHtml = html;
        }
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
        const overlayState = `${this.state}|${this.score}|${this.volume}`;
        if (overlayState === this.lastOverlayState && this.score === this.lastOverlayScore && this.volume === this.lastOverlayVolume) {
            return;
        }

        const loadingOverlay = document.getElementById('loadingOverlay');
        const nameOverlay = document.getElementById('nameOverlay');
        const menuOverlay = document.getElementById('menuOverlay');
        const gameOverOverlay = document.getElementById('gameOverOverlay');
        const victoryOverlay = document.getElementById('victoryOverlay');
        const pauseOverlay = document.getElementById('pauseOverlay');
        const levelCompleteOverlay = document.getElementById('levelCompleteOverlay');
        const gameOverScore = document.getElementById('gameOverScore');
        const victoryScore = document.getElementById('victoryScore');
        const volumeButton = document.getElementById('volumeButton');
        const winnerNameInput = document.getElementById('winnerNameInput');

        if (!nameOverlay || !menuOverlay || !gameOverOverlay || !victoryOverlay || !pauseOverlay || !levelCompleteOverlay) return;

        if (loadingOverlay) loadingOverlay.classList.add('hidden');
        nameOverlay.classList.toggle('hidden', this.state !== 'nameEntry');
        menuOverlay.classList.toggle('hidden', this.state !== 'menu');
        gameOverOverlay.classList.toggle('hidden', this.state !== 'gameOver');
        victoryOverlay.classList.toggle('hidden', this.state !== 'victory');
        pauseOverlay.classList.toggle('hidden', this.state !== 'paused');
        levelCompleteOverlay.classList.toggle('hidden', this.state !== 'levelComplete');

        if (gameOverScore) gameOverScore.textContent = `Puntuación: ${this.score}`;
        if (victoryScore) victoryScore.textContent = `Puntuación final: ${this.score}`;
        if (volumeButton) volumeButton.textContent = `VOLUMEN: ${Math.round(this.volume * 100)}%`;
        if (winnerNameInput && this.playerName) winnerNameInput.value = this.playerName;

        this.lastOverlayState = overlayState;
        this.lastOverlayScore = this.score;
        this.lastOverlayVolume = this.volume;
    }

    loadVolume() {
        const saved = localStorage.getItem('btsGameVolume');
        const parsed = saved !== null ? parseFloat(saved) : 1;
        return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 1;
    }

    loadPlayerName() {
        const saved = localStorage.getItem('btsGamePlayerName');
        return saved ? saved.toString().trim().slice(0, 20) : '';
    }

    savePlayerName(name) {
        const clean = (name || '').toString().trim().slice(0, 20);
        this.playerName = clean;
        if (clean) localStorage.setItem('btsGamePlayerName', clean);
        else localStorage.removeItem('btsGamePlayerName');
    }

    saveVolume() {
        localStorage.setItem('btsGameVolume', String(this.volume));
    }

    toggleVolume() {
        this.volume = this.volume > 0 ? 0 : 1;
        this.saveVolume();
        this.syncOverlays();
    }

    openPauseMenu() {
        if (this.state !== 'playing') return;
        this.setState('paused');
    }

    closePauseMenu() {
        if (this.state !== 'paused') return;
        this.setState('playing');
    }

    togglePause() {
        if (this.state === 'playing') this.openPauseMenu();
        else if (this.state === 'paused') this.closePauseMenu();
    }

    showModePreview() {
        const note = document.getElementById('pauseModeNote');
        if (note) {
            const modeLabel = this.mode === 'normal' ? 'Normal' : this.mode === 'hardcore' ? 'Hardcore' : 'Infinito';
            note.textContent = `Modo actual: ${modeLabel}`;
        }
    }

    loadBestScore() {
        return 0;
    }

    saveBestScore() {
        if (this.score > this.bestScore) this.bestScore = this.score;
    }

    normalizeLeaderboardEntry(entry, mode = 'normal') {
        if (!entry || typeof entry !== 'object') return null;

        const safeName = (entry.name || 'Jugador').toString().trim().slice(0, 20) || 'Jugador';
        const safeScore = Number.isFinite(Number(entry.score)) ? Number(entry.score) : 0;
        const safeDate = (entry.date || new Date().toLocaleDateString('es-ES')).toString();

        if (mode === 'infinito') {
            const safeLevel = Number.isFinite(Number(entry.levelReached)) ? Math.max(1, Number(entry.levelReached)) : 1;
            return { name: safeName, score: safeScore, levelReached: safeLevel, date: safeDate };
        }

        return { name: safeName, score: safeScore, date: safeDate };
    }

    normalizeLeaderboard(entries, mode = 'normal') {
        const cleaned = (entries || [])
            .map(entry => this.normalizeLeaderboardEntry(entry, mode))
            .filter(Boolean);

        cleaned.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (mode === 'infinito') {
                const levelDiff = (b.levelReached || 0) - (a.levelReached || 0);
                if (levelDiff !== 0) return levelDiff;
            }
            return (a.name || '').localeCompare(b.name || '');
        });

        return cleaned.slice(0, 5);
    }

    mergeLeaderboards(primary, secondary, mode = 'normal') {
        const combined = [...(primary || []), ...(secondary || [])];
        const uniqueMap = new Map();

        for (const entry of combined) {
            const normalized = this.normalizeLeaderboardEntry(entry, mode);
            if (!normalized) continue;
            const key = mode === 'infinito'
                ? `${normalized.name}|${normalized.score}|${normalized.levelReached}|${normalized.date}`
                : `${normalized.name}|${normalized.score}|${normalized.date}`;
            uniqueMap.set(key, normalized);
        }

        return this.normalizeLeaderboard([...uniqueMap.values()], mode);
    }

    loadLeaderboard(mode = 'normal') {
        return this.leaderboards[mode] ? [...this.leaderboards[mode]] : [];
    }

    saveLeaderboardLocal(mode = 'normal', list = []) {
        this.leaderboards[mode] = this.normalizeLeaderboard(list, mode);
    }

    async loadRemoteLeaderboards() {
        if (this.supabaseClient) {
            return this.loadSupabaseLeaderboards();
        }

        if (!this.remoteLeaderboardApi) return { normal: [], infinito: [] };

        try {
            const endpoint = this.remoteLeaderboardApi.replace(/\/$/, '');
            const response = await fetch(`${endpoint}/leaderboards`, { cache: 'no-store' });
            if (!response.ok) return { normal: [], infinito: [] };
            const data = await response.json();
            return {
                normal: Array.isArray(data?.normal) ? data.normal : [],
                infinito: Array.isArray(data?.infinito) ? data.infinito : []
            };
        } catch {
            return { normal: [], infinito: [] };
        }
    }

    async loadSupabaseLeaderboards() {
        try {
            const { data, error } = await this.supabaseClient
                .from('leaderboard_scores')
                .select('name, score, mode, level_reached, created_at')
                .in('mode', ['normal', 'infinito'])
                .order('score', { ascending: false })
                .order('created_at', { ascending: true })
                .limit(200);

            if (error) {
                console.warn('[Supabase] Error cargando leaderboard:', error.message || error);
                return { normal: [], infinito: [] };
            }

            if (!Array.isArray(data)) return { normal: [], infinito: [] };

            const mapped = data.map((row) => ({
                name: row.name,
                score: row.score,
                mode: row.mode,
                levelReached: row.level_reached,
                date: row.created_at ? new Date(row.created_at).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES')
            }));

            return {
                normal: mapped.filter((entry) => entry.mode === 'normal'),
                infinito: mapped.filter((entry) => entry.mode === 'infinito')
            };
        } catch {
            return { normal: [], infinito: [] };
        }
    }

    async pushRemoteScore(entry) {
        if (this.supabaseClient) {
            await this.pushSupabaseScore(entry);
            return;
        }

        if (!this.remoteLeaderboardApi) return;
        try {
            const endpoint = this.remoteLeaderboardApi.replace(/\/$/, '');
            await fetch(`${endpoint}/scores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            });
        } catch {
            // fallback silencioso
        }
    }

    async pushSupabaseScore(entry) {
        try {
            const payload = {
                name: (entry.name || 'Jugador').toString().slice(0, 20),
                score: Number(entry.score) || 0,
                mode: entry.mode === 'infinito' ? 'infinito' : 'normal',
                level_reached: entry.mode === 'infinito'
                    ? Math.max(1, Number(entry.levelReached) || 1)
                    : null
            };

            const { error } = await this.supabaseClient.from('leaderboard_scores').insert(payload);
            if (error) {
                console.warn('[Supabase] Error guardando score:', error.message || error, payload);
            } else {
                console.log('[Supabase] Score guardado:', payload);
            }
        } catch (err) {
            console.warn('[Supabase] Excepción guardando score:', err);
        }
    }

    async refreshLeaderboards() {
        const remote = await this.loadRemoteLeaderboards();

        this.saveLeaderboardLocal('normal', this.normalizeLeaderboard(remote.normal, 'normal'));
        this.saveLeaderboardLocal('infinito', this.normalizeLeaderboard(remote.infinito, 'infinito'));
        this.renderLeaderboards();
    }

    saveLeaderboardScore(name, options = {}) {
        const mode = options.mode || this.mode;
        const leaderboard = this.loadLeaderboard(mode);
        const cleanName = (name || '').trim().slice(0, 20) || 'Jugador';
        const entry = {
            name: cleanName,
            score: this.score,
            mode,
            date: new Date().toLocaleDateString('es-ES')
        };

        if (mode === 'infinito') {
            entry.levelReached = Number.isFinite(Number(options.levelReached)) ? Number(options.levelReached) : this.currentLevel;
        }

        const top = this.normalizeLeaderboard([...leaderboard, entry], mode);
        this.saveLeaderboardLocal(mode, top);
        this.renderLeaderboards();
        this.pushRemoteScore(entry);
    }

    renderLeaderboardList(elementId, list, mode = 'normal') {
        const board = document.getElementById(elementId);
        if (!board) return;

        if (!list.length) {
            board.innerHTML = '<div class="leaderboard-empty">Aún no hay puntajes</div>';
            return;
        }

        board.innerHTML = list.map((entry, index) => {
            const dateText = (entry.date || '').toString();
            const compactDate = mode === 'infinito'
                ? dateText.split('/').slice(0, 2).join('/')
                : dateText;

            return `
            <div class="leaderboard-item ${mode === 'infinito' ? 'infinite' : ''} ${index === 0 ? 'top' : ''}">
                <span class="leaderboard-rank">${index + 1}.</span>
                <span class="leaderboard-name">${entry.name || 'Jugador'}</span>
                <span class="leaderboard-score">${entry.score}</span>
                ${mode === 'infinito' ? `<span class="leaderboard-level">Nvl ${entry.levelReached || 1}</span>` : ''}
                <span class="leaderboard-date">${compactDate}</span>
            </div>
        `;
        }).join('');
    }

    renderLeaderboards() {
        const normalList = this.loadLeaderboard('normal');
        const infiniteList = this.loadLeaderboard('infinito');

        this.renderLeaderboardList('leaderboardList', normalList, 'normal');
        this.renderLeaderboardList('infiniteLeaderboardList', infiniteList, 'infinito');

        const historicalBest = normalList.length ? Math.max(...normalList.map(entry => Number(entry.score) || 0)) : 0;
        if (historicalBest > this.bestScore) {
            this.bestScore = historicalBest;
        }
    }

    submitWinnerName() {
        if (this.state === 'nameEntry') {
            const nameInput = document.getElementById('nameEntryInput');
            const name = (nameInput ? nameInput.value : '').trim();
            if (!name) return;
            this.savePlayerName(name);
            this.setState('menu');
            return;
        }

        if (this.state !== 'victory') return;
        const input = document.getElementById('winnerNameInput');
        const name = (input ? input.value : '').trim() || this.playerName || 'Jugador';
        this.savePlayerName(name);
        this.saveLeaderboardScore(name, { mode: this.mode, levelReached: this.currentLevel });
        if (input) input.value = this.playerName || '';
        this.setState('menu');
        this.currentLevel = 1;
        this.score = 0;
        this.level = null;
        this.player = null;
        this.cameraX = 0;
        this.messageTimer = 0;
        this.lastHudHtml = '';
        this.lastHudKey = '';
        this.hudFrameThrottle = 0;
        document.getElementById('hud').innerHTML = '';
    }

    retry() {
        this.currentLevel = 1;
        this.score = 0;
        this.loadLevel(1);
        this.setState('playing');
        this.messageTimer = 0;
        this.cameraX = 0;
        this.lastHudHtml = '';
        this.lastHudKey = '';
        this.hudFrameThrottle = 0;
        document.getElementById('hud').innerHTML = '';
    }

    startGame() {
        if (!this.playerName) {
            this.setState('nameEntry');
            return;
        }
        this.setState('playing');
        this.loadLevel(this.currentLevel);
        this.syncOverlays();
    }

    goToNextLevel() {
        if (this.state !== 'levelComplete') return;
        if (this.mode === 'infinito') {
            this.loadLevel(this.currentLevel + 1);
            this.setState('playing');
            return;
        }

        const totalLevels = this.level?.members?.length || 7;

        if (this.currentLevel >= totalLevels) {
            this.setState('victory');
            return;
        }

        this.loadLevel(this.currentLevel + 1);
        this.setState('playing');
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
    if (e.key === 'Escape') {
        e.preventDefault();
        if (game && (game.state === 'playing' || game.state === 'paused')) {
            game.togglePause();
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// ============================================
// LOOP PRINCIPAL
// ============================================
const FRAME_TIME = 1000 / FPS;
let lastFrameTime = 0;
let accumulator = 0;
let fpsFrames = 0;
let fpsElapsed = 0;

function gameLoop(timestamp = 0) {
    if (!lastFrameTime) {
        lastFrameTime = timestamp;
    }

    const delta = Math.min(100, timestamp - lastFrameTime);
    lastFrameTime = timestamp;
    accumulator += delta;

    fpsFrames++;
    fpsElapsed += delta;
    if (fpsElapsed >= 1000) {
        console.log(`[FPS] ${fpsFrames}`);
        fpsFrames = 0;
        fpsElapsed = 0;
    }

    let updateCount = 0;
    const maxUpdatesPerFrame = 2;
    while (accumulator >= FRAME_TIME && updateCount < maxUpdatesPerFrame) {
        game.update();
        accumulator -= FRAME_TIME;
        updateCount++;
    }

    if (updateCount === maxUpdatesPerFrame && accumulator >= FRAME_TIME) {
        accumulator = 0;
    }

    game.draw();
    requestAnimationFrame(gameLoop);
}

window.addEventListener('load', () => {
    spriteManager = new TiledSpriteManager();
    game = new Game();
    const nameEntryInput = document.getElementById('nameEntryInput');
    const saveNameButton = document.getElementById('saveNameButton');
    const playButton = document.getElementById('playButton');
    const modeNormal = document.getElementById('modeNormal');
    const modeHardcore = document.getElementById('modeHardcore');
    const modeInfinite = document.getElementById('modeInfinite');
    const retryButton = document.getElementById('retryButton');
    const saveWinnerButton = document.getElementById('saveWinnerButton');
    const nextLevelButton = document.getElementById('nextLevelButton');
    const winnerNameInput = document.getElementById('winnerNameInput');
    const resumeButton = document.getElementById('resumeButton');
    const volumeButton = document.getElementById('volumeButton');
    const modeButton = document.getElementById('modeButton');

    if (saveNameButton) saveNameButton.addEventListener('click', () => game.submitWinnerName());
    if (playButton) playButton.addEventListener('click', () => game.startGame());
    if (modeNormal) modeNormal.addEventListener('click', () => game.setMode('normal'));
    if (modeHardcore) modeHardcore.addEventListener('click', () => game.setMode('hardcore'));
    if (modeInfinite) modeInfinite.addEventListener('click', () => game.setMode('infinito'));
    if (retryButton) retryButton.addEventListener('click', () => game.retry());
    if (saveWinnerButton) saveWinnerButton.addEventListener('click', () => game.submitWinnerName());
    if (nextLevelButton) nextLevelButton.addEventListener('click', () => game.goToNextLevel());
    if (resumeButton) resumeButton.addEventListener('click', () => game.closePauseMenu());
    if (volumeButton) volumeButton.addEventListener('click', () => game.toggleVolume());
    if (modeButton) modeButton.addEventListener('click', () => game.showModePreview());
    if (winnerNameInput) {
        if (game.playerName) winnerNameInput.value = game.playerName;
        winnerNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') game.submitWinnerName();
        });
    }

    if (nameEntryInput) {
        if (game.playerName) nameEntryInput.value = game.playerName;
        nameEntryInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') game.submitWinnerName();
        });
    }

    game.setMode('normal');

    game.syncOverlays();
    game.refreshLeaderboards();

    setInterval(() => {
        game.refreshLeaderboards();
    }, 12000);

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            game.refreshLeaderboards();
        }
    });

    requestAnimationFrame(gameLoop);
});
