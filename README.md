# Luiz Claudio Barbearia — Portal de Agendamento

Portal web de agendamento de corte de cabelo e barba para a **Luiz Claudio Barbearia**
(R. H-161 — Cidade Vera Cruz, Aparecida de Goiânia — GO · (62) 98424-2138).

É um site estático (HTML + CSS + JavaScript puro), **sem necessidade de servidor
ou banco de dados** — os agendamentos ficam salvos no `localStorage` do navegador
do cliente e podem ser confirmados com a barbearia via WhatsApp.

## Como usar

Abra o `index.html` no navegador. Para servir localmente:

```bash
python3 -m http.server 8000
# depois acesse http://localhost:8000
```

## Fluxo de agendamento

1. Escolha o **serviço** (corte, barba, navalha, etc.)
2. Escolha o **profissional**
3. Selecione a **data** (respeita os dias de funcionamento)
4. Escolha o **horário** (gerados automaticamente conforme a duração do serviço e
   o horário de funcionamento; horários já reservados ou que já passaram ficam bloqueados)
5. Informe **nome e telefone** e confirme
6. Ao confirmar, aparece um resumo e um botão para **enviar a confirmação no WhatsApp**
   da barbearia

A seção **Meus agendamentos** lista as reservas futuras salvas naquele navegador,
com opção de reenviar no WhatsApp ou cancelar (o cancelamento libera o horário).

## Personalização

Todos os dados do estabelecimento ficam em [`assets/js/config.js`](assets/js/config.js):

- **Identidade:** nome, monograma do logo, slogan, endereço, telefone, link do Maps
- **WhatsApp:** número (com DDI 55) que recebe as confirmações
- **Horários:** funcionamento por dia da semana (`null` = fechado)
- **Serviços:** nome, duração e preço
- **Profissionais:** nome e especialidade

Basta editar esse arquivo — nenhuma outra alteração é necessária.

## Estrutura

```
index.html              Página principal
assets/css/styles.css   Estilos (tema escuro com dourado, responsivo)
assets/js/config.js     Configuração do estabelecimento (edite aqui)
assets/js/app.js         Lógica de agendamento
```

## Observações

- Os agendamentos são armazenados **localmente no navegador** de cada cliente. Isso
  é ideal para um portal de vitrine/confirmação via WhatsApp. Para uma agenda
  compartilhada entre dispositivos (com bloqueio real de horários entre clientes),
  seria necessário um backend — a estrutura atual já isola a configuração e a lógica
  para facilitar essa evolução.
