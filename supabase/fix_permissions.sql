-- Ejecuta este script si la tabla existe pero no se guardan registros desde el juego

alter table public.leaderboard_scores enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert on table public.leaderboard_scores to anon, authenticated;
grant usage, select on sequence public.leaderboard_scores_id_seq to anon, authenticated;

drop policy if exists "public read leaderboard" on public.leaderboard_scores;
create policy "public read leaderboard"
on public.leaderboard_scores
for select
using (true);

drop policy if exists "public insert leaderboard" on public.leaderboard_scores;
create policy "public insert leaderboard"
on public.leaderboard_scores
for insert
with check (true);

-- Test rápido de inserción/lectura
insert into public.leaderboard_scores (name, score, mode, level_reached)
values ('TEST_FIX', 321, 'infinito', 9);

select id, name, score, mode, level_reached, created_at
from public.leaderboard_scores
where name = 'TEST_FIX'
order by id desc
limit 3;

-- Limpieza opcional
-- delete from public.leaderboard_scores where name = 'TEST_FIX';
