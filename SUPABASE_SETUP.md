# Configuración Supabase para Leaderboard Global

## 1) Crear proyecto en Supabase
1. Entra a https://supabase.com
2. Crea un proyecto nuevo.
3. Espera a que termine el provisioning.

## 2) Crear tabla y políticas
1. Abre `SQL Editor`.
2. Ejecuta el script de `supabase/setup.sql`.

Eso crea:
- Tabla `public.leaderboard_scores`
- Índices
- RLS habilitado
- Políticas públicas de `select` e `insert`

## 3) Copiar URL y anon key
En Supabase:
- Project Settings → API
- Copia:
  - `Project URL`
  - `anon public key`

## 4) Pegar configuración en el juego
En `index.html`, al final, completa:

```html
<script>
  window.BTS_SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
  window.BTS_SUPABASE_ANON_KEY = 'TU_ANON_KEY';
  window.BTS_LEADERBOARD_API = '';
</script>
```

## 5) Deploy
Publica el proyecto (GitHub Pages, Vercel o Netlify).
Con esa configuración:
- Cualquier persona que abra el link ve el histórico compartido.
- Se guarda leaderboard normal/hardcore.
- Se guarda leaderboard infinito con nivel alcanzado.

## Notas
- `scores.json` queda como fallback/local seed.
- Si no pones URL/key, el juego sigue funcionando con localStorage.
- Para producción avanzada, puedes restringir políticas por rate-limit vía Edge Functions.
