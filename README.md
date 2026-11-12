# Catálogo: vitrine com carrinho e pedido pelo WhatsApp

Catálogo on-line de uma loja. O cliente monta o carrinho, finaliza e o pedido chega pronto no WhatsApp da loja. O pedido também fica registrado: tem número, o cliente acompanha o status e a equipe atende pelo painel.

O app é **genérico**: nome, logo, cor, WhatsApp, horário, regras de entrega e formas de pagamento são configurados no painel. Não há nada de uma loja específica no código.

## Como funciona

**Cliente:**

1. Vê a vitrine, busca, filtra por categoria e escolhe a opção (tamanho, cor...).
2. Monta o carrinho. Para isso não precisa de conta, e o carrinho fica salvo no navegador.
3. Ao finalizar, entra ou cria a conta (e-mail e senha) e escolhe entrega ou retirada. O endereço é preenchido pelo CEP. Depois escolhe o pagamento (Pix, crédito, débito ou dinheiro com troco).
4. Toca em **Enviar pedido pelo WhatsApp**. O pedido é gravado e o WhatsApp abre com a mensagem pronta para a loja.
5. Acompanha o pedido em **Meus pedidos**: vê o status ao vivo, copia a chave Pix, reenvia a mensagem, cancela enquanto a loja não começou a atender e pode pedir de novo.

**Loja:**

- Recebe o pedido no WhatsApp e, ao mesmo tempo, no painel, com aviso na hora.
- Muda o status: novo → em atendimento → concluído, ou cancelado.
- Mantém o catálogo, as categorias, as configurações e a equipe.

**Quem garante as regras é o banco.**

- O navegador manda só *qual variação e quantas*.
- O trigger `pedidos_criar` faz o resto:
  - lê os preços atuais;
  - confere se a loja está aberta, o estoque, o pedido mínimo e as formas aceitas;
  - calcula taxa e total;
  - dá baixa no estoque;
  - grava o pedido como um retrato que não muda mais.
- Cancelar devolve o estoque (`pedidos_protect`).
- A mensagem do WhatsApp sai do pedido gravado, não do carrinho.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript.
- Tailwind v4 e shadcn (base-rhea, sobre Base UI).
- TanStack Query, zustand (o carrinho, com `persist`), react-hook-form + zod.
- Supabase: Auth, Postgres com RLS, Realtime e Storage público para as fotos.
- Sem Edge Function e sem service role.

O padrão de código é o do workspace (`../CLAUDE.md`). O que muda por causa do Next está em `../docs/catalogo-web.md`.

## Setup

### 1. Supabase

1. Crie um projeto no Supabase.
2. No **SQL Editor**, rode `supabase/schema.sql` inteiro. Ele cria tabelas, triggers e policies, liga o Realtime em `pedidos` e cria o bucket público `catalogo`.
3. Em **Authentication → URL Configuration**:
   - em *Site URL*, coloque o endereço da loja;
   - em *Redirect URLs*, adicione `https://SEU-DOMINIO/entrar` e `https://SEU-DOMINIO/redefinir-senha`, e os mesmos com `http://localhost:3000`.
4. **Confirm email**: decida pela loja.
   - Ligado, é mais seguro: o e-mail é verificado. O cliente precisa abrir o link **no mesmo aparelho** para voltar ao checkout com o carrinho.
   - Desligado, o cliente cria a conta e finaliza na hora. A loja deixa de ter garantia de que o e-mail existe; o telefone continua obrigatório.
   - Nos dois casos o carrinho fica guardado.
   - **Sem SMTP próprio, o Supabase só manda e-mail para os membros do projeto.** Com a confirmação ligada, cliente de verdade não recebe o link e não consegue comprar. Configure um SMTP (Authentication → Emails → SMTP) antes de ligar. O SMTP também é o que faz "recuperar senha" chegar ao cliente.

### 2. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

| Variável | O que é |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (ou a anon key legada). É pública: quem protege os dados é o RLS |
| `APP_URL` | Endereço público da loja (`https://...`), só no servidor. É a base do sitemap e da prévia do link (Open Graph) |

### 3. Rodar

```bash
npm install
npm run dev      # http://localhost:3000
```

`npm run build` e `npm run lint` precisam passar antes de terminar qualquer tarefa.

### 4. Primeiro admin

1. Crie a conta em `/cadastrar` e confirme o e-mail. Toda conta nasce **cliente**.
2. No SQL Editor:

   ```sql
   update public.profiles set role = 'admin'
    where id = (select id from auth.users where email = 'SEU-EMAIL@exemplo.com');
   ```

3. Saia e entre de novo: o menu da conta mostra **Painel da loja**.

### 5. Configurar a loja

Em **Painel → Configurações**:

- **Loja:**
  - nome, frase e logo;
  - **cor da marca** (botões e destaques) e **cor escura** (textos, títulos, rodapé e filtro ativo). Se a cor escura não tiver contraste com o branco, o site usa o preto padrão;
  - o **WhatsApp que recebe os pedidos** (sem ele, a loja não aceita pedido);
  - Instagram, endereço, horário e aviso no topo.
- **Entrega e pagamento:** entrega (taxa e frete grátis a partir de um valor), retirada, pedido mínimo, formas de pagamento e chave Pix.
- **Equipe:** promove contas já criadas a atendente ou admin.

Depois, cadastre as **categorias** e os **produtos**: fotos (a primeira é a capa), opções com preço, preço "de" e estoque (vazio = sem controle).

### 6. Deploy (Vercel)

1. Importe o repositório na Vercel, framework Next.js. A região `gru1` (São Paulo, perto do Supabase em sa-east-1) já vem do `vercel.json`.
2. Cadastre as três variáveis. `APP_URL` é o domínio definitivo.
3. Atualize as *Redirect URLs* do Supabase com o domínio.
4. Cada push na branch de produção (`develop`) publica sozinho.

O HTML público é regerado a cada minuto (`revalidate = 60` no layout raiz). Uma mudança de nome, cor ou logo aparece na prévia dos links em até 1 minuto, sem novo deploy.

## Papéis

| Papel | Pode |
|---|---|
| `cliente` | Comprar, ver e cancelar os próprios pedidos (só enquanto estão `novo`), editar os próprios dados |
| `atendente` | Ver todos os pedidos e mudar o status. Não mexe em produtos, configurações nem equipe |
| `admin` | Tudo: catálogo, categorias, configurações, equipe, abrir e fechar a loja |

- Ninguém muda o próprio papel.
- Tirar alguém da equipe devolve a pessoa a `cliente`.
- O primeiro admin é promovido por SQL.

## Regras do pedido

- **Preço, taxa e total** são do banco (`pedidos_criar`). O `src/lib/carrinho.ts` só mostra a prévia com a mesma regra: mudou um, muda o outro.
- **Estoque:**
  - O pedido reserva (baixa) na hora e o cancelamento devolve.
  - Variação com estoque vazio não tem controle.
  - Pedido acima do estoque é recusado com a mensagem "Só restam N".
- **Pedido mínimo** vale sobre o subtotal. **Frete grátis** zera a taxa quando o subtotal chega ao valor. **Retirada** não tem taxa nem endereço.
- **Loja fechada** (painel → Pedidos → interruptor): o site continua no ar e o carrinho funciona, mas o pedido é recusado.
- **Limite:** cada cliente pode ter até 3 pedidos `novo` ao mesmo tempo. Isso segura spam e quem tentaria reservar o estoque inteiro.
- **Status:**
  - `novo` ↔ `em_atendimento` → `concluido`, ou `cancelado`.
  - Concluído e cancelado são finais.
  - O cliente só cancela enquanto o pedido está `novo`.
- **Ninguém apaga pedido.** Apagar produto ou variação não mexe nos pedidos, que guardam cópia do nome e do preço.
- **Abrir o WhatsApp:**
  - No computador, a aba abre no clique e recebe o link quando o pedido é gravado.
  - No celular, o WhatsApp abre a partir da tela do pedido; o "voltar" cai no pedido.
  - Nos dois casos, a tela do pedido tem o botão **Abrir no WhatsApp**.

## Testar

### O banco

Num Postgres local (Docker), sem projeto Supabase:

```bash
docker run -d --name catalogo-pg -e POSTGRES_PASSWORD=test -p 55433:5432 postgres:17-alpine
export PGPASSWORD=test
psql -h localhost -p 55433 -U postgres -c "create database catalogo"
psql -h localhost -p 55433 -U postgres -d catalogo -f supabase/tests/stub-supabase.sql
psql -h localhost -p 55433 -U postgres -d catalogo -f supabase/schema.sql
psql -h localhost -p 55433 -U postgres -d catalogo -f supabase/tests/regras.sql   # termina em "TUDO OK"
```

O roteiro confere:

- **Preço e taxa:** o preço vindo do navegador é ignorado; as linhas repetidas se juntam; a taxa de entrega, o frete grátis e o pedido mínimo valem.
- **Estoque:** baixa e devolução no cancelamento; estoque insuficiente é recusado.
- **Bloqueios do pedido:**
  - variação ou produto inativo;
  - loja fechada;
  - forma de pagamento não aceita;
  - troco menor que o total;
  - endereço incompleto;
  - limite de pedidos `novo`.
- **Permissões:**
  - o cliente só cancela o próprio pedido `novo` e não muda o retrato;
  - concluído é final;
  - ninguém apaga pedido;
  - o atendente não mexe no catálogo;
  - ninguém muda o próprio papel;
  - `anon` não lê pedidos nem perfis.

### O app

Com um projeto Supabase de teste no `.env.local`:

1. Promova o admin, configure a loja (com WhatsApp) e cadastre uma categoria e um produto com duas opções e estoque.
2. Numa aba anônima:
   1. Monte o carrinho e recarregue a página: o carrinho continua.
   2. Finalize. Deve pedir conta: crie uma e volte ao checkout.
   3. Envie: o WhatsApp abre com a mensagem e a tela vai para o pedido.
3. No painel, o pedido aparece na hora, com aviso e contador. Mude o status: o cliente vê a mudança sem recarregar.
4. Cancele o pedido e confira que o estoque voltou.
5. Feche a loja e tente pedir: o pedido é recusado com a mensagem do banco.

## Estrutura

```
src/
  app/
    layout.tsx                metadata da loja (servidor), cor no <body>, revalidate 60
    robots.ts  sitemap.ts
    (app)/layout.tsx          providers (React Query semeado com a configuração)
      (loja)/                 site público: vitrine, produto/[slug], finalizar, conta/
      (auth)/                 entrar, cadastrar, recuperar-senha
      redefinir-senha/
      painel/                 pedidos, produtos, categorias, configuracoes
  components/
    loja/                     cabeçalho, rodapé, carrinho (gaveta, barra, sync), cards
    forms/                    um arquivo por formulário
    ui/                       primitivos shadcn
  hooks/                      sessão, configuração, carrinho (zustand + persist), realtime
  lib/                        carrinho.ts, pedido.ts, mensagem.ts, cor.ts, fotos.ts, constants, errors, queries
  server/catalogo.ts          leituras públicas no servidor (metadata, sitemap, cor)
  services/                   acesso ao Supabase, um arquivo por recurso
supabase/
  schema.sql                  instalação completa
  tests/                      stub do Supabase + roteiro das regras
```
