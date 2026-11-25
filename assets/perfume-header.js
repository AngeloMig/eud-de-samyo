/*
  <perfume-header> (sections/perfume-header.liquid)
  Opens and closes the menu (burger), keeps the closed menu out of the tab order
  (inert), closes on Escape, outside click and breakpoint change, staggers the items,
  and keeps the Bag count in step with Dawn's cart events.
  Desktop: marks the bar "settled" once unrolled (so mega menus can hang below it;
  a timer backs up the transitionend), moves the glide block under the hovered
  link, opens mega menus on tap for touch screens and keeps aria-expanded in step.
  Phones: the + button next to a mega item opens its links in place. Search opens inside the bar (Escape or Cancel closes it).
*/
(() => {
  if (customElements.get('perfume-header')) return;

  class PerfumeHeader extends HTMLElement {
    connectedCallback() {
      this.toggle = this.querySelector('[data-ph-toggle]');
      this.panel = this.querySelector('[data-ph-panel]');
      this.label = this.querySelector('[data-ph-label]');
      this.count = this.querySelector('[data-ph-count]');
      this.glide = this.querySelector('[data-ph-glide]');
      this.search = this.querySelector('[data-ph-search]');
      this.searchOpen = this.querySelector('[data-ph-search-open]');
      if (!this.toggle || !this.panel) return;

      this.abort = new AbortController();
      const signal = this.abort.signal;

      // Stagger index for the items' entrance.
      this.panel.querySelectorAll('.ph__item').forEach((item, i) => item.style.setProperty('--i', i));
      this.setOpen(false);

      this.toggle.addEventListener('click', () => this.setOpen(!this.open), { signal });
      document.addEventListener(
        'keydown',
        (e) => {
          if (e.key !== 'Escape' || !this.open) return;
          if (this.classList.contains('is-searching')) {
            this.setSearch(false);
            return;
          }
          this.setOpen(false);
          this.toggle.focus();
        },
        { signal }
      );
      document.addEventListener(
        'click',
        (e) => {
          if (this.open && !this.contains(e.target)) this.setOpen(false);
        },
        { signal }
      );
      window.matchMedia('(min-width: 990px)').addEventListener('change', () => this.setOpen(false), { signal });
      this.panel.addEventListener(
        'transitionend',
        (e) => {
          if (e.target === this.panel && e.propertyName === 'clip-path' && this.open) this.classList.add('is-settled');
        },
        { signal }
      );

      this.bindSpray(signal);
      this.bindGlide(signal);
      this.bindMega(signal);
      this.bindSearch(signal);
      this.bindAnnouncement(signal);
      this.bindAdaptDark(signal);
      // Scrolled past the top: a soft cream fade behind the logo corner (owner idea 07).
      const down = () => this.classList.toggle('is-down', window.scrollY > 40);
      window.addEventListener('scroll', down, { passive: true, signal });
      down();

      // Bag count: Dawn publishes cart updates through its pub/sub; other themes can
      // dispatch a 'cart:updated' event on document.
      const refresh = () => this.refreshCount();
      if (typeof window.subscribe === 'function' && window.PUB_SUB_EVENTS?.cartUpdate) {
        this.unsubscribe = window.subscribe(window.PUB_SUB_EVENTS.cartUpdate, refresh);
      }
      document.addEventListener('cart:updated', refresh, { signal });
    }

    disconnectedCallback() {
      this.abort?.abort();
      this.unsubscribe?.();
    }

    setOpen(open) {
      this.open = open;
      clearTimeout(this.settleTimer);
      if (open) {
        // Fallback in case the clip-path transitionend never arrives.
        this.settleTimer = setTimeout(() => this.open && this.classList.add('is-settled'), 800);
      }
      if (!open) {
        this.closeMegas();
        this.classList.remove('is-settled');
        if (this.classList.contains('is-searching')) this.setSearch(false, false);
      } else if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.classList.add('is-settled');
      }
      this.classList.toggle('is-open', open);
      // Phones: the menu is a full-height sheet just under the boxes; the page behind stays put.
      const phone = !window.matchMedia('(min-width: 990px)').matches;
      if (open && phone) {
        const boxes = this.querySelector('.ph__inner')?.getBoundingClientRect();
        if (boxes) this.style.setProperty('--ph-sheet-top', `${Math.round(boxes.bottom + 4)}px`);
      }
      document.documentElement.classList.toggle('ph-locked', open && phone);
      this.toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      this.panel.inert = !open;
      if (this.label) this.label.textContent = open ? this.label.dataset.close : this.label.dataset.open;
    }

    // Announcement: several messages roll through (paused while hovered); × hides it
    // for this visit (a changed message has a new key, so it shows again).
    bindAnnouncement(signal) {
      const ann = this.querySelector('[data-ph-ann]');
      if (!ann) return;
      const key = `pf-ann-${ann.dataset.key}`;
      try {
        if (sessionStorage.getItem(key)) ann.hidden = true;
      } catch (e) {
        /* storage blocked: just show it */
      }
      ann.querySelector('[data-ph-ann-close]')?.addEventListener('click', () => {
        ann.hidden = true;
        try {
          sessionStorage.setItem(key, '1');
        } catch (e) {
          /* storage blocked */
        }
        window.dispatchEvent(new Event('resize'));
      }, { signal });
      const msgs = [...ann.querySelectorAll('[data-ph-ann-msg]')];
      if (msgs.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      let i = 0;
      let hovered = false;
      ann.addEventListener('pointerenter', () => (hovered = true), { signal });
      ann.addEventListener('pointerleave', () => (hovered = false), { signal });
      const timer = setInterval(() => {
        if (hovered || ann.hidden || document.hidden) return;
        const out = msgs[i];
        i = (i + 1) % msgs.length;
        out.classList.remove('is-on');
        out.classList.add('is-out');
        msgs[i].classList.remove('is-out');
        msgs[i].classList.add('is-on');
        setTimeout(() => out.classList.remove('is-out'), 650);
      }, 4500);
      signal.addEventListener('abort', () => clearInterval(timer));
    }

    // Reads the background colour just under the header (images are skipped: their
    // parent's colour counts). Used to turn the boxes charcoal over dark sections
    // (under the Bag box) and, on inner pages, to give the sticky bar the colour of
    // the section under it so it blends in (middle of the screen).
    colourAt(x, y) {
      const stack = document.elementsFromPoint(x, y);
      for (const el of stack) {
        if (this.contains(el) || el.closest('perfume-cart-drawer, .pcol-drawer, .pp-sticky')) continue;
        let node = el;
        while (node && node !== document.documentElement) {
          const c = getComputedStyle(node).backgroundColor;
          const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
          if (m && (m[4] === undefined || Number(m[4]) > 0.5)) return [Number(m[1]), Number(m[2]), Number(m[3])];
          node = node.parentElement;
        }
        return null;
      }
      return null;
    }

    bindAdaptDark(signal) {
      const dark = this.hasAttribute('data-adapt-dark');
      const blend = this.hasAttribute('data-blend') && this.classList.contains('ph--sticky');
      if (!dark && !blend) return;
      let frame = 0;
      const check = () => {
        frame = 0;
        const head = this.querySelector('.ph__inner').getBoundingClientRect();
        if (blend) {
          // Just below the sticky bar, in the middle of the screen.
          const rgb = this.colourAt(window.innerWidth / 2, this.getBoundingClientRect().bottom + 2);
          if (rgb) this.style.setProperty('--ph-under', `rgb(${rgb.join(',')})`);
        }
        if (dark) {
          const r = (this.querySelector('.ph__bag') || this).getBoundingClientRect();
          const rgb = this.colourAt(r.left + r.width / 2, Math.max(head.bottom, r.bottom) + 6);
          if (!rgb) return;
          const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
          this.classList.toggle('is-on-dark', lum < 0.35);
        }
      };
      const queue = () => {
        if (!frame) frame = requestAnimationFrame(check);
      };
      window.addEventListener('scroll', queue, { passive: true, signal });
      window.addEventListener('resize', queue, { signal });
      check();
      setTimeout(check, 400);
      if (blend) setTimeout(() => this.classList.add('is-blend-ready'), 450);
    }

    // Spray logo: one spray on hover/keyboard focus, and once shortly after load.
    bindSpray(signal) {
      const mark = this.querySelector('[data-ph-mark]');
      if (!mark || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const logo = mark.closest('a');
      let busy = false;
      const spray = () => {
        if (busy) return;
        busy = true;
        mark.classList.remove('is-spraying');
        void mark.offsetWidth;
        mark.classList.add('is-spraying');
        setTimeout(() => {
          mark.classList.remove('is-spraying');
          busy = false;
        }, 1800);
      };
      logo.addEventListener('mouseenter', spray, { signal });
      logo.addEventListener('focus', () => logo.matches(':focus-visible') && spray(), { signal });
      setTimeout(spray, 900);
    }

    // A single charcoal block slides under the hovered link (transform only).
    bindGlide(signal) {
      if (!this.glide) return;
      const desktop = window.matchMedia('(min-width: 990px)');
      const links = [...this.panel.querySelectorAll('.ph__list > .ph__item > .ph__link')];
      let current = null;
      const moveTo = (link) => {
        if (!desktop.matches) return;
        const box = this.panel.getBoundingClientRect();
        const r = link.getBoundingClientRect();
        const first = !this.glide.classList.contains('is-on');
        this.glide.classList.toggle('is-jump', first);
        this.glide.style.transform = `translateX(${r.left - box.left}px) scaleX(${r.width / 100})`;
        if (first) void this.glide.offsetWidth;
        this.glide.classList.add('is-on');
        this.glide.classList.remove('is-jump');
        current?.classList.remove('is-glided');
        link.classList.add('is-glided');
        current = link;
      };
      const off = () => {
        this.glide.classList.remove('is-on');
        current?.classList.remove('is-glided');
        current = null;
      };
      links.forEach((link) => {
        link.addEventListener('mouseenter', () => moveTo(link), { signal });
        link.addEventListener('focus', () => link.matches(':focus-visible') && moveTo(link), { signal });
        link.addEventListener('blur', off, { signal });
      });
      this.panel.querySelector('.ph__list')?.addEventListener('mouseleave', (e) => {
        // Moving down into a sub-menu panel keeps its link lit.
        if (e.relatedTarget && current?.parentElement.contains(e.relatedTarget)) return;
        off();
      }, { signal });
      this.panel.querySelectorAll('[data-ph-mega-item]').forEach((item) =>
        item.addEventListener('mouseleave', off, { signal })
      );
    }

    // Mega menu. Desktop: opens on hover and keyboard focus in CSS; on touch screens
    // (no hover) the first tap opens it instead of following the link. Phones: the +
    // button opens the links in place. aria-expanded stays truthful either way.
    bindMega(signal) {
      const desktop = window.matchMedia('(min-width: 990px)');
      const touch = window.matchMedia('(hover: none)');
      this.megas = [...this.panel.querySelectorAll('[data-ph-mega-item]')];
      this.megas.forEach((item) => {
        const link = item.querySelector('.ph__link');
        const sub = item.querySelector('[data-ph-sub]');
        const set = (v) => link.setAttribute('aria-expanded', v && this.classList.contains('is-settled') ? 'true' : 'false');
        item.addEventListener('mouseenter', () => set(true), { signal });
        item.addEventListener('mouseleave', () => {
          if (!item.contains(document.activeElement)) item.classList.remove('is-mega-shut');
          set(item.contains(document.activeElement) || item.classList.contains('is-mega-open'));
        }, { signal });
        item.addEventListener('focusin', () => set(true), { signal });
        item.addEventListener('focusout', (e) => {
          if (item.contains(e.relatedTarget)) return;
          item.classList.remove('is-mega-open', 'is-mega-shut');
          set(false);
        }, { signal });
        link.addEventListener('click', (e) => {
          if (!desktop.matches || !touch.matches || item.classList.contains('is-mega-open')) return;
          e.preventDefault();
          this.closeMegas(item);
          item.classList.add('is-mega-open');
          set(true);
        }, { signal });
        this.bindFeatureSwap(item, signal);
        sub?.addEventListener('click', () => {
          const open = !item.classList.contains('is-sub-open');
          item.classList.toggle('is-sub-open', open);
          sub.setAttribute('aria-expanded', open ? 'true' : 'false');
        }, { signal });
      });
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const item = this.megas.find((m) => m.contains(document.activeElement) || m.classList.contains('is-mega-open'));
        if (!item) return;
        e.stopImmediatePropagation();
        this.closeMegas();
        item.classList.add('is-mega-shut'); // stays shut until the pointer or focus leaves
        item.querySelector('.ph__link').focus();
      }, { signal, capture: true });
      document.addEventListener('click', (e) => {
        if (!this.megas.some((m) => m.contains(e.target))) this.closeMegas();
      }, { signal });
    }

    // Hovering (or focusing) a link with its own image swaps the mega menu picture
    // to it, with the link's name as the caption; leaving the list restores it.
    bindFeatureSwap(item, signal) {
      const feature = item.querySelector('[data-ph-feature]');
      const alt = feature?.querySelector('[data-ph-alt]');
      if (!alt) return;
      const title = feature.querySelector('[data-ph-feature-title]');
      const base = { href: feature.getAttribute('href'), title: title?.textContent || '' };
      const links = [...item.querySelectorAll('.ph__mega-link[data-ph-img]:not([data-ph-img=""])')];
      if (!links.length) return;
      let preloaded = false;
      const preload = () => {
        if (preloaded) return;
        preloaded = true;
        links.forEach((a) => (new Image().src = a.dataset.phImg));
      };
      const show = (a) => {
        if (alt.getAttribute('src') !== a.dataset.phImg) alt.src = a.dataset.phImg;
        feature.classList.add('is-alt');
        feature.setAttribute('href', a.getAttribute('href'));
        if (title) title.textContent = a.textContent.trim();
      };
      const reset = () => {
        feature.classList.remove('is-alt');
        feature.setAttribute('href', base.href);
        if (title) title.textContent = base.title;
      };
      item.addEventListener('mouseenter', preload, { signal });
      item.addEventListener('focusin', preload, { signal });
      links.forEach((a) => {
        a.addEventListener('mouseenter', () => show(a), { signal });
        a.addEventListener('focus', () => show(a), { signal });
      });
      item.querySelector('.ph__mega-main')?.addEventListener('mouseleave', (e) => {
        if (!feature.contains(e.relatedTarget)) reset();
      }, { signal });
      item.addEventListener('mouseleave', reset, { signal });
    }

    closeMegas(except) {
      (this.megas || []).forEach((m) => {
        if (m === except) return;
        m.classList.remove('is-mega-open');
        m.querySelector('.ph__link')?.setAttribute('aria-expanded', 'false');
      });
    }

    bindSearch(signal) {
      if (!this.search || !this.searchOpen) return;
      this.searchOpen.addEventListener(
        'click',
        (e) => {
          e.preventDefault();
          this.setSearch(true);
        },
        { signal }
      );
      this.search.querySelector('[data-ph-search-close]')?.addEventListener('click', () => this.setSearch(false), { signal });
    }

    setSearch(on, refocus = true) {
      if (!this.search) return;
      this.classList.toggle('is-searching', on);
      this.search.hidden = !on;
      this.searchOpen?.setAttribute('aria-expanded', on ? 'true' : 'false');
      this.glide?.classList.remove('is-on');
      if (on) this.search.querySelector('input[type="search"]')?.focus();
      else if (refocus && this.open) this.searchOpen?.focus();
    }

    async refreshCount() {
      if (!this.count) return;
      try {
        const res = await fetch(`${this.dataset.cartUrl}.js`, { headers: { Accept: 'application/json' } });
        const cart = await res.json();
        this.count.textContent = cart.item_count;
      } catch (e) {
        // Leave the last known count.
      }
    }
  }

  customElements.define('perfume-header', PerfumeHeader);
})();
