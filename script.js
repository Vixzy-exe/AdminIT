/* AdminIT — navigation, apparitions au scroll, vidéo, formulaire de contact */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 960px)');

  /* ---------------------------------------------------------------
     Menu burger
     --------------------------------------------------------------- */
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');

  if (header && toggle && nav) {
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
     Goutte de navigation : suit le lien survolé, sinon la section
     en cours de lecture (bureau uniquement)
     --------------------------------------------------------------- */
  const linksWrap = document.querySelector('.nav-links');
  const indicator = document.querySelector('.nav-indicator');
  const navLinks = linksWrap ? Array.from(linksWrap.querySelectorAll('a')) : [];
  let currentLink = null;
  let hoveredLink = null;

  const placeIndicator = (link) => {
    if (!indicator) return;
    if (!link || !desktop.matches) {
      indicator.classList.remove('is-visible');
      return;
    }
    // Si la goutte était cachée, elle réapparaît sur place sans glisser
    const appearing = !indicator.classList.contains('is-visible');
    if (appearing) indicator.classList.add('is-instant');
    indicator.style.setProperty('--x', `${link.offsetLeft}px`);
    indicator.style.setProperty('--w', `${link.offsetWidth}px`);
    if (appearing) {
      void indicator.offsetWidth;
      indicator.classList.remove('is-instant');
    }
    indicator.classList.add('is-visible');
  };

  navLinks.forEach((link) => {
    const target = () => {
      hoveredLink = link;
      placeIndicator(link);
    };
    link.addEventListener('pointerenter', target);
    link.addEventListener('focus', target);
  });

  if (linksWrap) {
    linksWrap.addEventListener('pointerleave', () => {
      hoveredLink = null;
      placeIndicator(currentLink);
    });
    linksWrap.addEventListener('focusout', (event) => {
      if (linksWrap.contains(event.relatedTarget)) return;
      hoveredLink = null;
      placeIndicator(currentLink);
    });
  }

  desktop.addEventListener('change', () => placeIndicator(hoveredLink || currentLink));

  // Sections suivies : uniquement les ancres de la page courante
  const spyTargets = navLinks
    .filter((link) => (link.getAttribute('href') || '').startsWith('#'))
    .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
    .filter((target) => target.section);

  /* ---------------------------------------------------------------
     Mise à jour au défilement (une fois par image)
     --------------------------------------------------------------- */
  let ticking = false;

  const update = () => {
    ticking = false;
    const viewport = window.innerHeight;

    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);

    // Section en cours : celle qui traverse la ligne à 40 % de l'écran
    const probe = viewport * 0.4;
    let found = null;
    spyTargets.forEach(({ link, section }) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= probe && rect.bottom > probe) found = link;
    });
    if (found !== currentLink) {
      if (currentLink) currentLink.classList.remove('is-current');
      if (found) found.classList.add('is-current');
      currentLink = found;
      if (!hoveredLink) placeIndicator(currentLink);
    }
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();

  // Les polices modifient la largeur des liens : on recale la goutte
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => placeIndicator(hoveredLink || currentLink));
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
     Vidéo de présentation : aperçu muet en boucle tant qu'elle est
     à l'écran, lecture complète avec le son à la demande
     --------------------------------------------------------------- */
  const player = document.querySelector('[data-video]');
  const video = player ? player.querySelector('video') : null;

  if (video) {
    const playButton = player.querySelector('[data-video-play]');
    const playLabel = player.querySelector('[data-video-play-label]');
    const toggleButton = player.querySelector('[data-video-toggle]');
    const soundButton = player.querySelector('[data-video-sound]');
    const soundLabel = player.querySelector('[data-video-sound-label]');
    const progressBar = player.querySelector('[data-video-progress]');
    const sources = Array.from(video.querySelectorAll('source'));
    const saveData = Boolean(navigator.connection && navigator.connection.saveData);

    let watching = false;       // le visiteur a demandé la lecture avec le son
    let pausedByUser = false;

    // Les commandes maison remplacent celles du navigateur
    video.removeAttribute('controls');
    video.loop = true;

    // Format adapté à l'écran : vertical sur téléphone, 16:9 ailleurs
    const applySource = () => {
      const source = sources.find((s) => !s.media || window.matchMedia(s.media).matches) || sources[0];
      const src = source.getAttribute('src');
      if (video.getAttribute('src') === src) return;
      const time = video.currentTime;
      const wasPlaying = !video.paused;
      video.poster = source.dataset.poster;
      video.src = src;
      if (time) video.addEventListener('loadedmetadata', () => { video.currentTime = time; }, { once: true });
      if (wasPlaying) video.play().catch(() => {});
    };

    applySource();
    sources.forEach((source) => {
      if (source.media) window.matchMedia(source.media).addEventListener('change', applySource);
    });

    // Lecture refusée par le navigateur : le bouton « Regarder » reste affiché
    const play = () => video.play().catch(() => {});

    const render = () => {
      player.classList.toggle('is-playing', !video.paused);
      player.classList.toggle('is-muted', video.muted);
      toggleButton.setAttribute('aria-label', video.paused ? 'Lire la vidéo' : 'Mettre la vidéo en pause');
      let sound = 'Regarder avec le son';
      if (watching) sound = video.muted ? 'Activer le son' : 'Couper le son';
      soundLabel.textContent = sound;
    };

    // Barre de progression, rafraîchie à chaque image pendant la lecture
    let progressFrame = 0;
    const drawProgress = () => {
      const ratio = video.duration ? video.currentTime / video.duration : 0;
      progressBar.style.transform = `scaleX(${ratio})`;
      progressFrame = video.paused ? 0 : window.requestAnimationFrame(drawProgress);
    };

    const watchWithSound = () => {
      watching = true;
      pausedByUser = false;
      video.loop = false;
      video.muted = false;
      video.currentTime = 0;
      play();
      render();
    };

    const togglePlay = () => {
      pausedByUser = !video.paused;
      if (video.paused) play();
      else video.pause();
    };

    ['play', 'pause', 'volumechange'].forEach((type) => video.addEventListener(type, render));
    ['play', 'seeked'].forEach((type) => video.addEventListener(type, () => {
      if (!progressFrame) drawProgress();
    }));

    video.addEventListener('playing', () => player.classList.add('is-started'));
    video.addEventListener('ended', () => {
      player.classList.remove('is-started');
      playLabel.textContent = 'Revoir la vidéo';
    });

    playButton.addEventListener('click', watchWithSound);
    toggleButton.addEventListener('click', togglePlay);

    // Depuis l'aperçu muet, le son relance la vidéo depuis le début
    soundButton.addEventListener('click', () => {
      if (!watching) watchWithSound();
      else video.muted = !video.muted;
    });

    video.addEventListener('click', () => {
      if (!watching) watchWithSound();
      else togglePlay();
    });

    // Pause dès que la vidéo quitte l'écran ; l'aperçu muet reprend à son retour
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) {
          video.pause();
          return;
        }
        if (!watching && !pausedByUser && !reduceMotion.matches && !saveData) play();
      }, { threshold: 0.5 }).observe(player);
    }

    render();
  }

  /* ---------------------------------------------------------------
     Contrats : le bouton d'un contrat pré-remplit le message
     (seulement si le champ est vide ou contient encore ce texte)
     --------------------------------------------------------------- */
  const message = document.getElementById('f-msg');

  if (message) {
    let lastPrefill = '';
    document.querySelectorAll('[data-plan]').forEach((link) => {
      link.addEventListener('click', () => {
        const text = `Bonjour, le contrat ${link.dataset.plan} m'intéresse. `;
        if (message.value.trim() === '' || message.value === lastPrefill) {
          message.value = text;
          lastPrefill = text;
        }
      });
    });
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
