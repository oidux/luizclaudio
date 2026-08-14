-- ============================================================
-- Schema proposto — Luiz Claudio Barbearia (Supabase / Postgres)
-- Rode no SQL Editor do Supabase. É um ponto de partida; ajuste à vontade.
--
-- Modelo de segurança (IMPORTANTE):
--  - O site (front-end no GitHub Pages) usa a CHAVE ANON (pública). Ela é
--    protegida por RLS (Row Level Security) — por isso as policies abaixo.
--  - A service_role key e a senha do banco NUNCA vão para o front-end/GitHub.
--    Use-as só no painel do Supabase ou em funções server-side (Edge Functions).
-- ============================================================

-- ---------- Catálogo (leitura pública) ----------
create table if not exists servicos (
  id           text primary key,
  nome         text not null,
  duracao      int  not null,        -- minutos
  preco        numeric(10,2) not null,
  a_partir_de  boolean not null default false,
  ativo        boolean not null default true,
  ordem        int not null default 0
);

create table if not exists profissionais (
  id            text primary key,
  nome          text not null,
  especialidade text,
  ativo         boolean not null default true
);

create table if not exists planos (
  id          text primary key,
  nome        text not null,
  preco       numeric(10,2) not null,
  beneficios  jsonb not null default '[]',
  destaque    boolean not null default false,
  ativo       boolean not null default true
);

-- ---------- Movimentação ----------
create table if not exists agendamentos (
  id             uuid primary key default gen_random_uuid(),
  criado_em      timestamptz not null default now(),
  cliente_nome   text not null,
  cliente_tel    text not null,
  data           date not null,
  horario        time not null,
  profissional_id text references profissionais(id),
  servicos       jsonb not null,     -- [{id,nome,preco,duracao}, ...]
  total          numeric(10,2) not null,
  duracao        int not null,
  sinal          numeric(10,2) not null default 0,
  sinal_pago     boolean not null default false,
  obs            text,
  status         text not null default 'pendente'  -- pendente | confirmado | cancelado | concluido
);
create index if not exists idx_agend_data on agendamentos (data, horario);

-- Fidelidade / assinatura (evolução futura; requer identificar o cliente)
create table if not exists clientes (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  telefone   text unique not null,
  selos      int not null default 0,
  resgatados int not null default 0,
  criado_em  timestamptz not null default now()
);

create table if not exists assinaturas (
  id         uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id),
  plano_id   text references planos(id),
  preco      numeric(10,2) not null,
  status     text not null default 'ativa',       -- ativa | cancelada
  iniciada_em timestamptz not null default now()
);

-- ============================================================
-- RLS — Row Level Security
-- ============================================================
alter table servicos       enable row level security;
alter table profissionais  enable row level security;
alter table planos         enable row level security;
alter table agendamentos   enable row level security;
alter table clientes       enable row level security;
alter table assinaturas    enable row level security;

-- Catálogo: qualquer visitante (anon) pode LER
create policy "catalogo_leitura_publica" on servicos      for select using (true);
create policy "prof_leitura_publica"     on profissionais for select using (true);
create policy "planos_leitura_publica"   on planos        for select using (true);

-- Agendamentos: o visitante pode CRIAR (agendar), mas NÃO listar os dos outros.
-- A visualização/gerência fica com o admin (service_role, painel do Supabase)
-- ou via uma Edge Function que filtre por telefone confirmado.
create policy "agendar_publico" on agendamentos for insert with check (true);
-- (sem policy de SELECT para anon → ninguém lê a agenda alheia pelo site)

-- clientes/assinaturas: sem acesso público direto (só via função server-side).
-- Deixe sem policies de select/insert para anon até definir o fluxo com login.

-- ============================================================
-- Seed do catálogo (bate com assets/js/config.js)
-- ============================================================
insert into servicos (id, nome, duracao, preco, a_partir_de, ordem) values
  ('social',            'Cabelo social',                    30, 30, false, 1),
  ('social-maquina',    'Cabelo social simples (máquina)',  20, 25, false, 2),
  ('degrade',           'Cabelo degradê',                   40, 35, false, 3),
  ('degrade-navalhado', 'Cabelo degradê navalhado',         45, 40, false, 4),
  ('pesinho',           'Pesinho',                          10, 15, false, 5),
  ('sobrancelha',       'Sobrancelha',                      15, 15, false, 6),
  ('barba',             'Barba',                            30, 25, false, 7),
  ('barba-pigmentacao', 'Barba e pigmentação',              45, 45, false, 8),
  ('infantil',          'Corte infantil',                   30, 35, false, 9),
  ('limpeza-simples',   'Limpeza de pele simples',          20, 25, false, 10),
  ('limpeza-completa',  'Limpeza de pele completa',         30, 35, false, 11),
  ('progressiva',       'Progressiva',                      90, 70, true,  12)
on conflict (id) do nothing;

insert into profissionais (id, nome, especialidade) values
  ('luiz',     'Luiz Cláudio',    'Cortes, barba e navalha'),
  ('qualquer', 'Sem preferência', 'Primeiro disponível')
on conflict (id) do nothing;

insert into planos (id, nome, preco, beneficios, destaque) values
  ('basico',    'Clube Básico',    89,  '["2 cortes por mês","10% de desconto em produtos"]', false),
  ('ilimitado', 'Clube Ilimitado', 149, '["Cortes ilimitados","1 barba por semana","10% em produtos"]', true),
  ('premium',   'Clube Premium',   219, '["Tudo do Ilimitado","Barba e sobrancelha inclusas","Atendimento prioritário"]', false)
on conflict (id) do nothing;
