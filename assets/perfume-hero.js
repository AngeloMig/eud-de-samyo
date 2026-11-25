/*
  <perfume-hero> (sections/perfume-hero.liquid)

  Intro: if the section's inline script showed the preloader (first visit this
  session), the charcoal bar rises, the cover lifts, then the hero reveals: heading
  lines slide up, tiles wipe in one by one, accent / slogan / header fade in. The
  start states are the .is-pre class, so removing it plays the reveal through CSS.

  Cursor: a dot follows the mouse over the hero (eased), and grows with a label over
  linked tiles. Mouse and trackpad only; off with reduced motion.

  Hover notes: hovering or focusing a perfume tile shows its notes in random free
  cells; the scent tiles step back until the pointer or focus leaves.
*/
(() => {
  if (customElements.get('perfume-hero')) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  class PerfumeHero extends HTMLElement {
    connectedCallback() {
      this.abort = new AbortController();
      this.intro();
      this.bindCursor();
      this.bindNotes();
      this.bindRotate();
    }

    disconnectedCallback() {
      this.abort?.abort();
      cancelAnimationFrame(this.raf);
    }

    async intro() {
      const loader = this.querySelector('[data-phh-loader]');
      if (!this.classList.contains('is-pre')) {
        if (loader) loader.hidden = true;
        return;
      }

      // Let the display fonts arrive so the heading lines don't re-wrap mid-reveal.
      await Promise.race([document.fonts?.ready, wait(700)]);

      const k = this.dataset.speed === 'fast' ? 0.6 : 1;
      const useLoader = loader && !loader.hidden && !reduced.matches;
      if (useLoader) {
        try {
          sessionStorage.setItem('pf-intro-seen', '1');
        } catch (e) {}
        await wait(40);
        this.classList.add('is-loading');
        await wait(950 * k);
        this.classList.add('is-lifting');
        this.style.setProperty('--phh-delay', `${Math.round(250 * k)}ms`);
        this.reveal();
        await wait(1000);
        loader.hidden = true;
        this.classList.remove('is-loading', 'is-lifting');
      } else {
        if (loader) loader.hidden = true;
        this.reveal();
      }
    }

    reveal() {
      requestAnimationFrame(() => {
        this.classList.remove('is-pre');
        document.documentElement.classList.remove('pf-intro-pre');
      });
    }

    // Rotating word: the heading's last word takes turns with the setting's words.
    // Starts once the intro is done; pauses while the heading is hovered, focus is in
    // the hero, it is off screen or
    // the tab is hidden. Reduced motion: stays on the heading's own word.
    bindRotate() {
      const rot = this.querySelector('[data-phh-rot]');
      if (!rot || reduced.matches) return;
      const words = [...rot.querySelectorAll('.phh__rw')];
      if (words.length < 2) return;
      const signal = this.abort.signal;
      const every = Math.max(2000, parseInt(rot.dataset.interval, 10) || 3000);

      // Fit: the cell is as wide as the longest word. If that doesn't fit beside the
      // line's other words, scale all words down together (one stable size, no wrap).
      const line = rot.closest('.phh__line');
      const lead = line.querySelector('.phh__lead');
      const fit = () => {
        const room = line.clientWidth;
        const space = parseFloat(getComputedStyle(line).fontSize) * 0.1;
        const leadWidth = lead ? lead.offsetWidth + space : 0;
        const free = Math.max(1, room - leadWidth);
        words.forEach((w) => {
          w.style.setProperty('--w-fit', 1);
          const need = w.offsetWidth;
          w.style.setProperty('--w-fit', need > free ? Math.max(0.25, (free / need) * 0.94).toFixed(3) : 1);
        });
        // Still on its own line? Shrink the widest words a little more.
        // Wrapped = the word starts left of where the lead ends (it went to a new line).
        const wrapped = () => lead && rot.getBoundingClientRect().left < lead.getBoundingClientRect().right - 1;
        for (let i = 0; i < 8 && wrapped(); i++) {
          words.forEach((w) => {
            const f = parseFloat(w.style.getPropertyValue('--w-fit')) || 1;
            if (w.offsetWidth >= rot.offsetWidth - 2) w.style.setProperty('--w-fit', Math.max(0.25, f * 0.92).toFixed(3));
          });
        }
      };
      fit();
      document.fonts?.ready.then(fit);
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(fit, 150);
      }, { signal });
      let index = 0;
      let timer;
      let visible = true;
      let held = false;

      const swap = () => {
        const out = words[index];
        index = (index + 1) % words.length;
        const next = words[index];
        out.classList.remove('is-on');
        out.classList.add('is-out');
        next.classList.add('is-on');
        // Once faded, put the old word back to "unwritten" without animating it.
        setTimeout(() => {
          if (out.classList.contains('is-on')) return;
          out.style.transition = 'none';
          out.classList.remove('is-out');
          void out.offsetWidth;
          out.style.transition = '';
        }, 700);
      };
      const schedule = (delay = every) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (visible && !held && !document.hidden) swap();
          schedule();
        }, delay);
      };

      // Hold only while the heading itself is hovered (the hero fills the screen, so
      // holding on the whole hero would mean it almost never turns), or while
      // keyboard focus is in the hero.
      const heading = rot.closest('.phh__heading') || rot;
      let hovering = false;
      let focused = false;
      const sync = () => (held = hovering || focused);
      heading.addEventListener('pointerenter', () => ((hovering = true), sync()), { signal });
      heading.addEventListener('pointerleave', () => ((hovering = false), sync()), { signal });
      this.addEventListener('focusin', () => ((focused = true), sync()), { signal });
      this.addEventListener('focusout', (e) => this.contains(e.relatedTarget) || ((focused = false), sync()), { signal });
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => (visible = entries[0].isIntersecting));
        io.observe(this);
        signal.addEventListener('abort', () => io.disconnect());
      }
      signal.addEventListener('abort', () => clearTimeout(timer));

      // Wait for the intro (the .is-pre class) to finish before the first swap.
      const start = () => {
        rot.classList.add('is-ready');
        schedule(every + 600);
      };
      if (this.classList.contains('is-pre')) {
        const mo = new MutationObserver(() => {
          if (this.classList.contains('is-pre')) return;
          mo.disconnect();
          setTimeout(start, 1200);
        });
        mo.observe(this, { attributes: true, attributeFilter: ['class'] });
      } else {
        start();
      }
    }

    // Hover notes: a perfume tile's notes take random free cells (scent tiles' cells
    // and empty cells of the 4 x 3 grid) while it is hovered or focused.
    bindNotes() {
      const grid = this.querySelector('.phh__grid');
      const perfumes = grid ? [...grid.querySelectorAll('.phh-tile[data-notes]')] : [];
      if (!perfumes.length) return;
      const signal = this.abort.signal;
      const allNotes = [...grid.querySelectorAll('.phh-note')];
      const cellOf = (el) => {
        const cs = getComputedStyle(el);
        return `${parseInt(cs.gridRowStart, 10)}/${parseInt(cs.gridColumnStart, 10)}`;
      };
      const freeCells = () => {
        const taken = new Set();
        const free = [];
        grid.querySelectorAll('.phh-tile').forEach((t) => {
          const cell = cellOf(t);
          if (t.classList.contains('phh-tile--scent')) free.push(cell);
          taken.add(cell);
        });
        for (let r = 1; r <= 3; r++) for (let c = 1; c <= 4; c++) if (!taken.has(`${r}/${c}`)) free.push(`${r}/${c}`);
        for (let i = free.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [free[i], free[j]] = [free[j], free[i]];
        }
        return free;
      };

      let current = null;
      let hideTimer;
      const clearNotes = (keep) => {
        allNotes.forEach((n) => {
          if (n.dataset.for === keep) return;
          n.classList.remove('is-on');
          clearTimeout(n._t);
          n._t = setTimeout(() => n.classList.contains('is-on') || n.classList.remove('is-placed'), 650);
        });
      };
      const show = (id) => {
        clearTimeout(hideTimer);
        if (id === current) return;
        current = id;
        clearNotes(id);
        const cells = freeCells();
        grid.querySelectorAll(`.phh-note[data-for="${id}"]`).forEach((n, i) => {
          if (!cells[i]) return;
          clearTimeout(n._t);
          n.style.gridArea = cells[i];
          n.classList.add('is-placed');
          requestAnimationFrame(() => requestAnimationFrame(() => current === id && n.classList.add('is-on')));
        });
        grid.classList.add('is-notes');
      };
      const hide = () => {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
          current = null;
          clearNotes(null);
          grid.classList.remove('is-notes');
        }, 160);
      };

      perfumes.forEach((tile) => {
        const id = tile.dataset.notes;
        tile.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && show(id), { signal });
        tile.addEventListener('focusin', () => show(id), { signal });
      });
      grid.addEventListener('pointerleave', hide, { signal });
      grid.addEventListener('focusout', (e) => grid.contains(e.relatedTarget) || hide(), { signal });
      // Leaving a perfume for another tile (not a perfume) also puts the scents back.
      grid.querySelectorAll('.phh-tile:not([data-notes])').forEach((t) =>
        t.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && hide(), { signal })
      );
    }

    bindCursor() {
      const cursor = this.querySelector('[data-phh-cursor]');
      const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
      if (!cursor || !fine.matches || reduced.matches) return;
      const signal = this.abort.signal;

      let x = 0;
      let y = 0;
      let cx = 0;
      let cy = 0;
      let running = false;

      const step = () => {
        cx += (x - cx) * 0.2;
        cy += (y - cy) * 0.2;
        cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
        if (Math.abs(x - cx) > 0.1 || Math.abs(y - cy) > 0.1) {
          this.raf = requestAnimationFrame(step);
        } else {
          running = false;
        }
      };

      this.addEventListener(
        'pointermove',
        (e) => {
          if (e.pointerType !== 'mouse') return;
          x = e.clientX;
          y = e.clientY;
          if (!cursor.classList.contains('is-on')) {
            cx = x;
            cy = y;
            cursor.classList.add('is-on');
          }
          if (!running) {
            running = true;
            this.raf = requestAnimationFrame(step);
          }
        },
        { signal }
      );
      this.addEventListener('pointerleave', () => cursor.classList.remove('is-on', 'is-big'), { signal });
      this.querySelectorAll('[data-phh-hover]').forEach((el) => {
        el.addEventListener('pointerenter', () => cursor.classList.add('is-big'), { signal });
        el.addEventListener('pointerleave', () => cursor.classList.remove('is-big'), { signal });
      });
    }
  }

  customElements.define('perfume-hero', PerfumeHero);
})();
