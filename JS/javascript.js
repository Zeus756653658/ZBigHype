// Billing X — micro interactions + smooth reveal + mouse glow
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Update mouse-tracked glow for primary buttons & header
  function bindMouseGlow() {
    const trackables = $$(".btn-primary[data-mx], header[data-glow], .site-header[data-glow]");

    // Prefer matching by presence; also bind to any .btn-primary
    const buttons = $$(".btn-primary");
    const header = $(".site-header[data-glow]");
    const all = buttons.concat(header ? [header] : []);

    all.forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width) * 100;
        const my = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty("--mx", mx + "%");
        el.style.setProperty("--my", my + "%");
      });
    });
  }

  // Reveal on scroll
  function bindReveal() {
    const nodes = $$("[data-reveal]");
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const ent of entries) {
          if (ent.isIntersecting) {
            ent.target.classList.add("is-revealed");
            io.unobserve(ent.target);
          }
        }
      },
      { threshold: 0.18 }
    );

    nodes.forEach((n) => io.observe(n));
  }

  // Nav toggle (mobile)
  function bindNavToggle() {
    const btn = $("[data-nav-toggle]");
    const nav = document.querySelector(".nav");
    if (!btn || !nav) return;

    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", (!expanded).toString());
      nav.style.display = expanded ? "none" : "flex";
      nav.style.flexDirection = "column";
      nav.style.position = "absolute";
      nav.style.right = "16px";
      nav.style.top = "68px";
      nav.style.padding = "12px";
      nav.style.gap = "10px";
      nav.style.borderRadius = "16px";
      nav.style.background = "rgba(0,0,0,.6)";
      nav.style.border = "1px solid rgba(255,255,255,.10)";
      nav.style.backdropFilter = "blur(14px)";
      nav.style.zIndex = "60";
    });
  }

  // Copy download link (works with future URL replacement)
  function bindCopyLink() { 
    const copyBtn = $("[data-copy-link]");
    const dl = $("#downloadBtn");
    if (!copyBtn || !dl) return;

    copyBtn.addEventListener("click", async () => {
      const href = dl.getAttribute("href") || "#";
      try {
        await navigator.clipboard.writeText(href);
        copyBtn.textContent = "Copied!";
        setTimeout(() => (copyBtn.textContent = "Copy download link"), 1200);
      } catch (e) {
        alert("Copy failed. Please copy manually: " + href);
      }
    });
  }

  // Animated counters
  function bindCounters() {
    const nodes = $$('[data-count]');
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const ent of entries) {
          if (!ent.isIntersecting) continue;
          const el = ent.target;
          const end = parseFloat(el.getAttribute('data-count'));
          if (!Number.isFinite(end)) continue;

          const rawText = (el.textContent || '').trim();
          const decimals = String(el.getAttribute('data-count')).includes('.') ? String(el.getAttribute('data-count')).split('.')[1]?.length || 0 : 0;

          const start = 0;
          const duration = 950;
          const t0 = performance.now();

          function step(now) {
            const p = Math.min(1, (now - t0) / duration);
            const v = start + (end - start) * p;
            el.textContent = decimals ? v.toFixed(decimals) : String(Math.round(v));
            if (p < 1) requestAnimationFrame(step);
          }

          requestAnimationFrame(step);
          io.unobserve(el);

          if (rawText === '') {
            // keep default
          }
        }
      },
      { threshold: 0.35 }
    );

    nodes.forEach((n) => io.observe(n));
  }

  function setYear() {
    const el = $("#year");
    if (el) el.textContent = new Date().getFullYear();
  }

  function bindLoadingScreen() {
    const s = document.querySelector('.loading-screen');
    if (!s) return;

    window.addEventListener('load', () => {
      s.style.transition = 'opacity .35s ease, transform .35s ease';
      s.style.opacity = '0';
      s.style.transform = 'translateY(8px) scale(.98)';
      setTimeout(() => {
        s.style.display = 'none';
      }, 380);
    });
  }


  // Initialize
  document.addEventListener("DOMContentLoaded", () => {
    setYear();
    bindReveal();
    bindMouseGlow();
    bindNavToggle();
    bindCopyLink();
    bindCounters();
    bindLoadingScreen();
  });
})();

