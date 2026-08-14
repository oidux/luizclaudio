/* Fidelidade + Clube (assinatura) + navegação por abas — Luiz Claudio Barbearia
   Área de demonstração: dados de membro são fictícios e ficam no localStorage. */
(function () {
  "use strict";

  var CFG = window.SHOP_CONFIG || {};
  var MKEY = "lc_barbearia_membro_v1";

  function $(s, c) { return (c || document).querySelector(s); }
  function $all(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function el(t, cls, html) { var e = document.createElement(t); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function money(v) { return "R$ " + Number(v).toFixed(2).replace(".", ","); }
  var MON = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  function fmtData(iso) { var p = iso.split("-"); return (+p[2]) + " " + MON[(+p[1]) - 1] + " " + p[0]; }
  function hoje() { var d = new Date(); function p(n) { return n < 10 ? "0" + n : n; } return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }

  // ---------- Membro (demonstração) ----------
  function seed() {
    return {
      nome: "João", desde: "2024", selos: 7, resgatados: 2, assinatura: null,
      historico: [
        { data: "2026-08-02", servico: "Corte com Navalha", prof: "Luiz Cláudio", valor: 55 },
        { data: "2026-07-18", servico: "Corte + Barba", prof: "Luiz Cláudio", valor: 70 },
        { data: "2026-07-04", servico: "Corte de Cabelo", prof: "Luiz Cláudio", valor: 45 },
        { data: "2026-06-20", servico: "Corte de Cabelo", prof: "Luiz Cláudio", valor: 45 },
        { data: "2026-06-06", servico: "Barba", prof: "Luiz Cláudio", valor: 35 },
        { data: "2026-05-23", servico: "Corte de Cabelo", prof: "Luiz Cláudio", valor: 45 },
        { data: "2026-05-09", servico: "Corte + Barba", prof: "Luiz Cláudio", valor: 70 },
        { data: "2026-04-25", servico: "Corte grátis 🎁", prof: "Luiz Cláudio", valor: 0, gratis: true }
      ]
    };
  }
  function loadM() { try { var r = localStorage.getItem(MKEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function saveM(m) { try { localStorage.setItem(MKEY, JSON.stringify(m)); } catch (e) {} }
  var member = loadM() || seed();
  saveM(member);

  function meta() { return (CFG.fidelidade && CFG.fidelidade.meta) || 10; }

  // ---------- Navegação por abas ----------
  function switchView(name) {
    $(".app").setAttribute("data-view", name);
    $all(".view").forEach(function (v) { v.classList.toggle("is-active", v.id === "view-" + name); });
    $all(".tab").forEach(function (t) { t.classList.toggle("is-active", t.getAttribute("data-tab") === name); });
    if (name === "fidelidade") renderFidelidade();
    if (name === "clube") renderClube();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- Fidelidade ----------
  function renderFidelidade() {
    var m = member;
    $("#memberHero").innerHTML =
      '<div class="mh-avatar">' + m.nome.charAt(0) + "</div>" +
      '<div class="mh-info"><div class="mh-hi">Olá, ' + m.nome + " 👋</div>" +
      '<div class="mh-sub">Membro desde ' + m.desde + " · " + m.resgatados + " cortes grátis resgatados</div></div>";

    var faltam = Math.max(0, meta() - m.selos);
    var pronto = m.selos >= meta();
    var stamps = "";
    for (var i = 0; i < meta(); i++) {
      var filled = i < m.selos;
      stamps += '<div class="stamp' + (filled ? " is-filled" : "") + '">' + (filled ? "✂️" : (i + 1)) + "</div>";
    }
    $("#stampCard").innerHTML =
      '<div class="stamp-card">' +
        '<div class="sc-top"><span class="sc-title">Cartão Fidelidade</span>' +
          '<span class="sc-count">' + m.selos + "/" + meta() + "</span></div>" +
        '<p class="sc-rule">A cada ' + meta() + " cortes, o próximo é grátis.</p>" +
        '<div class="stamp-grid">' + stamps + "</div>" +
        (pronto
          ? '<div class="sc-ready">🎉 Você tem um corte grátis!</div><button type="button" class="btn btn-primary btn-block" id="redeemBtn">Resgatar corte grátis</button>'
          : '<p class="sc-faltam">Faltam <b>' + faltam + "</b> corte" + (faltam === 1 ? "" : "s") + " para o próximo grátis.</p>") +
      "</div>";
    if (pronto) $("#redeemBtn").addEventListener("click", redeem);

    var h = $("#historyList"); h.innerHTML = "";
    if (!m.historico.length) { h.innerHTML = '<p class="muted">Sem cortes ainda.</p>'; return; }
    m.historico.forEach(function (c) {
      h.appendChild(el("div", "hist-card",
        '<div class="hc-emoji">' + (c.gratis ? "🎁" : "✂️") + "</div>" +
        '<div class="hc-body"><div class="hc-serv">' + c.servico + "</div>" +
        '<div class="hc-meta">' + fmtData(c.data) + " · " + c.prof + "</div></div>" +
        '<div class="hc-val">' + (c.valor ? money(c.valor) : "Grátis") + "</div>"));
    });
  }
  function redeem() {
    member.selos -= meta(); if (member.selos < 0) member.selos = 0;
    member.resgatados += 1;
    member.historico.unshift({ data: hoje(), servico: "Corte grátis 🎁", prof: "Luiz Cláudio", valor: 0, gratis: true });
    saveM(member); renderFidelidade();
    showOk("🎉", "Corte grátis resgatado!", "Mostre esta tela no balcão para usar. Seu cartão de selos foi reiniciado.");
  }

  // ---------- Clube (assinatura) ----------
  var planoSel = null;
  function renderClube() {
    var st = $("#clubeStatus");
    if (member.assinatura) {
      st.innerHTML =
        '<div class="sub-active"><div><span class="sa-cap">Assinatura ativa</span>' +
        '<div class="sa-name">' + member.assinatura.planoNome + "</div>" +
        '<div class="sa-price">' + money(member.assinatura.preco) + "/mês · desde " + fmtData(member.assinatura.desde) + "</div></div>" +
        '<button type="button" class="btn btn-danger" id="cancelSub">Cancelar</button></div>';
      $("#cancelSub").addEventListener("click", function () {
        if (!confirm("Cancelar sua assinatura? (demonstração)")) return;
        member.assinatura = null; saveM(member); renderClube();
      });
    } else st.innerHTML = "";

    var wrap = $("#clubePlans"); wrap.innerHTML = "";
    (CFG.planos || []).forEach(function (pl) {
      var ativo = member.assinatura && member.assinatura.planoId === pl.id;
      var card = el("div", "plan" + (pl.destaque ? " is-featured" : "") + (ativo ? " is-current" : ""));
      card.innerHTML =
        (pl.destaque ? '<span class="plan-badge">Mais popular</span>' : "") +
        '<div class="plan-name">' + pl.nome + "</div>" +
        '<div class="plan-price">' + money(pl.preco) + "<span>/mês</span></div>" +
        '<ul class="plan-benes">' + pl.beneficios.map(function (b) { return "<li>" + b + "</li>"; }).join("") + "</ul>" +
        '<button type="button" class="btn ' + (pl.destaque ? "btn-primary" : "btn-outline") + ' btn-block plan-btn"' + (ativo ? " disabled" : "") + ">" + (ativo ? "Plano atual" : "Assinar") + "</button>";
      if (!ativo) card.querySelector(".plan-btn").addEventListener("click", function () { openCheckout(pl); });
      wrap.appendChild(card);
    });

    $("#clubePlansPanel").hidden = false;
    $("#clubeCheckoutPanel").hidden = true;
  }

  function openCheckout(pl) {
    planoSel = pl;
    $("#clubeCheckoutSub").textContent = pl.nome + " · " + money(pl.preco) + "/mês";
    $("#ccSubmit").textContent = "Assinar · " + money(pl.preco) + "/mês";
    $("#clubePlansPanel").hidden = true;
    $("#clubeCheckoutPanel").hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- Cartão de crédito (máscara + preview) ----------
  function digits(s) { return (s || "").replace(/\D/g, ""); }
  function brandOf(num) {
    if (/^4/.test(num)) return "VISA";
    if (/^(5[1-5]|2[2-7])/.test(num)) return "MASTERCARD";
    if (/^3[47]/.test(num)) return "AMEX";
    if (/^(4011|4312|4389|5041|5066|5067|509|6277|6362|6363|650|651|655)/.test(num)) return "ELO";
    if (/^6(011|5)/.test(num)) return "DISCOVER";
    return "CARTÃO";
  }
  function resetPreview() {
    $("#ccNumberView").textContent = "•••• •••• •••• ••••";
    $("#ccNameView").textContent = "NOME NO CARTÃO";
    $("#ccExpView").textContent = "MM/AA";
    $("#ccBrand").textContent = "CARTÃO";
  }
  function setupCC() {
    var num = $("#ccNumber"), name = $("#ccName"), exp = $("#ccExp"), cvv = $("#ccCvv");

    num.addEventListener("input", function () {
      var d = digits(num.value).slice(0, 16);
      num.value = d.replace(/(.{4})/g, "$1 ").trim();
      var pretty = "";
      for (var i = 0; i < 16; i++) { pretty += (i < d.length ? d[i] : "•"); if (i % 4 === 3 && i < 15) pretty += " "; }
      $("#ccNumberView").textContent = pretty;
      $("#ccBrand").textContent = brandOf(d);
    });
    name.addEventListener("input", function () { $("#ccNameView").textContent = (name.value || "NOME NO CARTÃO").toUpperCase(); });
    exp.addEventListener("input", function () {
      var d = digits(exp.value).slice(0, 4);
      exp.value = d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d;
      $("#ccExpView").textContent = exp.value || "MM/AA";
    });
    cvv.addEventListener("input", function () { cvv.value = digits(cvv.value).slice(0, 4); });

    $("#ccForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var err = $("#ccError"); err.hidden = true;
      var d = digits(num.value), em = exp.value, problems = [];
      if (d.length < 13) problems.push("número do cartão");
      if (!name.value.trim()) problems.push("nome do titular");
      if (!/^\d{2}\/\d{2}$/.test(em) || +em.slice(0, 2) < 1 || +em.slice(0, 2) > 12) problems.push("validade");
      if (digits(cvv.value).length < 3) problems.push("CVV");
      if (problems.length) { err.textContent = "Confira: " + problems.join(", ") + "."; err.hidden = false; return; }

      member.assinatura = { planoId: planoSel.id, planoNome: planoSel.nome, preco: planoSel.preco, desde: hoje() };
      saveM(member);
      $("#ccForm").reset(); resetPreview();
      renderClube();
      showOk("✓", "Assinatura ativada!", "Bem-vindo ao " + planoSel.nome + "! (demonstração — nenhuma cobrança real foi feita)");
    });
  }

  // ---------- Sheet de sucesso genérico ----------
  function showOk(icon, title, body) {
    $("#okIcon").textContent = icon;
    $("#okTitle").textContent = title;
    $("#okBody").innerHTML = '<p class="ok-text">' + body + "</p>";
    $("#okSheet").hidden = false;
  }

  // ---------- Init ----------
  function init() {
    $all(".tab").forEach(function (t) { t.addEventListener("click", function () { switchView(t.getAttribute("data-tab")); }); });
    $all("[data-close-ok]").forEach(function (n) { n.addEventListener("click", function () { $("#okSheet").hidden = true; }); });
    $("#clubeBack").addEventListener("click", function () {
      $("#clubePlansPanel").hidden = false; $("#clubeCheckoutPanel").hidden = true; window.scrollTo({ top: 0 });
    });
    setupCC();
    renderFidelidade();
    renderClube();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
