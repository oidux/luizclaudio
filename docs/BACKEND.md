# Backend com Supabase — guia e segurança

O site é **estático** (HTML/CSS/JS) e hoje guarda tudo no `localStorage` do
navegador (`backend.modo = "local"`). Para "rodar de verdade" — agenda
compartilhada entre dispositivos, o barbeiro vendo os agendamentos, fidelidade e
assinatura reais — usamos o **Supabase** como banco/serviço, mantendo o **GitHub**
apenas como repositório do site (GitHub Pages).

## Regra de segurança (o mais importante)

O site é público e o código fica no GitHub. Então:

| Pode ir no GitHub / front-end | NUNCA no GitHub / front-end |
|---|---|
| URL do projeto (`https://xxx.supabase.co`) | `service_role` key |
| **Chave anon / publishable** (é pública por design) | Senha do banco de dados |
| Schema SQL, policies | Tokens de acesso pessoal, secrets de API |

A segurança **não** vem de esconder a chave anon (ela vai em todo app cliente).
Vem das **policies de RLS** (Row Level Security) no banco — por isso o
`schema.sql` já habilita RLS e define quem pode ler/gravar o quê.

O `.gitignore` já bloqueia `.env`, `*.local.js`, `service-role*`, etc.

## Como ligar (quando o projeto Supabase existir)

1. No Supabase, crie o projeto e rode `supabase/schema.sql` (SQL Editor).
2. Copie **Project URL** e a **anon key** (Settings → API).
3. Em `assets/js/config.js`, preencha `backend.supabaseUrl` e
   `backend.supabaseAnonKey` e troque `backend.modo` para `"supabase"`.
   (Essas duas são públicas — podem ser commitadas.)
4. Implementar a camada de dados (ver abaixo).

## Onde plugar no código (a "costura")

Toda a persistência está isolada em poucas funções — trocar `localStorage` por
Supabase mexe só nelas:

- `assets/js/app.js`: `loadBookings()` / `saveBookings()` (agendamentos)
- `assets/js/membro.js`: `loadM()` / `saveM()` (fidelidade/assinatura)

O plano é criar `assets/js/data.js` expondo uma API assíncrona
(`getServicos`, `criarAgendamento`, `getAgendamentos`, ...) com duas
implementações — `local` e `supabase` — escolhidas por `backend.modo`. As
telas passam a `await` essas funções.

## Modelo de dados

Ver `supabase/schema.sql`. Tabelas: `servicos`, `profissionais`, `planos`
(catálogo, leitura pública), `agendamentos` (visitante cria; leitura só admin),
`clientes` e `assinaturas` (fidelidade/assinatura, via login/função server-side).

## Pagamentos

- **Sinal via Pix**: o código "copia e cola" é gerado no cliente (já funciona);
  a baixa do comprovante hoje é manual (WhatsApp). Para automatizar, usar um PSP
  (ex.: Mercado Pago/Pagar.me) via Edge Function.
- **Assinatura no cartão**: hoje é demonstração. Para cobrança real, integrar um
  gateway (Stripe/Pagar.me/Mercado Pago) por uma Edge Function — a chave secreta
  do gateway fica no Supabase, **nunca** no front-end.
