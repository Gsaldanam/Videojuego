#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🎮 MARIO BROS: BTS EDITION 💜
Un emocionante juego tipo Mario Bros con temática BTS
Un regalo especial para Alexandra 💜
- 6 Niveles con todos los miembros de BTS
- Múltiples tipos de enemigos con mecánicas diferentes
- Power-ups y potenciadores
- Sistema de efectos visuales
- Guardado de puntuaciones
"""

import pygame
import sys
import random
import math
import json
import os

# Inicializar Pygame
pygame.init()
pygame.mixer.init()

# ===== CONFIGURACIÓN =====
WIDTH, HEIGHT = 1000, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("🎮 Mario Bros: BTS Edition 💜")
clock = pygame.time.Clock()
FPS = 60

# ===== COLORES (Temática BTS) =====
COLOR_BG = (10, 10, 20)          # Fondo oscuro
COLOR_BTS_PURPLE = (155, 89, 182)  # Morado BTS
COLOR_BTS_GOLD = (255, 215, 0)     # Dorado
MEMBER_COLORS = {
    "jin": (255, 182, 193),        # Rosa claro
    "suga": (192, 192, 192),       # Gris
    "jhope": (255, 215, 0),        # Oro
    "rm": (64, 224, 208),          # Turquesa
    "jimin": (255, 105, 180),      # Rosa caliente
    "v": (138, 43, 226),           # Azul violeta
    "jungkook": (255, 20, 147)     # Rosa oscuro
}

# ===== CLASES =====
class Particle:
    """Efecto de partícula para animaciones"""
    def __init__(self, x, y, vx, vy, color, lifetime=30):
        self.x = x
        self.y = y
        self.vx = vx
        self.vy = vy
        self.color = color
        self.lifetime = lifetime
        self.age = 0
        self.gravity = 0.2
    
    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.vy += self.gravity
        self.age += 1
    
    def is_alive(self):
        return self.age < self.lifetime
    
    def draw(self, surface, camera_x):
        if self.is_alive():
            alpha = int(255 * (1 - self.age / self.lifetime))
            size = max(1, int(3 * (1 - self.age / self.lifetime)))
            pygame.draw.circle(surface, self.color, 
                             (int(self.x - camera_x), int(self.y)), size)

class PowerUp:
    """Power-ups para mejorar habilidades"""
    def __init__(self, x, y, power_type="shield"):
        self.rect = pygame.Rect(x, y, 20, 20)
        self.power_type = power_type  # "shield", "speed", "health"
        self.animation_timer = 0
    
    def update(self):
        self.animation_timer += 1
    
    def draw(self, surface, camera_x):
        x = self.rect.x - camera_x
        y = self.rect.y
        
        if self.power_type == "shield":
            color = (100, 200, 255)
            pygame.draw.circle(surface, color, (int(x + 10), int(y + 10)), 12)
            pygame.draw.circle(surface, (255, 255, 255), (int(x + 10), int(y + 10)), 12, 2)
        elif self.power_type == "speed":
            color = (255, 255, 0)
            pygame.draw.polygon(surface, color, 
                              [(int(x + 10), int(y + 3)), (int(x + 18), int(y + 10)), 
                               (int(x + 10), int(y + 17)), (int(x + 2), int(y + 10))])
        elif self.power_type == "health":
            color = (255, 100, 100)
            pygame.draw.rect(surface, color, (int(x + 5), int(y + 10), 10, 5))
            pygame.draw.rect(surface, color, (int(x + 10), int(y + 5), 5, 10))

class Player:
    def __init__(self, x, y):
        self.width, self.height = 35, 40
        self.rect = pygame.Rect(x, y, self.width, self.height)
        self.vel_y = 0
        self.vel_x = 0
        self.gravity = 0.5
        self.jump_power = -12
        self.speed = 5
        self.on_ground = False
        self.direction = 1
        self.animation_timer = 0
        self.color = COLOR_BTS_PURPLE
        self.shield = False
        self.shield_timer = 0
        self.speed_boost = False
        self.speed_boost_timer = 0
        self.particles = []
        
    def handle_input(self, keys):
        self.vel_x = 0
        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            self.vel_x = -self.speed
            self.direction = -1
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            self.vel_x = self.speed
            self.direction = 1
        if (keys[pygame.K_SPACE] or keys[pygame.K_w]) and self.on_ground:
            self.vel_y = self.jump_power
            self.on_ground = False
            # Partículas de salto
            for _ in range(5):
                vx = random.uniform(-2, 2)
                vy = random.uniform(1, 3)
                self.particles.append(Particle(self.rect.centerx, self.rect.bottom, vx, vy, COLOR_BTS_GOLD, 20))
    
    def update(self, platforms):
        # Movimiento horizontal
        self.rect.x += self.vel_x
        self.check_platform_collision(platforms, axis='x')
        
        # Gravedad
        self.vel_y += self.gravity
        self.rect.y += self.vel_y
        self.on_ground = False
        self.check_platform_collision(platforms, axis='y')
        
        # Actualizar power-ups
        if self.shield and self.shield_timer > 0:
            self.shield_timer -= 1
        else:
            self.shield = False
        
        if self.speed_boost and self.speed_boost_timer > 0:
            self.speed_boost_timer -= 1
        else:
            self.speed_boost = False
        
        # Actualizar partículas
        for particle in self.particles[:]:
            particle.update()
            if not particle.is_alive():
                self.particles.remove(particle)
        
        # Caer al vacío
        if self.rect.y > HEIGHT + 100:
            return False
        return True
    
    def check_platform_collision(self, platforms, axis='y'):
        for platform in platforms:
            if self.rect.colliderect(platform.rect):
                if axis == 'y':
                    if self.vel_y > 0:
                        self.rect.bottom = platform.rect.top
                        self.vel_y = 0
                        self.on_ground = True
                    elif self.vel_y < 0:
                        self.rect.top = platform.rect.bottom
                        self.vel_y = 0
                elif axis == 'x':
                    if self.vel_x > 0:
                        self.rect.right = platform.rect.left
                    elif self.vel_x < 0:
                        self.rect.left = platform.rect.right
    
    def draw(self, surface, camera_x):
        x = self.rect.x - camera_x
        y = self.rect.y
        
        # Escudo si está activo
        if self.shield:
            pygame.draw.circle(surface, (100, 200, 255), (int(x + 17), int(y + 20)), 30, 3)
        
        # Cuerpo principal
        color = (200, 150, 255) if self.speed_boost else self.color
        pygame.draw.rect(surface, color, (x, y, self.width, self.height), border_radius=5)
        
        # Ojos
        eye_y = y + 8
        eye1_x = x + 10 if self.direction == 1 else x + 20
        eye2_x = x + 20 if self.direction == 1 else x + 10
        pygame.draw.circle(surface, (255, 255, 255), (int(eye1_x), int(eye_y)), 4)
        pygame.draw.circle(surface, (255, 255, 255), (int(eye2_x), int(eye_y)), 4)
        pygame.draw.circle(surface, (0, 0, 0), (int(eye1_x), int(eye_y)), 2)
        pygame.draw.circle(surface, (0, 0, 0), (int(eye2_x), int(eye_y)), 2)
        
        # Sonrisa
        pygame.draw.arc(surface, (0, 0, 0), (x + 8, y + 15, 20, 15), 0, 3.14, 2)
        
        # Partículas
        for particle in self.particles:
            particle.draw(surface, camera_x)

class Enemy:
    def __init__(self, x, y, enemy_type="normal"):
        self.width, self.height = 30, 30
        self.rect = pygame.Rect(x, y, self.width, self.height)
        
        # Velocidad según tipo
        if enemy_type == "fast":
            self.vel_x = random.choice([4, -4])
        elif enemy_type == "flying":
            self.vel_x = random.choice([2.5, -2.5])
            self.vel_y = random.choice([0.5, -0.5])
        elif enemy_type == "shooter":
            self.vel_x = random.choice([1.5, -1.5])
        elif enemy_type == "teleport":
            self.vel_x = random.choice([3, -3])
        else:
            self.vel_x = random.choice([2, -2])
        
        self.x_min, self.x_max = x - 150, x + 150
        self.y_min, self.y_max = y - 80, y + 80
        self.enemy_type = enemy_type
        self.animation_timer = 0
        self.teleport_timer = 0
        
    def update(self):
        self.rect.x += self.vel_x
        
        # Movimiento según tipo
        if self.enemy_type == "flying":
            self.rect.y += self.vel_y
            if self.rect.y < self.y_min or self.rect.y > self.y_max:
                self.vel_y *= -1
        
        if self.rect.x < self.x_min or self.rect.x > self.x_max:
            self.vel_x *= -1
        
        if self.enemy_type == "teleport":
            self.teleport_timer += 1
            if self.teleport_timer > 180:  # Cada 3 segundos
                self.rect.x = random.randint(self.x_min, self.x_max)
                self.rect.y = random.randint(self.y_min, self.y_max)
                self.teleport_timer = 0
        
        self.animation_timer += 1
    
    def draw(self, surface, camera_x):
        x = self.rect.x - camera_x
        y = self.rect.y
        
        # Color según tipo
        if self.enemy_type == "fast":
            color = (150, 20, 20)
        elif self.enemy_type == "flying":
            color = (200, 100, 50)
        elif self.enemy_type == "shooter":
            color = (100, 50, 150)
        elif self.enemy_type == "teleport":
            # Efecto de desvanecimiento al teletransportarse
            fade = abs(math.sin(self.animation_timer * 0.1))
            color = (int(220 * fade), int(50 * fade), int(220 * fade))
        else:
            color = (220, 50, 50)
        
        # Cuerpo
        pygame.draw.rect(surface, color, (x, y, self.width, self.height))
        
        # Ojos
        pygame.draw.circle(surface, (255, 255, 255), (int(x + 8), int(y + 10)), 4)
        pygame.draw.circle(surface, (255, 255, 255), (int(x + 22), int(y + 10)), 4)
        pygame.draw.circle(surface, (0, 0, 0), (int(x + 8), int(y + 10)), 2)
        pygame.draw.circle(surface, (0, 0, 0), (int(x + 22), int(y + 10)), 2)
        
        # Alas si es flying
        if self.enemy_type == "flying":
            wing_offset = 3 * math.sin(self.animation_timer * 0.1)
            pygame.draw.polygon(surface, color, 
                              [(int(x - 5), int(y + 15)), (int(x + 2), int(y + 10 + wing_offset)), 
                               (int(x + 1), int(y + 20))])
            pygame.draw.polygon(surface, color, 
                              [(int(x + 35), int(y + 15)), (int(x + 28), int(y + 10 + wing_offset)), 
                               (int(x + 29), int(y + 20))])

class Coin:
    def __init__(self, x, y, coin_type="normal"):
        self.rect = pygame.Rect(x, y, 16, 16)
        self.coin_type = coin_type
        self.animation_timer = 0
        
    def update(self):
        self.animation_timer += 1
    
    def draw(self, surface, camera_x):
        x = self.rect.x - camera_x
        y = self.rect.y
        
        scale = 1 + math.sin(self.animation_timer * 0.05) * 0.2
        
        if self.coin_type == "normal":
            color = COLOR_BTS_GOLD
            radius = 8
        else:
            color = (255, 20, 147)
            radius = 10
        
        pygame.draw.circle(surface, color, (int(x + 8), int(y + 8)), int(radius * scale))
        pygame.draw.circle(surface, (200, 170, 0), (int(x + 8), int(y + 8)), int(radius * scale) - 2)

class Platform:
    def __init__(self, x, y, width, height, platform_type="normal"):
        self.rect = pygame.Rect(x, y, width, height)
        self.platform_type = platform_type
        self.original_x = x
        self.movement_range = 100
        self.movement_timer = 0
        
    def update(self):
        if self.platform_type == "moving":
            self.movement_timer += 1
            offset = math.sin(self.movement_timer * 0.02) * self.movement_range
            self.rect.x = self.original_x + offset
    
    def draw(self, surface, camera_x):
        x = self.rect.x - camera_x
        y = self.rect.y
        
        if self.platform_type == "normal":
            color = COLOR_BTS_PURPLE
        elif self.platform_type == "moving":
            color = (100, 200, 255)
        else:
            color = (255, 100, 100)
        
        pygame.draw.rect(surface, color, (x, y, self.rect.width, self.rect.height), border_radius=3)
        
        for i in range(0, self.rect.width, 20):
            pygame.draw.line(surface, (200, 200, 200), 
                           (x + i, y), (x + i + 10, y - 3), 1)

# ===== NIVELES =====
class Level:
    def __init__(self, level_num):
        self.level_num = level_num
        self.platforms = []
        self.enemies = []
        self.coins = []
        self.powerups = []
        self.goal = None
        self.members = ["Jin", "Suga", "J-Hope", "RM", "Jungkook", "V"]
        self.member_name = self.members[level_num % 6]
        self.generate_level()
    
    def generate_level(self):
        if self.level_num == 0:
            self.generate_level_jin()
        elif self.level_num == 1:
            self.generate_level_suga()
        elif self.level_num == 2:
            self.generate_level_jhope()
        elif self.level_num == 3:
            self.generate_level_rm()
        elif self.level_num == 4:
            self.generate_level_jungkook()
        else:
            self.generate_level_v()
    
    def generate_level_jin(self):
        self.platforms.append(Platform(0, 500, 3000, 100, "normal"))
        self.platforms.append(Platform(150, 420, 120, 20, "normal"))
        self.platforms.append(Platform(300, 360, 120, 20, "normal"))
        self.platforms.append(Platform(450, 300, 120, 20, "normal"))
        self.platforms.append(Platform(550, 350, 120, 20, "normal"))
        self.platforms.append(Platform(700, 280, 100, 20, "moving"))
        self.platforms.append(Platform(850, 360, 100, 20, "normal"))
        self.platforms.append(Platform(1000, 280, 80, 20, "spike"))
        self.platforms.append(Platform(1100, 380, 100, 20, "normal"))
        self.platforms.append(Platform(1250, 320, 100, 20, "normal"))
        self.platforms.append(Platform(1380, 240, 80, 20, "normal"))
        
        for i, pos_y in enumerate([200, 250, 300, 350]):
            self.coins.append(Coin(200 + i * 300, pos_y, "normal"))
        self.coins.append(Coin(800, 180, "special"))
        self.coins.append(Coin(1200, 200, "special"))
        
        self.powerups.append(PowerUp(600, 150, "shield"))
        
        self.enemies.append(Enemy(400, 450, "normal"))
        self.enemies.append(Enemy(1000, 420, "normal"))
        self.enemies.append(Enemy(1150, 420, "normal"))
        
        self.goal = pygame.Rect(1420, 180, 40, 40)
    
    def generate_level_suga(self):
        self.platforms.append(Platform(0, 500, 3500, 100, "normal"))
        self.platforms.append(Platform(100, 420, 100, 20, "normal"))
        self.platforms.append(Platform(250, 360, 100, 20, "normal"))
        self.platforms.append(Platform(370, 300, 80, 20, "normal"))
        self.platforms.append(Platform(500, 280, 90, 20, "moving"))
        self.platforms.append(Platform(650, 350, 90, 20, "moving"))
        self.platforms.append(Platform(800, 280, 80, 20, "moving"))
        self.platforms.append(Platform(950, 400, 70, 20, "spike"))
        self.platforms.append(Platform(1050, 400, 70, 20, "spike"))
        self.platforms.append(Platform(1150, 350, 100, 20, "normal"))
        self.platforms.append(Platform(1300, 320, 80, 20, "normal"))
        self.platforms.append(Platform(1400, 260, 80, 20, "normal"))
        self.platforms.append(Platform(1500, 360, 80, 20, "spike"))
        self.platforms.append(Platform(1600, 280, 100, 20, "normal"))
        self.platforms.append(Platform(1750, 240, 80, 20, "normal"))
        self.platforms.append(Platform(1900, 300, 80, 20, "normal"))
        
        self.coins.append(Coin(100, 350, "normal"))
        self.coins.append(Coin(250, 290, "special"))
        self.coins.append(Coin(500, 200, "normal"))
        self.coins.append(Coin(650, 270, "normal"))
        self.coins.append(Coin(800, 200, "special"))
        self.coins.append(Coin(1150, 260, "normal"))
        self.coins.append(Coin(1300, 230, "normal"))
        self.coins.append(Coin(1600, 190, "special"))
        self.coins.append(Coin(1750, 150, "normal"))
        
        self.powerups.append(PowerUp(700, 150, "speed"))
        self.powerups.append(PowerUp(1400, 150, "health"))
        
        self.enemies.append(Enemy(300, 450, "normal"))
        self.enemies.append(Enemy(700, 420, "fast"))
        self.enemies.append(Enemy(1100, 420, "normal"))
        self.enemies.append(Enemy(1400, 420, "fast"))
        self.enemies.append(Enemy(1800, 420, "normal"))
        
        self.goal = pygame.Rect(1940, 200, 40, 40)
    
    def generate_level_jhope(self):
        self.platforms.append(Platform(0, 500, 4500, 100, "normal"))
        self.platforms.append(Platform(80, 420, 100, 20, "normal"))
        self.platforms.append(Platform(220, 360, 90, 20, "normal"))
        self.platforms.append(Platform(340, 300, 80, 20, "normal"))
        self.platforms.append(Platform(480, 280, 80, 20, "moving"))
        self.platforms.append(Platform(620, 340, 80, 20, "moving"))
        self.platforms.append(Platform(760, 260, 80, 20, "moving"))
        self.platforms.append(Platform(900, 320, 80, 20, "moving"))
        self.platforms.append(Platform(1050, 400, 60, 20, "spike"))
        self.platforms.append(Platform(1130, 400, 60, 20, "spike"))
        self.platforms.append(Platform(1210, 400, 60, 20, "spike"))
        self.platforms.append(Platform(1290, 340, 90, 20, "normal"))
        self.platforms.append(Platform(1440, 300, 80, 20, "moving"))
        self.platforms.append(Platform(1580, 360, 70, 20, "spike"))
        self.platforms.append(Platform(1680, 280, 80, 20, "normal"))
        self.platforms.append(Platform(1800, 400, 60, 20, "spike"))
        self.platforms.append(Platform(1900, 320, 80, 20, "normal"))
        self.platforms.append(Platform(2050, 260, 80, 20, "moving"))
        self.platforms.append(Platform(2180, 340, 80, 20, "moving"))
        self.platforms.append(Platform(2310, 280, 80, 20, "normal"))
        self.platforms.append(Platform(2450, 400, 60, 20, "spike"))
        self.platforms.append(Platform(2550, 320, 80, 20, "normal"))
        self.platforms.append(Platform(2680, 280, 80, 20, "normal"))
        self.platforms.append(Platform(2800, 360, 80, 20, "normal"))
        self.platforms.append(Platform(2920, 240, 80, 20, "normal"))
        
        self.coins.append(Coin(80, 350, "normal"))
        self.coins.append(Coin(220, 290, "normal"))
        self.coins.append(Coin(480, 190, "special"))
        self.coins.append(Coin(620, 260, "normal"))
        self.coins.append(Coin(760, 170, "special"))
        self.coins.append(Coin(900, 230, "normal"))
        self.coins.append(Coin(1290, 250, "normal"))
        self.coins.append(Coin(1440, 210, "special"))
        self.coins.append(Coin(1680, 190, "normal"))
        self.coins.append(Coin(1900, 230, "normal"))
        self.coins.append(Coin(2050, 170, "special"))
        self.coins.append(Coin(2310, 190, "normal"))
        self.coins.append(Coin(2550, 230, "special"))
        self.coins.append(Coin(2680, 190, "normal"))
        self.coins.append(Coin(2800, 280, "normal"))
        
        self.powerups.append(PowerUp(900, 150, "shield"))
        self.powerups.append(PowerUp(1600, 150, "speed"))
        
        self.enemies.append(Enemy(200, 450, "normal"))
        self.enemies.append(Enemy(550, 420, "fast"))
        self.enemies.append(Enemy(800, 420, "fast"))
        self.enemies.append(Enemy(1100, 420, "normal"))
        self.enemies.append(Enemy(1400, 420, "fast"))
        self.enemies.append(Enemy(1700, 420, "normal"))
        self.enemies.append(Enemy(2000, 420, "fast"))
        self.enemies.append(Enemy(2300, 420, "normal"))
        self.enemies.append(Enemy(2600, 420, "fast"))
        self.enemies.append(Enemy(2900, 420, "normal"))
        
        self.goal = pygame.Rect(2960, 160, 40, 40)
    
    def generate_level_rm(self):
        # Nivel 4: RM - Enemigos voladores
        self.platforms.append(Platform(0, 500, 4000, 100, "normal"))
        self.platforms.append(Platform(100, 380, 100, 20, "normal"))
        self.platforms.append(Platform(280, 300, 100, 20, "normal"))
        self.platforms.append(Platform(450, 380, 100, 20, "moving"))
        self.platforms.append(Platform(650, 280, 80, 20, "normal"))
        self.platforms.append(Platform(800, 350, 100, 20, "moving"))
        self.platforms.append(Platform(950, 240, 80, 20, "normal"))
        self.platforms.append(Platform(1100, 400, 60, 20, "spike"))
        self.platforms.append(Platform(1200, 300, 100, 20, "normal"))
        self.platforms.append(Platform(1350, 360, 80, 20, "normal"))
        self.platforms.append(Platform(1500, 280, 100, 20, "moving"))
        self.platforms.append(Platform(1700, 320, 80, 20, "normal"))
        self.platforms.append(Platform(1850, 400, 60, 20, "spike"))
        self.platforms.append(Platform(2000, 300, 100, 20, "normal"))
        
        for i in range(8):
            self.coins.append(Coin(100 + i * 250, random.randint(150, 250), "normal"))
            if i % 2 == 0:
                self.coins.append(Coin(200 + i * 250, random.randint(100, 200), "special"))
        
        self.powerups.append(PowerUp(650, 150, "shield"))
        self.powerups.append(PowerUp(1500, 150, "speed"))
        
        # ENEMIGOS VOLADORES
        self.enemies.append(Enemy(300, 250, "flying"))
        self.enemies.append(Enemy(600, 200, "flying"))
        self.enemies.append(Enemy(900, 220, "flying"))
        self.enemies.append(Enemy(1250, 280, "flying"))
        self.enemies.append(Enemy(1600, 240, "flying"))
        self.enemies.append(Enemy(1950, 260, "flying"))
        
        self.goal = pygame.Rect(2050, 220, 40, 40)
    
    def generate_level_jungkook(self):
        # Nivel 5: Jungkook - Enemigos disparadores
        self.platforms.append(Platform(0, 500, 4500, 100, "normal"))
        self.platforms.append(Platform(120, 380, 100, 20, "normal"))
        self.platforms.append(Platform(300, 300, 100, 20, "normal"))
        self.platforms.append(Platform(500, 380, 120, 20, "moving"))
        self.platforms.append(Platform(750, 260, 100, 20, "normal"))
        self.platforms.append(Platform(900, 350, 100, 20, "spike"))
        self.platforms.append(Platform(1050, 280, 80, 20, "normal"))
        self.platforms.append(Platform(1200, 400, 70, 20, "spike"))
        self.platforms.append(Platform(1350, 300, 100, 20, "normal"))
        self.platforms.append(Platform(1550, 360, 90, 20, "moving"))
        self.platforms.append(Platform(1750, 280, 100, 20, "normal"))
        self.platforms.append(Platform(1900, 400, 60, 20, "spike"))
        self.platforms.append(Platform(2100, 320, 100, 20, "normal"))
        self.platforms.append(Platform(2300, 380, 80, 20, "normal"))
        
        for i in range(10):
            self.coins.append(Coin(100 + i * 220, random.randint(140, 280), "normal"))
            if i % 3 == 0:
                self.coins.append(Coin(180 + i * 220, random.randint(80, 200), "special"))
        
        self.powerups.append(PowerUp(750, 120, "shield"))
        self.powerups.append(PowerUp(1350, 120, "health"))
        self.powerups.append(PowerUp(2100, 120, "speed"))
        
        # ENEMIGOS DISPARADORES
        self.enemies.append(Enemy(400, 400, "shooter"))
        self.enemies.append(Enemy(700, 420, "shooter"))
        self.enemies.append(Enemy(1100, 420, "shooter"))
        self.enemies.append(Enemy(1500, 420, "shooter"))
        self.enemies.append(Enemy(1800, 420, "shooter"))
        self.enemies.append(Enemy(2200, 420, "shooter"))
        
        self.goal = pygame.Rect(2340, 280, 40, 40)
    
    def generate_level_v(self):
        # Nivel 6: V - Enemigos teletransportadores
        self.platforms.append(Platform(0, 500, 5000, 100, "normal"))
        self.platforms.append(Platform(100, 380, 100, 20, "normal"))
        self.platforms.append(Platform(280, 300, 100, 20, "normal"))
        self.platforms.append(Platform(500, 360, 120, 20, "moving"))
        self.platforms.append(Platform(750, 260, 100, 20, "normal"))
        self.platforms.append(Platform(900, 350, 100, 20, "spike"))
        self.platforms.append(Platform(1100, 280, 80, 20, "normal"))
        self.platforms.append(Platform(1250, 400, 90, 20, "spike"))
        self.platforms.append(Platform(1400, 300, 100, 20, "normal"))
        self.platforms.append(Platform(1600, 360, 90, 20, "moving"))
        self.platforms.append(Platform(1850, 260, 100, 20, "normal"))
        self.platforms.append(Platform(2000, 400, 80, 20, "spike"))
        self.platforms.append(Platform(2200, 320, 100, 20, "normal"))
        self.platforms.append(Platform(2400, 380, 100, 20, "moving"))
        self.platforms.append(Platform(2650, 280, 100, 20, "normal"))
        self.platforms.append(Platform(2850, 400, 60, 20, "spike"))
        self.platforms.append(Platform(3000, 300, 100, 20, "normal"))
        
        for i in range(12):
            self.coins.append(Coin(80 + i * 250, random.randint(120, 280), "normal"))
            if i % 2 == 0:
                self.coins.append(Coin(150 + i * 250, random.randint(60, 200), "special"))
        
        self.powerups.append(PowerUp(750, 120, "shield"))
        self.powerups.append(PowerUp(1400, 120, "speed"))
        self.powerups.append(PowerUp(2200, 120, "health"))
        self.powerups.append(PowerUp(2900, 120, "shield"))
        
        # ENEMIGOS TELETRANSPORTADORES
        self.enemies.append(Enemy(300, 350, "teleport"))
        self.enemies.append(Enemy(600, 420, "teleport"))
        self.enemies.append(Enemy(950, 420, "teleport"))
        self.enemies.append(Enemy(1300, 420, "teleport"))
        self.enemies.append(Enemy(1700, 420, "teleport"))
        self.enemies.append(Enemy(2200, 420, "teleport"))
        self.enemies.append(Enemy(2600, 420, "teleport"))
        self.enemies.append(Enemy(3000, 420, "teleport"))
        
        self.goal = pygame.Rect(3050, 220, 40, 40)

# ===== JUEGO PRINCIPAL =====
class Game:
    def __init__(self):
        self.level = 0
        self.score = 0
        self.lives = 3
        self.level_obj = Level(self.level)
        self.player = Player(50, 400)
        self.camera_x = 0
        self.font_large = pygame.font.Font(None, 48)
        self.font_medium = pygame.font.Font(None, 32)
        self.font_small = pygame.font.Font(None, 24)
        self.game_state = "playing"
        self.state_timer = 0
        self.best_score = self.load_best_score()
    
    def load_best_score(self):
        try:
            if os.path.exists("scores.json"):
                with open("scores.json", "r") as f:
                    data = json.load(f)
                    return data.get("best_score", 0)
        except:
            pass
        return 0
    
    def save_score(self):
        try:
            data = {"best_score": max(self.best_score, self.score)}
            with open("scores.json", "w") as f:
                json.dump(data, f)
        except:
            pass
    
    def update(self):
        if self.game_state == "playing":
            keys = pygame.key.get_pressed()
            
            self.player.handle_input(keys)
            if not self.player.update(self.level_obj.platforms):
                self.lives -= 1
                if self.lives <= 0:
                    self.game_state = "game_over"
                    self.save_score()
                    self.state_timer = 0
                else:
                    self.reset_level()
            
            for platform in self.level_obj.platforms:
                platform.update()
            
            for enemy in self.level_obj.enemies:
                enemy.update()
            
            for coin in self.level_obj.coins:
                coin.update()
            
            for powerup in self.level_obj.powerups:
                powerup.update()
            
            # Colisiones con monedas
            for coin in self.level_obj.coins[:]:
                if self.player.rect.colliderect(coin.rect):
                    self.level_obj.coins.remove(coin)
                    self.score += 50 if coin.coin_type == "special" else 10
            
            # Colisiones con power-ups
            for powerup in self.level_obj.powerups[:]:
                if self.player.rect.colliderect(powerup.rect):
                    self.level_obj.powerups.remove(powerup)
                    if powerup.power_type == "shield":
                        self.player.shield = True
                        self.player.shield_timer = 300
                    elif powerup.power_type == "speed":
                        self.player.speed_boost = True
                        self.player.speed_boost_timer = 300
                    elif powerup.power_type == "health":
                        self.lives += 1
            
            # Colisiones con plataformas spike
            for platform in self.level_obj.platforms:
                if platform.platform_type == "spike" and self.player.rect.colliderect(platform.rect):
                    if not self.player.shield:
                        self.lives -= 1
                        if self.lives <= 0:
                            self.game_state = "game_over"
                            self.save_score()
                        else:
                            self.reset_level()
                        break
                    else:
                        self.player.shield = False
            
            # Colisiones con enemigos
            for enemy in self.level_obj.enemies:
                if self.player.rect.colliderect(enemy.rect):
                    if not self.player.shield:
                        self.lives -= 1
                        if self.lives <= 0:
                            self.game_state = "game_over"
                            self.save_score()
                        else:
                            self.reset_level()
                        break
                    else:
                        self.player.shield = False
            
            # Colisiones con meta
            if self.player.rect.colliderect(self.level_obj.goal):
                self.game_state = "level_complete"
                self.score += 500
                self.state_timer = 0
            
            self.camera_x = max(0, self.player.rect.x - 300)
        
        elif self.game_state == "level_complete":
            self.state_timer += 1
            if self.state_timer > 180 or pygame.key.get_pressed()[pygame.K_SPACE]:
                self.next_level()
        
        elif self.game_state == "game_over":
            self.state_timer += 1
            if self.state_timer > 180 or pygame.key.get_pressed()[pygame.K_SPACE]:
                if self.level >= 5:
                    self.show_ending()
                self.reset_game()
    
    def next_level(self):
        if self.level < 5:
            self.level += 1
            self.level_obj = Level(self.level)
            self.player = Player(50, 400)
            self.camera_x = 0
            self.game_state = "playing"
        else:
            self.show_ending()
    
    def show_ending(self):
        self.game_state = "ending"
        self.state_timer = 0
    
    def reset_level(self):
        self.player = Player(50, 400)
        self.camera_x = 0
    
    def reset_game(self):
        self.level = 0
        self.score = 0
        self.lives = 3
        self.level_obj = Level(0)
        self.player = Player(50, 400)
        self.camera_x = 0
        self.game_state = "playing"
        self.state_timer = 0
    
    def draw(self):
        screen.fill(COLOR_BG)
        
        # Fondo estrellado
        random.seed(int(self.camera_x / 100))
        for i in range(20):
            star_x = (random.randint(0, WIDTH) + self.camera_x) % WIDTH
            star_y = random.randint(0, 100)
            pygame.draw.circle(screen, (200, 200, 200), (star_x, star_y), 1)
        
        # Elementos del nivel
        for platform in self.level_obj.platforms:
            platform.draw(screen, self.camera_x)
        
        for coin in self.level_obj.coins:
            coin.draw(screen, self.camera_x)
        
        for powerup in self.level_obj.powerups:
            powerup.draw(screen, self.camera_x)
        
        for enemy in self.level_obj.enemies:
            enemy.draw(screen, self.camera_x)
        
        # Objetivo
        goal_x = self.level_obj.goal.x - self.camera_x
        goal_y = self.level_obj.goal.y
        pygame.draw.circle(screen, MEMBER_COLORS.get(self.level_obj.member_name.lower(), (255, 105, 180)), 
                         (int(goal_x + 20), int(goal_y + 20)), 25)
        pygame.draw.circle(screen, (255, 255, 255), 
                         (int(goal_x + 20), int(goal_y + 20)), 25, 3)
        font_member = pygame.font.Font(None, 16)
        text = font_member.render("BTS", True, (255, 255, 255))
        screen.blit(text, (int(goal_x + 7), int(goal_y + 15)))
        
        # Jugador
        self.player.draw(screen, self.camera_x)
        
        # HUD
        level_text = self.font_small.render(f"Nivel {self.level + 1}/6: {self.level_obj.member_name}", 
                                           True, COLOR_BTS_GOLD)
        score_text = self.font_small.render(f"Puntos: {self.score}", True, COLOR_BTS_GOLD)
        best_text = self.font_small.render(f"Mejor: {self.best_score}", True, (200, 200, 200))
        lives_text = self.font_small.render(f"Vidas: {self.lives} ❤️", True, COLOR_BTS_GOLD)
        
        screen.blit(level_text, (10, 10))
        screen.blit(score_text, (10, 40))
        screen.blit(best_text, (10, 70))
        screen.blit(lives_text, (WIDTH - 150, 10))
        
        # Estados
        if self.game_state == "level_complete":
            text = self.font_large.render(f"¡Rescataste a {self.level_obj.member_name}! 💜", True, COLOR_BTS_GOLD)
            screen.blit(text, (WIDTH // 2 - text.get_width() // 2, HEIGHT // 2 - 50))
            small = self.font_medium.render("Presiona ESPACIO para continuar", True, (200, 200, 200))
            screen.blit(small, (WIDTH // 2 - small.get_width() // 2, HEIGHT // 2 + 50))
        
        elif self.game_state == "game_over":
            text = self.font_large.render("GAME OVER", True, (255, 50, 50))
            screen.blit(text, (WIDTH // 2 - text.get_width() // 2, HEIGHT // 2 - 50))
            score = self.font_medium.render(f"Puntuación: {self.score}", True, COLOR_BTS_GOLD)
            screen.blit(score, (WIDTH // 2 - score.get_width() // 2, HEIGHT // 2 + 20))
            small = self.font_medium.render("Presiona ESPACIO para reintentar", True, (200, 200, 200))
            screen.blit(small, (WIDTH // 2 - small.get_width() // 2, HEIGHT // 2 + 80))
        
        elif self.game_state == "ending":
            text = self.font_large.render("¡GANASTE! 🎉", True, COLOR_BTS_GOLD)
            screen.blit(text, (WIDTH // 2 - text.get_width() // 2, HEIGHT // 2 - 80))
            msg = self.font_medium.render("¡Rescataste a todos los miembros de BTS!", True, (255, 255, 255))
            screen.blit(msg, (WIDTH // 2 - msg.get_width() // 2, HEIGHT // 2))
            score = self.font_medium.render(f"Puntuación Final: {self.score}", True, COLOR_BTS_GOLD)
            screen.blit(score, (WIDTH // 2 - score.get_width() // 2, HEIGHT // 2 + 80))

# ===== MENÚ =====
def show_menu():
    menu_running = True
    animation_timer = 0
    
    while menu_running:
        clock.tick(FPS)
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE:
                    return
                if event.key == pygame.K_ESCAPE:
                    pygame.quit()
                    sys.exit()
        
        screen.fill(COLOR_BG)
        animation_timer += 1
        
        title = pygame.font.Font(None, 72).render("🎮 MARIO BROS", True, COLOR_BTS_GOLD)
        subtitle = pygame.font.Font(None, 48).render("BTS EDITION", True, COLOR_BTS_PURPLE)
        
        screen.blit(title, (WIDTH // 2 - title.get_width() // 2, 30))
        screen.blit(subtitle, (WIDTH // 2 - subtitle.get_width() // 2, 90))
        
        members = ["Jin", "Suga", "J-Hope", "RM", "Jungkook", "V"]
        for i, member in enumerate(members):
            x = 50 + i * 155
            y = 180 + (8 * math.sin(animation_timer * 0.05 + i))
            color = MEMBER_COLORS.get(member.lower(), COLOR_BTS_PURPLE)
            text = pygame.font.Font(None, 24).render(member, True, color)
            screen.blit(text, (x, int(y)))
        
        instr1 = pygame.font.Font(None, 28).render("Rescata a todos los miembros de BTS", True, (200, 200, 200))
        instr2 = pygame.font.Font(None, 28).render("6 Niveles • Enemigos Únicos • Power-ups", True, (200, 200, 200))
        instr3 = pygame.font.Font(None, 32).render("Presiona ESPACIO para comenzar", True, COLOR_BTS_GOLD)
        
        screen.blit(instr1, (WIDTH // 2 - instr1.get_width() // 2, 330))
        screen.blit(instr2, (WIDTH // 2 - instr2.get_width() // 2, 370))
        screen.blit(instr3, (WIDTH // 2 - instr3.get_width() // 2, 450))
        
        controls = pygame.font.Font(None, 20).render(
            "Controles: FLECHAS/WASD para mover, ESPACIO/W para saltar | ESC para salir", 
            True, (150, 150, 150)
        )
        screen.blit(controls, (WIDTH // 2 - controls.get_width() // 2, 520))
        
        pygame.display.update()

def main():
    show_menu()
    game = Game()
    
    while True:
        clock.tick(FPS)
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    pygame.quit()
                    sys.exit()
        
        game.update()
        game.draw()
        pygame.display.update()

if __name__ == "__main__":
    main()
