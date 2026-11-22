/*
  Fragrance discovery sections (docs/DISCOVERY-PLAN.md).
  - <perfume-tilt>: the hero bottle leans a little toward the cursor (desktop, fine
    pointer, no reduced motion), one rAF per move, transform only.
  - <perfume-discovery-nav>: sticks under the header, hides links whose section is
    missing, scrolls smoothly, underlines the section on screen and keeps it in view;
    when the links overflow it acts as a small carousel (faded edges, arrows, mouse
    drag); sets --pd-offset so anchors land below header + nav.
  - <perfume-dna>: ranks the characteristics strongest first; choosing one opens its
    explanation and brightens its cloud in the scent aura (hover previews it).
  - <perfume-journey>: scroll-driven; the timeline follows the stage you're reading
    (no clicking needed); "Show all n notes" opens long lists.
  - <perfume-projection> / <perfume-sillage> (Performance lab): the level buttons
    preview Intimate/Moderate/Strong or Soft/Moderate/Heavy and update the caption;
    CSS draws and animates the rings and ribbons.
  Without JS: every panel shows, anchors still work.
*/
(() => {
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const define = (name, cls) => customElements.get(name) || customElements.define(name, cls);

  define('perfume-tilt', class extends HTMLElement {
    connectedCallback() {
      if (reduced() || !window.matchMedia('(pointer: fine) and (min-width: 990px)').matches) return;
      const host = this.closest('section') || this;
      let frame = 0;
      let px = 0;
      let py = 0;
      const apply = () => {
        frame = 0;
        this.style.setProperty('--ry', `${(px * 8).toFixed(2)}deg`);
        this.style.setProperty('--rx', `${(-py * 5).toFixed(2)}deg`);
        this.style.setProperty('--tx', `${(px * 14).toFixed(1)}px`);
        this.style.setProperty('--ty', `${(py * 10).toFixed(1)}px`);
      };
      host.addEventListener('pointermove', (e) => {
        const r = host.getBoundingClientRect();
        px = (e.clientX - r.left) / r.width - 0.5;
        py = (e.clientY - r.top) / r.height - 0.5;
        if (!frame) frame = requestAnimationFrame(apply);
      });
      host.addEventListener('pointerleave', () => {
        px = 0;
        py = 0;
        if (!frame) frame = requestAnimationFrame(apply);
      });
    }
  });

  define('perfume-discovery-nav', class extends HTMLElement {
    connectedCallback() {
      this.links = [...this.querySelectorAll('[data-pdn-link]')];
      this.targets = new Map();
      this.links.forEach((a) => {
        const t = document.getElementById(a.getAttribute('href').slice(1));
        if (t) this.targets.set(a, t);
        else a.closest('li').hidden = true;
      });
      const header = document.querySelector('perfume-header');
      const place = () => {
        const hb = header && header.classList.contains('ph--sticky') ? header.getBoundingClientRect().height : 0;
        this.style.setProperty('--pdn-top', `${Math.round(hb)}px`);
        document.documentElement.style.setProperty('--pd-offset', `${Math.round(hb + this.offsetHeight + 16)}px`);
      };
      place();
      window.addEventListener('resize', place);
      this.links.forEach((a) =>
        a.addEventListener('click', (e) => {
          const t = this.targets.get(a);
          if (!t) return;
          e.preventDefault();
          t.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
          history.replaceState(null, '', a.getAttribute('href'));
        })
      );
      // The current section: the last one whose top has passed the nav.
      let frame = 0;
      const sync = () => {
        frame = 0;
        const line = this.getBoundingClientRect().bottom + 40;
        let current = null;
        this.targets.forEach((t, a) => {
          if (t.getBoundingClientRect().top <= line) current = a;
        });
        this.links.forEach((a) => a.classList.toggle('is-current', a === current));
        if (current && current !== this.current) {
          this.current = current;
          const row = this.querySelector('.pdn__inner');
          const r = current.getBoundingClientRect();
          const rr = row.getBoundingClientRect();
          if (r.left < rr.left + 48 || r.right > rr.right - 48) row.scrollBy({ left: r.left + r.width / 2 - (rr.left + rr.width / 2), behavior: reduced() ? 'auto' : 'smooth' });
        }
      };
      window.addEventListener('scroll', () => frame || (frame = requestAnimationFrame(sync)), { passive: true });
      sync();
      this.carousel();
    }

    // When the links overflow: faded edges and arrows on the side with more links,
    // mouse drag to scroll (a drag never counts as a click). Touch swipes natively.
    carousel() {
      const row = this.querySelector('[data-pdn-row]');
      if (!row) return;
      const edges = () => {
        const max = row.scrollWidth - row.clientWidth;
        this.classList.toggle('can-prev', row.scrollLeft > 4);
        this.classList.toggle('can-next', row.scrollLeft < max - 4);
      };
      row.addEventListener('scroll', edges, { passive: true });
      window.addEventListener('resize', edges);
      edges();
      const step = (dir) => row.scrollBy({ left: dir * row.clientWidth * 0.6, behavior: reduced() ? 'auto' : 'smooth' });
      this.querySelector('[data-pdn-prev]')?.addEventListener('click', () => step(-1));
      this.querySelector('[data-pdn-next]')?.addEventListener('click', () => step(1));
      let start = null;
      row.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        start = { x: e.clientX, left: row.scrollLeft, moved: false };
      });
      window.addEventListener('pointermove', (e) => {
        if (!start) return;
        const dx = e.clientX - start.x;
        if (!start.moved && Math.abs(dx) < 6) return;
        start.moved = true;
        this.classList.add('is-dragging');
        row.scrollLeft = start.left - dx;
      });
      window.addEventListener('pointerup', () => {
        if (!start) return;
        const moved = start.moved;
        start = null;
        // Let the click that ends a drag pass without following the link.
        this.classList.remove('is-dragging');
        if (moved) row.addEventListener('click', (e) => e.preventDefault(), { capture: true, once: true });
      });
    }
  });

  define('perfume-dna', class extends HTMLElement {
    connectedCallback() {
      const list = this.querySelector('.pdna__rows');
      if (!list) return;
      // Strongest first (ties keep the order they were entered in).
      [...list.children]
        .map((li, i) => ({ li, i, s: Number(li.dataset.score) || 0 }))
        .sort((a, b) => b.s - a.s || a.i - b.i)
        .forEach((x) => list.appendChild(x.li));
      this.rows = [...list.children];
      this.orbs = [...this.querySelectorAll('.pdna__orb')];
      this.classList.add('is-ready');
      const open = (row) => {
        const i = row.dataset.i;
        this.classList.add('has-active');
        this.rows.forEach((r) => {
          const on = r === row;
          r.classList.toggle('is-open', on);
          r.querySelector('.pdna__item').setAttribute('aria-expanded', on ? 'true' : 'false');
        });
        this.orbs.forEach((o) => o.classList.toggle('is-on', o.dataset.i === i));
      };
      const glow = (row) => {
        this.classList.add('has-active');
        this.orbs.forEach((o) => o.classList.toggle('is-on', o.dataset.i === row.dataset.i));
      };
      const back = () => {
        const opened = this.rows.find((r) => r.classList.contains('is-open'));
        if (opened) glow(opened);
      };
      this.rows.forEach((row) => {
        row.querySelector('.pdna__item').addEventListener('click', () => open(row));
        row.addEventListener('mouseenter', () => glow(row));
        row.addEventListener('mouseleave', back);
      });
      open(this.rows[0]);
    }
  });

  // Generic tabs: [role="tab"] buttons and [data-tab-panel] panels inside the element.
  define('perfume-tabs', class extends HTMLElement {
    connectedCallback() {
      const tabs = [...this.querySelectorAll('[role="tab"]')];
      const panels = [...this.querySelectorAll('[data-tab-panel]')];
      if (!tabs.length) return;
      this.classList.add('is-ready');
      const select = (i, focus) => {
        tabs.forEach((t, j) => {
          t.setAttribute('aria-selected', j === i ? 'true' : 'false');
          t.tabIndex = j === i ? 0 : -1;
        });
        panels.forEach((p, j) => p.classList.toggle('is-on', j === i));
        if (focus) tabs[i].focus();
      };
      tabs.forEach((t, i) => {
        t.addEventListener('click', () => select(i));
        t.addEventListener('keydown', (e) => {
          const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
          if (!d) return;
          e.preventDefault();
          select((i + d + tabs.length) % tabs.length, true);
        });
      });
      select(Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true')));
    }
  });

  // Similar fragrances: rank by score (ties keep the collection order), keep the best
  // few, and let "Show more" reveal the rest. Without JS, CSS order already ranks them.
  define('perfume-similar', class extends HTMLElement {
    connectedCallback() {
      const list = this.querySelector('[data-psim-list]');
      if (!list) return;
      const items = [...list.children];
      items
        .map((li, i) => ({ li, i, s: Number(li.dataset.score) || 0 }))
        .sort((a, b) => b.s - a.s || a.i - b.i)
        .forEach((x) => {
          x.li.style.order = '';
          list.appendChild(x.li);
        });
      const limit = Number(this.dataset.limit) || 4;
      const ranked = [...list.children];
      ranked.forEach((li, i) => (li.hidden = i >= limit));
      const more = this.querySelector('[data-psim-more]');
      if (more && ranked.length > limit) {
        more.hidden = false;
        more.addEventListener('click', () => {
          ranked.forEach((li) => (li.hidden = false));
          more.hidden = true;
        });
      }
    }
  });

  // Compare: the picker switches which fragrance shows on the right; rows where both
  // columns say the same thing (and aren't empty) are marked "Same".
  define('perfume-compare', class extends HTMLElement {
    connectedCallback() {
      const select = this.querySelector('[data-pcmp-select]');
      const a = this.querySelector('.pcmp__slot--a');
      const mark = () => {
        const b = [...this.querySelectorAll('.pcmp__slot:not(.pcmp__slot--a)')].find((x) => !x.hidden);
        this.querySelectorAll('.pcmp__row').forEach((r) => r.classList.remove('is-same'));
        if (!a || !b) return;
        a.querySelectorAll('.pcmp__row').forEach((ra) => {
          const rb = b.querySelector(`.pcmp__row[data-row="${ra.dataset.row}"]`);
          const va = (ra.dataset.val || '').replace(/[-,\s]+$/, '').trim();
          if (rb && va && va === (rb.dataset.val || '').replace(/[-,\s]+$/, '').trim()) {
            ra.classList.add('is-same');
            rb.classList.add('is-same');
          }
        });
      };
      select?.addEventListener('change', () => {
        this.querySelectorAll('.pcmp__slot[data-key]').forEach((s) => {
          const on = s.dataset.key === select.value;
          s.hidden = !on;
          s.classList.toggle('is-in', on && !reduced());
        });
        mark();
      });
      mark();
    }
  });

  // Is it for you?: compares the four answers with the perfume's own data and gives a
  // qualitative verdict with a reason per answer. No percentages.
  define('perfume-fit', class extends HTMLElement {
    connectedCallback() {
      const form = this.querySelector('[data-pfit-form]');
      if (!form) return;
      form.addEventListener('submit', (e) => e.preventDefault());
      const fresh = Number(this.dataset.fresh) || 0;
      const warm = Number(this.dataset.warm) || 0;
      const proj = this.dataset.projection || '';
      const occ = (this.dataset.occasions || '').split(',').map((x) => x.trim()).filter(Boolean);
      const accords = Object.fromEntries(
        (this.dataset.accords || '').split(',').filter(Boolean).map((p) => {
          const [k, v] = p.split(':');
          return [k, Number(v) || 0];
        })
      );
      const hasAccords = Object.keys(accords).length > 0;
      const lean = !fresh && !warm ? '' : fresh > warm * 1.2 ? 'fresh' : warm > fresh * 1.2 ? 'warm' : 'balanced';
      const judge = {
        q1: (v) => {
          if (!lean) return ['unknown', 'Its character isn’t assessed yet.'];
          if (v === 'both') return ['yes', `You like both; it leans ${lean === 'balanced' ? 'between the two' : lean}.`];
          if (lean === v) return ['yes', `It leans ${lean}, like you.`];
          if (lean === 'balanced') return ['partly', 'It sits between fresh and warm.'];
          return ['no', `It leans ${lean}, you prefer ${v}.`];
        },
        q2: (v) => {
          if (!proj) return ['unknown', 'Projection isn’t assessed yet.'];
          if (v === 'either') return ['yes', `Its projection is ${proj}.`];
          const map = { subtle: { intimate: 'yes', moderate: 'partly', strong: 'no' }, noticeable: { strong: 'yes', moderate: 'partly', intimate: 'no' } };
          return [map[v][proj] || 'unknown', `Its projection is ${proj}.`];
        },
        q3: (v) => {
          if (!occ.length) return ['unknown', 'Occasions aren’t assessed yet.'];
          const every = occ.some((o) => ['everyday', 'office', 'casual'].includes(o));
          const special = occ.some((o) => ['date night', 'formal', 'special occasions'].includes(o));
          if (v === 'both') return [every && special ? 'yes' : 'partly', `Best for: ${occ.join(', ')}.`];
          const ok = v === 'everyday' ? every : special;
          return [ok ? 'yes' : 'no', `Best for: ${occ.join(', ')}.`];
        },
        q4: (v) => {
          if (!hasAccords) return ['unknown', 'Its character isn’t scored yet.'];
          const keys = { sweet: ['sweet', 'gourmand'], woody: ['woody'], floral: ['floral', 'powdery'], musky: ['musky'], fresh: ['fresh', 'citrus', 'aquatic', 'green'] }[v];
          const best = Math.max(0, ...keys.map((k) => accords[k] || 0));
          if (best >= 4) return ['yes', `${v[0].toUpperCase() + v.slice(1)} is prominent in it (${best} of 5).`];
          if (best >= 2) return ['partly', `There is some ${v} in it (${best} of 5).`];
          return ['no', `${v[0].toUpperCase() + v.slice(1)} isn’t really part of it.`];
        },
      };
      const words = { yes: 'Yes', partly: 'Partly', no: 'No', unknown: 'Can’t tell' };
      const update = () => {
        const answers = ['q1', 'q2', 'q3', 'q4'].map((q) => form.querySelector(`input[name="${q}"]:checked`)?.value);
        if (answers.some((a) => !a)) return;
        const results = answers.map((a, i) => judge[`q${i + 1}`](a));
        const count = (k) => results.filter((r) => r[0] === k).length;
        let verdict;
        if (count('unknown') >= 2) verdict = 'We can’t tell yet';
        else if (count('no') === 0 && count('partly') === 0) verdict = 'Made for you';
        else if (count('no') === 0) verdict = 'A good match';
        else if (count('no') === 1) verdict = 'Could work, with one difference';
        else verdict = 'Probably not your style';
        this.querySelector('[data-pfit-wait]').hidden = true;
        this.querySelector('[data-pfit-out]').hidden = false;
        const v = this.querySelector('[data-pfit-verdict]');
        v.textContent = verdict;
        v.style.animation = 'none';
        void v.offsetWidth;
        v.style.animation = '';
        const list = this.querySelector('[data-pfit-reasons]');
        list.textContent = '';
        results.forEach(([k, text]) => {
          const li = document.createElement('li');
          li.className = `is-${k}`;
          const b = document.createElement('b');
          b.textContent = words[k];
          li.append(b, document.createTextNode(text));
          list.appendChild(li);
        });
        const similar = this.querySelector('[data-pfit-similar]');
        if (similar) similar.hidden = count('no') < 1 || !document.getElementById('similar');
      };
      form.addEventListener('change', update);
    }
  });

  // Journey, scroll-driven: the stage whose top has passed the reading line (45% of
  // the screen) is the current one; the timeline's line fills continuously from the
  // first stage to the last, the background follows the stage, and each stage's
  // notes rise in the first time it's reached. The step names are plain links.
  define('perfume-journey', class extends HTMLElement {
    connectedCallback() {
      this.steps = [...this.querySelectorAll('.pjr__step')];
      this.stages = [...this.querySelectorAll('.pjr__stage')];
      this.line = this.querySelector('.pjr__line span');
      if (!this.stages.length) return;
      let frame = 0;
      const sync = () => {
        frame = 0;
        const reading = window.innerHeight * 0.45;
        const tops = this.stages.map((st) => st.getBoundingClientRect().top);
        let current = 0;
        tops.forEach((t, i) => {
          if (t <= reading) current = i;
        });
        const first = tops[0];
        const last = tops[tops.length - 1];
        const fill = last > first ? Math.min(1, Math.max(0, (reading - first) / (last - first))) : 0;
        this.line?.style.setProperty('--fill', fill.toFixed(3));
        this.querySelector('.pjr__line')?.style.setProperty('--fill', fill.toFixed(3));
        this.dataset.stage = String(current + 1);
        this.steps.forEach((st, i) => {
          st.classList.toggle('is-current', i === current);
          st.classList.toggle('is-past', i < current);
          if (i === current) st.setAttribute('aria-current', 'step');
          else st.removeAttribute('aria-current');
        });
        this.stages.forEach((st, i) => {
          if (tops[i] < window.innerHeight * 0.85) st.classList.add('is-seen');
        });
      };
      const queue = () => frame || (frame = requestAnimationFrame(sync));
      window.addEventListener('scroll', queue, { passive: true });
      window.addEventListener('resize', queue);
      sync();

      this.steps.forEach((a) =>
        a.addEventListener('click', (e) => {
          const target = this.querySelector(a.getAttribute('href'));
          if (!target) return;
          e.preventDefault();
          target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
        })
      );
      this.querySelectorAll('[data-pjr-more]').forEach((b) =>
        b.addEventListener('click', () => {
          const list = b.previousElementSibling;
          const open = !list.classList.contains('is-all');
          list.classList.toggle('is-all', open);
          b.setAttribute('aria-expanded', open ? 'true' : 'false');
          b.textContent = open ? 'Show fewer' : b.dataset.label;
        })
      );
    }
  });
  /* Level buttons shared by the Projection and Sillage scenes. */
  const levelButtons = (host, onChange) => {
    const buttons = [...host.querySelectorAll('.plab__level')];
    const caption = host.querySelector('[data-caption]');
    buttons.forEach((b) =>
      b.addEventListener('click', () => {
        const level = b.dataset.level;
        host.dataset.level = level;
        buttons.forEach((o) => {
          o.classList.toggle('is-on', o === b);
          o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
        });
        if (caption) caption.textContent = host.getAttribute(`data-caption-${level}`) || '';
        if (onChange) onChange();
      })
    );
  };

  define('perfume-projection', class extends HTMLElement {
    connectedCallback() {
      levelButtons(this);
    }
  });

  define('perfume-sillage', class extends HTMLElement {
    connectedCallback() {
      levelButtons(this);
    }
  });
})();
