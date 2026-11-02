-- =====================================================================
-- DF EventoS — dados para a apresentação (rodar DEPOIS de schema.sql e seed.sql)
--
-- Coloca curtidas e comentários de exemplo nos eventos publicados, usando as
-- contas que JÁ EXISTEM (o Supabase não deixa criar login por SQL).
-- Antes de rodar: crie pelo site pelo menos 2 contas (ex.: a do admin e uma comum).
--
-- Pode rodar de novo: troca os comentários de exemplo e não mexe nos comentários reais.
-- =====================================================================

do $$
declare
  usuarios uuid[];
  total int;
begin
  select array_agg(id order by criado_em) into usuarios from public.perfis;
  total := coalesce(array_length(usuarios, 1), 0);
  if total = 0 then
    raise exception 'Nenhuma conta encontrada. Cadastre pelo menos uma conta no site antes de rodar este script.';
  end if;

  -- limpa os comentários da demonstração anterior (marca invisível no fim do texto)
  delete from public.comentarios where texto like '%' || chr(8203);

  -- curtidas: cada conta curte alguns eventos publicados (quantidades variadas).
  -- "on conflict do nothing" mantém as curtidas que já existem.
  insert into public.curtidas (usuario_id, evento_id)
  select u.id, e.id
  from (select unnest(usuarios) as id, generate_subscripts(usuarios, 1) as n) u
  join (select id, row_number() over (order by data) as pos from public.eventos where status = 'publicado') e
    on (e.pos + u.n) % 3 <> 0
  on conflict do nothing;

  -- comentários (o chr(8203) invisível no fim identifica os comentários da demonstração)
  insert into public.comentarios (evento_id, usuario_id, texto, criado_em)
  select e.id, usuarios[1 + (c.n % total)], c.texto || chr(8203), now() - (c.n || ' hours')::interval
  from (values
      ('Campanha de vacinação contra a gripe', 1, 'Precisa levar o cartão do SUS ou só a identidade resolve?'),
      ('Campanha de vacinação contra a gripe', 2, 'Fui ano passado e foi bem rápido. Chegar cedo ajuda.'),
      ('Mutirão de doação de sangue', 3, 'Quem tem tatuagem recente pode doar?'),
      ('Mutirão de doação de sangue', 4, 'Vale confirmar no site do hemocentro, mas acho que precisa esperar um ano depois da tatuagem.'),
      ('Caminhada pela saúde do coração', 5, 'Vai ter água no percurso? Vou levar minha mãe.'),
      ('Roda de conversa: ansiedade no dia a dia', 6, 'Ótima iniciativa. Precisa se inscrever antes?'),
      ('Oficina de alimentação saudável com pouco dinheiro', 7, 'Seria bom ter uma edição em Ceilândia também.')
    ) as c(titulo, n, texto)
  join public.eventos e on e.titulo = c.titulo and e.status = 'publicado';
end $$;
