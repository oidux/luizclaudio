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

  // --- Sinal / entrada via Pix ---
  // Cobrança de um sinal para garantir o horário e reduzir faltas.
  sinalAtivo: true,
  sinalPercent: 0.35, // 35% do valor do serviço
  pix: {
    // IMPORTANTE: troque pela CHAVE PIX REAL do recebedor.
    // Pode ser CPF/CNPJ (só números), e-mail, telefone (+55DDXXXXXXXXX) ou chave aleatória.
    chave: "+5562984242138",
    nome: "LUIZ CLAUDIO BARBEARIA", // nome do recebedor (máx. 25 caracteres, sem acento)
    cidade: "APARECIDA GO",         // cidade do recebedor (máx. 15 caracteres, sem acento)
  },

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
  // duracao em minutos; preco em R$. aPartirDe: mostra "a partir de".
  servicos: [
    { id: "social",            nome: "Cabelo social",              duracao: 30, preco: 30 },
    { id: "social-maquina",    nome: "Cabelo social simples (máquina)", duracao: 20, preco: 25 },
    { id: "degrade",           nome: "Cabelo degradê",             duracao: 40, preco: 35 },
    { id: "degrade-navalhado", nome: "Cabelo degradê navalhado",   duracao: 45, preco: 40 },
    { id: "pesinho",           nome: "Pesinho",                    duracao: 10, preco: 15 },
    { id: "sobrancelha",       nome: "Sobrancelha",                duracao: 15, preco: 15 },
    { id: "barba",             nome: "Barba",                      duracao: 30, preco: 25 },
    { id: "barba-pigmentacao", nome: "Barba e pigmentação",        duracao: 45, preco: 45 },
    { id: "infantil",          nome: "Corte infantil",             duracao: 30, preco: 35 },
    { id: "limpeza-simples",   nome: "Limpeza de pele simples",    duracao: 20, preco: 25 },
    { id: "limpeza-completa",  nome: "Limpeza de pele completa",   duracao: 30, preco: 35 },
    { id: "progressiva",       nome: "Progressiva",                duracao: 90, preco: 70, aPartirDe: true },
  ],

  // --- Profissionais ---
  profissionais: [
    { id: "luiz",     nome: "Luiz Cláudio",    especialidade: "Cortes, barba e navalha" },
    { id: "qualquer", nome: "Sem preferência", especialidade: "Primeiro disponível" },
  ],

  // --- Backend / dados ---
  // "local"    = tudo no navegador (localStorage) — modo atual, sem servidor.
  // "supabase" = usa o Supabase (quando estiver pronto). Ver docs/BACKEND.md.
  backend: {
    modo: "local",
    // A chave ANON é PÚBLICA por natureza (protegida por RLS) — pode ir no GitHub.
    // NUNCA coloque aqui a service_role key nem a senha do banco.
    supabaseUrl: "",      // ex.: https://SEUPROJETO.supabase.co
    supabaseAnonKey: "",  // chave anon/publishable
  },

  // --- Fidelidade ---
  // A cada `meta` cortes, o cliente ganha 1 grátis.
  fidelidade: { ativa: true, meta: 10 },

  // --- Clube (assinatura mensal) ---
  planos: [
    { id: "basico",    nome: "Clube Básico",    preco: 89,  destaque: false,
      beneficios: ["2 cortes por mês", "10% de desconto em produtos"] },
    { id: "ilimitado", nome: "Clube Ilimitado", preco: 149, destaque: true,
      beneficios: ["Cortes ilimitados", "1 barba por semana", "10% em produtos"] },
    { id: "premium",   nome: "Clube Premium",   preco: 219, destaque: false,
      beneficios: ["Tudo do Ilimitado", "Barba e sobrancelha inclusas", "Atendimento prioritário"] },
  ],
};
