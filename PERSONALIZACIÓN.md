# 🎮 PERSONALIZACIÓN Y MEJORAS - GUÍA COMPLETA v2.0

## 📋 TABLE OF CONTENTS
1. [Estado Actual](#estado-actual)
2. [Mejoras Implementadas en v2.0](#mejoras-implementadas-en-v20)
3. [Características Completadas](#características-completadas)
4. [Mejoras Futuras](#mejoras-futuras)
5. [🎨 GUÍA PASO A PASO: CÓMO CREAR SPRITES](#guía-paso-a-paso-cómo-crear-sprites)
6. [Resonancias y Optimizaciones](#resonancias-y-optimizaciones)

---

## ✅ ESTADO ACTUAL (v2.0)

**Versión:** 2.0 - MEJORADA  
**Fecha:** Abril 2026  
**Estado:** Completamente funcional y optimizada  

### 🚀 Lo que acabamos de mejorar:
- ✅ **Físicas mejoradas** - Aceleración, fricción y movimiento realista
- ✅ **Nueva trampa: Fuego giratorio** - Palo de fuego con 4 llamas rotativas
- ✅ **interfaz de vidas mejorada** - Corazones visuales con efectos
- ✅ **Gráficos mejorados** - Colores, bordes, sombras y efectos
- ✅ **Colisiones precisas** - Detección circle y rect mejorada
- ✅ **Partículas avanzadas** - Mejor animación y velocidad

---

## 🎯 MEJORAS IMPLEMENTADAS EN v2.0

### 1. **Física Mejorada**
```javascript
// Antes
this.vx = -this.speed; // Movimiento instantáneo

// Ahora (v2.0)
this.speed = Math.max(this.speed - ACCELERATION, -this.maxSpeed);
this.vx = this.speed * FRICTION;
// ✅ Movimiento suave y realista con aceleración/fricción
```

### 2. **Nueva Trampa: Fuego Giratorio** 🔥
- Localización: Niveles 5 y 6
- Mechánica: 4 llamas giratorias alrededor de un centro
- Velocidad: Giro constante generando daño
- Visualización: Fuego naranja/amarillo con efecto de rotación
- Colisión: Detecta contacto con las llamas

**Código:**
```javascript
class FireTrap {
    constructor(x, y) {
        this.flames = 4; // 4 llamas
        this.rotation += this.rotationSpeed; // Giro constante
        // Cada llama causa daño si toca al jugador
    }
}
```

### 3. **Interfaz de Vidas Mejorada** ❤️
- Antes: Simple texto "Vidas: 3"
- Now: `❤️ ❤️ ❤️` (Corazones visuales individuales)
- Efecto: Cada corazón tiene glow rosa
- Animación: Parpadean cuando pierdes una vida
- Ubicación: HUD superior

### 4. **Gráficos Mejorados**
- ✅ Mayor pixel art (detalles en ojos, boca)
- ✅ Bordes oscuros en todos los objetos
- ✅ Luces/highlights realistas
- ✅ Colores más vibrantes y contrastantes
- ✅ Efectos de parpadeo en especiales
- ✅ Background más oscuro para mejor contraste

### 5. **Colisiones Precisas**
```javascript
// Colisión rect-rect (plataformas, monedas)
checkCollision(a, b)

// Colisión circle-rect (llamas de fuego)
checkCircleCollision(player, circle)
```

### 6. **Partículas Avanzadas**
- Mejor velocidad inicial (3-6 píxeles)
- Mejor gravedad aplicada
- Tamaño variable
- Fade out suave

---

## ✅ CARACTERÍSTICAS COMPLETADAS

| Característica | Estado | Detalles |
|---|---|---|
| 6 Niveles | ✅ Completo | Jin → Suga → J-Hope → RM → Jungkook → V |
| 5 Tipos Enemigos | ✅ Completo | normal, fast, flying, shooter, teleport |
| 3 Tipos Power-ups | ✅ Completo | shield, speed, health |
| Trampa Spikes | ✅ Completo | Plataformas puntiagudas |
| **Trampa Fuego** | ✅ NUEVO | Palo giratorio con 4 llamas |
| Física 2D | ✅ Mejorado | Aceleración, fricción, saltos suaves |
| Partículas | ✅ Mejorado | Sistema avanzado de efectos |
| HUD | ✅ Mejorado | Interfaz con iconos emoji |
| Puntuaciones | ✅ Completo | localStorage persistente |
| Gráficos | ✅ Mejorado | Pixel art de calidad |

---

## ⏳ MEJORAS FUTURAS (No Implementadas)

### 1. 🎵 **Sistema de Sonidos**
**Dificultad:** ⭐⭐ Fácil  
**Tiempo:** 30 minutos

Qué falta:
```
/sounds/
├── jump.wav
├── coin.wav  
├── powerup.wav
├── firetrap.wav
├── levelcomplete.wav
└── music.mp3
```

Cómo agregar:
```javascript
// Al inicio
const sounds = {
    jump: new Audio('sounds/jump.wav'),
    coin: new Audio('sounds/coin.wav'),
    powerup: new Audio('sounds/powerup.wav'),
    fire: new Audio('sounds/fire.wav')
};

// Cuando necesites usar
In Player.update():
    if (justJumped) sounds.jump.play();

In Game.update():
    if (collectCoin) sounds.coin.play();
```

### 2. 🎨 **Sprites Reales en lugar de Shapes**
**Dificultad:** ⭐⭐ Fácil  
**Tiempo:** 2-3 horas

Ver sección: [GUÍA PASO A PASO: CÓMO CREAR SPRITES](#guía-paso-a-paso-cómo-crear-sprites)

### 3. 🎬 **Animaciones Avanzadas**
**Dificultad:** ⭐⭐⭐ Medio  
**Tiempo:** 2 horas

- Animations del jugador corriendo (4 frames)
- Salto (2 frames)
- Animación de muerte
- Animación de enemigos

```javascript
class Animation {
    constructor(frames) {
        this.frames = frames;
        this.currentFrame = 0;
        this.frameTimer = 0;
    }

    update() {
        this.frameTimer++;
        if (this.frameTimer > 5) {
            this.currentFrame++;
            this.frameTimer = 0;
        }
    }
}
```

### 4. 🌟 **Efectos Visuales Especiales**
**Dificultad:** ⭐⭐ Fácil  
**Tiempo:** 1 hora

- Distorsión de pantalla en colisiones
- Screen shake en eventos
- Flash de color en daño
- Transiciones suaves entre niveles

```javascript
// Screen shake en colisión
Game.prototype.shake = function() {
    canvas.style.transform = `translate(${Math.random()-0.5}*10px, ${Math.random()-0.5}*10px)`;
};
```

### 5. 🎯 **Sistema de Combos**
**Dificultad:** ⭐⭐ Fácil  
**Tiempo:** 1 hora

```javascript
class ComboSystem {
    constructor() {
        this.coinsCollected = 0;
        this.jumpsWithoutDamage = 0;
    }

    onCoinCollect() {
        this.coinsCollected++;
        if (this.coinsCollected % 5 === 0) {
            this.triggerCombo(500); // +500 puntos
        }
    }

    onDamage() {
        this.coinsCollected = 0;
        this.jumpsWithoutDamage = 0;
    }
}
```

### 6. 🏆 **Sistema de Logros**
**Dificultad:** ⭐⭐ Fácil  
**Tiempo:** 1 hora

- "¡Primer Nivel!" - Completar nivel 1
- "¡Sin fallos!" - Completa nivel sin daño
- "¡Coleccionista!" - Recoge 80%+ monedas
- "¡Velocista!" - Completa nivel en menos de tiempo

```javascript
const achievements = {
    'first_level': { name:'¡Primer Nivel!', completed: false },
    'no_damage': { name:'¡Sin fallos!', completed: false },
};

function checkAchievements() {
    if (player.lives === 3 && levelComplete) {
        achievements.no_damage.completed = true;
    }
}
```

### 7. 📊 **Leaderboard con Límite**
**Dificultad:** ⭐⭐ Fácil  
**Tiempo:** 1.5 horas

```javascript
class Leaderboard {
    constructor(maxScores = 10) {
        this.scores = JSON.parse(localStorage.getItem('btsLeaderboard')) || [];
        this.maxScores = maxScores;
    }

    addScore(name, score) {
        this.scores.push({ name, score, date: new Date().toLocaleDateString() });
        this.scores.sort((a, b) => b.score - a.score);
        this.scores = this.scores.slice(0, this.maxScores);
        localStorage.setItem('btsLeaderboard', JSON.stringify(this.scores));
    }

    getTop() {
        return this.scores.slice(0, 5);
    }
}
```

### 8. 🎪 **Nuevos Modos de Juego**
**Dificultad:** ⭐⭐⭐ Medio  
**Tiempo:** 3 horas

- **Modo Arcade:** Niveles infinitos, dificultad aumenta
- **Modo Desafío:** Tiempo límite (5 minutos)
- **Modo Zen:** Sin enemigos, solo plataformas
- **Modo Hardcore:** 1 vida, sin power-ups

---

# 🎨 GUÍA PASO A PASO: CÓMO CREAR SPRITES

## ¿Qué son los Sprites?
Los **sprites** son imágenes que reemplazan las formas geométricas (rectángulos, círculos) del juego actual.

**Diferencia:**
- **Ahora:** Dibujos con `ctx.fillRect()` y `ctx.arc()`
- **Con sprites:** Imágenes `.png` reales (pixel art o ilustraciones)

---

## PASO 1: PREPARAR LAS IMÁGENES

### Requisitos:
- Formato: **PNG** (permite transparencia)
- Tamaño: Múltiplos de 32x32 píxeles (32x32, 64x64, 128x128)
- Transparencia: Fondo transparente
- Resolución: 72-96 DPI

### Opción 1: Descargar sprites existentes
**Sitios recomendados:**
1. **OpenGameArt.org** - Libre bajo Creative Commons
2. **Itch.io** - Busca "pixel art platformer"
3. **Kenney.nl** - Sprites gratuitos de excelente calidad

Busca por:
- "platformer sprites"
- "pixel art characters"
- "game tiles"

### Opción 2: Crear tus propios sprites
**Herramientas (Gratis):**
1. **Aseprite** (lite) - Pixel art profesional ($20 pero vale)
2. **Piskel** (online) - Gratis, sin instalar
3. **LibreSprite** - Gratis, código abierto
4. **Krita** - Gratis, versátil

---

## PASO 2: ORGANIZAR LA CARPETA

Crea esta estructura en tu carpeta del juego:

```
regalo/
├── index.html
├── game.js
├── sprites/                    ← NUEVA CARPETA
│   ├── player.png
│   ├── player-walk-1.png
│   ├── player-walk-2.png
│   ├── player-jump.png
│   ├── enemies/
│   │   ├── normal.png
│   │   ├── fast.png
│   │   ├── flying.png
│   │   ├── shooter.png
│   │   └── teleport.png
│   ├── platforms/
│   │   ├── normal.png
│   │   ├── moving.png
│   │   └── spike.png
│   ├── items/
│   │   ├── coin.png
│   │   ├── shield.png
│   │   ├── speed.png
│   │   └── health.png
│   └── effects/
│       ├── fire-trap.png
│       └── particle.png
```

---

## PASO 3: CARGAR LOS SPRITES EN game.js

### Crear un gestor de sprites:

```javascript
class SpriteManager {
    constructor() {
        this.sprites = {};
        this.loadingPromises = [];
    }

    loadSprite(name, path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.sprites[name] = img;
                resolve();
            };
            img.onerror = () => reject(new Error(`No se pudo cargar: ${path}`));
            img.src = path;
        });
    }

    async loadAll() {
        await Promise.all([
            this.loadSprite('player', 'sprites/player.png'),
            this.loadSprite('enemy-normal', 'sprites/enemies/normal.png'),
            this.loadSprite('enemy-fast', 'sprites/enemies/fast.png'),
            this.loadSprite('platform', 'sprites/platforms/normal.png'),
            this.loadSprite('coin', 'sprites/items/coin.png'),
            this.loadSprite('shield', 'sprites/items/shield.png'),
        ]);
    }

    getSprite(name) {
        return this.sprites[name];
    }
}

// Crear gestor global
const spriteManager new SpriteManager();
```

### Cargar sprites al inicio del juego:

```javascript
window.addEventListener('load', async () => {
    await spriteManager.loadAll();
    game = new Game();
    gameLoop();
});
```

---

## PASO 4: REEMPLAZAR DIBUJOS CON SPRITES

### Ejemplo: Cambiar el Jugador

**Código actual (v2.0):**
```javascript
Player.prototype.draw = function(ctx, cameraX) {
    ctx.fillStyle = '#FFEB3B';
    ctx.fillRect(this.x - cameraX, this.y, 30, 35);
    // ... más código de color
};
```

**Código con sprites:**
```javascript
Player.prototype.draw = function(ctx, cameraX) {
    const sprite = spriteManager.getSprite('player');
    if (sprite) {
        // Dibujar la imagen en lugar del rectángulo
        ctx.drawImage(
            sprite,                           // Imagen
            this.x - cameraX,                // X
            this.y,                          // Y
            30,                              // Ancho
            35                               // Alto
        );
    }
};
```

### Ejemplo: Cambiar Moneda

**Antes:**
```javascript
Coin.prototype.draw = function(ctx, cameraX) {
    ctx.fillStyle = '#FFB800';
    ctx.beginPath();
    ctx.arc(x, y, this.radius, 0, Math.PI * 2);
    ctx.fill();
};
```

**Después:**
```javascript
Coin.prototype.draw = function(ctx, cameraX) {
    const sprite = spriteManager.getSprite('coin');
    if (sprite) {
        ctx.drawImage(sprite, x - 5, y - 5, 10, 10);
    }
};
```

### Ejemplo: Cambiar Enemigos

```javascript
Enemy.prototype.draw = function(ctx, cameraX) {
    let spriteName = 'enemy-normal';
    
    if (this.type === 'fast') spriteName = 'enemy-fast';
    else if (this.type === 'flying') spriteName = 'enemy-flying';
    else if (this.type === 'shooter') spriteName = 'enemy-shooter';
    else if (this.type === 'teleport') spriteName = 'enemy-teleport';

    const sprite = spriteManager.getSprite(spriteName);
    if (sprite) {
        ctx.drawImage(sprite, this.x - cameraX, this.y, 30, 30);
    }
};
```

### Ejemplo: Plataformas

```javascript
Platform.prototype.draw = function(ctx, cameraX) {
    let spriteName = 'platform';
    
    if (this.type === 'spike') spriteName = 'platform-spike';
    if (this.type === 'moving') spriteName = 'platform-moving';

    const sprite = spriteManager.getSprite(spriteName);
    if (sprite) {
        const x = this.x - cameraX + this.moving;
        
        // Repetir sprite según el ancho
        for (let i = 0; i < this.width; i += 32) {
            ctx.drawImage(sprite, x + i, this.y, 32, this.height);
        }
    }
};
```

---

## PASO 5: ANIMACIONES CON SPRITES

### Sistema simple de animación:

```javascript
class AnimatedSprite {
    constructor(frames, frameDelay = 5) {
        this.frames = frames;        // ['walk-1.png', 'walk-2.png', ...]
        this.frameDelay = frameDelay;
        this.currentFrame = 0;
        this.timer = 0;
    }

    update() {
        this.timer++;
        if (this.timer >= this.frameDelay) {
            this.timer = 0;
            this.currentFrame++;
            if (this.currentFrame >= this.frames.length) {
                this.currentFrame = 0;
            }
        }
    }

    getFrame() {
        return this.frames[this.currentFrame];
    }
}

// Usar en el Jugador:
class Player {
    constructor() {
        // ... código anterior
        this.walkAnimation = new AnimatedSprite([
            'sprites/player-walk-1.png',
            'sprites/player-walk-2.png',
            'sprites/player-walk-3.png',
            'sprites/player-walk-4.png'
        ], 5);
        
        this.jumpSprite = 'sprites/player-jump.png';
    }

    update() {
        // ... código anterior
        if (this.vx !== 0) {
            this.walkAnimation.update();
        }
    }

    draw(ctx, cameraX) {
        let spritePath;
        
        if (this.onGround && this.vx !== 0) {
            spritePath = this.walkAnimation.getFrame();
        } else if (!this.onGround) {
            spritePath = this.jumpSprite;
        } else {
            spritePath = 'sprites/player.png';
        }

        const sprite = spriteManager.getSprite(spritePath);
        if (sprite) {
            ctx.drawImage(sprite, this.x - cameraX, this.y, 30, 35);
        }
    }
}
```

---

## PASO 6: ROTACIÓN DE SPRITES

Perfectofor:
- Enemigos voladores (alas)
- Trampas de fuego
- Items giratorios

```javascript
function drawRotatedImage(ctx, image, x, y, width, height, angle) {
    ctx.save();
    ctx.translate(x + width/2, y + height/2);
    ctx.rotate(angle);
    ctx.drawImage(image, -width/2, -height/2, width, height);
    ctx.restore();
}

// Usar en FireTrap:
FireTrap.prototype.draw = function(ctx, cameraX) {
    const sprite = spriteManager.getSprite('fire-trap');
    if (sprite) {
        const x = this.x - cameraX;
        const y = this.y;
        drawRotatedImage(ctx, sprite, x, y, 60, 60, this.rotation);
    }
};
```

---

## PASO 7: ESCALADO Y TRANSFORMACIÓN

```javascript
// Espejos horizontales (para que el jugador mire en ambas direcciones)
function drawFlipped(ctx, image, x, y, width, height) {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(image, -x - width, y, width, height);
    ctx.restore();
}

// En Player.draw:
if (this.direction === -1) {
    drawFlipped(ctx, sprite, this.x - cameraX, this.y, 30, 35);
} else {
    ctx.drawImage(sprite, this.x - cameraX, this.y, 30, 35);
}
```

---

## CHECKLIST: IMPLEMENTACIÓN DE SPRITES

- [ ] Carpeta `/sprites` creada
- [ ] Todas las imágenes descargadas/creadas
- [ ] SpriteManager agregado a game.js
- [ ] Todos los sprites cargados en loadAll()
- [ ] Player.draw() actualizado
- [ ] Enemy.draw() actualizado
- [ ] Platform.draw() actualizado
- [ ] Coin.draw() actualizado
- [ ] PowerUp.draw() actualizado
- [ ] Animaciones configuradas (opcional)
- [ ] Rotaciones funcionando (opcional)
- [ ] Pruebas completadas ✅

---

## 🎯 TRUCOS Y OPTIMIZACIONES

### TruckO 1: Cachear Sprites Escalados
```javascript
class CachedSprite {
    constructor(path) {
        this.original = spriteManager.getSprite(path);
        this.cache = {};
    }

    draw(ctx, x, y, width, height) {
        const key = `${width}x${height}`;
        if (!this.cache[key]) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(this.original, 0, 0, width, height);
            this.cache[key] = canvas;
        }
        ctx.drawImage(this.cache[key], x, y);
    }
}
```

### Truco 2: Spritesheets (Multi-sprites en una imagen)

Si tienes múltiples frames en una sola imagen:

```javascript
class Spritesheet {
    constructor(imagePath, frameWidth, frameHeight) {
        this.image = spriteManager.getSprite(imagePath);
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
    }

    drawFrame(ctx, frameIndex, x, y) {
        const col = frameIndex % Math.floor(this.image.width / this.frameWidth);
        const row = Math.floor(frameIndex / Math.floor(this.image.width / this.frameWidth));
        
        ctx.drawImage(
            this.image,
            col * this.frameWidth,
            row * this.frameHeight,
            this.frameWidth,
            this.frameHeight,
            x,
            y,
            this.frameWidth,
            this.frameHeight
        );
    }
}
```

---

## 📚 RECURSOS RECOMENDADOS

### Descargar Sprites:
1. **OpenGameArt.org** - Gratis, CC0/CC-BY
2. **Kenney.nl** - Sprites premium gratis
3. **Itch.io** - Busca "free game assets"
4. **CraftPix** - Variedades de estilos

### Crear Sprites:
1. **Piskel** (piskelapp.com) - Online, no instalar
2. **Aseprite** - Profesional ($20)
3. **LibreSprite** - Gratis, código abierto
4. **Krita** - Versátil, gratis

### Herramientas Útiles:
1. **Sprite Fusion** - Combinar sprites online
2. **Pico-8** - Juegos retro pixel art
3. **GIMP** - Editor gratuito, crea PNGs

---

## 💡 PRÓXIMOS PASOS

**Recomendado:**
1. Descarga sprites existentes de Kenney.nl (más rápido)
2. Crea la carpeta `/sprites`
3. Implementa SpriteManager
4. Reemplaza los draw() uno por uno
5. Prueba cada elemento
6. Agrega animaciones (opcional)

**Dificultad:** ⭐⭐ Fácil  
**Tiempo:** 2-3 horas con sprites existentes

---

## 💜 RESUMEN

El sistema de sprites te permite:
- ✅ Mejor calidad visual
- ✅ Mayor profesionalismo
- ✅ Facilidad para cambiar estilo
- ✅ Animaciones suaves
- ✅ Compatibilidad total con físicas actuales

**El código de lógica de juego NO cambia**, solo cambian los `draw()`.

---

**¡Créjue y personaliza tu juego! 🎨💜**

Creado con 💜 para Alexandra
Última actualización: Abril 2026
