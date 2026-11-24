/*
  <perfume-hero> (sections/perfume-hero.liquid)

  Intro: if the section's inline script showed the preloader (first visit this
  session), the charcoal bar rises, the cover lifts, then the hero reveals: heading
  lines slide up, tiles wipe in one by one, accent / slogan / header fade in. The
  start states are the .is-pre class, so removing it plays the reveal through CSS.

  Cursor: a dot follows the mouse over the hero (eased), and grows with a label over
  linked tiles. Mouse and trackpad only; off with reduced motion.

  Floating tiles: the grid's lean follows the mouse (--phh-mx / --phh-my).
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
      this.bindFloat();
      this.bindNotes();
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

    // Floating tiles: the grid leans with the mouse (each tile by its own depth, CSS).
    bindFloat() {
      const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
      const grid = this.querySelector('.phh__grid');
      if (!grid || !this.classList.contains('phh--float') || !fine.matches || reduced.matches) return;
      const signal = this.abort.signal;
      this.addEventListener(
        'pointermove',
        (e) => {
          if (e.pointerType !== 'mouse') return;
          const r = this.getBoundingClientRect();
          grid.style.setProperty('--phh-mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
          grid.style.setProperty('--phh-my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
        },
        { signal }
      );
      this.addEventListener(
        'pointerleave',
        () => {
          grid.style.setProperty('--phh-mx', 0);
          grid.style.setProperty('--phh-my', 0);
        },
        { signal }
      );
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
