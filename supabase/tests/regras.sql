-- Roteiro de teste das regras do banco (RLS e triggers), num Postgres local.
-- Veja "Testar o banco" no README. Para no primeiro resultado inesperado ("FALHOU").
-- Termina com "TUDO OK".

\set ON_ERROR_STOP 1

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@x.com', '{"nome":"Dona","telefone":"(81) 99999-0000"}'),
  ('00000000-0000-0000-0000-00000000000b', 'atend@x.com', '{"nome":"Bia"}'),
  ('00000000-0000-0000-0000-00000000000c', 'cli1@x.com', '{"nome":"Carla","telefone":"81988887777"}'),
  ('00000000-0000-0000-0000-00000000000d', 'cli2@x.com', '{"nome":"Davi","telefone":"123"}');
update public.profiles set role = 'admin' where email = 'admin@x.com';
update public.profiles set role = 'atendente' where email = 'atend@x.com';

create or replace function pg_temp.espera_erro(sql text, trecho text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'FALHOU: esperava erro com "%"', trecho;
exception when others then
  if sqlerrm like 'FALHOU%' then raise; end if;
  if position(trecho in sqlerrm) = 0 then
    raise exception 'FALHOU: erro inesperado "%" (esperava "%")', sqlerrm, trecho;
  end if;
  raise notice 'ok: % → %', left(sql, 60), sqlerrm;
end $$;

create or replace function pg_temp.confere(condicao boolean, descricao text) returns void language plpgsql as $$
begin
  if not coalesce(condicao, false) then raise exception 'FALHOU: %', descricao; end if;
  raise notice 'ok: %', descricao;
end $$;

-- cadastro: telefone formatado vira dígitos; telefone inválido vira null (não derruba o cadastro)
select pg_temp.confere(
  (select telefone from public.profiles where email = 'admin@x.com') = '81999990000'
  and (select telefone from public.profiles where email = 'cli2@x.com') is null
  and (select role from public.profiles where email = 'cli1@x.com') = 'cliente',
  'handle_new_user: papel cliente e telefone normalizado');

set role authenticated;

-- ---------------------------------------------------------------- admin monta a loja
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select pg_temp.espera_erro($$update public.profiles set role = 'cliente' where email = 'admin@x.com'$$, 'próprio papel');
update public.configuracoes set whatsapp = '5581999990000', taxa_entrega = 10, frete_gratis_acima = 200,
  pedido_minimo = 40, formas_pagamento = array['pix', 'dinheiro'] where id = 1;
insert into public.categorias (id, nome, slug) values ('10000000-0000-0000-0000-000000000001', 'Camisetas', 'camisetas');
insert into public.produtos (id, categoria_id, nome, slug, rotulo_variacao) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Camiseta Básica', 'camiseta-basica', 'Tamanho'),
  ('20000000-0000-0000-0000-000000000002', null, 'Caneca', 'caneca', null),
  ('20000000-0000-0000-0000-000000000003', null, 'Oculto', 'oculto', null);
update public.produtos set ativo = false where id = '20000000-0000-0000-0000-000000000003';
insert into public.produto_variacoes (id, produto_id, rotulo, preco, estoque, ativo) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'P', 50, 5, true),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'M', 60, null, true),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'G', 70, 10, false),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', '', 35, 2, true),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', '', 10, null, true);
select pg_temp.espera_erro($$insert into public.produto_variacoes (produto_id, preco, preco_de) values ('20000000-0000-0000-0000-000000000002', 10, 5)$$, 'produto_variacoes_check');
select pg_temp.espera_erro($$update public.configuracoes set whatsapp = '81999990000' where id = 1$$, 'configuracoes_whatsapp_check');

-- ---------------------------------------------------------------- público
reset role;
set role anon;
set request.jwt.claim.sub = '';
select pg_temp.confere((select count(*) from public.produtos) = 2, 'anon vê só os 2 produtos ativos');
select pg_temp.confere((select count(*) from public.produto_variacoes) = 3, 'anon vê só as 3 variações ativas de produto ativo');
select pg_temp.confere((select count(*) from public.configuracoes) = 1, 'anon lê a configuração');
select pg_temp.confere((select count(*) from public.pedidos) = 0 and (select count(*) from public.profiles) = 0, 'anon não lê pedidos nem perfis');
select pg_temp.espera_erro($$insert into public.pedidos (tipo_entrega, cliente_nome, cliente_telefone, forma_pagamento, itens) values ('retirada', 'X', '81988887777', 'pix', '[]')$$, 'Entre na sua conta');
reset role;
set role authenticated;

-- ---------------------------------------------------------------- atendente não mexe no catálogo
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.espera_erro($$insert into public.produtos (nome, slug) values ('X', 'x')$$, 'row-level security');
update public.produto_variacoes set preco = 1 where id = '30000000-0000-0000-0000-000000000001';
select pg_temp.confere((select preco from public.produto_variacoes where id = '30000000-0000-0000-0000-000000000001') = 50, 'atendente não altera preço (0 linhas)');
select pg_temp.confere((select count(*) from public.profiles) = 1, 'atendente só vê o próprio perfil');

-- ---------------------------------------------------------------- cliente 1 compra
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.espera_erro($$update public.profiles set role = 'admin' where email = 'cli1@x.com'$$, 'próprio papel');
update public.profiles set cep = '50000000', logradouro = 'Rua A', numero = '10', bairro = 'Centro', cidade = 'Recife', uf = 'PE' where email = 'cli1@x.com';

-- preço vindo do navegador é ignorado; variação repetida vira uma linha só; estoque baixa
insert into public.pedidos (id, tipo_entrega, cliente_nome, cliente_telefone, endereco, forma_pagamento, itens)
values ('40000000-0000-0000-0000-000000000001', 'entrega', ' Carla ', '(81) 98888-7777',
  '{"logradouro":"Rua A","numero":"10","bairro":"Centro","cidade":"Recife","uf":"pe","cep":"50000-000","lixo":"x"}',
  'pix',
  '[{"variacao_id":"30000000-0000-0000-0000-000000000001","quantidade":1,"preco":0.01},
    {"variacao_id":"30000000-0000-0000-0000-000000000004","quantidade":1},
    {"variacao_id":"30000000-0000-0000-0000-000000000001","quantidade":1}]');
select pg_temp.confere(
  (select subtotal = 135 and taxa_entrega = 10 and total = 145 and status = 'novo'
      and jsonb_array_length(itens) = 2 and (itens->0->>'quantidade')::int = 2
      and (itens->0->>'preco')::numeric = 50 and itens->0->>'variacao_rotulo' = 'P'
      and cliente_nome = 'Carla' and cliente_telefone = '81988887777'
      and endereco->>'uf' = 'PE' and endereco->>'cep' = '50000000' and not endereco ? 'lixo'
      and cliente_id = '00000000-0000-0000-0000-00000000000c'
     from public.pedidos where id = '40000000-0000-0000-0000-000000000001'),
  'pedido calculado no servidor (subtotal 135 + taxa 10)');
select pg_temp.confere(
  (select estoque from public.produto_variacoes where id = '30000000-0000-0000-0000-000000000001') = 3
  and (select estoque from public.produto_variacoes where id = '30000000-0000-0000-0000-000000000004') = 1,
  'estoque reservado (P: 5→3, caneca: 2→1)');

-- frete grátis a partir de 200; variação sem controle de estoque não baixa
insert into public.pedidos (id, tipo_entrega, cliente_nome, cliente_telefone, endereco, forma_pagamento, troco_para, itens)
values ('40000000-0000-0000-0000-000000000002', 'entrega', 'Carla', '81988887777',
  '{"logradouro":"Rua A","numero":"10","bairro":"Centro","cidade":"Recife"}', 'dinheiro', 250,
  '[{"variacao_id":"30000000-0000-0000-0000-000000000002","quantidade":4}]');
select pg_temp.confere(
  (select subtotal = 240 and taxa_entrega = 0 and total = 240 and troco_para = 250 and (itens->0->>'reservado')::boolean = false
     from public.pedidos where id = '40000000-0000-0000-0000-000000000002'),
  'frete grátis acima de 200 e troco aceito');
select pg_temp.confere((select estoque from public.produto_variacoes where id = '30000000-0000-0000-0000-000000000002') is null, 'sem controle de estoque continua null');

-- retirada: sem taxa e sem endereço; troco some fora do dinheiro
insert into public.pedidos (id, tipo_entrega, cliente_nome, cliente_telefone, endereco, forma_pagamento, troco_para, itens)
values ('40000000-0000-0000-0000-000000000003', 'retirada', 'Carla', '81988887777', '{"logradouro":"Rua A"}', 'pix', 100,
  '[{"variacao_id":"30000000-0000-0000-0000-000000000002","quantidade":1}]');
select pg_temp.confere(
  (select taxa_entrega = 0 and total = 60 and endereco is null and troco_para is null
     from public.pedidos where id = '40000000-0000-0000-0000-000000000003'),
  'retirada sem taxa nem endereço');

-- limite de pedidos aguardando a loja
select pg_temp.espera_erro($$insert into public.pedidos (tipo_entrega, cliente_nome, cliente_telefone, forma_pagamento, itens) values ('retirada', 'Carla', '81988887777', 'pix', '[{"variacao_id":"30000000-0000-0000-0000-000000000002","quantidade":1}]')$$, 'aguardando a loja');

-- cliente não muda nada além de cancelar o próprio pedido novo
update public.pedidos set total = 1, itens = '[]', cliente_nome = 'X' where id = '40000000-0000-0000-0000-000000000001';
select pg_temp.confere((select total = 145 and cliente_nome = 'Carla' from public.pedidos where id = '40000000-0000-0000-0000-000000000001'), 'cliente não altera o retrato do pedido');
select pg_temp.espera_erro($$update public.pedidos set status = 'concluido' where id = '40000000-0000-0000-0000-000000000001'$$, 'não pode alterar');
update public.pedidos set status = 'cancelado' where id = '40000000-0000-0000-0000-000000000001';
select pg_temp.confere(
  (select estoque from public.produto_variacoes where id = '30000000-0000-0000-0000-000000000001') = 5
  and (select estoque from public.produto_variacoes where id = '30000000-0000-0000-0000-000000000004') = 2,
  'cancelar devolve o estoque');
select pg_temp.espera_erro($$update public.pedidos set status = 'novo' where id = '40000000-0000-0000-0000-000000000001'$$, 'já foi cancelado');
delete from public.pedidos where id = '40000000-0000-0000-0000-000000000002';
select pg_temp.confere((select count(*) from public.pedidos where cliente_id = '00000000-0000-0000-0000-00000000000c') = 3, 'ninguém apaga pedido');

-- erros de validação, todos com a mensagem da tela
select pg_temp.espera_erro($$insert into public.pedidos (tipo_entrega, cliente_nome, cliente_telefone, forma_pagamento, itens) values ('retirada', 'Carla', '81988887777', 'pix', '[{"variacao_id":"30000000-0000-0000-0000-000000000001","quantidade":6}]')$$, 'Só restam 5 unidade(s) de Camiseta Básica (P)');
select pg_temp.espera_erro($$insert into public.pedidos (tipo_entrega, cliente_nome, cliente_telefone, forma_pagamento, itens) values ('retirada', 'Carla', '81988887777', 'pix', '[{"variacao_id":"30000000-0000-0000-0000-000000000003","quantidade":1}]')$$, 'não está mais disponível');
select pg_temp.espera_erro($$insert into public.pedidos (tipo_entrega, cliente_nome, cliente_telefone, forma_pagamento, itens) values ('retirada', 'Carla', '81988887777', 'pix', '[{"variacao_id":"30000000-0000-0000-0000-000000000005","quantidade":5}]')$$, 'não está mais disponível');
select pg_temp.espera_erro($$insert into public.pedidos (tipo_entrega, cliente_nome, cliente_telefone, forma_pagamento, itens) values ('retirada', 'Carla', '81988887777', 'pix', '[{"variacao_id":"30000000-0000-0000-0000-000000000004","quantidade":0}]')$$, 'Quantidade inválida');
select pg_temp.espera_erro($$insert into public.pedidos (tipo_entrega, cliente_nome, cliente_telefone, forma_pagamento, itens) values ('retirada', 'Carla', '81988887777', 'pix', '[{"variacao_id":"30000000-0000-0000-0000-000000000004","quantidade":0.5}]')$$, 'integer');
select pg_temp.espera_erro($$insert into public.pedidos (tipo_entrega, cliente_nome, cliente_telefone, forma_pagamento, itens) values ('retirada', 'Carla', '81988887777', 'pix', '[]')$$, 'carrinho está vazio');
select pg_temp.espera_erro($$insert into public.pedidos (tipo_entrega, cliente_nome, cliente_telefone, forma_pagamento, itens) values ('retirada', 'Carla', '81988887777', 'pix', '[{"variacao_id":"30000000-0000-0000-0000-000000000002","quantidade":0}, {"variacao_id":"30000000-0000-0000-0000-000000000004","quantidade":-1}]')$$, 'Quantidade inválida');
select pg_temp.espera_erro($$insert into public.pedidos (tipo_entrega, cliente_nome, cliente_telefone, forma_pagamento, itens) values ('retirada', 'Carla', '81988887777', 'credito', '[{"variacao_id":"30000000-0000-0000-0000-000000000002","quantidade":1}]')$$, 'forma de pagamento');
select pg_temp.espera_erro($$insert into public.pedidos (tipo_entrega, cliente_nome, cliente_telefone, forma_pagamento, itens) values ('retirada', 'Carla', '81988887777', 'pix', '[{"variacao_id":"30000000-0000-0000-0000-000000000004","quantidade":1}]')$$, 'pedido mínimo é de R$ 40,00');
select pg_temp.espera_erro($$insert into public.pedidos (tipo_entrega, cliente_nome, cliente_telefone, forma_pagamento, itens) values ('entrega', 'Carla', '81988887777', 'pix', '[{"variacao_id":"30000000-0000-0000-0000-000000000002","quantidade":1}]')$$, 'endereço completo');
select pg_temp.espera_erro($$insert into public.pedidos (tipo_entrega, cliente_nome, cliente_telefone, endereco, forma_pagamento, troco_para, itens) values ('entrega', 'Carla', '81988887777', '{"logradouro":"R","numero":"1","bairro":"B","cidade":"C"}', 'dinheiro', 20, '[{"variacao_id":"30000000-0000-0000-0000-000000000002","quantidade":1}]')$$, 'troco precisa');
select pg_temp.espera_erro($$insert into public.pedidos (tipo_entrega, cliente_nome, cliente_telefone, endereco, forma_pagamento, itens) values ('entrega', 'Carla', '81988887777', '{"logradouro":"R","numero":"1","bairro":"B","cidade":"C","cep":"123"}', 'pix', '[{"variacao_id":"30000000-0000-0000-0000-000000000002","quantidade":1}]')$$, 'Confira o endereço');
select pg_temp.espera_erro($$insert into public.pedidos (cliente_id, tipo_entrega, cliente_nome, cliente_telefone, forma_pagamento, itens) values ('00000000-0000-0000-0000-00000000000d', 'retirada', 'Carla', '81988887777', 'pix', '[{"variacao_id":"30000000-0000-0000-0000-000000000002","quantidade":1}]')$$, 'própria conta');

-- ---------------------------------------------------------------- cliente 2 não vê nem mexe no pedido do 1
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
select pg_temp.confere((select count(*) from public.pedidos) = 0, 'cliente 2 não vê pedidos do cliente 1');
update public.pedidos set status = 'cancelado' where id = '40000000-0000-0000-0000-000000000002';
select pg_temp.confere((select count(*) from public.profiles) = 1, 'cliente 2 só vê o próprio perfil');

-- ---------------------------------------------------------------- equipe atende
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.confere((select count(*) from public.pedidos) = 3, 'atendente vê todos os pedidos');
update public.pedidos set status = 'em_atendimento' where id = '40000000-0000-0000-0000-000000000002';
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.espera_erro($$update public.pedidos set status = 'cancelado' where id = '40000000-0000-0000-0000-000000000002'$$, 'já está atendendo');
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
update public.pedidos set status = 'concluido' where id = '40000000-0000-0000-0000-000000000002';
select pg_temp.espera_erro($$update public.pedidos set status = 'cancelado' where id = '40000000-0000-0000-0000-000000000002'$$, 'já foi concluído');
select pg_temp.confere((select status from public.pedidos where id = '40000000-0000-0000-0000-000000000002') = 'concluido', 'concluído é final');

-- ---------------------------------------------------------------- loja fechada e admin monta a equipe
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
update public.configuracoes set aberta = false where id = 1;
update public.profiles set role = 'atendente', nome = 'Hacker' where email = 'cli2@x.com';
select pg_temp.confere((select role = 'atendente' and nome = 'Davi' from public.profiles where email = 'cli2@x.com'), 'admin muda o papel, mas não o nome dos outros');
update public.profiles set role = 'cliente' where email = 'cli2@x.com';
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.espera_erro($$insert into public.pedidos (tipo_entrega, cliente_nome, cliente_telefone, forma_pagamento, itens) values ('retirada', 'Carla', '81988887777', 'pix', '[{"variacao_id":"30000000-0000-0000-0000-000000000002","quantidade":1}]')$$, 'fechada');

-- ---------------------------------------------------------------- apagar produto não mexe no pedido
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
delete from public.produtos where id = '20000000-0000-0000-0000-000000000002';
select pg_temp.confere((select count(*) from public.produto_variacoes where produto_id = '20000000-0000-0000-0000-000000000002') = 0, 'variações saem junto com o produto');
select pg_temp.confere((select itens->1->>'produto_nome' from public.pedidos where id = '40000000-0000-0000-0000-000000000001') = 'Caneca', 'o pedido guarda o nome do produto apagado');

reset role;
select 'TUDO OK' as resultado;
