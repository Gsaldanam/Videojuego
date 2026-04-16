#!/bin/bash
# ===== MARIO BROS: BTS EDITION =====
# Script para ejecutar el juego en Linux/Mac

clear
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   🎮 MARIO BROS: BTS EDITION 💜         ║"
echo "║   Un regalo especial para Alexandra      ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Comprobando Python..."

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 no está instalado"
    echo "Por favor, instala Python desde python.org"
    exit 1
fi

echo "✅ Python encontrado"
echo ""
echo "Comprobando Pygame..."

python3 -c "import pygame" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  Pygame no está instalado. Instalando..."
    pip3 install pygame
    echo "✅ Pygame instalado"
else
    echo "✅ Pygame encontrado"
fi

echo ""
echo "🎮 Iniciando el juego..."
echo ""
echo "Controles:"
echo "   ⬅️  / ➡️  / A / D = Mover"
echo "   ESPACIO / W = Saltar"
echo "   ESC = Salir"
echo ""
read -p "Presiona Enter para comenzar..."

python3 juego.py
