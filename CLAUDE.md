# Diretrizes do projeto — Portal Luiz Claudio Barbearia

## Regra de responsividade (obrigatória)

**Toda tela e todo componente devem ser responsivos para mobile E desktop.**
Qualquer mudança na interface precisa funcionar bem nos dois — não entregue algo
que só fique bom no celular ou só no desktop.

Convenções em uso:
- **Mobile-first**: o CSS base é para celular; o desktop é ajustado em
  `@media (min-width: 760px)` no fim de `assets/css/styles.css`.
- No **mobile** a navegação é por abas fixas na base; no **desktop** as abas vão
  para o topo (horizontais) e o conteúdo vira um "card" central com grades em
  múltiplas colunas (serviços, horários, planos).
- Use unidades relativas, `max-width`, grid/flex; conteúdo largo (tabelas, grades)
  nunca deve estourar a largura da página.
- Respeite `env(safe-area-inset-*)` (notch) e `viewport-fit=cover`.
- **Ao criar/alterar telas, sempre verifique nos dois tamanhos** (ex.: ~390px e
  ~1280px) antes de concluir.

## Arquitetura

Site estático, sem backend. Dados persistem no `localStorage` do navegador.

- `index.html` — estrutura (abas + views: Agendar, Fidelidade, Clube)
- `assets/css/styles.css` — estilos (mobile-first + bloco desktop no fim)
- `assets/js/config.js` — **configuração editável** (dados da barbearia, serviços,
  horários, sinal/Pix, fidelidade, planos)
- `assets/js/app.js` — fluxo de agendamento (wizard passo a passo)
- `assets/js/membro.js` — fidelidade, clube/assinatura e navegação por abas

## Deploy

GitHub Pages via `.github/workflows/deploy-pages.yml` a cada push na `main`.
URL: https://oidux.github.io/luizclaudio/

## Observações

- Áreas de **Fidelidade** e **Clube/pagamento com cartão** são **demonstração**
  (dados fictícios, nenhum pagamento real). O **sinal via Pix** gera um
  "copia e cola" válido, mas a baixa do comprovante é manual (WhatsApp).
- Textos em **português (pt-BR)**.
