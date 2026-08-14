/* Portal de agendamento — Luiz Claudio Barbearia */
(function () {
  "use strict";

  var CFG = window.SHOP_CONFIG;
  var STORAGE_KEY = "lc_barbearia_agendamentos_v1";

  var DOW_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  var DOW_LONG = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  var MON_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  // Estado da seleção
  var state = {
    servico: null,
    profissional: null,
    dataISO: null,   // "YYY-MM-DD"
    horario: null,   // "HH:MM"
  };

  // ---------- Utilidades ----------
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function money(v) {
    return "R$ " + v.toFixed(2).replace(".", ",");
  }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function isoDate(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseISO(iso) {
    var p = iso.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function toMinutes(hhmm) {
    var p = hhmm.split(":");
    return (+p[0]) * 60 + (+p[1]);
  }
  function fromMinutes(min) {
    return pad(Math.floor(min / 60)) + ":" + pad(min % 60);
  }
  function svcById(id) {
    for (var i = 0; i < CFG.servicos.length; i++) if (CFG.servicos[i].id === id) return CFG.servicos[i];
    return null;
  }
  function proById(id) {
    for (var i = 0; i < CFG.profissionais.length; i++) if (CFG.profissionais[i].id === id) return CFG.profissionais[i];
    return null;
  }

  // ---------- Armazenamento ----------
  function loadBookings() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function saveBookings(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) {}
  }

  // ---------- Cabeçalho / infos ----------
  function fillShopInfo() {
    document.title = "Agendamento — " + CFG.nome;
    $("#brandName").textContent = CFG.nome;
    $("#brandTagline").textContent = "Agendamento online";
    $(".brand-mark").textContent = CFG.monograma || "✂";
    $("#heroSlogan").textContent = CFG.slogan;
    $("#infoEndereco").textContent = CFG.endereco + " · " + CFG.cidade;
    $("#infoTelefone").textContent = CFG.telefone;
    $("#infoHorario").textContent = resumoHorario();
    $("#footerBrand").textContent = CFG.nome;
    $("#footerEndereco").textContent = CFG.endereco + " · " + CFG.cidade;

    var maps = $("#mapsLink");
    if (CFG.mapsUrl) maps.href = CFG.mapsUrl; else maps.style.display = "none";

    // eyebrow com avaliação, se houver
    if (CFG.avaliacao) {
      var eyebrow = $(".hero-eyebrow");
      eyebrow.textContent = "★ " + CFG.avaliacao + " · " + CFG.numAvaliacoes + " avaliações";
    }
  }

  function resumoHorario() {
    // Agrupa de forma simples: mostra faixa dos dias úteis + sábado
    var seg = CFG.horarios[1];
    var sab = CFG.horarios[6];
    var txt = [];
    if (seg) txt.push("Seg a Sex " + seg.abre + "–" + seg.fecha);
    if (sab) txt.push("Sáb " + sab.abre + "–" + sab.fecha);
    return txt.join(" · ") || "Consulte horários";
  }

  // ---------- Passo 1: serviços ----------
  function renderServices() {
    var grid = $("#servicesGrid");
    grid.innerHTML = "";
    CFG.servicos.forEach(function (s) {
      var label = el("label", "option");
      label.innerHTML =
        '<input type="radio" name="servico" value="' + s.id + '">' +
        '<span class="opt-name">' + s.nome + "</span>" +
        '<span class="opt-meta">' + s.duracao + " min</span>" +
        '<span class="opt-price">' + money(s.preco) + "</span>";
      label.querySelector("input").addEventListener("change", function () {
        state.servico = s.id;
        markSelected(grid, label);
        state.horario = null;
        renderSlots();
        updateSummary();
      });
      grid.appendChild(label);
    });
  }

  // ---------- Passo 2: profissionais ----------
  function renderPros() {
    var grid = $("#prosGrid");
    grid.innerHTML = "";
    CFG.profissionais.forEach(function (p) {
      var label = el("label", "option");
      label.innerHTML =
        '<input type="radio" name="profissional" value="' + p.id + '">' +
        '<span class="opt-name">' + p.nome + "</span>" +
        '<span class="opt-meta">' + p.especialidade + "</span>";
      label.querySelector("input").addEventListener("change", function () {
        state.profissional = p.id;
        markSelected(grid, label);
        updateSummary();
      });
      grid.appendChild(label);
    });
  }

  function markSelected(grid, chosen) {
    var opts = grid.querySelectorAll(".option");
    for (var i = 0; i < opts.length; i++) opts[i].classList.remove("is-selected");
    chosen.classList.add("is-selected");
  }

  // ---------- Passo 3: dias ----------
  function renderDays() {
    var scroller = $("#daysScroller");
    scroller.innerHTML = "";
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    for (var i = 0; i < CFG.diasDisponiveis; i++) {
      var d = new Date(today);
      d.setDate(today.getDate() + i);
      var dow = d.getDay();
      var aberto = !!CFG.horarios[dow];

      var day = el("div", "day" + (aberto ? "" : " is-disabled"));
      day.innerHTML =
        '<div class="day-dow">' + DOW_SHORT[dow] + "</div>" +
        '<div class="day-num">' + d.getDate() + "</div>" +
        '<div class="day-mon">' + MON_SHORT[d.getMonth()] + "</div>";

      if (aberto) {
        (function (iso, node) {
          node.addEventListener("click", function () {
            state.dataISO = iso;
            state.horario = null;
            var all = scroller.querySelectorAll(".day");
            for (var j = 0; j < all.length; j++) all[j].classList.remove("is-selected");
            node.classList.add("is-selected");
            renderSlots();
            updateSummary();
          });
        })(isoDate(d), day);
      }
      scroller.appendChild(day);
    }
  }

  // ---------- Passo 4: horários ----------
  function renderSlots() {
    var grid = $("#slotsGrid");
    grid.innerHTML = "";

    if (!state.dataISO) {
      grid.appendChild(el("p", "muted slots-empty", "Selecione uma data para ver os horários."));
      return;
    }
    if (!state.servico) {
      grid.appendChild(el("p", "muted slots-empty", "Selecione um serviço para ver os horários."));
      return;
    }

    var d = parseISO(state.dataISO);
    var horario = CFG.horarios[d.getDay()];
    if (!horario) {
      grid.appendChild(el("p", "muted slots-empty", "Fechado neste dia."));
      return;
    }

    var svc = svcById(state.servico);
    var abre = toMinutes(horario.abre);
    var fecha = toMinutes(horario.fecha);
    var passo = CFG.intervaloMinutos;

    // horário atual para bloquear slots passados no dia de hoje
    var agora = new Date();
    var ehHoje = isoDate(agora) === state.dataISO;
    var minutoAgora = agora.getHours() * 60 + agora.getMinutes();

    // slots já ocupados para este profissional/data
    var ocupados = ocupadosPara(state.dataISO, state.profissional);

    var criados = 0;
    for (var t = abre; t + svc.duracao <= fecha; t += passo) {
      var hhmm = fromMinutes(t);
      var btn = el("button", "slot");
      btn.type = "button";
      btn.textContent = hhmm;

      var passado = ehHoje && t <= minutoAgora;
      var conflita = ocupados.indexOf(hhmm) !== -1;

      if (passado || conflita) {
        btn.disabled = true;
        btn.title = conflita ? "Horário indisponível" : "Horário já passou";
      } else {
        (function (hh, node) {
          node.addEventListener("click", function () {
            state.horario = hh;
            var all = grid.querySelectorAll(".slot");
            for (var k = 0; k < all.length; k++) all[k].classList.remove("is-selected");
            node.classList.add("is-selected");
            updateSummary();
          });
        })(hhmm, btn);
      }
      grid.appendChild(btn);
      criados++;
    }

    if (criados === 0) {
      grid.appendChild(el("p", "muted slots-empty", "Nenhum horário disponível para este serviço neste dia."));
    }
  }

  // horários ocupados (mesmo profissional OU quando 'sem preferência')
  function ocupadosPara(dataISO, profId) {
    var list = loadBookings();
    var res = [];
    list.forEach(function (b) {
      if (b.dataISO !== dataISO) return;
      // bloqueia se for o mesmo profissional escolhido, ou se qualquer um selecionou "sem preferência"
      if (profId && profId !== "qualquer" && b.profissionalId !== profId && b.profissionalId !== "qualquer") return;
      res.push(b.horario);
    });
    return res;
  }

  // ---------- Resumo ----------
  function updateSummary() {
    var box = $("#summary");
    if (!state.servico && !state.profissional && !state.dataISO && !state.horario) {
      box.hidden = true;
      return;
    }
    var svc = svcById(state.servico);
    var pro = proById(state.profissional);
    var rows = "";

    if (svc) rows += sumRow("Serviço", svc.nome + " (" + svc.duracao + " min)");
    if (pro) rows += sumRow("Profissional", pro.nome);
    if (state.dataISO) rows += sumRow("Data", formatDataLonga(state.dataISO));
    if (state.horario) rows += sumRow("Horário", state.horario);
    if (svc) rows += '<div class="sum-row sum-total"><span>Total</span><span>' + money(svc.preco) + "</span></div>";

    box.innerHTML = rows;
    box.hidden = false;
  }
  function sumRow(k, v) {
    return '<div class="sum-row"><span>' + k + "</span><span>" + v + "</span></div>";
  }
  function formatDataLonga(iso) {
    var d = parseISO(iso);
    return DOW_LONG[d.getDay()] + ", " + d.getDate() + " de " + nomeMes(d.getMonth()) + " de " + d.getFullYear();
  }
  function nomeMes(m) {
    return ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"][m];
  }

  // ---------- Submit ----------
  function onSubmit(e) {
    e.preventDefault();
    var errBox = $("#formError");
    errBox.hidden = true;

    var nome = $("#fldNome").value.trim();
    var tel = $("#fldTelefone").value.trim();
    var obs = $("#fldObs").value.trim();

    var faltando = [];
    if (!state.servico) faltando.push("um serviço");
    if (!state.profissional) faltando.push("um profissional");
    if (!state.dataISO) faltando.push("uma data");
    if (!state.horario) faltando.push("um horário");
    if (!nome) faltando.push("seu nome");
    if (!tel) faltando.push("seu telefone");

    if (faltando.length) {
      errBox.textContent = "Por favor, selecione/preencha: " + faltando.join(", ") + ".";
      errBox.hidden = false;
      errBox.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // re-checa conflito no momento da confirmação
    if (ocupadosPara(state.dataISO, state.profissional).indexOf(state.horario) !== -1) {
      errBox.textContent = "Ops! Esse horário acabou de ser reservado. Escolha outro, por favor.";
      errBox.hidden = false;
      state.horario = null;
      renderSlots();
      return;
    }

    var svc = svcById(state.servico);
    var pro = proById(state.profissional);

    var booking = {
      id: "ag_" + isoDate(new Date()).replace(/-/g, "") + "_" + state.horario.replace(":", "") + "_" + Math.floor(Math.random() * 1e4),
      criadoEm: new Date().toISOString(),
      servicoId: svc.id,
      servicoNome: svc.nome,
      preco: svc.preco,
      duracao: svc.duracao,
      profissionalId: pro.id,
      profissionalNome: pro.nome,
      dataISO: state.dataISO,
      horario: state.horario,
      cliente: nome,
      telefone: tel,
      obs: obs,
    };

    var list = loadBookings();
    list.push(booking);
    saveBookings(list);

    showConfirmation(booking);
    renderMyBookings();
    resetForm();
  }

  function resetForm() {
    $("#bookingForm").reset();
    state = { servico: null, profissional: null, dataISO: null, horario: null };
    document.querySelectorAll(".option.is-selected, .day.is-selected").forEach(function (n) {
      n.classList.remove("is-selected");
    });
    renderSlots();
    $("#summary").hidden = true;
  }

  // ---------- Confirmação (modal) ----------
  function showConfirmation(b) {
    var body = $("#modalBody");
    body.innerHTML =
      mbRow("Serviço", b.servicoNome) +
      mbRow("Profissional", b.profissionalNome) +
      mbRow("Data", formatDataLonga(b.dataISO)) +
      mbRow("Horário", b.horario) +
      mbRow("Cliente", b.cliente) +
      mbRow("Valor", money(b.preco));

    $("#modalWhats").href = whatsLink(b);
    $("#modal").hidden = false;
  }
  function mbRow(k, v) {
    return '<div class="mb-row"><span>' + k + "</span><span>" + v + "</span></div>";
  }
  function whatsLink(b) {
    var msg =
      "Olá! Gostaria de confirmar meu agendamento na " + CFG.nome + ":%0A" +
      "• Serviço: " + b.servicoNome + "%0A" +
      "• Profissional: " + b.profissionalNome + "%0A" +
      "• Data: " + formatDataLonga(b.dataISO) + "%0A" +
      "• Horário: " + b.horario + "%0A" +
      "• Nome: " + encodeURIComponent(b.cliente) +
      (b.obs ? "%0A• Obs: " + encodeURIComponent(b.obs) : "");
    return "https://wa.me/" + CFG.whatsapp + "?text=" + msg;
  }
  function closeModal() { $("#modal").hidden = true; }

  // ---------- Meus agendamentos ----------
  function renderMyBookings() {
    var box = $("#myBookings");
    var list = loadBookings().slice().sort(function (a, b) {
      return (a.dataISO + a.horario).localeCompare(b.dataISO + b.horario);
    });

    // remove passados? Mostra todos, mas marca próximos primeiro. Aqui filtramos passados.
    var agora = new Date();
    var futuros = list.filter(function (b) {
      var d = parseISO(b.dataISO);
      d.setHours(+b.horario.split(":")[0], +b.horario.split(":")[1], 0, 0);
      return d.getTime() >= agora.getTime() - 60 * 60 * 1000; // tolera 1h
    });

    if (!futuros.length) {
      box.innerHTML = '<p class="muted">Você ainda não tem agendamentos.</p>';
      return;
    }

    box.innerHTML = "";
    futuros.forEach(function (b) {
      var card = el("div", "booking-card");
      card.innerHTML =
        '<div class="bc-main">' +
          '<div class="bc-title">' + b.servicoNome + " · " + money(b.preco) + "</div>" +
          '<div class="bc-when">' + formatDataLonga(b.dataISO) + " às " + b.horario + "</div>" +
          '<div class="bc-meta">' + b.profissionalNome + " · " + b.cliente + (b.obs ? " · " + b.obs : "") + "</div>" +
        "</div>" +
        '<div class="bc-actions">' +
          '<a class="btn btn-ghost" href="' + whatsLink(b) + '" target="_blank" rel="noopener">WhatsApp</a>' +
          '<button class="btn-danger" data-cancel="' + b.id + '">Cancelar</button>' +
        "</div>";
      box.appendChild(card);
    });

    box.querySelectorAll("[data-cancel]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-cancel");
        if (!confirm("Deseja cancelar este agendamento?")) return;
        var updated = loadBookings().filter(function (x) { return x.id !== id; });
        saveBookings(updated);
        renderMyBookings();
        renderSlots(); // libera o horário
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
    renderSlots();
    renderMyBookings();

    $("#bookingForm").addEventListener("submit", onSubmit);
    document.querySelectorAll("[data-close]").forEach(function (n) {
      n.addEventListener("click", closeModal);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
