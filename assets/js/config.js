/**
 * Configuração do estabelecimento — Luiz Claudio Barbearia.
 * Dados extraídos da ficha do Google Maps. Ajuste serviços/preços/horários
 * conforme a realidade da barbearia.
 */
window.SHOP_CONFIG = {
  // --- Identidade ---
  nome: "Luiz Claudio Barbearia",
  monograma: "LC",
  slogan: "Corte, barba e navalha no capricho.",
  // Endereço e contato (Google Maps)
  endereco: "R. H-161 — Cidade Vera Cruz",
  cidade: "Aparecida de Goiânia — GO, 74937-590",
  telefone: "(62) 98424-2138",
  avaliacao: "5,0",
  numAvaliacoes: 29,
  mapsUrl: "https://maps.app.goo.gl/Q8M5sGxx76mZWWfj9",
  // WhatsApp (só dígitos, com DDI 55) para confirmar o agendamento
  whatsapp: "5562984242138",

  // --- Horário de funcionamento ---
  // 0 = domingo ... 6 = sábado. abre/fecha em "HH:MM" (24h). null = fechado.
  horarios: {
    0: null,                          // domingo — fechado
    1: { abre: "09:00", fecha: "20:00" },
    2: { abre: "09:00", fecha: "20:00" },
    3: { abre: "09:00", fecha: "20:00" },
    4: { abre: "09:00", fecha: "20:00" },
    5: { abre: "09:00", fecha: "20:00" },
    6: { abre: "08:00", fecha: "18:00" },
  },

  // Intervalo entre horários oferecidos, em minutos
  intervaloMinutos: 30,
  // Quantos dias à frente é possível agendar
  diasDisponiveis: 21,

  // --- Serviços ---
  servicos: [
    { id: "corte",        nome: "Corte de Cabelo",     duracao: 30, preco: 45 },
    { id: "barba",        nome: "Barba",               duracao: 30, preco: 35 },
    { id: "corte-barba",  nome: "Corte + Barba",       duracao: 60, preco: 70 },
    { id: "navalha",      nome: "Corte com Navalha",   duracao: 45, preco: 55 },
    { id: "infantil",     nome: "Corte Infantil",      duracao: 30, preco: 40 },
    { id: "sobrancelha",  nome: "Sobrancelha",         duracao: 15, preco: 20 },
  ],

  // --- Profissionais ---
  profissionais: [
    { id: "luiz",     nome: "Luiz Cláudio",    especialidade: "Cortes, barba e navalha" },
    { id: "qualquer", nome: "Sem preferência", especialidade: "Primeiro disponível" },
  ],
};
