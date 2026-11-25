# Diretrizes do projeto — Portal Luiz Claudio Barbearia

## Regra de layout (obrigatória): mobile em todo lugar

**O portal é desenhado só para celular. No desktop ele mostra a mesma coluna de
celular, centralizada na tela.** Não existe layout de desktop próprio.

Convenções em uso:
- O `.app` tem `max-width: 480px` e fica centralizado; acima de 520px ganha
  bordas laterais finas. Elementos fixos (abas na base, barra de ação, sheets)
  também ficam limitados a 480px e centralizados.
- A navegação é sempre por abas fixas na base, inclusive no desktop.
- Acima de 520px a rolagem é **dentro do `.app`** (a janela não rola) e a barra
  de rolagem fica invisível, para nada mudar de posição. Para rolar ao topo via
  JS use `scrollTopo()` (rola a janela e o `.app`), não `window.scrollTo`.
- **Não crie** `@media` de desktop com grades largas, abas no topo ou colunas
  extras. O fluxo é vertical.
- Use unidades relativas, `max-width`, grid/flex; nada pode estourar a largura
  da coluna.
- Respeite `env(safe-area-inset-*)` (notch) e `viewport-fit=cover`.
- **Ao criar/alterar telas, verifique em ~390px e confira em ~1280px** que a
  coluna continua centralizada e sem quebra.

## Arquitetura

Site estático, sem backend. Dados persistem no `localStorage` do navegador.

- `index.html` — estrutura (abas + views: Agendar, Fidelidade, Clube)
- `assets/css/styles.css` — estilos (só mobile; sem bloco de desktop)
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
