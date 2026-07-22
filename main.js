(function () {
  "use strict";

  /* ============ Helpers ============ */
  const data = window.__BRAND__ || {};
  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const escHTML = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]
  );
  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "] failed:", e); }
  }

  /* ============ Year ============ */
  function initYear() {
    const year = new Date().getFullYear();
    const y = $("#year");
    if (y) y.textContent = year;
    $$("[data-year]").forEach((el) => { el.textContent = year; });
  }

  /* ============ Cookies + mapa diferido (RGPD) ============
     El mapa de Google instala cookies de terceros: no se carga hasta que
     el usuario lo acepta expresamente. */
  const COOKIE_KEY = "tresabetos_cookies";

  function getConsent() {
    try { return localStorage.getItem(COOKIE_KEY); } catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(COOKIE_KEY, value); } catch (e) {}
  }

  function loadMap() {
    const wrap = $("[data-map]");
    if (!wrap || wrap.querySelector("iframe")) return;
    const src = wrap.getAttribute("data-map-src");
    if (!src) return;
    const iframe = document.createElement("iframe");
    iframe.title = "Ubicación de Casa Rural Tres Abetos en Becerril de la Sierra";
    iframe.src = src;
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.setAttribute("allowfullscreen", "");
    wrap.insertBefore(iframe, wrap.firstChild);
    const ph = $("[data-map-placeholder]", wrap);
    if (ph) ph.style.display = "none";
  }

  function initCookies() {
    const banner = $("[data-cookie-banner]");
    const consent = getConsent();

    if (consent === "accepted") loadMap();
    if (!consent && banner) banner.classList.add("is-open");

    function close() { if (banner) banner.classList.remove("is-open"); }

    const accept = $("[data-cookie-accept]");
    if (accept) accept.addEventListener("click", () => { setConsent("accepted"); close(); loadMap(); });

    const reject = $("[data-cookie-reject]");
    if (reject) reject.addEventListener("click", () => { setConsent("rejected"); close(); });

    // Botón del propio mapa: consentimiento expreso para cargarlo
    const mapBtn = $("[data-map-load]");
    if (mapBtn) mapBtn.addEventListener("click", () => { setConsent("accepted"); close(); loadMap(); });

    // Botón en la política de cookies para cambiar la decisión
    const resetBtn = $("[data-cookie-reset]");
    if (resetBtn) resetBtn.addEventListener("click", () => {
      try { localStorage.removeItem(COOKIE_KEY); } catch (e) {}
      resetBtn.textContent = "Preferencias borradas — se te preguntará de nuevo";
      resetBtn.disabled = true;
    });
  }

  /* ============ Splash ============ */
  function initSplash() {
    const splash = $("[data-splash]");
    if (!splash) return;
    const hide = () => {
      splash.classList.add("is-out");
      document.documentElement.classList.add("is-ready");
    };
    if (document.readyState === "complete") {
      setTimeout(hide, 700);
    } else {
      window.addEventListener("load", () => setTimeout(hide, 500));
    }
    setTimeout(hide, 4000);
  }

  /* ============ Nav (sticky transparent → solid) ============ */
  function initNav() {
    const nav = $(".nav");
    if (!nav) return;
    const onScroll = () => {
      if (scrollY > 60) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ============ Carrusel de bienvenida ============ */
  function initWelcomeCarousel() {
    const root = $("[data-carousel]");
    if (!root) return;
    const slides = $$(".welcome-slide", root);
    if (slides.length === 0) return;

    const prevBtn = $("[data-carousel-prev]", root);
    const nextBtn = $("[data-carousel-next]", root);
    const dotsWrap = $("[data-carousel-dots]", root);
    const INTERVAL = 10000; // 10 s por foto
    let index = slides.findIndex((s) => s.classList.contains("is-active"));
    if (index < 0) index = 0;
    let timer = null;

    // Puntitos indicadores
    const dots = slides.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Ir a la foto " + (i + 1));
      b.addEventListener("click", () => go(i, true));
      if (dotsWrap) dotsWrap.appendChild(b);
      return b;
    });

    function paint() {
      slides.forEach((s, i) => s.classList.toggle("is-active", i === index));
      dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
      // Reiniciar el zoom lento de la foto que entra
      const img = slides[index].querySelector("img");
      if (img) {
        img.style.animation = "none";
        // forzar reflow para reiniciar la animación CSS
        void img.offsetWidth;
        img.style.animation = "";
      }
    }

    function go(to, manual) {
      index = (to + slides.length) % slides.length;
      paint();
      if (manual) restart();
    }

    const next = (manual) => go(index + 1, manual);
    const prev = (manual) => go(index - 1, manual);

    function restart() {
      if (timer) clearInterval(timer);
      timer = setInterval(() => next(false), INTERVAL);
    }

    if (nextBtn) nextBtn.addEventListener("click", () => next(true));
    if (prevBtn) prevBtn.addEventListener("click", () => prev(true));

    // Pausa al pasar el ratón por encima
    root.addEventListener("mouseenter", () => { if (timer) clearInterval(timer); });
    root.addEventListener("mouseleave", restart);

    // Altura del carrusel: casi toda la pantalla (menos el menú fijo), para que
    // las fotos se recorten lo mínimo y se vean lo más grandes posible.
    function fit() {
      const nav = $(".nav");
      const navH = nav ? nav.offsetHeight : 0;
      const h = Math.max(420, window.innerHeight - navH - 8);
      root.style.setProperty("--welcome-h", h + "px");
    }
    fit();
    window.addEventListener("resize", fit, { passive: true });

    paint();
    restart();
  }

  /* ============ Mobile menu ============ */
  function initMobileMenu() {
    const burger = $("[data-nav-burger]");
    const menu = $("[data-nav-mobile]");
    if (!burger || !menu) return;
    const open = () => {
      burger.classList.add("is-open");
      burger.setAttribute("aria-expanded", "true");
      menu.setAttribute("aria-hidden", "false");
      document.body.classList.add("menu-open");
    };
    const close = () => {
      burger.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-hidden", "true");
      document.body.classList.remove("menu-open");
    };
    burger.addEventListener("click", () => {
      if (burger.classList.contains("is-open")) close();
      else open();
    });
    const closeBtn = $("[data-nav-close]");
    if (closeBtn) closeBtn.addEventListener("click", close);
    menu.addEventListener("click", (e) => {
      if (e.target.matches("a")) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && burger.classList.contains("is-open")) close();
    });
  }

  /* ============ Smooth anchors (native scrollTo) ============ */
  function initSmoothAnchors() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      const navOffset = 80;
      window.scrollTo({
        top: el.getBoundingClientRect().top + scrollY - navOffset,
        behavior: reduced ? "auto" : "smooth",
      });
    });
  }

  /* Cursor personalizado eliminado a propósito: su mix-blend-mode sobre las
     capas del hero (mesh + grain) forzaba recomponer toda la pila de blends a
     pantalla completa en cada mousemove y bloqueaba el puntero en equipos
     modestos. El cursor nativo es fluido y no resta nada al diseño. */

  /* ============ Reveals (IntersectionObserver) ============ */
  function initReveals() {
    const els = $$(".reveal, [data-reveal-mask]");
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-revealed");
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, {
      threshold: 0.01,
      rootMargin: "0px 0px -2% 0px",
    });
    els.forEach((el) => io.observe(el));

    // Safety net: at 6s reveal anything still hidden above the fold
    setTimeout(() => {
      $$(".reveal:not(.is-revealed), [data-reveal-mask]:not(.is-revealed)").forEach((el) => {
        if (el.getBoundingClientRect().top < innerHeight + 200) {
          el.classList.add("is-revealed");
          el.classList.add("is-visible");
        }
      });
    }, 6000);
  }

  /* ============ Count-up ============ */
  function initCountUp() {
    const els = $$("[data-count-to]");
    if (!els.length) return;
    els.forEach((el) => {
      const target = parseFloat(el.dataset.countTo);
      const decimals = (el.dataset.countTo.split(".")[1] || "").length;
      const obj = { v: 0 };
      const trigger = () => {
        if (window.gsap) {
          gsap.to(obj, {
            v: target,
            duration: 1.5,
            ease: "power2.out",
            onUpdate: () => { el.textContent = obj.v.toFixed(decimals); }
          });
        } else {
          el.textContent = target.toFixed(decimals);
        }
      };
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { trigger(); io.unobserve(e.target); }
        });
      }, { threshold: 0.05, rootMargin: "0px 0px -10% 0px" });
      io.observe(el);
      // Safety: at 6s, force-trigger anything still pending in viewport
      setTimeout(() => {
        if (el.textContent === "0" || parseFloat(el.textContent) === 0) {
          if (el.getBoundingClientRect().top < innerHeight) trigger();
        }
      }, 6000);
    });
  }

  /* ============ Split words (preserves <br> and <em>) ============ */
  function splitWords(el) {
    el.setAttribute("aria-label", el.textContent.trim().replace(/\s+/g, " "));
    const wrap = (text) => text.split(/(\s+)/).map((w) =>
      /^\s+$/.test(w) ? w : `<span class="split-word" aria-hidden="true">${escHTML(w)}</span>`
    ).join("");
    const html = Array.from(el.childNodes).map((node) => {
      if (node.nodeType === 3) return wrap(node.textContent);
      if (node.nodeName === "BR") return "<br>";
      if (node.nodeType === 1) {
        const tag = node.tagName.toLowerCase();
        return `<${tag}>${wrap(node.textContent)}</${tag}>`;
      }
      return "";
    }).join("");
    el.innerHTML = html;
    return el.querySelectorAll(".split-word");
  }

  function initSplitText() {
    if (!window.gsap || !window.ScrollTrigger) return;
    $$("[data-split]").forEach((el) => {
      const parts = splitWords(el);
      gsap.set(parts, { y: 28, opacity: 0 });
      gsap.to(parts, {
        y: 0,
        opacity: 1,
        duration: 0.95,
        stagger: 0.05,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });
  }

  /* Marquee: ahora es 100% CSS (animation: marqueeScroll en styles.css).
     Antes usaba GSAP con un modifier por frame, que sumaba carga a la GPU. */

  /* ============ Hero parallax ============
     Desactivado: el hero ya no lleva foto de fondo, solo el logo sobre blanco.
     El parallax lo desvanecía (opacity 0.2) al bajar, que aquí no aporta nada. */
  function initHeroParallax() {
    return;
    /* eslint-disable no-unreachable */
    if (!window.gsap || !window.ScrollTrigger) return;
    const heroBg = $(".hero-bg");
    const heroInner = $(".hero-inner");
    if (heroBg) {
      gsap.to(heroBg, {
        yPercent: 22,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }
    if (heroInner) {
      gsap.to(heroInner, {
        yPercent: -22,
        opacity: 0.2,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }
  }

  /* ============ Tilt 3D subtle (showcase + bento cards) ============ */
  function initTilt() {
    if (!fineHover) return;
    const cards = $$(".showcase-card, .bento-card");
    cards.forEach((card) => {
      const MAX = 5;
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      card.style.transformStyle = "preserve-3d";
      card.style.perspective = "1000px";

      const img = card.querySelector("img");
      function loop() {
        cx += (tx - cx) * 0.14;
        cy += (ty - cy) * 0.14;
        const t = `perspective(1000px) rotateX(${cx.toFixed(2)}deg) rotateY(${cy.toFixed(2)}deg)`;
        card.style.transform = (card.classList.contains("bento-card") && Math.abs(cx) < 0.05 && Math.abs(cy) < 0.05)
          ? ""
          : t;
        raf = (Math.abs(tx - cx) > 0.04 || Math.abs(ty - cy) > 0.04) ? requestAnimationFrame(loop) : null;
      }
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        tx = -py * MAX; ty = px * MAX;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      card.addEventListener("mouseleave", () => {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(loop);
      });
    });
  }

  /* ============ Magnetic buttons ============ */
  function initMagnetic() {
    if (!fineHover) return;
    $$("[data-magnetic]").forEach((el) => {
      const strength = parseFloat(el.dataset.magneticStrength || "0.25");
      // Wrap content
      if (!el.querySelector(".magnetic-inner")) {
        const inner = document.createElement("span");
        inner.className = "magnetic-inner";
        while (el.firstChild) inner.appendChild(el.firstChild);
        el.appendChild(inner);
        el.classList.add("has-magnetic");
      }
      const inner = el.querySelector(".magnetic-inner");
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        tx = ((e.clientX - r.left) - r.width / 2) * strength;
        ty = ((e.clientY - r.top) - r.height / 2) * strength;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      el.addEventListener("mouseleave", () => {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      function loop() {
        cx += (tx - cx) * 0.2;
        cy += (ty - cy) * 0.2;
        inner.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
        raf = (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) ? requestAnimationFrame(loop) : null;
      }
    });
  }

  /* ============ Lightbox galería ============ */
  function initLightbox() {
    const box = $("[data-lightbox]");
    if (!box) return;
    const imgEl = $("[data-lightbox-img]", box);
    const capEl = $("[data-lightbox-caption]", box);
    const counterEl = $("[data-lightbox-counter]", box);
    const btnClose = $("[data-lightbox-close]", box);
    const btnPrev = $("[data-lightbox-prev]", box);
    const btnNext = $("[data-lightbox-next]", box);
    if (!imgEl) return;

    // Galería bento: cada tarjeta es un ÁLBUM (data-images) de una estancia.
    const bentoCards = $$(".bento-card");
    const showcaseCards = $$(".showcase-card");
    const showcaseItems = showcaseCards.map((a) => {
      const im = a.querySelector("img");
      const h = a.querySelector("h3");
      return { src: im ? im.getAttribute("src") : "", cap: h ? h.textContent.trim() : "", alt: im ? im.alt : "" };
    });
    if (!bentoCards.length && !showcaseItems.length) return;
    let items = [];
    let idx = 0;
    let lastFocus = null;

    function render() {
      const it = items[idx];
      imgEl.src = it.src;
      imgEl.alt = it.alt;
      if (capEl) capEl.textContent = it.cap;
      if (counterEl) counterEl.textContent = (idx + 1) + " / " + items.length;
      // Precarga vecinos para que prev/next sea instantáneo
      [idx + 1, idx - 1].forEach((j) => {
        const pre = new Image();
        pre.src = items[(j + items.length) % items.length].src;
      });
    }
    function open(collection, i) {
      items = collection;
      idx = i;
      lastFocus = document.activeElement;
      render();
      box.classList.add("is-open");
      box.setAttribute("aria-hidden", "false");
      document.body.classList.add("lightbox-open");
      if (btnClose) btnClose.focus();
    }
    function close() {
      box.classList.remove("is-open");
      box.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lightbox-open");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function go(step) {
      idx = (idx + step + items.length) % items.length;
      render();
    }

    bentoCards.forEach((card) => {
      const album = card.getAttribute("data-album") || "";
      const names = (card.getAttribute("data-images") || "").split(",").map((s) => s.trim()).filter(Boolean);
      const list = names.length ? names : [(card.getAttribute("href") || "").replace("assets/img/", "")];
      const collection = list.map((name) => ({ src: "assets/img/" + name, cap: album, alt: album }));
      card.addEventListener("click", (e) => { e.preventDefault(); open(collection, 0); });
    });
    showcaseCards.forEach((a, i) => {
      a.addEventListener("click", () => open(showcaseItems, i));
    });
    if (btnClose) btnClose.addEventListener("click", close);
    if (btnPrev) btnPrev.addEventListener("click", () => go(-1));
    if (btnNext) btnNext.addEventListener("click", () => go(1));
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    document.addEventListener("keydown", (e) => {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    });
    // Swipe táctil
    let sx = 0;
    box.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ============ Boot ============ */
  function boot() {
    // Phase 1 — no dependencies
    safe(initYear, "initYear");
    safe(initCookies, "initCookies");
    safe(initSplash, "initSplash");
    safe(initNav, "initNav");
    safe(initWelcomeCarousel, "initWelcomeCarousel");
    safe(initMobileMenu, "initMobileMenu");
    safe(initSmoothAnchors, "initSmoothAnchors");
    safe(initReveals, "initReveals");
    safe(initCountUp, "initCountUp");
    safe(initTilt, "initTilt");
    safe(initMagnetic, "initMagnetic");
    safe(initLightbox, "initLightbox");

    // Phase 2 — GSAP dependent
    if (window.gsap) {
      try {
        if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
      } catch (_) {}
      safe(initSplitText, "initSplitText");
      safe(initHeroParallax, "initHeroParallax");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
