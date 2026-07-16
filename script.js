// ——— Nazar Kokoten site engine ———
// Renders everything from content.js. Supports live updates
// from admin.html via postMessage (CONTENT_UPDATE).

(function () {

  const get = p => p.split('.').reduce((o, k) => (o == null ? o : o[k]), window.CONTENT || {});

  function splitParas(v) {
    return String(v).split(/\n\s*\n/).map(t => t.trim()).filter(Boolean);
  }

  function setBg(el, src, placeholder) {
    if (el.dataset.ph == null) el.dataset.ph = el.textContent; // remember placeholder once
    if (src) {
      el.style.background = `center/cover no-repeat url("${src}")`;
      el.textContent = '';
    } else {
      el.style.background = '';
      el.textContent = placeholder != null ? placeholder : el.dataset.ph;
    }
  }

  function hydrate(isUpdate) {
    const C = window.CONTENT || {};

    // — simple text slots: empty string CLEARS the slot —
    document.querySelectorAll('[data-c]').forEach(el => {
      const v = get(el.dataset.c);
      if (v != null) el.textContent = v;
    });

    // — multi-paragraph slots: blank line = new paragraph —
    document.querySelectorAll('[data-rich]').forEach(box => {
      const v = get(box.dataset.rich);
      if (v == null) return;
      const cls = box.dataset.pclass || '';
      box.innerHTML = '';
      splitParas(v).forEach(t => {
        const p = document.createElement('p');
        if (cls) p.className = cls;
        p.textContent = t;
        box.appendChild(p);
      });
    });

    // — image slots —
    document.querySelectorAll('[data-img]').forEach(el => setBg(el, get(el.dataset.img)));

    // — links —
    document.querySelectorAll('[data-mail]').forEach(el => {
      const em = get('site.email');
      if (em) { el.href = 'mailto:' + em; el.textContent = em; }
    });
    document.querySelectorAll('[data-ig]').forEach(el => {
      const u = get('site.instagramUrl');
      if (u) el.href = u;
    });

    // — floating tags (about panel): any count, 0 = none —
    document.querySelectorAll('[data-tags]').forEach(box => {
      const arr = get(box.dataset.tags) || [];
      box.innerHTML = '';
      arr.slice(0, 3).forEach((t, i) => {
        if (!t) return;
        const s = document.createElement('span');
        s.className = 'tag-float tag-' + (i + 1);
        s.textContent = t;
        box.appendChild(s);
      });
    });

    // — slider slides —
    const slidesBox = document.querySelector('[data-slides]');
    if (slidesBox) {
      const arr = C.slides || [];
      slidesBox.innerHTML = '';
      arr.forEach((s, i) => {
        const d = document.createElement('div');
        d.className = `slide slide-${(i % 4) + 1}` + (i === 0 ? ' active' : '');
        const f = document.createElement('div');
        f.className = 'fill';
        if (s.image) f.style.background = `center/cover no-repeat url("${s.image}")`;
        else f.textContent = `( work — ${s.title || '…'} )`;
        d.appendChild(f);
        const c = document.createElement('div');
        c.className = 'caption';
        const h = document.createElement('h3'); h.textContent = s.title || '';
        const sp = document.createElement('span'); sp.textContent = s.category || '';
        c.append(h, sp); d.appendChild(c);
        slidesBox.appendChild(d);
      });
      const dots = document.querySelector('.dots');
      if (dots) {
        dots.innerHTML = '';
        arr.forEach((_, i) => {
          const b = document.createElement('button');
          b.className = 'dot' + (i === 0 ? ' active' : '');
          b.setAttribute('aria-label', 'Slide ' + (i + 1));
          dots.appendChild(b);
        });
      }
      initSlider();
    }

    // — projects list —
    const pl = document.querySelector('[data-projects]');
    if (pl) {
      const arr = (C.projects && C.projects.list) || [];
      pl.innerHTML = '';
      arr.forEach((p, i) => {
        const li = document.createElement('li');
        li.className = 'rv'; li.style.setProperty('--d', (i * 0.05) + 's');
        const a = document.createElement('a'); a.className = 'proj-row'; a.href = p.url || '#';
        const n = document.createElement('span'); n.className = 'name'; n.textContent = p.name || '';
        if (p.isNew) { const em = document.createElement('em'); em.className = 'new'; em.textContent = 'New'; n.append(' ', em); }
        const c = document.createElement('span'); c.className = 'cat'; c.textContent = p.category || '';
        const y = document.createElement('span'); y.className = 'yr'; y.textContent = p.year || '';
        a.append(n, c, y); li.appendChild(a); pl.appendChild(li);
      });
    }

    // — pricing tiers —
    const tb = document.querySelector('[data-tiers]');
    if (tb) {
      const arr = (C.services && C.services.tiers) || [];
      tb.innerHTML = '';
      arr.forEach((t, i) => {
        const d = document.createElement('div');
        d.className = 'tier rv' + (t.hero ? ' hero' : '');
        d.style.setProperty('--d', (i * 0.06) + 's');
        const fl = document.createElement('div'); fl.className = 'flag';
        if (t.flag) fl.textContent = t.flag; else fl.innerHTML = '&nbsp;';
        const h = document.createElement('h3'); h.textContent = t.name || '';
        const pr = document.createElement('div'); pr.className = 'price'; pr.textContent = t.price || '';
        const fo = document.createElement('p'); fo.className = 'for'; fo.textContent = t.forWho || '';
        const ul = document.createElement('ul');
        (t.features || []).forEach(f => {
          const li = document.createElement('li');
          if (f.highlight) li.className = 'strat';
          li.textContent = f.text || ''; ul.appendChild(li);
        });
        const btn = document.createElement('a');
        btn.className = 'btn ' + (t.hero ? 'solid' : 'soft');
        btn.href = 'contact.html';
        btn.textContent = t.button || ('Choose ' + (t.name || ''));
        d.append(fl, h, pr, fo, ul, btn); tb.appendChild(d);
      });
    }

    // — service rules —
    const rb = document.querySelector('[data-rules]');
    if (rb) {
      const arr = (C.services && C.services.rules) || [];
      rb.innerHTML = '';
      arr.forEach((r, i) => {
        const d = document.createElement('div');
        d.className = 'rv'; d.style.setProperty('--d', (i * 0.06) + 's');
        const h = document.createElement('h4'); h.textContent = r.title || '';
        const p = document.createElement('p'); p.textContent = r.text || '';
        d.append(h, p); rb.appendChild(d);
      });
    }

    // — contact: tier options in the select, always in sync with pricing —
    const sel = document.querySelector('[data-tier-select]');
    if (sel) {
      const arr = (C.services && C.services.tiers) || [];
      sel.innerHTML = '';
      arr.forEach(t => {
        const o = document.createElement('option');
        o.textContent = `${t.name} — ${t.price}`;
        sel.appendChild(o);
      });
      const o = document.createElement('option');
      o.textContent = 'Not sure yet';
      sel.appendChild(o);
    }

    // — case page: ordered blocks (any count, any order) —
    const bb = document.querySelector('[data-blocks]');
    if (bb) {
      const arr = (C.case && C.case.blocks) || [];
      bb.innerHTML = '';
      arr.forEach(b => {
        if (b.type === 'image') {
          const d = document.createElement('div');
          d.className = 'case-media rv' + (b.size === 'wide' ? ' wide' : b.size === 'square' ? ' sq' : '');
          if (b.image) d.style.background = `center/cover no-repeat url("${b.image}")`;
          else d.textContent = '( image )';
          bb.appendChild(d);
        } else {
          const s = document.createElement('section');
          s.className = 'case-section rv';
          const h = document.createElement('h2'); h.textContent = b.heading || '';
          s.appendChild(h);
          splitParas(b.text || '').forEach(t => {
            const p = document.createElement('p'); p.textContent = t; s.appendChild(p);
          });
          bb.appendChild(s);
        }
      });
    }

    // — case live link —
    const live = document.querySelector('[data-live]');
    if (live) {
      live.href = get('case.meta.liveUrl') || '#';
      live.textContent = get('case.meta.liveLabel') || 'Preview +';
    }

    // — more-projects cards —
    const mb = document.querySelector('[data-more]');
    if (mb) {
      const arr = (C.case && C.case.more) || [];
      mb.innerHTML = '';
      arr.forEach((m, i) => {
        const a = document.createElement('a');
        a.className = 'more-card rv'; a.href = m.url || '#';
        a.style.setProperty('--d', (i * 0.08) + 's');
        const th = document.createElement('div'); th.className = 'thumb';
        if (m.image) th.style.background = `center/cover no-repeat url("${m.image}")`;
        else th.textContent = `( image — ${m.name || '…'} )`;
        const meta = document.createElement('div'); meta.className = 'm';
        const h = document.createElement('h3'); h.textContent = m.name || '';
        const s = document.createElement('span'); s.textContent = m.category || '';
        meta.append(h, s); a.append(th, meta); mb.appendChild(a);
      });
    }

    // reveal: animate on first load, show instantly on live updates
    if (isUpdate) {
      document.querySelectorAll('.rv').forEach(el => el.classList.add('in'));
    } else {
      initReveal();
    }
  }

  // — slider (re-entrant: safe to call after each hydrate) —
  function initSlider() {
    const slides = [...document.querySelectorAll('.slide')];
    const dots = [...document.querySelectorAll('.dot')];
    const arrow = document.querySelector('.slider-arrow');
    clearInterval(window.__slTimer);
    if (slides.length < 2) return;
    let i = 0;
    const go = n => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('active', k === i));
      dots.forEach((d, k) => d.classList.toggle('active', k === i));
    };
    const next = () => go(i + 1);
    const start = () => { window.__slTimer = setInterval(next, 4500); };
    const reset = () => { clearInterval(window.__slTimer); start(); };
    if (arrow) arrow.onclick = () => { next(); reset(); };
    dots.forEach((d, k) => d.onclick = () => { go(k); reset(); });
    start();
  }

  // — scroll reveal —
  function initReveal() {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = document.querySelectorAll('.rv');
    if (reduced || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(ents => {
      ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(e => io.observe(e));
  }

  // — load content from per-section JSON files (edited via Pages CMS) —
  const FILES = {
    site: 'content/site.json',
    slides: 'content/slides.json',
    home: 'content/home.json',
    about: 'content/about.json',
    projects: 'content/projects.json',
    services: 'content/services.json',
    contact: 'content/contact.json',
    footer: 'content/footer.json'
  };

  // case pages declare their own content file: <body data-case-file="content/case-xxx.json">
  const caseFile = document.body.dataset.caseFile;
  if (caseFile) FILES.case = caseFile;

  Promise.all(Object.entries(FILES).map(([key, path]) =>
    fetch(path).then(r => { if (!r.ok) throw new Error(path); return r.json(); }).then(v => [key, v])
  ))
    .then(entries => {
      window.CONTENT = Object.fromEntries(entries);
      hydrate(false);
    })
    .catch(err => {
      console.warn('Не вдалося завантажити content/*.json (' + err.message + '). ' +
        'Сайт потрібно відкривати через сервер: локально — `npx serve`, або на Vercel.');
      document.querySelectorAll('.rv').forEach(el => el.classList.add('in'));
    });
})();

// theme — sun in light, moon in dark
(function () {
  const root = document.documentElement;
  const saved = window.__theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  root.setAttribute('data-theme', saved);
  document.addEventListener('click', e => {
    const t = e.target.closest('.theme-btn');
    if (!t) return;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    window.__theme = next;
  });
})();

// mobile menu
(function () {
  const nav = document.querySelector('.topnav');
  const btn = document.querySelector('.menu-btn');
  if (!nav || !btn) return;
  btn.addEventListener('click', () => nav.classList.toggle('open'));
  nav.querySelectorAll('ul a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
})();
