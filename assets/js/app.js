/* Portal de agendamento — Luiz Claudio Barbearia (fluxo passo a passo) */
(function () {
  "use strict";

  var CFG = window.SHOP_CONFIG;
  var STORAGE_KEY = "lc_barbearia_agendamentos_v1";
  var TOTAL_STEPS = 5;

  var DOW_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  var DOW_LONG = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  var MON_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  var SVC_EMOJI = {
    social: "✂️", "social-maquina": "✂️", degrade: "💈", "degrade-navalhado": "🪒",
    pesinho: "📏", sobrancelha: "👁️", barba: "🧔", "barba-pigmentacao": "🧔",
    infantil: "🧒", "limpeza-simples": "🧖", "limpeza-completa": "🧖", progressiva: "💇"
  };
  var PRO_EMOJI = { luiz: "💈", qualquer: "👥" };

  var state = { servicos: [], profissional: null, dataISO: null, horario: null };
  var step = 1;

  // ---------- Utilidades ----------
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function setText(sel, txt) { var e = $(sel); if (e) e.textContent = txt; }
  function money(v) { return "R$ " + v.toFixed(2).replace(".", ","); }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function isoDate(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseISO(iso) { var p = iso.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function toMinutes(hhmm) { var p = hhmm.split(":"); return (+p[0]) * 60 + (+p[1]); }
  function fromMinutes(min) { return pad(Math.floor(min / 60)) + ":" + pad(min % 60); }
  function svcById(id) { return CFG.servicos.filter(function (s) { return s.id === id; })[0] || null; }
  function proById(id) { return CFG.profissionais.filter(function (p) { return p.id === id; })[0] || null; }

  // ---------- Serviços selecionados (múltiplos) ----------
  function selectedSvcs() { return state.servicos.map(svcById).filter(Boolean); }
  function totalPreco() { return selectedSvcs().reduce(function (s, x) { return s + x.preco; }, 0); }
  function totalDuracao() { return selectedSvcs().reduce(function (s, x) { return s + x.duracao; }, 0); }
  function temAberto() { return selectedSvcs().some(function (x) { return x.aPartirDe; }); }
  function precoLabel(v) { return (temAberto() ? "a partir de " : "") + money(v); }
  function nomesSvcs() { return selectedSvcs().map(function (x) { return x.nome; }).join(", "); }

  // ---------- Armazenamento ----------
  function loadBookings() { try { var r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : []; } catch (e) { return []; } }
  function saveBookings(list) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) {} }

  // ---------- Sinal / Pix ----------
  function sinalAtivo() { return !!(CFG.sinalAtivo && CFG.pix && CFG.pix.chave); }
  function valorSinal(preco) { return Math.round(preco * (CFG.sinalPercent || 0) * 100) / 100; }
  function pctSinal() { return Math.round((CFG.sinalPercent || 0) * 100); }

  // Monta o "Pix Copia e Cola" (payload EMV BR Code) com CRC16-CCITT.
  function tlv(id, val) { val = "" + val; return id + pad(val.length) + val; }
  function crc16(str) {
    var crc = 0xFFFF;
    for (var i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (var j = 0; j < 8; j++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
    return ("000" + crc.toString(16).toUpperCase()).slice(-4);
  }
  function pixPayload(amount, txid) {
    var p = CFG.pix;
    var mai = tlv("00", "br.gov.bcb.pix") + tlv("01", p.chave);
    var nome = (p.nome || "RECEBEDOR").slice(0, 25);
    var cidade = (p.cidade || "BRASIL").slice(0, 15);
    var tx = (txid || "***").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
    var body =
      tlv("00", "01") +
      tlv("01", "11") +
      tlv("26", mai) +
      tlv("52", "0000") +
      tlv("53", "986") +
      tlv("54", amount) +
      tlv("58", "BR") +
      tlv("59", nome) +
      tlv("60", cidade) +
      tlv("62", tlv("05", tx)) +
      "6304";
    return body + crc16(body);
  }
  function copiaCola(str, btn) {
    var reset = function () { setTimeout(function () { btn.textContent = "Copiar código Pix"; }, 1800); };
    var ok = function () { btn.textContent = "Copiado ✓"; reset(); };
    var fb = function () {
      var ta = document.createElement("textarea"); ta.value = str; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      try { document.execCommand("copy"); ok(); } catch (e) {}
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(str).then(ok, fb);
    else fb();
  }

  // ---------- Infos da barbearia ----------
  function fillShopInfo() {
    document.title = "Agendamento — " + CFG.nome;
    setText("#brandName", CFG.nome);
    setText("#footerBrand", CFG.nome);
    setText("#footerEndereco", CFG.endereco + " · " + CFG.cidade);

    var av = CFG.avaliacao ? "★ " + CFG.avaliacao + "  ·  " : "";
    setText("#shopInfoLine", av + CFG.endereco + "  ·  " + resumoHorario());

    var maps = $("#mapsLink");
    if (CFG.mapsUrl) maps.href = CFG.mapsUrl; else maps.style.display = "none";
  }
  function resumoHorario() {
    var seg = CFG.horarios[1], sab = CFG.horarios[6], t = [];
    if (seg) t.push("Seg–Sex " + seg.abre + "–" + seg.fecha);
    if (sab) t.push("Sáb " + sab.abre + "–" + sab.fecha);
    return t.join(" · ") || "Consulte horários";
  }

  // ---------- Passo 1: serviços (múltipla escolha) ----------
  function renderServices() {
    var grid = $("#servicesGrid"); grid.innerHTML = "";
    CFG.servicos.forEach(function (s) {
      var sel = state.servicos.indexOf(s.id) !== -1;
      var label = el("label", "option option--check" + (sel ? " is-selected" : ""));
      label.innerHTML =
        '<input type="checkbox" name="servico" value="' + s.id + '"' + (sel ? " checked" : "") + ">" +
        '<span class="opt-emoji">' + (SVC_EMOJI[s.id] || "✂️") + "</span>" +
        '<span class="opt-body"><span class="opt-name">' + s.nome + "</span>" +
        '<span class="opt-meta">' + s.duracao + " min</span></span>" +
        '<span class="opt-price">' + (s.aPartirDe ? "a partir de " : "") + money(s.preco) + "</span>" +
        '<span class="opt-box">✓</span>';
      label.querySelector("input").addEventListener("change", function () {
        var i = state.servicos.indexOf(s.id);
        if (i === -1) state.servicos.push(s.id); else state.servicos.splice(i, 1);
        state.horario = null; // duração total muda os horários
        label.classList.toggle("is-selected", state.servicos.indexOf(s.id) !== -1);
        updateSvcBar();
      });
      grid.appendChild(label);
    });
    updateSvcBar();
  }

  function updateSvcBar() {
    var n = state.servicos.length;
    setText("#svcTotal", n ? precoLabel(totalPreco()) : "—");
    var btn = $("#svcContinue");
    if (btn) {
      btn.disabled = n === 0;
      btn.textContent = n > 1 ? "Continuar · " + n + " serviços" : "Continuar";
    }
  }

  // ---------- Passo 2: profissionais ----------
  function renderPros() {
    var grid = $("#prosGrid"); grid.innerHTML = "";
    CFG.profissionais.forEach(function (p) {
      var label = el("label", "option");
      label.innerHTML =
        '<input type="radio" name="profissional" value="' + p.id + '">' +
        '<span class="opt-emoji">' + (PRO_EMOJI[p.id] || "👤") + "</span>" +
        '<span class="opt-body"><span class="opt-name">' + p.nome + "</span>" +
        '<span class="opt-meta">' + p.especialidade + "</span></span>" +
        '<span class="opt-chevron">›</span>';
      label.querySelector("input").addEventListener("change", function () {
        if (state.profissional !== p.id) state.horario = null;
        state.profissional = p.id;
        markSelected(grid, label);
        advance(3);
      });
      grid.appendChild(label);
    });
  }

  function markSelected(grid, chosen) {
    $all(".option", grid).forEach(function (o) { o.classList.remove("is-selected"); });
    if (chosen) chosen.classList.add("is-selected");
  }

  // ---------- Passo 3: dias ----------
  function renderDays() {
    var scroller = $("#daysScroller"); scroller.innerHTML = "";
    var today = new Date(); today.setHours(0, 0, 0, 0);
    for (var i = 0; i < CFG.diasDisponiveis; i++) {
      var d = new Date(today); d.setDate(today.getDate() + i);
      var dow = d.getDay(); var aberto = !!CFG.horarios[dow];
      var day = el("div", "day" + (aberto ? "" : " is-disabled"));
      day.innerHTML =
        '<div class="day-dow">' + DOW_SHORT[dow] + "</div>" +
        '<div class="day-num">' + d.getDate() + "</div>" +
        '<div class="day-mon">' + MON_SHORT[d.getMonth()] + "</div>";
      if (aberto) {
        (function (iso, node) {
          node.addEventListener("click", function () {
            if (state.dataISO !== iso) state.horario = null;
            state.dataISO = iso;
            $all(".day", scroller).forEach(function (n) { n.classList.remove("is-selected"); });
            node.classList.add("is-selected");
            advance(4);
          });
        })(isoDate(d), day);
      }
      scroller.appendChild(day);
    }
  }

  // ---------- Passo 4: horários ----------
  function renderSlots() {
    var grid = $("#slotsGrid"); grid.innerHTML = "";
    if (!state.dataISO) { grid.appendChild(el("p", "muted slots-empty", "Selecione uma data para ver os horários.")); return; }
    if (!state.servicos.length) { grid.appendChild(el("p", "muted slots-empty", "Selecione um serviço primeiro.")); return; }

    var d = parseISO(state.dataISO);
    var horario = CFG.horarios[d.getDay()];
    if (!horario) { grid.appendChild(el("p", "muted slots-empty", "Fechado neste dia.")); return; }

    var dur = totalDuracao();
    var abre = toMinutes(horario.abre), fecha = toMinutes(horario.fecha), passo = CFG.intervaloMinutos;
    var agora = new Date();
    var ehHoje = isoDate(agora) === state.dataISO;
    var minutoAgora = agora.getHours() * 60 + agora.getMinutes();
    var ocupados = ocupadosPara(state.dataISO, state.profissional);

    var criados = 0;
    for (var t = abre; t + dur <= fecha; t += passo) {
      var hhmm = fromMinutes(t);
      var btn = el("button", "slot"); btn.type = "button"; btn.textContent = hhmm;
      var passado = ehHoje && t <= minutoAgora;
      var conflita = ocupados.indexOf(hhmm) !== -1;
      if (state.horario === hhmm && !passado && !conflita) btn.classList.add("is-selected");
      if (passado || conflita) { btn.disabled = true; }
      else {
        (function (hh, node) {
          node.addEventListener("click", function () {
            state.horario = hh;
            $all(".slot", grid).forEach(function (n) { n.classList.remove("is-selected"); });
            node.classList.add("is-selected");
            advance(5);
          });
        })(hhmm, btn);
      }
      grid.appendChild(btn); criados++;
    }
    if (criados === 0) grid.appendChild(el("p", "muted slots-empty", "Nenhum horário disponível para este serviço neste dia."));
  }

  function ocupadosPara(dataISO, profId) {
    var res = [];
    loadBookings().forEach(function (b) {
      if (b.dataISO !== dataISO) return;
      if (profId && profId !== "qualquer" && b.profissionalId !== profId && b.profissionalId !== "qualquer") return;
      res.push(b.horario);
    });
    return res;
  }

  // ---------- Passo 5: revisão ----------
  function renderReview() {
    var pro = proById(state.profissional);
    var svcTxt = state.servicos.length
      ? nomesSvcs() + " · " + totalDuracao() + " min · " + precoLabel(totalPreco())
      : "—";
    var card = $("#reviewCard");
    card.innerHTML =
      reviewRow("💈", state.servicos.length > 1 ? "Serviços" : "Serviço", svcTxt, 1) +
      reviewRow("👤", "Profissional", pro ? pro.nome : "—", 2) +
      reviewRow("📅", "Data", state.dataISO ? formatDataLonga(state.dataISO) : "—", 3) +
      reviewRow("🕒", "Horário", state.horario || "—", 4);
    $all(".rv-edit", card).forEach(function (b) {
      b.addEventListener("click", function () { goTo(+b.getAttribute("data-goto")); });
    });

    var note = $("#sinalNote");
    if (note) {
      var total = totalPreco();
      if (state.servicos.length && sinalAtivo()) {
        var sin = valorSinal(total);
        note.innerHTML =
          '<span class="sn-emoji">💸</span>' +
          '<span class="sn-body"><b>Sinal de ' + money(sin) + '</b> (' + pctSinal() + '%) via Pix' +
          '<span class="sn-sub">Restante de ' + precoLabel(total - sin) + ' no local. O código Pix aparece após confirmar.</span></span>';
        note.hidden = false;
      } else {
        note.hidden = true;
      }
    }
  }
  function reviewRow(emoji, label, value, gotoStep) {
    return '<div class="review-row">' +
      '<span class="rv-emoji">' + emoji + "</span>" +
      '<span class="rv-body"><span class="rv-label">' + label + "</span>" +
      '<span class="rv-value">' + value + "</span></span>" +
      '<button type="button" class="rv-edit" data-goto="' + gotoStep + '">Editar</button></div>';
  }
  function formatDataLonga(iso) {
    var d = parseISO(iso);
    return DOW_LONG[d.getDay()] + ", " + d.getDate() + " de " + nomeMes(d.getMonth()) + " de " + d.getFullYear();
  }
  function nomeMes(m) { return ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"][m]; }

  // ---------- Navegação do wizard ----------
  function advance(n) { setTimeout(function () { goTo(n); }, 180); }

  function goTo(n) {
    n = Math.max(1, Math.min(TOTAL_STEPS, n));
    step = n;

    $all(".wizard-step").forEach(function (s) {
      s.classList.toggle("is-active", +s.getAttribute("data-step") === n);
    });

    // progresso
    $("#progressFill").style.width = (n / TOTAL_STEPS * 100) + "%";
    $("#progressLabel").textContent = "Passo " + n + " de " + TOTAL_STEPS;

    // botão voltar
    $("#backBtn").hidden = (n === 1);

    // contexto no topo de cada passo
    setKickers();

    // conteúdo dependente
    if (n === 4) renderSlots();
    if (n === 5) { renderReview(); updateTotal(); }

    // "meus agendamentos" só na tela inicial
    $all(".post-booking").forEach(function (p) { p.classList.toggle("is-visible", n === 1); });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setKickers() {
    var pro = proById(state.profissional), n = state.servicos.length;
    var k2 = $('.wizard-step[data-step="2"] .step-kicker');
    if (k2) k2.textContent = n ? (n > 1 ? n + " serviços · " : "") + precoLabel(totalPreco()) : "Serviço escolhido";
    var k3 = $('.wizard-step[data-step="3"] .step-kicker');
    if (k3) k3.textContent = pro ? pro.nome : "Quase lá";
    var k4 = $("#step4Kicker");
    if (k4) k4.textContent = state.dataISO ? formatDataLonga(state.dataISO) : "Dia escolhido";
  }

  function updateTotal() {
    var total = $("#abTotal");
    if (total) total.textContent = state.servicos.length ? precoLabel(totalPreco()) : "—";
  }

  // ---------- Submit ----------
  function onSubmit(e) {
    e.preventDefault();
    var errBox = $("#formError"); errBox.hidden = true;
    var nome = $("#fldNome").value.trim(), tel = $("#fldTelefone").value.trim(), obs = $("#fldObs").value.trim();

    var faltando = [];
    if (!state.servicos.length) faltando.push("um serviço");
    if (!state.profissional) faltando.push("um profissional");
    if (!state.dataISO) faltando.push("uma data");
    if (!state.horario) faltando.push("um horário");
    if (!nome) faltando.push("seu nome");
    if (!tel) faltando.push("seu telefone");
    if (faltando.length) {
      errBox.textContent = "Por favor, preencha: " + faltando.join(", ") + ".";
      errBox.hidden = false; errBox.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (ocupadosPara(state.dataISO, state.profissional).indexOf(state.horario) !== -1) {
      errBox.textContent = "Ops! Esse horário acabou de ser reservado. Escolha outro, por favor.";
      errBox.hidden = false; state.horario = null; goTo(4);
      return;
    }

    var pro = proById(state.profissional);
    var svcs = selectedSvcs();
    var total = totalPreco();
    var booking = {
      id: "ag_" + isoDate(new Date()).replace(/-/g, "") + "_" + state.horario.replace(":", "") + "_" + (loadBookings().length + 1),
      criadoEm: new Date().toISOString(),
      servicos: svcs.map(function (s) { return { id: s.id, nome: s.nome, preco: s.preco, duracao: s.duracao }; }),
      servicoNome: nomesSvcs(), preco: total, duracao: totalDuracao(), aPartirDe: temAberto(),
      profissionalId: pro.id, profissionalNome: pro.nome,
      dataISO: state.dataISO, horario: state.horario,
      cliente: nome, telefone: tel, obs: obs,
      sinal: sinalAtivo() ? valorSinal(total) : 0,
    };
    var list = loadBookings(); list.push(booking); saveBookings(list);

    showConfirmation(booking);
    renderMyBookings();
    resetFlow();
  }

  function resetFlow() {
    $("#bookingForm").reset();
    state = { servicos: [], profissional: null, dataISO: null, horario: null };
    $all(".option.is-selected, .day.is-selected, .slot.is-selected").forEach(function (n) { n.classList.remove("is-selected"); });
    updateSvcBar();
    updateTotal();
    goTo(1);
  }
  function bPrecoLabel(b) { return (b.aPartirDe ? "a partir de " : "") + money(b.preco); }

  // ---------- Confirmação (bottom sheet) ----------
  function showConfirmation(b) {
    var rows = mbRow("Serviço", b.servicoNome) + mbRow("Profissional", b.profissionalNome) +
      mbRow("Data", formatDataLonga(b.dataISO)) + mbRow("Horário", b.horario) +
      mbRow("Cliente", b.cliente) + mbRow("Valor", bPrecoLabel(b));
    if (b.sinal) rows += mbRow("Sinal (" + pctSinal() + "%)", money(b.sinal));
    $("#modalBody").innerHTML = rows;

    var pixBox = $("#pixBlock");
    if (b.sinal && sinalAtivo()) {
      var txid = "LC" + b.dataISO.replace(/-/g, "") + b.horario.replace(":", "");
      var code = pixPayload(b.sinal.toFixed(2), txid);
      pixBox.innerHTML =
        '<p class="pix-title">Pague o sinal de <b>' + money(b.sinal) + '</b> por Pix para garantir seu horário</p>' +
        '<p class="pix-key">Chave: <b>' + CFG.pix.chave + '</b></p>' +
        '<div class="pix-code" id="pixCode">' + code + "</div>" +
        '<button type="button" class="btn btn-outline btn-block" id="pixCopyBtn">Copiar código Pix</button>' +
        '<p class="pix-hint">Depois de pagar, é só enviar o comprovante no WhatsApp. 🙂</p>';
      pixBox.hidden = false;
      var btn = $("#pixCopyBtn");
      btn.addEventListener("click", function () { copiaCola(code, btn); });
    } else {
      pixBox.hidden = true;
      pixBox.innerHTML = "";
    }

    $("#modalWhats").href = whatsLink(b);
    $("#modal").hidden = false;
  }
  function mbRow(k, v) { return '<div class="mb-row"><span>' + k + "</span><span>" + v + "</span></div>"; }
  function whatsLink(b) {
    var msg = "Olá! Gostaria de confirmar meu agendamento na " + CFG.nome + ":%0A" +
      "• Serviço: " + b.servicoNome + "%0A• Profissional: " + b.profissionalNome + "%0A" +
      "• Data: " + formatDataLonga(b.dataISO) + "%0A• Horário: " + b.horario + "%0A" +
      "• Nome: " + encodeURIComponent(b.cliente) + (b.obs ? "%0A• Obs: " + encodeURIComponent(b.obs) : "");
    if (b.sinal) msg += "%0A• Sinal (" + pctSinal() + "%25): R$ " + b.sinal.toFixed(2).replace(".", ",") + " via Pix — envio o comprovante";
    return "https://wa.me/" + CFG.whatsapp + "?text=" + msg;
  }
  function closeModal() { $("#modal").hidden = true; }

  // ---------- Meus agendamentos ----------
  function renderMyBookings() {
    var box = $("#myBookings");
    var agora = new Date();
    var futuros = loadBookings().filter(function (b) {
      var d = parseISO(b.dataISO); d.setHours(+b.horario.split(":")[0], +b.horario.split(":")[1], 0, 0);
      return d.getTime() >= agora.getTime() - 3600000;
    }).sort(function (a, b) { return (a.dataISO + a.horario).localeCompare(b.dataISO + b.horario); });

    if (!futuros.length) { box.innerHTML = '<p class="muted">Você ainda não tem agendamentos.</p>'; return; }

    box.innerHTML = "";
    futuros.forEach(function (b) {
      var card = el("div", "booking-card");
      card.innerHTML =
        '<div class="bc-title">' + b.servicoNome + " · " + bPrecoLabel(b) + "</div>" +
        '<div class="bc-when">' + formatDataLonga(b.dataISO) + " às " + b.horario + "</div>" +
        '<div class="bc-meta">' + b.profissionalNome + " · " + b.cliente + (b.obs ? " · " + b.obs : "") + "</div>" +
        '<div class="bc-actions">' +
          '<a class="btn btn-ghost" href="' + whatsLink(b) + '" target="_blank" rel="noopener">WhatsApp</a>' +
          '<button type="button" class="btn btn-danger" data-cancel="' + b.id + '">Cancelar</button>' +
        "</div>";
      box.appendChild(card);
    });
    $all("[data-cancel]", box).forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!confirm("Deseja cancelar este agendamento?")) return;
        saveBookings(loadBookings().filter(function (x) { return x.id !== btn.getAttribute("data-cancel"); }));
        renderMyBookings();
      });
    });
  }

  // ---------- Init ----------
  function init() {
    if (!CFG) { console.error("SHOP_CONFIG não encontrado."); return; }
    fillShopInfo();
    renderServices();
    renderPros();
    renderDays();
    renderMyBookings();
    updateTotal();
    goTo(1);

    $("#bookingForm").addEventListener("submit", onSubmit);
    $("#svcContinue").addEventListener("click", function () { if (state.servicos.length) advance(2); });
    $("#backBtn").addEventListener("click", function () { goTo(step - 1); });
    $all("[data-close]").forEach(function (n) { n.addEventListener("click", closeModal); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
