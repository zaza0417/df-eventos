-- =====================================================================
-- DF EventoS — estrutura do banco (Supabase / Postgres)
-- Como usar: Supabase > SQL Editor > New query > cole este arquivo > Run
-- Pode ser executado de novo: ele apaga e recria tudo (CUIDADO: apaga os dados).
-- =====================================================================

drop table if exists public.notificacoes cascade;
drop table if exists public.comentarios cascade;
drop table if exists public.curtidas cascade;
drop table if exists public.eventos cascade;
drop table if exists public.perfis cascade;
drop type if exists public.papel_usuario;
drop type if exists public.status_evento;

create type public.papel_usuario as enum ('usuario', 'admin');
create type public.status_evento as enum ('pendente', 'publicado', 'rejeitado');

-- ---------------------------------------------------------------------
-- perfis: dados públicos do usuário (a senha fica no Supabase Auth)
-- ---------------------------------------------------------------------
create table public.perfis (
  id        uuid primary key references auth.users (id) on delete cascade,
  nome      text not null,
  email     text not null unique,                              -- RN15
  papel     public.papel_usuario not null default 'usuario',   -- RN21
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- eventos
-- categoria e regiao são textos validados pela API (lista em api/_app/constantes.py)
-- ---------------------------------------------------------------------
create table public.eventos (
  id              uuid primary key default gen_random_uuid(),
  titulo          text not null check (char_length(titulo) between 5 and 120),
  descricao       text not null check (char_length(descricao) >= 20),
  categoria       text not null,
  data            date not null,
  hora_inicio     time not null,
  hora_fim        time,
  local_nome      text not null,
  endereco        text not null,
  regiao          text not null,
  status          public.status_evento not null default 'pendente',  -- RN18
  motivo_rejeicao text,
  criado_por      uuid references public.perfis (id) on delete set null,
  validado_por    uuid references public.perfis (id) on delete set null,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  constraint hora_fim_depois_do_inicio check (hora_fim is null or hora_fim > hora_inicio)  -- RN17
);

create index eventos_status_data_idx on public.eventos (status, data);
create index eventos_criado_por_idx on public.eventos (criado_por);

-- ---------------------------------------------------------------------
-- curtidas: chave composta = 1 curtida por usuário por evento (RN22)
-- ---------------------------------------------------------------------
create table public.curtidas (
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  evento_id  uuid not null references public.eventos (id) on delete cascade,
  criado_em  timestamptz not null default now(),
  primary key (usuario_id, evento_id)
);

-- ---------------------------------------------------------------------
-- comentarios
-- ---------------------------------------------------------------------
create table public.comentarios (
  id         uuid primary key default gen_random_uuid(),
  evento_id  uuid not null references public.eventos (id) on delete cascade,
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  texto      text not null check (char_length(texto) between 1 and 1000),
  criado_em  timestamptz not null default now()
);

create index comentarios_evento_idx on public.comentarios (evento_id, criado_em);

-- ---------------------------------------------------------------------
-- notificacoes
-- ---------------------------------------------------------------------
create table public.notificacoes (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  titulo     text not null,
  link       text,
  lida       boolean not null default false,
  criado_em  timestamptz not null default now()
);

create index notificacoes_usuario_idx on public.notificacoes (usuario_id, lida, criado_em desc);

-- ---------------------------------------------------------------------
-- Gatilho: cria o perfil automaticamente quando alguém se cadastra
-- ---------------------------------------------------------------------
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();

-- ---------------------------------------------------------------------
-- Gatilho: atualiza eventos.atualizado_em a cada alteração
-- ---------------------------------------------------------------------
create or replace function public.marcar_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger eventos_atualizado_em
  before update on public.eventos
  for each row execute function public.marcar_atualizado_em();

-- ---------------------------------------------------------------------
-- Segurança (RNF02, RNF06): RLS ligado e nenhuma política pública.
-- Só a API em Python (com a service role key) lê e grava os dados.
-- ---------------------------------------------------------------------
alter table public.perfis       enable row level security;
alter table public.eventos      enable row level security;
alter table public.curtidas     enable row level security;
alter table public.comentarios  enable row level security;
alter table public.notificacoes enable row level security;
