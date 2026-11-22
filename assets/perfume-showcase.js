/*
  <perfume-showcase> (sections/perfume-showcase.liquid)

  Carousel after the High Spirits "Homegrown brands": choosing a perfume sets every
  bottle's data-offset (distance from the chosen one, -1 … 3) and CSS glides them to
  their stops. Choose with the tabs (click, arrows, Home/End), a waiting bottle, a
  drag or swipe on the stage, the phone arrows, or autoplay (driven by the active
  tab's CSS progress animation, paused on hover, focus, off screen, hidden tab,
  pause button, editor selection; off with reduced motion).

  Add to bag: the native product form posts to /cart/add.js in place, with a spritz
  while adding and "Added to bag" after; the header's Bag count follows through
  Dawn's pub/sub (if present) and a 'cart:updated' event. Without JS the form posts
  normally and lands on the cart.
*/
(() => {
  if (customElements.get('perfume-showcase')) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const OFFSET_MIN = -1;
  const OFFSET_MAX = 3;
  const DRAG_START = 8;
  const SWIPE_DISTANCE = 40;

  class PerfumeShowcase extends HTMLElement {
    connectedCallback() {
      this.abort = new AbortController();
      const signal = this.abort.signal;

      this.tabs = [...this.querySelectorAll('[data-ps-tab]')];
      this.slides = [...this.querySelectorAll('[data-ps-slide]')];
      this.names = [...this.querySelectorAll('[data-ps-name]')];
      this.panels = [...this.querySelectorAll('[data-ps-panel]')];
      this.currentEls = [...this.querySelectorAll('[data-ps-current]')];
      this.stage = this.querySelector('[data-ps-stage]');
      this.toggle = this.querySelector('[data-ps-toggle]');
      this.bar = this.querySelector('[data-ps-bar]');
      this.count = this.slides.length;
      this.index = 0;
      this.holds = new Set();

      this.bindCart(signal);
      this.bindMini(signal);
      this.bindIntro(signal);
      if (this.count < 2) return;
      this.bindCompare(signal);

      this.tabs.forEach((tab, i) => tab.addEventListener('click', () => this.go(i), { signal }));
      // Dots: one per perfume (the current one is longer); each jumps to its perfume.
      const dotsWrap = this.querySelector('[data-ps-dots]');
      if (dotsWrap) {
        this.dots = this.panels.map((panel, i) => {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = `ps__dot${i === this.index ? ' is-active' : ''}`;
          dot.setAttribute('aria-label', panel.querySelector('.ps-panel__name')?.textContent.trim() || `Fragrance ${i + 1}`);
          if (i === this.index) dot.setAttribute('aria-current', 'true');
          dot.addEventListener('click', () => this.go(i), { signal });
          dotsWrap.append(dot);
          return dot;
        });
      }
      this.querySelector('[role="tablist"]')?.addEventListener('keydown', (e) => this.onKeydown(e), { signal });
      this.querySelectorAll('[data-ps-next]').forEach((b) => b.addEventListener('click', () => this.go(this.index + 1), { signal }));
      this.querySelectorAll('[data-ps-prev]').forEach((b) => b.addEventListener('click', () => this.go(this.index - 1), { signal }));
      this.stage?.addEventListener('keydown', (e) => {
        if (e.target !== this.stage) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); this.go(this.index + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); this.go(this.index - 1); }
      }, { signal });
      this.style.setProperty('--ps-frac', 1 / this.count);
      this.bindDrag(signal);
      this.bindEditor(signal);

      this.autoplay = this.dataset.autoplay === 'true' && !reducedMotion.matches;
      if (this.autoplay) {
        this.bindAutoplay(signal);
        this.restartBar();
      }
      else {
        this.classList.remove('is-autoplay');
        if (this.toggle) this.toggle.hidden = true;
      }
    }

    disconnectedCallback() {
      this.abort?.abort();
      this.observer?.disconnect();
      cancelAnimationFrame(this.introFrame);
    }

    // ---------- Entrance ----------
    // Plays by itself (~3.4s) once the section is well into view: the heading ("The
    // Samyó edit") appears large in the centre and glides up to the top centre,
    // shrinking; the bottle rises and the details fade in; last, after a short pause,
    // the perfume's name appears in the centre and drifts up to its place behind the
    // bottle. No pinning or
    // scroll-jacking (2026-11-22: the pinned version showed an empty screen while
    // scrolling). Any interaction, reduced motion or the theme editor ends it.
    bindIntro(signal) {
      if (reducedMotion.matches || window.Shopify?.designMode || this.dataset.intro === 'false') return;
      const vh = () => window.innerHeight;
      const rect = this.getBoundingClientRect();
      if (rect.bottom < 0) return; // already scrolled past
      const inner = this.querySelector('.ps__inner');
      const ease = {
        inOut: (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
        out: (t) => 1 - (1 - t) ** 3,
        soft: (t) => 1 - (1 - t) ** 2,
      };
      const seg = (p, from, to, fn) => fn(Math.min(1, Math.max(0, (p - from) / (to - from))));
      const apply = (p) => {
        const parts = {
          // 1. heading in the centre, then up; 2. bottle; 3. details;
          // 4. last, after a short pause, the perfume's name.
          '--i-show': seg(p, 0, 0.16, ease.out),
          '--i-move': seg(p, 0.18, 0.42, ease.inOut),
          '--i-rise': seg(p, 0.3, 0.62, ease.soft),
          '--i-head': seg(p, 0.38, 0.52, ease.soft),
          '--i-rest': seg(p, 0.5, 0.7, ease.out),
          '--i-grow': seg(p, 0.76, 0.88, ease.out),
          '--i-nmove': seg(p, 0.8, 1, ease.inOut),
          '--i-blur': seg(p, 0.82, 1, ease.inOut),
        };
        Object.entries(parts).forEach(([k, v]) => this.style.setProperty(k, v.toFixed(4)));
      };

      // Starts when the section's top passes 70% of the screen (at once if it already has).
      let auto = rect.top < vh() * 0.7 ? performance.now() : null;
      const pin = false;
      let room = 0;
      let pinTop = 0;
      if (pin) {
        room = Math.round(vh() * 1.2);
        pinTop = Math.max(0, Math.round((vh() - inner.offsetHeight) / 2));
        this.style.setProperty('--ps-room', `${room}px`);
        this.style.setProperty('--ps-pin-top', `${pinTop}px`);
        this.classList.add('is-pinned');
      }
      this.classList.add('is-intro');

      // The heading and the perfume's name both start in the centre of the section,
      // larger: how far and how big.
      const heading = this.querySelector('.ps__heading');
      if (heading) {
        const hr = heading.getBoundingClientRect();
        const sr = this.getBoundingClientRect();
        this.style.setProperty('--h-dx', `${Math.round(sr.left + sr.width / 2 - (hr.left + hr.width / 2))}px`);
        this.style.setProperty('--h-dy', `${Math.round(sr.top + sr.height / 2 - (hr.top + hr.height / 2))}px`);
        this.style.setProperty('--h-s', window.matchMedia('(min-width: 990px)').matches ? '2.4' : '1.6');
      }
      const bigName = this.querySelector('.ps-name.is-active .ps-name__big');
      if (bigName) {
        const nr = bigName.getBoundingClientRect();
        const sr = this.getBoundingClientRect();
        this.style.setProperty('--n-dx', `${Math.round(sr.left + sr.width / 2 - (nr.left + nr.width / 2))}px`);
        this.style.setProperty('--n-dy', `${Math.round(sr.top + sr.height / 2 - (nr.top + nr.height / 2))}px`);
        this.style.setProperty('--n-s', '1.3');
      }

      // Desktop: the bottle rises from the section's real bottom edge (the screen's
      // bottom edge while pinned) instead of being clipped by the stage mid-air.
      // Phones keep the stage clip: there the bottle would pass over the text below.
      if (window.matchMedia('(min-width: 990px)').matches && inner) {
        const pose =
          this.querySelector('.ps-slide[data-offset="0"] .ps-slide__pose') || this.querySelector('.ps-slide__pose');
        if (pose) {
          const ir = inner.getBoundingClientRect();
          const relTop = pose.getBoundingClientRect().top - ir.top;
          // Where the visible area ends, measured from the top of the content.
          const edge = pin ? vh() - pinTop : this.getBoundingClientRect().bottom - ir.top;
          this.style.setProperty('--ps-rise-from', `${Math.ceil(Math.max(0, edge - relTop) + 8)}px`);
          this.classList.add('is-rise-free');
        }
      }

      // Scroll distance over which the intro plays: from the section top at 85% of the
      // screen, through the sticky room when pinned.
      const target = (now) => {
        if (auto === null && this.getBoundingClientRect().top < vh() * 0.7) auto = now;
        if (auto === null) return 0;
        return Math.min(1, (now - auto) / 3400);
      };

      let current = 0;
      let reached = 0;
      let last = performance.now();
      const finish = () => {
        if (this.introDone) return;
        this.introDone = true;
        cancelAnimationFrame(this.introFrame);
        if (this.classList.contains('is-pinned')) {
          // Remove the room and keep what is on screen exactly where it is.
          const before = inner.getBoundingClientRect().top;
          this.classList.remove('is-pinned');
          this.style.removeProperty('--ps-room');
          const after = inner.getBoundingClientRect().top;
          if (Math.abs(after - before) > 0.5) window.scrollBy(0, after - before);
        }
        this.classList.remove('is-intro', 'is-rise-free');
        ['--i-show', '--i-move', '--i-nmove', '--i-grow', '--i-blur', '--i-rise', '--i-head', '--i-rest', '--ps-rise-from', '--h-dx', '--h-dy', '--h-s', '--n-dx', '--n-dy', '--n-s'].forEach((k) =>
          this.style.removeProperty(k)
        );
      };
      const tick = (now) => {
        const dt = Math.min(64, now - last);
        last = now;
        reached = Math.max(reached, target(now));
        current += (reached - current) * (1 - Math.exp(-dt / 120));
        if (reached >= 1 && current > 0.995) return finish();
        apply(current);
        this.introFrame = requestAnimationFrame(tick);
      };
      apply(0);
      this.introFrame = requestAnimationFrame(tick);
      ['pointerdown', 'keydown', 'focusin'].forEach((type) =>
        this.addEventListener(type, () => finish(), { signal, once: true })
      );
    }

    // ---------- Carousel ----------
    go(target, { focus = false } = {}) {
      const next = ((target % this.count) + this.count) % this.count;
      if (next === this.index) return;
      const prev = this.index;
      this.index = next;
      // The outgoing name drifts on while it fades (see .ps-name.is-leaving).
      const leaving = this.names[prev];
      if (leaving) {
        clearTimeout(leaving.leaveTimer);
        leaving.classList.add('is-leaving');
        leaving.leaveTimer = setTimeout(() => leaving.classList.remove('is-leaving'), (Number(this.dataset.duration) || 900) * 1.3);
      }

      this.slides.forEach((slide, i) => {
        const offset = Math.min(Math.max(i - next, OFFSET_MIN), OFFSET_MAX);
        slide.dataset.offset = offset;
        slide.classList.toggle('is-active', offset === 0);
        if (offset === 0) slide.removeAttribute('aria-hidden');
        else slide.setAttribute('aria-hidden', 'true');
      });
      this.names.forEach((el, i) => {
        el.classList.toggle('is-active', i === next);
        if (i === next) el.classList.remove('is-leaving');
      });
      this.panels.forEach((panel, i) => {
        panel.classList.toggle('is-active', i === next);
        panel.inert = i !== next;
      });
      this.tabs.forEach((tab, i) => {
        const on = i === next;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
      });
      if (focus) this.tabs[next].focus({ preventScroll: true });
      this.revealTab(this.tabs[next]);

      const { bg, ink, accent } = this.slides[next].dataset;
      if (bg) this.style.setProperty('--ps-bg', bg);
      if (ink) this.style.setProperty('--ps-ink', ink);
      if (accent) this.style.setProperty('--ps-accent', accent);

      this.dots?.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === next);
        if (i === next) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });

      const label = String(next + 1).padStart(2, '0');
      this.currentEls.forEach((el) => (el.textContent = label));
      this.style.setProperty('--ps-frac', (next + 1) / this.count);
      if (this.autoplay) this.restartBar();
    }

    restartBar() {
      if (!this.bar) return;
      this.bar.classList.remove('is-run');
      void this.bar.offsetWidth;
      this.bar.classList.add('is-run');
    }

    revealTab(tab) {
      const strip = tab?.parentElement;
      if (!strip || strip.scrollWidth <= strip.clientWidth) return;
      const pad = parseFloat(getComputedStyle(strip).scrollPaddingInlineStart) || 0;
      strip.scrollTo({ left: tab.offsetLeft - strip.offsetLeft - pad, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }

    onKeydown(event) {
      const keys = {
        ArrowRight: this.index + 1,
        ArrowDown: this.index + 1,
        ArrowLeft: this.index - 1,
        ArrowUp: this.index - 1,
        Home: 0,
        End: this.count - 1,
      };
      if (!(event.key in keys)) return;
      event.preventDefault();
      this.go(keys[event.key], { focus: true });
    }

    // Drag or swipe the stage. While dragging, every bottle follows the pointer (75%,
    // with resistance past one step), updated once per frame. Let go past ~22% of a
    // step, or with a quick flick, and the carousel moves on; the drag offset eases
    // out with the same timing as the bottles' glide, so the hand-over is seamless.
    // A click (no drag) on a waiting bottle brings it forward.
    bindDrag(signal) {
      if (!this.stage) return;
      let drag = null;
      let frame = null;
      const paint = () => {
        frame = null;
        if (drag) this.style.setProperty('--ps-drag', `${drag.offset.toFixed(1)}px`);
      };
      const stepPx = () => {
        const slide = this.slides[this.index];
        const pct = parseFloat(getComputedStyle(this).getPropertyValue('--ps-step')) || 88;
        return (slide?.offsetWidth || 300) * (pct / 100);
      };

      this.stage.addEventListener(
        'pointerdown',
        (e) => {
          if (e.button !== 0 || e.target.closest('button, a, input, label')) return;
          const now = performance.now();
          drag = {
            id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, offset: 0, moved: false,
            lastX: e.clientX, lastT: now, vx: 0, step: stepPx(),
            slide: e.target.closest('[data-ps-slide]'),
          };
        },
        { signal }
      );
      this.stage.addEventListener(
        'pointermove',
        (e) => {
          if (!drag || e.pointerId !== drag.id) return;
          drag.dx = e.clientX - drag.x;
          const dy = e.clientY - drag.y;
          if (!drag.moved) {
            if (Math.abs(drag.dx) < DRAG_START || Math.abs(drag.dx) < Math.abs(dy)) return;
            drag.moved = true;
            try {
              this.stage.setPointerCapture?.(e.pointerId);
            } catch (err) {
              // Pointer already released or synthetic; dragging still works without capture.
            }
            this.classList.add('is-dragging');
            this.hold?.('drag', true);
          }
          const now = performance.now();
          const dt = Math.max(1, now - drag.lastT);
          drag.vx = drag.vx * 0.6 + ((e.clientX - drag.lastX) / dt) * 0.4;
          drag.lastX = e.clientX;
          drag.lastT = now;
          let off = drag.dx * 0.75;
          if (Math.abs(off) > drag.step) off = Math.sign(off) * (drag.step + (Math.abs(off) - drag.step) * 0.3);
          drag.offset = off;
          if (!frame) frame = requestAnimationFrame(paint);
        },
        { signal }
      );
      const end = (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        const { dx, vx, moved, slide, step } = drag;
        drag = null;
        if (frame) cancelAnimationFrame(frame);
        frame = null;
        this.classList.remove('is-dragging');
        this.hold?.('drag', false);
        this.style.setProperty('--ps-drag', '0px');
        if (moved) {
          const flick = Math.abs(vx) > 0.45 && Math.sign(vx) === Math.sign(dx);
          if (Math.abs(dx) * 0.75 > step * 0.22 || flick) this.go(this.index + (dx < 0 ? 1 : -1));
        } else if (e.type === 'pointerup' && slide && slide.dataset.offset !== '0') {
          this.go(Number(slide.dataset.index));
        }
      };
      this.stage.addEventListener('pointerup', end, { signal });
      this.stage.addEventListener('pointercancel', end, { signal });
    }

    bindAutoplay(signal) {
      this.addEventListener(
        'animationend',
        (e) => {
          const fromBar = e.target === this.bar;
          const fromTab = this.tabs.length && e.target.closest('[data-ps-tab]') === this.tabs[this.index];
          if (e.animationName === 'ps-progress' && (fromBar || fromTab)) {
            this.go(this.index + 1);
          }
        },
        { signal }
      );
      this.addEventListener('pointerenter', () => this.hold('hover', true), { signal });
      this.addEventListener('pointerleave', () => this.hold('hover', false), { signal });
      this.addEventListener('focusin', () => this.hold('focus', true), { signal });
      this.addEventListener('focusout', (e) => !this.contains(e.relatedTarget) && this.hold('focus', false), { signal });
      document.addEventListener('visibilitychange', () => this.hold('hidden', document.hidden), { signal });
      this.toggle?.addEventListener(
        'click',
        () => {
          const paused = this.toggle.getAttribute('aria-pressed') !== 'true';
          this.toggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
          this.hold('user', paused);
        },
        { signal }
      );
      this.observer = new IntersectionObserver(([entry]) => this.hold('offscreen', !entry.isIntersecting), { threshold: 0.25 });
      this.observer.observe(this);
    }

    hold(reason, on) {
      if (!this.holds) return;
      if (on) this.holds.add(reason);
      else this.holds.delete(reason);
      this.classList.toggle('is-paused', this.holds.size > 0);
    }

    bindEditor(signal) {
      if (!window.Shopify?.designMode) return;
      this.addEventListener(
        'shopify:block:select',
        (e) => {
          const slide = e.target.closest('[data-ps-slide]');
          if (slide) this.go(Number(slide.dataset.index));
          this.hold('editor', true);
        },
        { signal }
      );
      this.addEventListener('shopify:block:deselect', () => this.hold('editor', false), { signal });
    }

    // ---------- Compare notes ----------
    // Two columns built from what is already on the page (each perfume's panel and
    // bottle). Notes both perfumes share are highlighted.
    bindCompare(signal) {
      const dialog = this.querySelector('[data-ps-compare]');
      const opens = this.querySelectorAll('[data-ps-compare-open]');
      if (!dialog || !opens.length || typeof dialog.showModal !== 'function') return;
      const select = dialog.querySelector('[data-ps-compare-select]');
      const colA = dialog.querySelector('[data-ps-compare-a]');
      const colB = dialog.querySelector('[data-ps-compare-b]');
      const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

      const info = (i) => {
        const panel = this.panels[i];
        return {
          name: text(panel.querySelector('.ps-panel__name')),
          brand: text(panel.querySelector('.ps-panel__brand')),
          meta: [...panel.querySelectorAll('.ps-panel__meta > span')].map(text).filter(Boolean).join(' · '),
          chips: [...panel.querySelectorAll('.ps-chip')],
          media: this.slides[i]?.querySelector('img, svg'),
          bg: this.slides[i]?.dataset.bg,
        };
      };
      const labels = (i) => new Set(info(i).chips.map((c) => text(c.querySelector('.ps-chip__label')).toLowerCase()));

      const card = (i, other) => {
        const d = info(i);
        const shared = labels(other);
        const wrap = document.createElement('div');
        wrap.className = 'ps-cmp';
        const media = document.createElement('div');
        media.className = 'ps-cmp__media';
        if (d.bg) media.style.setProperty('--cmp-bg', d.bg);
        if (d.media) {
          const clone = d.media.cloneNode(true);
          clone.removeAttribute('loading');
          clone.removeAttribute('fetchpriority');
          media.append(clone);
        }
        const brand = document.createElement('p');
        brand.className = 'ps-cmp__brand';
        brand.textContent = d.brand;
        const name = document.createElement('p');
        name.className = 'ps-cmp__name';
        name.textContent = d.name;
        const meta = document.createElement('p');
        meta.className = 'ps-cmp__meta';
        meta.textContent = d.meta;
        const list = document.createElement('ul');
        list.className = 'ps-chips';
        list.setAttribute('role', 'list');
        d.chips.forEach((chip) => {
          const c = chip.cloneNode(true);
          c.style.animation = 'none';
          if (shared.has(text(chip.querySelector('.ps-chip__label')).toLowerCase())) {
            c.classList.add('is-shared');
            c.setAttribute('aria-label', `${text(chip)} (shared)`);
          }
          list.append(c);
        });
        wrap.append(media, brand, name, meta, list);
        return wrap;
      };

      let a = 0;
      const render = (b) => {
        colA.replaceChildren(card(a, b));
        colB.replaceChildren(card(b, a));
      };
      opens.forEach((btn) =>
        btn.addEventListener(
          'click',
          () => {
            a = this.index;
            select.replaceChildren(
              ...this.panels
                .map((_, i) => i)
                .filter((i) => i !== a)
                .map((i) => {
                  const d = info(i);
                  return new Option(`${d.brand ? `${d.brand}, ` : ''}${d.name}`, String(i));
                })
            );
            const b = (a + 1) % this.count;
            select.value = String(b);
            render(b);
            this.hold('compare', true);
            dialog.showModal();
          },
          { signal }
        )
      );
      select.addEventListener('change', () => render(Number(select.value)), { signal });
      dialog.querySelector('[data-ps-compare-close]')?.addEventListener('click', () => dialog.close(), { signal });
      dialog.addEventListener('click', (e) => e.target === dialog && dialog.close(), { signal });
      dialog.addEventListener('close', () => this.hold('compare', false), { signal });
    }

    // ---------- Mini bag ----------
    bindMini(signal) {
      this.mini = this.querySelector('[data-ps-mini]');
      if (!this.mini) return;
      this.mini.querySelector('[data-ps-mini-close]')?.addEventListener('click', () => this.hideMini(), { signal });
      document.addEventListener('keydown', (e) => e.key === 'Escape' && !this.mini.hidden && this.hideMini(), { signal });
      this.mini.addEventListener('pointerenter', () => clearTimeout(this.miniTimer), { signal });
      this.mini.addEventListener('pointerleave', () => this.armMini(), { signal });
      this.mini.addEventListener('focusin', () => clearTimeout(this.miniTimer), { signal });
    }

    async showMini(item) {
      const mini = this.mini;
      if (!mini) return;
      const money = (cents, currency) => {
        try {
          return new Intl.NumberFormat('en-PH', { style: 'currency', currency: currency || 'PHP' }).format(cents / 100);
        } catch (e) {
          return (cents / 100).toFixed(2);
        }
      };
      const img = mini.querySelector('[data-ps-mini-img]');
      if (item.image) {
        img.src = item.image;
        img.hidden = false;
      } else img.hidden = true;
      mini.querySelector('[data-ps-mini-name]').textContent = item.product_title || '';
      const variant = item.variant_title && item.variant_title !== 'Default Title' ? item.variant_title : '';
      mini.querySelector('[data-ps-mini-variant]').textContent = variant;
      const lineCents = item.final_line_price ?? item.line_price ?? item.price;
      mini.querySelector('[data-ps-mini-price]').textContent = lineCents != null ? money(lineCents, item.currency) : '';
      try {
        const cart = await (await fetch(`${this.dataset.cart || '/cart'}.js`, { headers: { Accept: 'application/json' } })).json();
        mini.querySelector('[data-ps-mini-subtotal]').textContent = money(cart.total_price, cart.currency);
        mini.querySelector('[data-ps-mini-count]').textContent = `${cart.item_count} ${cart.item_count === 1 ? 'item' : 'items'}`;
      } catch (e) {
        mini.querySelector('.ps-mini__sub').hidden = true;
      }
      mini.classList.remove('is-leaving');
      mini.hidden = false;
      this.armMini();
    }

    armMini() {
      clearTimeout(this.miniTimer);
      this.miniTimer = setTimeout(() => this.hideMini(), 6000);
    }

    hideMini() {
      if (!this.mini || this.mini.hidden) return;
      clearTimeout(this.miniTimer);
      this.mini.classList.add('is-leaving');
      setTimeout(() => {
        this.mini.hidden = true;
        this.mini.classList.remove('is-leaving');
      }, 300);
    }

    // ---------- Spray ----------
    // A spritz from the atomizer at the button's left: a cone of fine droplets
    // (random size, angle, distance, blur, timing) and a soft mist cloud drifting
    // right. Elements remove themselves when their animation ends.
    spray(button, strength = 1) {
      if (reducedMotion.matches) return;
      const layer = button.querySelector('.ps-add__mist');
      if (!layer) return;
      const drops = Math.round(18 * strength);
      for (let k = 0; k < drops; k++) {
        const drop = document.createElement('i');
        const angle = ((-26 + Math.random() * 34) * Math.PI) / 180;
        const dist = (90 + Math.random() * 180) * Math.min(strength, 1.4);
        drop.style.setProperty('--dx', `${(Math.cos(angle) * dist).toFixed(1)}px`);
        drop.style.setProperty('--dy', `${(Math.sin(angle) * dist).toFixed(1)}px`);
        drop.style.setProperty('--s', `${(2 + Math.random() * 6).toFixed(1)}px`);
        drop.style.setProperty('--b', `${(Math.random() * 1.6).toFixed(2)}px`);
        drop.style.setProperty('--d', `${Math.round(700 + Math.random() * 600)}ms`);
        drop.style.setProperty('--delay', `${Math.round(Math.random() * 120)}ms`);
        drop.addEventListener('animationend', () => drop.remove(), { once: true });
        layer.append(drop);
      }
      const cloud = document.createElement('b');
      cloud.style.setProperty('--k', strength.toFixed(2));
      cloud.addEventListener('animationend', () => cloud.remove(), { once: true });
      layer.append(cloud);
    }

    // ---------- Add to bag ----------
    bindCart(signal) {
      this.querySelectorAll('.ps-form').forEach((form) => {
        const button = form.querySelector('[data-ps-add]');
        const label = form.querySelector('[data-ps-add-label]');
        const price = form.querySelector('[data-ps-price]');
        const status = form.querySelector('[data-ps-status]');
        const sr = form.querySelector('[data-ps-add-sr]');
        if (!button) return;
        // 'drop' uses the rolling label too, plus a bottle into the bag and a light spray.
        const drop = button.dataset.anim === 'drop';
        const roll = button.dataset.anim === 'roll' || drop;
        // Roll mode: the visible label rolls via CSS classes; only the screen-reader copy changes text.
        const say = (t) => {
          if (roll) { if (sr) sr.textContent = t; }
          else if (label) label.textContent = t;
        };

        const sync = () => {
          const chosen = form.querySelector('input[name="id"]:checked');
          if (!chosen) return;
          if (price && chosen.dataset.price) price.textContent = chosen.dataset.price;
          const panel = form.closest('[data-ps-panel]');
          const top = panel?.querySelector('[data-ps-price-top]');
          const size = panel?.querySelector('[data-ps-price-size]');
          if (top && chosen.dataset.price) top.textContent = chosen.dataset.price;
          if (size) size.textContent = chosen.closest('label')?.querySelector('span')?.textContent.trim() || '';
          const available = chosen.dataset.available === 'true';
          button.disabled = !available;
          if (label) label.textContent = available ? button.dataset.label : button.dataset.soldout;
          if (sr) sr.textContent = available ? button.dataset.label : button.dataset.soldout;
        };
        form.addEventListener('change', (e) => e.target.name === 'id' && sync(), { signal });

        form.addEventListener(
          'submit',
          async (e) => {
            e.preventDefault();
            if (button.disabled) return;
            button.disabled = true;
            button.classList.add('is-loading');
            if (!roll) {
              this.spray(button, 1);
              let pulses = 0;
              const pulse = setInterval(() => {
                if (!button.classList.contains('is-loading') || ++pulses > 3) return clearInterval(pulse);
                this.spray(button, 0.8);
              }, 420);
            }
            say(button.dataset.adding);
            if (status) status.textContent = '';
            try {
              const res = await fetch(`${this.dataset.cartAdd || '/cart/add'}.js`, {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: new FormData(form),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.description || data.message || 'Could not add to bag.');

              button.classList.remove('is-loading');
              button.classList.add('is-added');
              if (!roll) this.spray(button, 1.6);
              if (drop) this.spray(button, 0.45);
              say(button.dataset.added);
              if (status) status.textContent = `${data.product_title || 'Item'} added to your bag.`;
              if (typeof window.publish === 'function' && window.PUB_SUB_EVENTS?.cartUpdate) {
                window.publish(window.PUB_SUB_EVENTS.cartUpdate, { source: 'perfume-showcase', productVariantId: data.variant_id });
              }
              document.dispatchEvent(new CustomEvent('cart:updated', { detail: data }));
              if (this.dataset.afterAdd === 'mini') this.showMini(data);
              if (this.dataset.afterAdd === 'drawer') {
                // Let the rolling label reach "Added ✓" before the drawer slides in.
                setTimeout(() => document.dispatchEvent(new CustomEvent('perfume:cart-open', { detail: data })), 450);
              }
              setTimeout(() => {
                button.classList.remove('is-added');
                sync();
                if (!form.querySelector('input[name="id"]:checked')) {
                  button.disabled = false;
                  say(button.dataset.label);
                }
              }, 2200);
            } catch (error) {
              button.classList.remove('is-loading');
              button.disabled = false;
              say(button.dataset.label);
              if (status) status.textContent = error.message;
            }
          },
          { signal }
        );
      });
    }
  }

  customElements.define('perfume-showcase', PerfumeShowcase);
})();
