#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de prueba para capturar errores del juego
"""

import sys
import traceback

try:
    exec(open('juego.py').read())
except Exception as e:
    print(f"\n\n❌ ERROR CAPTURADO:")
    print(f"Tipo: {type(e).__name__}")
    print(f"Mensaje: {e}")
    print("\n📍 Traceback completo:")
    traceback.print_exc()
    input("\n\nPresiona Enter para salir...")
