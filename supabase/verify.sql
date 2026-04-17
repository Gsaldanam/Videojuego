-- Verificación rápida de funcionamiento (ejecutar en Supabase SQL Editor)

-- 1) Verifica que la tabla existe
select table_name
from information_schema.tables
where table_schema = 'public' and table_name = 'leaderboard_scores';

-- 2) Inserta un registro de prueba
insert into public.leaderboard_scores (name, score, mode, level_reached)
values ('TEST_SUPABASE', 123, 'infinito', 7);

-- 3) Lee top normal e infinito
select name, score, mode, level_reached, created_at
from public.leaderboard_scores
where mode = 'normal'
order by score desc, created_at asc
limit 5;

select name, score, mode, level_reached, created_at
from public.leaderboard_scores
where mode = 'infinito'
order by score desc, level_reached desc, created_at asc
limit 5;

-- 4) Limpieza del registro de prueba
delete from public.leaderboard_scores
where name = 'TEST_SUPABASE' and score = 123 and mode = 'infinito';
