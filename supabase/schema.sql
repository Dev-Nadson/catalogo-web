-- =====================================================================
-- Catálogo com carrinho e pedido pelo WhatsApp (instalação do zero)
-- Rode no SQL Editor do Supabase, uma única vez.
--
-- Quem escreve o quê:
--   tudo → navegador, com a sessão do usuário. Não há service role nem Edge Function: o RLS
--          e os triggers abaixo valem sempre.
--
-- Aberto para `anon` (só leitura): a configuração da loja, as categorias e os produtos ativos.
-- Perfis e pedidos nunca são abertos para `anon`.
--
-- Preço, taxa, total e estoque do pedido são calculados só aqui (`pedidos_criar`). O
-- `src/lib/carrinho.ts` mostra uma prévia com a mesma regra: mudou um, muda o outro.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Perfis  (cliente | atendente | admin)
-- ---------------------------------------------------------------------
-- Todo cadastro é cliente. O admin promove alguém da equipe em Configurações → Equipe.
-- O endereço é o padrão do cliente; cada pedido guarda a própria cópia.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text check (nome is null or length(trim(nome)) between 1 and 80),
  email text,
  telefone text check (telefone is null or telefone ~ '^\d{10,11}$'),
  cep text check (cep is null or cep ~ '^\d{8}$'),
  logradouro text check (logradouro is null or length(logradouro) <= 120),
  numero text check (numero is null or length(numero) <= 20),
  complemento text check (complemento is null or length(complemento) <= 80),
  bairro text check (bairro is null or length(bairro) <= 80),
  cidade text check (cidade is null or length(cidade) <= 80),
  uf text check (uf is null or uf ~ '^[A-Z]{2}$'),
  role text not null default 'cliente'
    check (role in ('cliente', 'atendente', 'admin')),
  criado_em timestamptz not null default now()
);

create index profiles_email_idx on public.profiles (lower(email));

create or replace function public.papel_atual()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Atendente ou admin: quem vê e atende os pedidos.
create or replace function public.is_equipe()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.papel_atual() in ('atendente', 'admin'), false);
$$;

-- Só o admin mexe no catálogo, nas configurações e na equipe.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.papel_atual() = 'admin', false);
$$;

-- O metadado do cadastro é só uma dica para nome e telefone: nenhuma policy lê
-- `user_metadata`. Valor fora do formato vira null, para não derrubar o cadastro.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  telefone text := regexp_replace(coalesce(new.raw_user_meta_data->>'telefone', ''), '\D', '', 'g');
begin
  insert into public.profiles (id, nome, email, telefone)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data->>'nome'), ''), split_part(new.email, '@', 1)), 80),
    new.email,
    case when telefone ~ '^\d{10,11}$' then telefone end
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Ninguém muda o próprio papel (o admin não se tranca fora). O admin muda o papel dos outros,
-- mas não os dados pessoais deles. E-mail e data de cadastro não mudam pelo navegador.
create or replace function public.profiles_protect()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;

  new.id := old.id;
  new.email := old.email;
  new.criado_em := old.criado_em;

  if new.role is distinct from old.role then
    if old.id = auth.uid() then
      raise exception 'Você não pode mudar o próprio papel.';
    end if;
    if not public.is_admin() then
      raise exception 'Só o admin muda o papel de alguém.';
    end if;
  end if;

  if old.id <> auth.uid() then
    new.nome := old.nome;
    new.telefone := old.telefone;
    new.cep := old.cep;
    new.logradouro := old.logradouro;
    new.numero := old.numero;
    new.complemento := old.complemento;
    new.bairro := old.bairro;
    new.cidade := old.cidade;
    new.uf := old.uf;
  end if;

  return new;
end $$;

create trigger profiles_protect
  before update on public.profiles
  for each row execute function public.profiles_protect();

-- "R$ 1234,50" nas mensagens dos triggers (chegam prontas na tela).
create or replace function public.formatar_real(valor numeric)
returns text language sql immutable set search_path = public as $$
  select 'R$ ' || replace(to_char(valor, 'FM9999999990.00'), '.', ',');
$$;

-- ---------------------------------------------------------------------
-- 2) Configurações da loja (linha única, pública)
-- ---------------------------------------------------------------------
-- Tudo aqui aparece no site, então tudo é público (o RLS filtra linhas, não colunas): não
-- guarde nada sigiloso nesta tabela.
create table public.configuracoes (
  id integer primary key default 1 check (id = 1),
  nome text not null default 'Minha Loja' check (length(trim(nome)) between 2 and 60),
  slogan text check (slogan is null or length(slogan) <= 120),
  -- Bucket público `catalogo`, pasta `marca/`.
  logo_path text,
  cor text not null default '#0f766e' check (cor ~ '^#[0-9a-fA-F]{6}$'),
  -- Só dígitos, com o 55 do Brasil: é o número do link wa.me.
  whatsapp text check (whatsapp is null or whatsapp ~ '^55\d{10,11}$'),
  instagram text check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  endereco text check (endereco is null or length(endereco) <= 160),
  horario text check (horario is null or length(horario) <= 160),
  -- Fechada, o site continua aberto para olhar, mas o pedido é barrado no `pedidos_criar`.
  aberta boolean not null default true,
  aviso text check (aviso is null or length(aviso) <= 200),
  aceita_entrega boolean not null default true,
  aceita_retirada boolean not null default true,
  taxa_entrega numeric(10, 2) not null default 0 check (taxa_entrega >= 0),
  frete_gratis_acima numeric(10, 2) check (frete_gratis_acima is null or frete_gratis_acima > 0),
  pedido_minimo numeric(10, 2) not null default 0 check (pedido_minimo >= 0),
  formas_pagamento text[] not null default array['pix', 'credito', 'debito', 'dinheiro']
    check (cardinality(formas_pagamento) between 1 and 4
      and formas_pagamento <@ array['pix', 'credito', 'debito', 'dinheiro']),
  chave_pix text check (chave_pix is null or length(chave_pix) <= 100),
  atualizado_em timestamptz not null default now(),
  check (aceita_entrega or aceita_retirada)
);

insert into public.configuracoes (id) values (1);

create or replace function public.configuracoes_protect()
returns trigger language plpgsql set search_path = public as $$
begin
  new.id := old.id;
  new.atualizado_em := now();
  return new;
end $$;

create trigger configuracoes_protect
  before update on public.configuracoes
  for each row execute function public.configuracoes_protect();

-- ---------------------------------------------------------------------
-- 3) Categorias
-- ---------------------------------------------------------------------
-- Na vitrine só aparecem as categorias que têm produto ativo.
create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(trim(nome)) between 2 and 40),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 60),
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4) Produtos e variações
-- ---------------------------------------------------------------------
-- O produto é a vitrine (nome, fotos, descrição); o que se compra é a variação (preço e
-- estoque). Produto sem variação real tem uma variação só, de rótulo vazio.
create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references public.categorias(id) on delete set null,
  nome text not null check (length(trim(nome)) between 2 and 80),
  -- A URL do produto (/produto/<slug>). Não muda sozinha ao renomear: links já
  -- compartilhados continuam valendo.
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 90),
  descricao text check (descricao is null or length(descricao) <= 1000),
  -- Caminhos no bucket `catalogo` (pasta `produtos/`). A primeira é a capa.
  fotos text[] not null default '{}' check (cardinality(fotos) <= 6),
  -- O nome da escolha na tela do produto: "Tamanho", "Cor", "Sabor".
  rotulo_variacao text check (rotulo_variacao is null or length(trim(rotulo_variacao)) between 1 and 30),
  destaque boolean not null default false,
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index produtos_categoria_idx on public.produtos (categoria_id);

create table public.produto_variacoes (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id) on delete cascade,
  rotulo text not null default '' check (length(rotulo) <= 40),
  preco numeric(10, 2) not null check (preco > 0),
  -- Preço "de", riscado ao lado do preço atual.
  preco_de numeric(10, 2) check (preco_de is null or preco_de > preco),
  -- null = sem controle de estoque (feito sob encomenda, por exemplo).
  estoque integer check (estoque is null or estoque >= 0),
  ativo boolean not null default true,
  ordem integer not null default 0
);

create index produto_variacoes_produto_idx on public.produto_variacoes (produto_id);

create or replace function public.produtos_protect()
returns trigger language plpgsql set search_path = public as $$
begin
  new.id := old.id;
  new.criado_em := old.criado_em;
  new.atualizado_em := now();
  return new;
end $$;

create trigger produtos_protect
  before update on public.produtos
  for each row execute function public.produtos_protect();

-- ---------------------------------------------------------------------
-- 5) Pedidos
-- ---------------------------------------------------------------------
-- O pedido é um retrato do momento da compra: itens, preços, endereço e contato ficam
-- copiados aqui (`itens` jsonb) e não mudam mais. Só o status anda.
--
-- O cliente manda `itens` como [{ variacao_id, quantidade }]. O `pedidos_criar` ignora
-- qualquer preço vindo do navegador, confere a loja e o estoque, dá baixa e reescreve
-- `itens` com nome, preço e subtotal. O cancelamento devolve o estoque (`pedidos_protect`).
-- Ninguém apaga pedido.
create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  numero integer generated always as identity unique,
  -- Conta apagada não apaga o pedido: a loja continua com o registro.
  cliente_id uuid default auth.uid() references public.profiles(id) on delete set null,
  status text not null default 'novo'
    check (status in ('novo', 'em_atendimento', 'concluido', 'cancelado')),
  tipo_entrega text not null check (tipo_entrega in ('entrega', 'retirada')),
  cliente_nome text not null check (length(trim(cliente_nome)) between 2 and 80),
  cliente_telefone text not null check (cliente_telefone ~ '^\d{10,11}$'),
  -- { cep, logradouro, numero, complemento, bairro, cidade, uf }. null na retirada.
  endereco jsonb check (endereco is null or jsonb_typeof(endereco) = 'object'),
  forma_pagamento text not null check (forma_pagamento in ('pix', 'credito', 'debito', 'dinheiro')),
  troco_para numeric(10, 2) check (troco_para is null or troco_para > 0),
  observacoes text check (observacoes is null or length(observacoes) <= 500),
  itens jsonb not null
    check (jsonb_typeof(itens) = 'array' and jsonb_array_length(itens) between 1 and 50),
  subtotal numeric(10, 2) not null default 0,
  taxa_entrega numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index pedidos_cliente_idx on public.pedidos (cliente_id, criado_em desc);
create index pedidos_status_idx on public.pedidos (status, criado_em desc);

-- Pedidos ainda sem resposta da loja que um cliente pode ter ao mesmo tempo. Segura spam e
-- quem tentaria reservar o estoque inteiro. Igual a MAX_PEDIDOS_ABERTOS (lib/constants.ts).
create or replace function public.max_pedidos_abertos()
returns integer language sql immutable set search_path = public as $$
  select 3;
$$;

-- security definer: o cliente não tem permissão de alterar o estoque, só este trigger.
create or replace function public.pedidos_criar()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  cfg public.configuracoes%rowtype;
  item record;
  snapshot jsonb := '[]'::jsonb;
  soma numeric(10, 2) := 0;
  abertos integer;
  nome_item text;
begin
  if new.cliente_id is null then
    raise exception 'Entre na sua conta para finalizar o pedido.';
  end if;
  if auth.uid() is not null and new.cliente_id <> auth.uid() then
    raise exception 'Você só pode fazer pedidos na sua própria conta.';
  end if;

  select * into cfg from public.configuracoes where id = 1;

  if not cfg.aberta then
    raise exception 'A loja está fechada no momento.';
  end if;
  if cfg.whatsapp is null then
    raise exception 'A loja ainda não configurou o WhatsApp para receber pedidos.';
  end if;
  if new.tipo_entrega = 'entrega' and not cfg.aceita_entrega then
    raise exception 'A loja não está fazendo entregas no momento.';
  end if;
  if new.tipo_entrega = 'retirada' and not cfg.aceita_retirada then
    raise exception 'A loja não está aceitando retirada no momento.';
  end if;
  if not (new.forma_pagamento = any (cfg.formas_pagamento)) then
    raise exception 'Essa forma de pagamento não está disponível.';
  end if;

  select count(*) into abertos
    from public.pedidos where cliente_id = new.cliente_id and status = 'novo';
  if abertos >= public.max_pedidos_abertos() then
    raise exception 'Você já tem % pedidos aguardando a loja. Espere a resposta antes de fazer outro.',
      public.max_pedidos_abertos();
  end if;

  if new.itens is null or jsonb_typeof(new.itens) <> 'array' or jsonb_array_length(new.itens) = 0 then
    raise exception 'Seu carrinho está vazio.';
  end if;

  -- Trava as variações em ordem de id (evita deadlock entre dois pedidos simultâneos). As
  -- leituras abaixo já enxergam o estoque de quem terminou antes.
  perform 1 from public.produto_variacoes
    where id in (select (x->>'variacao_id')::uuid from jsonb_array_elements(new.itens) x)
    order by id for update;

  -- A mesma variação em duas linhas do carrinho vira uma só, na ordem em que apareceu.
  for item in
    select e.variacao_id, e.quantidade, v.id as encontrada, v.rotulo, v.preco, v.estoque,
           v.ativo as variacao_ativa, p.id as produto_id, p.nome as produto_nome, p.ativo as produto_ativo
      from (
        select (x->>'variacao_id')::uuid as variacao_id,
               sum((x->>'quantidade')::integer) as quantidade,
               min(ord) as ord
          from jsonb_array_elements(new.itens) with ordinality as t(x, ord)
         group by 1
      ) e
      left join public.produto_variacoes v on v.id = e.variacao_id
      left join public.produtos p on p.id = v.produto_id
     order by e.ord
  loop
    if item.encontrada is null or not item.variacao_ativa or not item.produto_ativo then
      raise exception 'Um item do carrinho não está mais disponível%. Remova-o para continuar.',
        coalesce(' (' || item.produto_nome || ')', '');
    end if;

    nome_item := item.produto_nome || case when item.rotulo <> '' then ' (' || item.rotulo || ')' else '' end;

    if item.quantidade is null or item.quantidade < 1 or item.quantidade > 99 then
      raise exception 'Quantidade inválida para %.', nome_item;
    end if;

    if item.estoque is not null and item.quantidade > item.estoque then
      if item.estoque = 0 then
        raise exception '% esgotou.', nome_item;
      end if;
      raise exception 'Só restam % unidade(s) de %.', item.estoque, nome_item;
    end if;

    if item.estoque is not null then
      update public.produto_variacoes set estoque = estoque - item.quantidade where id = item.variacao_id;
    end if;

    snapshot := snapshot || jsonb_build_object(
      'variacao_id', item.variacao_id,
      'produto_id', item.produto_id,
      'produto_nome', item.produto_nome,
      'variacao_rotulo', item.rotulo,
      'preco', item.preco,
      'quantidade', item.quantidade,
      'subtotal', item.preco * item.quantidade,
      -- Só devolve no cancelamento o que de fato saiu do estoque.
      'reservado', item.estoque is not null
    );
    soma := soma + item.preco * item.quantidade;
  end loop;

  if jsonb_array_length(snapshot) > 50 then
    raise exception 'O pedido pode ter no máximo 50 itens diferentes.';
  end if;

  if soma < cfg.pedido_minimo then
    raise exception 'O pedido mínimo é de %.', public.formatar_real(cfg.pedido_minimo);
  end if;

  new.cliente_nome := trim(new.cliente_nome);
  new.cliente_telefone := regexp_replace(coalesce(new.cliente_telefone, ''), '\D', '', 'g');

  if new.tipo_entrega = 'entrega' then
    new.endereco := jsonb_strip_nulls(jsonb_build_object(
      'cep', nullif(regexp_replace(coalesce(new.endereco->>'cep', ''), '\D', '', 'g'), ''),
      'logradouro', nullif(trim(new.endereco->>'logradouro'), ''),
      'numero', nullif(trim(new.endereco->>'numero'), ''),
      'complemento', nullif(trim(new.endereco->>'complemento'), ''),
      'bairro', nullif(trim(new.endereco->>'bairro'), ''),
      'cidade', nullif(trim(new.endereco->>'cidade'), ''),
      'uf', nullif(upper(trim(new.endereco->>'uf')), '')
    ));
    if new.endereco->>'logradouro' is null or new.endereco->>'numero' is null
       or new.endereco->>'bairro' is null or new.endereco->>'cidade' is null then
      raise exception 'Informe o endereço completo: rua, número, bairro e cidade.';
    end if;
    if exists (select 1 from jsonb_each_text(new.endereco) where length(value) > 120)
       or (new.endereco ? 'cep' and new.endereco->>'cep' !~ '^\d{8}$')
       or (new.endereco ? 'uf' and new.endereco->>'uf' !~ '^[A-Z]{2}$') then
      raise exception 'Confira o endereço de entrega.';
    end if;
    new.taxa_entrega := case
      when cfg.frete_gratis_acima is not null and soma >= cfg.frete_gratis_acima then 0
      else cfg.taxa_entrega
    end;
  else
    new.endereco := null;
    new.taxa_entrega := 0;
  end if;

  new.itens := snapshot;
  new.subtotal := soma;
  new.total := soma + new.taxa_entrega;

  if new.forma_pagamento = 'dinheiro' then
    if new.troco_para is not null and new.troco_para < new.total then
      raise exception 'O troco precisa ser para um valor igual ou maior que o total (%).',
        public.formatar_real(new.total);
    end if;
  else
    new.troco_para := null;
  end if;

  new.status := 'novo';
  new.criado_em := now();
  new.atualizado_em := now();

  return new;
end $$;

create trigger pedidos_criar
  before insert on public.pedidos
  for each row execute function public.pedidos_criar();

-- Do pedido feito só o status muda. A equipe move entre os status em aberto e encerra
-- (concluído ou cancelado, que são finais). O cliente só cancela o próprio pedido enquanto a
-- loja não começou a atender. Cancelar devolve o estoque reservado.
create or replace function public.pedidos_protect()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  novo_status text := new.status;
begin
  new := old;
  new.status := novo_status;

  if new.status = old.status then return new; end if;

  if old.status in ('concluido', 'cancelado') then
    raise exception 'Este pedido já foi %.',
      case old.status when 'concluido' then 'concluído' else 'cancelado' end;
  end if;

  if auth.uid() is not null and not public.is_equipe() then
    if old.cliente_id is distinct from auth.uid() or new.status <> 'cancelado' then
      raise exception 'Você não pode alterar este pedido.';
    end if;
    if old.status <> 'novo' then
      raise exception 'A loja já está atendendo este pedido. Para cancelar, fale com ela pelo WhatsApp.';
    end if;
  end if;

  if new.status = 'cancelado' then
    update public.produto_variacoes v
       set estoque = v.estoque + i.quantidade
      from (
        select (x->>'variacao_id')::uuid as variacao_id, (x->>'quantidade')::integer as quantidade
          from jsonb_array_elements(old.itens) x
         where coalesce((x->>'reservado')::boolean, false)
      ) i
     where v.id = i.variacao_id and v.estoque is not null;
  end if;

  new.atualizado_em := now();

  return new;
end $$;

create trigger pedidos_protect
  before update on public.pedidos
  for each row execute function public.pedidos_protect();

-- ---------------------------------------------------------------------
-- 6) RLS
-- ---------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.configuracoes     enable row level security;
alter table public.categorias        enable row level security;
alter table public.produtos          enable row level security;
alter table public.produto_variacoes enable row level security;
alter table public.pedidos           enable row level security;

-- Os helpers vão dentro de `(select ...)` para o Postgres avaliar uma vez por consulta, e
-- não uma vez por linha.

-- profiles: cada um vê e edita o seu; o admin vê todos (para montar a equipe) e muda papéis.
-- O que cada um pode alterar está no profiles_protect.
create policy "perfis: o proprio ou o admin ve" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
create policy "perfis: o proprio ou o admin altera" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

-- configuracoes: o site inteiro lê; só o admin altera. A linha vem deste arquivo.
create policy "configuracoes: todos veem" on public.configuracoes
  for select to anon, authenticated using (true);
create policy "configuracoes: admin altera" on public.configuracoes
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- categorias: todos veem; só o admin cadastra.
create policy "categorias: todos veem" on public.categorias
  for select to anon, authenticated using (true);
create policy "categorias: admin cadastra" on public.categorias
  for insert to authenticated with check ((select public.is_admin()));
create policy "categorias: admin edita" on public.categorias
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "categorias: admin apaga" on public.categorias
  for delete to authenticated using ((select public.is_admin()));

-- produtos e variações: o público vê só o que está ativo; o admin vê e mexe em tudo.
create policy "produtos: todos veem os ativos, o admin todos" on public.produtos
  for select to anon, authenticated using (ativo or (select public.is_admin()));
create policy "produtos: admin cadastra" on public.produtos
  for insert to authenticated with check ((select public.is_admin()));
create policy "produtos: admin edita" on public.produtos
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "produtos: admin apaga" on public.produtos
  for delete to authenticated using ((select public.is_admin()));

create policy "variacoes: todos veem as ativas, o admin todas" on public.produto_variacoes
  for select to anon, authenticated
  using (
    (ativo and exists (select 1 from public.produtos p where p.id = produto_id and p.ativo))
    or (select public.is_admin())
  );
create policy "variacoes: admin cadastra" on public.produto_variacoes
  for insert to authenticated with check ((select public.is_admin()));
create policy "variacoes: admin edita" on public.produto_variacoes
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "variacoes: admin apaga" on public.produto_variacoes
  for delete to authenticated using ((select public.is_admin()));

-- pedidos: o cliente vê e faz os seus; a equipe vê todos e muda o status. Sem delete. As
-- regras finas (o que muda, quem cancela) ficam no pedidos_criar e no pedidos_protect.
create policy "pedidos: o cliente ve os seus, a equipe todos" on public.pedidos
  for select to authenticated
  using (cliente_id = (select auth.uid()) or (select public.is_equipe()));
create policy "pedidos: o cliente faz o seu" on public.pedidos
  for insert to authenticated with check (cliente_id = (select auth.uid()));
create policy "pedidos: o cliente cancela o seu, a equipe atende" on public.pedidos
  for update to authenticated
  using (cliente_id = (select auth.uid()) or (select public.is_equipe()))
  with check (cliente_id = (select auth.uid()) or (select public.is_equipe()));

-- ---------------------------------------------------------------------
-- 7) Realtime (o painel recebe o pedido novo na hora; o cliente vê o status mudar)
-- ---------------------------------------------------------------------
-- O Realtime respeita o RLS acima: cada um só recebe os pedidos que pode ver.
alter publication supabase_realtime add table public.pedidos;

-- ---------------------------------------------------------------------
-- 8) Storage (bucket público: fotos dos produtos e logo)
-- ---------------------------------------------------------------------
-- Público porque o conteúdo é público e vai em link compartilhado no WhatsApp. Cada envio
-- ganha nome novo (`produtos/<uuid>.webp`), por causa do cache da CDN. O link público não
-- passa pelas policies; elas valem para enviar e apagar (o remove precisa do select).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('catalogo', 'catalogo', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "catalogo: admin ve" on storage.objects
  for select to authenticated
  using (bucket_id = 'catalogo' and (select public.is_admin()));
create policy "catalogo: admin envia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'catalogo' and (select public.is_admin()));
create policy "catalogo: admin apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'catalogo' and (select public.is_admin()));

-- ---------------------------------------------------------------------
-- 9) Primeiro admin (depois de se cadastrar em /cadastrar e confirmar o e-mail)
-- ---------------------------------------------------------------------
-- update public.profiles set role = 'admin'
--  where id = (select id from auth.users where email = 'SEU-EMAIL@exemplo.com');
