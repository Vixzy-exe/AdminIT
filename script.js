(function () {
  var top = document.getElementById("top");
  function onScroll() { top.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  var EMAIL = "info@adminit.support";
  var copy = document.getElementById("copy");
  copy.addEventListener("click", function () {
    function done() { copy.textContent = "Copié"; setTimeout(function () { copy.textContent = "Copier"; }, 1800); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(EMAIL).then(done, function () { selectMail(); });
    } else { selectMail(); }
  });
  function selectMail() {
    var r = document.createRange(); r.selectNodeContents(document.getElementById("mail"));
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  var form = document.getElementById("form"), sent = document.getElementById("sent");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var bad = Array.prototype.filter.call(form.querySelectorAll("[required]"), function (el) { return !el.checkValidity(); });
    if (bad.length) {
      bad[0].focus();
      sent.hidden = false;
      sent.textContent = bad[0].type === "email" && bad[0].value ? "L’adresse e-mail semble incomplète." : "Merci de remplir le nom, l’e-mail et votre besoin.";
      return;
    }
    var d = new FormData(form);
    var who = d.get("entreprise") ? d.get("entreprise") : d.get("nom");
    var subject = "Demande d’audit · " + who;
    var body = "Nom : " + d.get("nom") + "\nEntreprise : " + (d.get("entreprise") || "–") + "\nE-mail : " + d.get("email") + "\n\n" + d.get("message");
    window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    sent.hidden = false;
    sent.textContent = "Votre messagerie s’ouvre avec la demande. Il ne reste qu’à l’envoyer.";
  });
})();
