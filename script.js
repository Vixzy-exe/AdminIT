/* AdminIT — menu mobile, apparitions au scroll, formulaire de contact */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------------------------------------------------------
     Menu burger
     --------------------------------------------------------------- */
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');

  if (header && toggle && nav) {
    const desktop = window.matchMedia('(min-width: 821px)');
    const isOpen = () => header.classList.contains('is-open');

    const setOpen = (open) => {
      header.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    };

    toggle.addEventListener('click', () => setOpen(!isOpen()));

    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', (event) => {
      if (isOpen() && !header.contains(event.target)) setOpen(false);
    });

    desktop.addEventListener('change', (event) => {
      if (event.matches) setOpen(false);
    });
  }

  /* ---------------------------------------------------------------
     Apparitions au scroll
     --------------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  const show = (el) => el.classList.add('is-visible');
  const hasExplicitDelay = (el) => /(^|\s)d\d(\s|$)/.test(el.className);

  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    revealEls.forEach(show);
  } else {
    const observer = new IntersectionObserver((entries) => {
      // Les éléments qui apparaissent ensemble sont légèrement décalés
      let batch = 0;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (!hasExplicitDelay(el)) {
          el.style.setProperty('--reveal-delay', `${batch * 0.08}s`);
          batch += 1;
        }
        show(el);
        observer.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    revealEls.forEach((el) => observer.observe(el));
  }

  /* ---------------------------------------------------------------
     Formulaire de contact (Formspree)
     --------------------------------------------------------------- */
  const form = document.querySelector('[data-contact-form]');

  if (form) {
    const status = form.querySelector('[data-form-status]');
    const submit = form.querySelector('button[type="submit"]');
    const submitLabel = submit.textContent;

    const setStatus = (state, message) => {
      status.dataset.state = state;
      status.textContent = message;
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const action = form.getAttribute('action') || '';
      if (/\[.*\]/.test(action)) {
        console.warn('Formspree : remplacez [FORMSPREE_ID] dans l\'attribut action du formulaire (index.html).');
        setStatus('error', 'Le formulaire n\'est pas encore configuré. Écrivez-nous directement par e-mail.');
        return;
      }

      submit.disabled = true;
      submit.textContent = 'Envoi en cours…';
      setStatus('', '');

      try {
        const response = await fetch(action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });

        if (response.ok) {
          form.reset();
          setStatus('success', 'Merci ! Votre demande a bien été envoyée. Nous vous répondons sous 24 heures.');
        } else {
          setStatus('error', 'L\'envoi a échoué. Merci de réessayer ou de nous écrire directement par e-mail.');
        }
      } catch {
        setStatus('error', 'Connexion impossible. Vérifiez votre réseau ou écrivez-nous directement par e-mail.');
      } finally {
        submit.disabled = false;
        submit.textContent = submitLabel;
      }
    });
  }
})();
