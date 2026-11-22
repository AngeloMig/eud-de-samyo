/*
  <perfume-hero> (sections/perfume-hero.liquid)

  Intro: if the section's inline script showed the preloader (first visit this
  session), the charcoal bar rises, the cover lifts, then the hero reveals: heading
  lines slide up, tiles wipe in one by one, accent / slogan / header fade in. The
  start states are the .is-pre class, so removing it plays the reveal through CSS.

  Cursor: a dot follows the mouse over the hero (eased), and grows with a label over
  linked tiles. Mouse and trackpad only; off with reduced motion.
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
