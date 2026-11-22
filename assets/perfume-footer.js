/*
  <perfume-footer> (sections/perfume-footer.liquid)
  - Reveal: while the footer comes into view, its content moves from 35% of the
    footer's height lower up to its place (--pfo-shift), so the page seems to lift
    off it (NOHO). Only while it is near the screen; off with reduced motion.
  - The giant wordmark's letters rise in once it is on screen.
  - Back to top scrolls smoothly (instantly with reduced motion) and moves focus.
*/
(() => {
  if (customElements.get('perfume-footer')) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.documentElement.classList.add('pf-js');

  class PerfumeFooter extends HTMLElement {
    connectedCallback() {
      this.abort = new AbortController();
      const signal = this.abort.signal;
      this.inner = this.querySelector('[data-pfo-inner]');
      this.wordmark = this.querySelector('[data-pfo-wordmark]');

      if (this.dataset.reveal === 'true' && !reduced.matches && this.inner) {
        const update = () => {
          this.frame = null;
          const rect = this.getBoundingClientRect();
          const vh = window.innerHeight;
          // 0 when the footer's top meets the bottom of the screen, 1 when it is fully in.
          const progress = Math.min(1, Math.max(0, (vh - rect.top) / Math.min(rect.height, vh)));
          this.inner.style.setProperty('--pfo-shift', `${((1 - progress) * rect.height * -0.35).toFixed(1)}px`);
        };
        const onScroll = () => {
          if (!this.near || this.frame) return;
          this.frame = requestAnimationFrame(update);
        };
        this.observer = new IntersectionObserver(
          ([entry]) => {
            this.near = entry.isIntersecting;
            if (this.near) update();
          },
          { rootMargin: '0px 0px 200px 0px' }
        );
        this.observer.observe(this);
        window.addEventListener('scroll', onScroll, { passive: true, signal });
        window.addEventListener('resize', onScroll, { signal });
      }

      if (this.wordmark) {
        if (reduced.matches || !('IntersectionObserver' in window)) this.wordmark.classList.add('is-in');
        else {
          this.wordObserver = new IntersectionObserver(
            ([entry]) => {
              if (!entry.isIntersecting) return;
              this.wordmark.classList.add('is-in');
              this.wordObserver.disconnect();
            },
            { threshold: 0.4 }
          );
          this.wordObserver.observe(this.wordmark);
        }
      }

      this.querySelector('[data-pfo-top]')?.addEventListener(
        'click',
        (e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' });
          const target = document.getElementById('MainContent') || document.querySelector('main');
          if (target) {
            if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
          }
        },
        { signal }
      );
    }

    disconnectedCallback() {
      this.abort?.abort();
      this.observer?.disconnect();
      this.wordObserver?.disconnect();
      if (this.frame) cancelAnimationFrame(this.frame);
    }
  }

  customElements.define('perfume-footer', PerfumeFooter);
})();
