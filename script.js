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
        const link = document.createElement(s.url ? 'a' : 'div');
        link.className = 'slide-link';
        if (s.url) link.href = s.url;
        const f = document.createElement('div');
        f.className = 'fill';
        if (s.image) f.style.background = `center/cover no-repeat url("${s.image}")`;
        else f.textContent = `( work — ${s.title || '…'} )`;
        link.appendChild(f);
        const c = document.createElement('div');
        c.className = 'caption';
        const h = document.createElement('h3'); h.textContent = s.title || '';
        const sp = document.createElement('span'); sp.textContent = s.category || '';
        c.append(h, sp); link.appendChild(c);
        if (s.url) {
          if (s.logo) {
            const logo = document.createElement('img');
            logo.className = 'slide-logo';
            logo.src = s.logo;
            logo.alt = s.title ? `${s.title} logo` : '';
            link.appendChild(logo);
          } else {
            const logo = document.createElement('span');
            logo.className = 'slide-logo slide-logo-text';
            logo.textContent = s.title || '';
            link.appendChild(logo);
          }
        }
        d.appendChild(link);
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

    if (slidesBox) initSlider();

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
        btn.href = 'contact.html?tier=' + encodeURIComponent(t.name || '');
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
        o.value = t.name || '';
        o.textContent = `${t.name} — ${t.price}`;
        sel.appendChild(o);
      });
      const o = document.createElement('option');
      o.textContent = 'Not sure yet';
      sel.appendChild(o);

      // pre-select the tier the visitor picked on the Services page
      const wantedTier = new URLSearchParams(location.search).get('tier');
      if (wantedTier && [...sel.options].some(opt => opt.value === wantedTier)) {
        sel.value = wantedTier;
      }
    }

    // — case page: 8 editorial sections (subject, difference, anchor,
    // identity, mark, typeColor, inWorld, [result], system), each holding
    // an author-ordered list of heading/text/image items — drag-reorder
    // in Pages CMS decides what shows first, last, or between photos —
    const bb = document.querySelector('[data-blocks]');
    if (bb) {
      const cse = C.case || {};
      bb.innerHTML = '';

      const parseRatio = r => {
        const m = /^\s*(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\s*$/.exec(r || '');
        return m ? `${m[1]} / ${m[2]}` : '4 / 5';
      };

      const isMediaItem = it =>
        (it.type === 'image' && it.image) || (it.type === 'video' && it.video) || (it.type === 'gif' && it.gif);

      // the still image the hero/poster falls back to for a given item
      const mediaImageUrl = it => it.type === 'gif' ? it.gif : it.image;

      // one media cell — a photo, a GIF (both plain background images —
      // GIFs animate on their own), or a short looping animation
      // (autoplaying muted video) — all sized the same way
      const buildMediaCell = it => {
        if (it.type === 'video') {
          const v = document.createElement('video');
          v.className = 'case-media';
          v.style.aspectRatio = parseRatio(it.ratio);
          v.src = it.video;
          v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true;
          v.setAttribute('muted', ''); // iOS Safari needs the attribute, not just the property
          return v;
        }
        const d = document.createElement('div');
        d.className = 'case-media';
        d.style.aspectRatio = parseRatio(it.ratio);
        d.style.background = `center/cover no-repeat url("${mediaImageUrl(it)}")`;
        return d;
      };

      // consecutive image/video items lay out side by side (1-3 up);
      // heading/text items render inline wherever they sit in the order
      const renderItems = (items, markHeroDup) => {
        const els = [];
        let heroMarked = false;
        let i = 0;
        while (i < items.length) {
          const it = items[i] || {};
          if (isMediaItem(it)) {
            const run = [];
            while (i < items.length && isMediaItem(items[i])) {
              run.push(items[i]);
              i++;
            }
            const group = document.createElement('div');
            group.className = 'case-media-group';
            group.style.setProperty('--n', run.length);
            run.forEach(im => group.appendChild(buildMediaCell(im)));
            // the first block's first photo/animation is usually the cover —
            // mirror the photo-first rhythm every other page opens with on
            // mobile by duplicating it above the nav; hide the in-flow copy
            if (markHeroDup && !heroMarked) {
              group.classList.add('case-media-group--hero-dup');
              heroMarked = true;
            }
            els.push(group);
            continue;
          }
          if (it.type === 'heading' && (it.text || '').trim()) {
            const l = document.createElement('div');
            l.className = 'cb-label';
            l.textContent = it.text.trim();
            els.push(l);
          } else if (it.type === 'text' && (it.text || '').trim()) {
            const s = document.createElement('section');
            s.className = 'case-block-txt';
            const p = document.createElement('p');
            p.className = 'cb-thesis';
            p.textContent = it.text.trim();
            s.appendChild(p);
            els.push(s);
          }
          i++;
        }
        return els;
      };

      const renderBlock = (sec, isFirst) => {
        const els = renderItems((sec && sec.items) || [], isFirst);
        if (!els.length) return;
        const wrap = document.createElement('div');
        wrap.className = 'case-block rv';
        els.forEach(el => wrap.appendChild(el));
        bb.appendChild(wrap);
      };

      ['subject', 'difference', 'anchor', 'identity', 'mark', 'typeColor', 'inWorld']
        .forEach((key, i) => renderBlock(cse[key], i === 0));

      const resultText = ((cse.result && cse.result.text) || '').trim();
      if (resultText) {
        const s = document.createElement('section');
        s.className = 'case-block-txt rv';
        const p = document.createElement('p');
        p.className = 'cb-thesis';
        p.textContent = resultText;
        s.appendChild(p);
        bb.appendChild(s);
      }
      renderBlock(cse.system, false);

      const existingHero = document.querySelector('.case-hero-mobile');
      if (existingHero) existingHero.remove();
      const subjectItems = (cse.subject && cse.subject.items) || [];
      const heroItem = subjectItems.find(isMediaItem);
      if (heroItem) {
        const hero = document.createElement('div');
        hero.className = 'case-hero-mobile';
        if (heroItem.type === 'video') {
          const v = document.createElement('video');
          v.className = 'case-hero-mobile-media';
          v.src = heroItem.video;
          v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true;
          v.setAttribute('muted', '');
          hero.appendChild(v);
        } else {
          hero.style.background = `center/cover no-repeat url("${mediaImageUrl(heroItem)}")`;
        }
        // same topbar markup as every other page's .panel-inner, so the
        // logo + theme toggle inherit their white-on-photo styling as-is
        hero.insertAdjacentHTML('beforeend',
          '<div class="panel-topbar">' +
          '<a class="panel-logo" href="index.html"><img src="images/circle-buro-logo-white.png" alt="Circle Buro"></a>' +
          '<button class="theme-btn panel-theme-btn" aria-label="Toggle theme">' +
          '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' +
          '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' +
          '</button>' +
          '</div>');
        document.querySelector('.case').prepend(hero);
      }
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
    const rows = [...document.querySelectorAll('.proj-row')];
    clearInterval(window.__slTimer);
    if (slides.length < 2) return;
    let i = 0;
    const go = n => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('active', k === i));
      dots.forEach((d, k) => {
        d.classList.toggle('active', k === i);
        d.classList.toggle('done', k < i);
      });
    };
    // project list rows (e.g. Projects page): photo follows hover, newest by default, no autoplay
    if (rows.length) {
      rows.forEach((row, k) => {
        row.addEventListener('mouseenter', () => go(k));
        row.addEventListener('mouseleave', () => go(0));
        row.addEventListener('focus', () => go(k));
        row.addEventListener('blur', () => go(0));
      });
      return;
    }
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
  const ALL_FILES = {
    site: 'content/site.json',
    slides: 'content/slides.json',
    home: 'content/home.json',
    about: 'content/about.json',
    projects: 'content/projects.json',
    services: 'content/services.json',
    contact: 'content/contact.json',
    footer: 'content/footer.json'
  };

  // only fetch the sections this page actually binds to, so the first
  // real content (photo, text) paints as soon as possible — not after
  // every page's data has round-tripped
  const CONTAINER_NEEDS = { slides: 'slides', projects: 'projects', tiers: 'services', rules: 'services', 'tier-select': 'services' };
  const needed = new Set();
  document.querySelectorAll('[data-c],[data-rich],[data-tags],[data-img]').forEach(el => {
    const v = el.dataset.c || el.dataset.rich || el.dataset.tags || el.dataset.img;
    if (v) needed.add(v.split('.')[0]);
  });
  Object.entries(CONTAINER_NEEDS).forEach(([attr, key]) => {
    if (document.querySelector('[data-' + attr + ']')) needed.add(key);
  });

  const FILES = {};
  Object.entries(ALL_FILES).forEach(([key, path]) => { if (needed.has(key)) FILES[key] = path; });

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
  const saved = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  root.setAttribute('data-theme', saved);
  document.addEventListener('click', e => {
    const t = e.target.closest('.theme-btn');
    if (!t) return;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
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
