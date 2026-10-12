/* AdminIT — en-tête, menu mobile, apparitions au scroll, formulaire */
(function () {
  "use strict";
  var EMAIL = "info@adminit.support";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* en-tête qui se resserre au scroll */
  var top = document.getElementById("top");
  if (top) {
    var onScroll = function () { top.classList.toggle("scrolled", window.scrollY > 10); };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  /* menu mobile */
  var burger = document.querySelector(".burger"), nav = document.getElementById("nav");
  if (top && burger && nav) {
    var setOpen = function (open) {
      top.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    };
    burger.addEventListener("click", function () { setOpen(!top.classList.contains("open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && top.classList.contains("open")) { setOpen(false); burger.focus(); } });
    document.addEventListener("click", function (e) { if (top.classList.contains("open") && !top.contains(e.target)) setOpen(false); });
  }

  /* surligneur du titre */
  var mk1 = document.getElementById("mk1");
  if (mk1) setTimeout(function () { mk1.classList.add("on"); }, reduce ? 0 : 900);

  /* apparitions au scroll */
  var targets = Array.prototype.slice.call(document.querySelectorAll(".rv, #steps, #van, #mk2"));
  var show = function (el) { el.classList.add(el.classList.contains("mk") ? "on" : "in"); };
  if (reduce || !("IntersectionObserver" in window)) {
    targets.forEach(show);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        if (el.id === "mk2") setTimeout(function () { show(el); }, 450); else show(el);
        io.unobserve(el);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* copier l'adresse */
  var copy = document.getElementById("copy"), mail = document.getElementById("mail");
  if (copy && mail) {
    var done = function () { copy.textContent = "Copié"; copy.classList.add("ok"); setTimeout(function () { copy.textContent = "Copier"; copy.classList.remove("ok"); }, 1800); };
    var select = function () { var r = document.createRange(); r.selectNodeContents(mail); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); };
    copy.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(EMAIL).then(done, select); else select();
    });
  }

  /* formulaire : ouvre la messagerie avec la demande rédigée */
  var form = document.getElementById("form"), sent = document.getElementById("sent");
  var CK = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#0E7C70"/><path d="M7 12.5l3.2 3.2L17 8.8" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var say = function (msg, err) {
    sent.className = "sent" + (err ? " err" : "");
    sent.innerHTML = (err ? "" : CK) + "<span></span>";
    sent.lastChild.textContent = msg;
  };
  if (form && sent) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = Array.prototype.filter.call(form.querySelectorAll("[required]"), function (el) { return !el.checkValidity(); });
      if (bad.length) {
        bad[0].focus();
        say(bad[0].type === "email" && bad[0].value ? "L’adresse e-mail semble incomplète." : "Merci de remplir le nom, l’e-mail et votre besoin.", true);
        return;
      }
      var d = new FormData(form);
      var who = d.get("entreprise") || d.get("nom");
      var subject = "Demande d’audit · " + who;
      var body = "Nom : " + d.get("nom") + "\nEntreprise : " + (d.get("entreprise") || "–") + "\nE-mail : " + d.get("email") + "\n\n" + d.get("message");
      window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      say("Votre messagerie s’ouvre avec la demande. Il ne reste qu’à l’envoyer.");
    });
  }
})();
