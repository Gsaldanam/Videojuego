@echo off
REM ===== MARIO BROS: BTS EDITION =====
REM Script para ejecutar el juego fácilmente en Windows

cls
echo.
echo ╔══════════════════════════════════════════╗
echo ║   🎮 MARIO BROS: BTS EDITION 💜         ║
echo ║   Un regalo especial para Alexandra      ║
echo ╚══════════════════════════════════════════╝
echo.
echo Comprobando Python...

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python no está instalado o no está en PATH
    echo Por favor, instala Python desde python.org
    pause
    exit /b 1
)

echo ✅ Python encontrado
echo.
echo Comprobando Pygame...

python -c "import pygame" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Pygame no está instalado. Instalando...
    python -m pip install pygame --quiet
    echo ✅ Pygame instalado
) else (
    echo ✅ Pygame encontrado
)

echo.
echo 🎮 Iniciando el juego...
echo.
echo Controles:
echo   ⬅️  / ➡️  / A / D = Mover
echo   ESPACIO / W = Saltar
echo   ESC = Salir
echo.
pause

python juego.py
