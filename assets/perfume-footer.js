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
      const signature = this.querySelector('.pfo-signature');
      signature?.addEventListener('pointerenter', event => {
        if (event.pointerType === 'mouse' && !this.wordmark?.classList.contains('is-entering')) this.spraySignature();
      }, { signal });
      signature?.addEventListener('pointerleave', () => this.finishMist(), { signal });

      // Keep Shopify's native success/error handling; stop malformed email posts
      // even though the customer form disables the browser's automatic validation.
      this.querySelector('.pfo-news')?.addEventListener('submit', (event) => {
        if (event.currentTarget.checkValidity()) return;
        event.preventDefault();
        event.currentTarget.reportValidity();
      }, { signal });

      const mobile = window.matchMedia('(max-width: 749px)');
      const menus = [...this.querySelectorAll('[data-pfo-menu]')];
      const arrangeMenus = () => menus.forEach(menu => {
        menu.open = !mobile.matches || menu.contains(document.activeElement);
      });
      menus.forEach(menu => menu.querySelector('summary').addEventListener('click', event => {
        if (!mobile.matches) event.preventDefault();
      }, { signal }));
      mobile.addEventListener('change', arrangeMenus, { signal });
      arrangeMenus();

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
        const reveal = () => {
          this.wordmark.classList.add('is-in');
          if (this.dataset.wordmarkMotion === 'prefix') this.revealSignature();
        };
        if (reduced.matches || !('IntersectionObserver' in window)) this.wordmark.classList.add('is-in');
        else {
          this.wordObserver = new IntersectionObserver(
            ([entry]) => {
              if (!entry.isIntersecting) return;
              this.wordObserver.disconnect();
              reveal();
            },
            { threshold: 0.12 }
          );
          this.wordObserver.observe(this.wordmark);
        }
        reduced.addEventListener('change', () => {
          if (reduced.matches) { this.finishSignature(); this.finishMist(); }
        }, { signal });
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) { this.finishSignature(); this.finishMist(); }
        }, { signal });
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

    // Idea 5: the small prefix introduces the name, once on entering the viewport.
    // Baseline content is visible; a failed script never leaves the signature hidden.
    revealSignature() {
      this.finishSignature();
      if (!this.wordmark || reduced.matches || typeof this.wordmark.animate !== 'function') return;
      this.wordmark.classList.add('is-in', 'is-entering');
      const prefix = this.wordmark.querySelector('.pfo-wordmark__pre');
      const letters = [...this.wordmark.querySelectorAll('.pfo-wordmark__ch')];
      const easing = 'cubic-bezier(0.16, 1, 0.3, 1)';
      const animations = [];
      if (prefix) animations.push(prefix.animate([
        { opacity: 0, transform: 'translateX(-18px)' },
        { opacity: 1, transform: 'translateX(0)' },
      ], { duration: 700, easing, fill: 'both' }));
      letters.forEach((letter, index) => animations.push(letter.animate([
        { opacity: 0, transform: 'translateY(28%)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 1000, delay: (prefix ? 500 : 0) + index * 65, easing, fill: 'both' })));
      this.signatureAnimations = animations;
      Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
        if (this.signatureAnimations === animations) this.finishSignature();
      });
    }

    finishSignature() {
      this.signatureAnimations?.forEach(animation => animation.cancel());
      this.signatureAnimations = null;
      this.wordmark?.classList.remove('is-entering');
    }

    // One short atomiser plume per hover; no loop or pointer-tracking work.
    spraySignature() {
      this.finishMist();
      if (this.dataset.wordmarkMist !== 'true' || reduced.matches || !this.wordmark?.animate) return;
      const layer = document.createElement('span');
      layer.className = 'pfo-signature__mist';
      layer.setAttribute('aria-hidden', 'true');
      this.querySelector('.pfo-signature')?.append(layer);
      this.mistLayer = layer;
      const animations = [];
      for (let i = 0; i < 21; i++) {
        const cloud = i > 17;
        const drop = document.createElement('span');
        drop.className = `pfo-signature__drop${cloud ? ' pfo-signature__drop--cloud' : ''}`;
        drop.style.left = `${cloud ? 32 + (i - 18) * 19 : 16 + (i * 13 % 73)}%`;
        drop.style.top = `${cloud ? 47 : 39 + (i * 7 % 33)}%`;
        layer.append(drop);
        const x = 14 + (i % 5) * 9;
        const y = -25 - (i % 6) * 10;
        animations.push(drop.animate([
          { opacity: 0, transform: 'translate(0, 10px) scale(0.65)' },
          { opacity: cloud ? 0.24 : 0.65, offset: 0.22, transform: `translate(${x * 0.22}px, ${y * 0.18}px) scale(1)` },
          { opacity: 0, transform: `translate(${x}px, ${y}px) scale(${cloud ? 2.4 : 0.45})` },
        ], { duration: 1250 + i % 3 * 120, delay: i % 6 * 45, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)', fill: 'both' }));
      }
      this.mistAnimations = animations;
      Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
        if (this.mistLayer === layer) this.finishMist();
      });
    }

    finishMist() {
      this.mistAnimations?.forEach(animation => animation.cancel());
      this.mistAnimations = null;
      this.mistLayer?.remove();
      this.mistLayer = null;
    }

    disconnectedCallback() {
      this.finishSignature();
      this.finishMist();
      this.abort?.abort();
      this.observer?.disconnect();
      this.wordObserver?.disconnect();
      if (this.frame) cancelAnimationFrame(this.frame);
    }
  }

  customElements.define('perfume-footer', PerfumeFooter);
})();
