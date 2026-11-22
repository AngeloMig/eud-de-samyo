/*
  <perfume-lineup> (sections/perfume-lineup.liquid), after High Spirits' Product Lineup.
  - Endless: copies of the bottles follow the originals; the row's position wraps by
    exactly one set's width, which looks identical, so it never runs out either way.
    Copies are hidden from screen readers and the keyboard.
  - Moves with transform only, one requestAnimationFrame loop while on screen:
    a slow drift (setting), paused while hovered, keyboard-focused, touched, hidden,
    or under reduced motion.
  - Drag with mouse or finger (vertical page scroll still works); on release it
    glides on and eases to a stop, no snapping. A drag never opens the bottle's link.
  - Arrow keys on the focused row give it a nudge.
*/
(() => {
  if (customElements.get('perfume-lineup')) return;

  const FRICTION = 0.995; // glide speed kept per ms
  const MIN_SPEED = 0.02; // px/ms at which the glide stops
  const THRESHOLD = 6; // px before a press counts as a drag
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  class PerfumeLineup extends HTMLElement {
    connectedCallback() {
      this.strip = this.querySelector('[data-pl-strip]');
      this.track = this.querySelector('[data-pl-track]');
      if (!this.strip || !this.track) return;
      this.originals = [...this.track.children];
      if (!this.originals.length) return;
      this.x = 0;
      this.v = 0;
      this.speed = (Number(this.dataset.speed) || 30) / 1000; // px per ms
      this.autoplay = this.dataset.autoplay === 'true';
      this.abort = new AbortController();
      const signal = this.abort.signal;

      this.build();
      new ResizeObserver(() => this.build()).observe(this.strip);

      this.strip.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && (this.hovered = true), { signal });
      this.strip.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && (this.hovered = false), { signal });
      this.addEventListener('focusin', () => (this.focused = true), { signal });
      this.addEventListener('focusout', () => (this.focused = this.contains(document.activeElement)), { signal });
      this.strip.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') this.v = -1.4;
        else if (e.key === 'ArrowLeft') this.v = 1.4;
        else return;
        e.preventDefault();
        this.resumeAt = performance.now() + 2500;
      }, { signal });
      this.bindDrag(signal);

      // Only animate while on screen.
      new IntersectionObserver((entries) => {
        this.visible = entries.some((e) => e.isIntersecting);
        if (this.visible) this.start();
      }).observe(this);
    }

    disconnectedCallback() {
      this.abort?.abort();
      cancelAnimationFrame(this.frame);
    }

    leftOf(el) {
      return el.getBoundingClientRect().left - this.track.getBoundingClientRect().left;
    }

    makeCopy() {
      const frag = document.createDocumentFragment();
      this.originals.forEach((item) => {
        const clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.dataset.plClone = '';
        [...clone.attributes].forEach((a) => a.name.startsWith('data-shopify-editor') && clone.removeAttribute(a.name));
        clone.querySelectorAll('a, button, [tabindex]').forEach((el) => el.setAttribute('tabindex', '-1'));
        frag.appendChild(clone);
      });
      return frag;
    }

    build() {
      this.track.querySelectorAll('[data-pl-clone]').forEach((c) => c.remove());
      this.track.appendChild(this.makeCopy());
      const firstCopy = this.track.children[this.originals.length];
      this.period = this.leftOf(firstCopy) - this.leftOf(this.originals[0]);
      if (this.period <= 0) return;
      // Enough copies that the strip is always covered after wrapping.
      let guard = 0;
      while (this.track.scrollWidth < this.strip.clientWidth + this.period * 2 && guard++ < 20) {
        this.track.appendChild(this.makeCopy());
      }
      this.wrap();
      this.render();
    }

    wrap() {
      if (!this.period) return;
      while (this.x <= -this.period) this.x += this.period;
      while (this.x > 0) this.x -= this.period;
    }

    render() {
      this.track.style.transform = `translate3d(${this.x}px, 0, 0)`;
    }

    canDrift() {
      return (
        this.autoplay && !reduced.matches && !this.hovered && !this.focused &&
        !this.dragging && !document.hidden && performance.now() >= (this.resumeAt || 0)
      );
    }

    start() {
      if (this.frame) return;
      let last = performance.now();
      const tick = (now) => {
        const dt = Math.min(64, now - last);
        last = now;
        if (!this.dragging) {
          if (Math.abs(this.v) > MIN_SPEED) {
            this.x += this.v * dt;
            this.v *= reduced.matches ? 0 : FRICTION ** dt;
          } else {
            this.v = 0;
            if (this.canDrift()) this.x -= this.speed * dt;
          }
          this.wrap();
          this.render();
        }
        this.frame = this.visible ? requestAnimationFrame(tick) : 0;
      };
      this.frame = requestAnimationFrame(tick);
    }

    bindDrag(signal) {
      let id = null;
      let startX = 0;
      let startPos = 0;
      let samples = [];
      this.strip.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        id = e.pointerId;
        startX = e.clientX;
        startPos = this.x;
        samples = [[performance.now(), e.clientX]];
        this.moved = false;
        this.v = 0;
      }, { signal });
      this.strip.addEventListener('pointermove', (e) => {
        if (e.pointerId !== id) return;
        const dx = e.clientX - startX;
        if (!this.moved && Math.abs(dx) > THRESHOLD) {
          this.moved = true;
          this.dragging = true;
          this.classList.add('is-dragging');
          try {
            this.strip.setPointerCapture(id);
          } catch (err) {
            /* pointer already gone */
          }
        }
        if (!this.dragging) return;
        this.x = startPos + dx;
        this.wrap();
        this.render();
        const now = performance.now();
        samples.push([now, e.clientX]);
        samples = samples.filter(([t]) => now - t < 100);
      }, { signal });
      const end = (e) => {
        if (e.pointerId !== id) return;
        id = null;
        if (this.dragging) {
          const [t0, x0] = samples[0] || [0, 0];
          const [t1, x1] = samples[samples.length - 1] || [0, 0];
          this.v = t1 > t0 ? (x1 - x0) / (t1 - t0) : 0;
          this.resumeAt = performance.now() + 2500;
        }
        this.dragging = false;
        this.classList.remove('is-dragging');
      };
      this.strip.addEventListener('pointerup', end, { signal });
      this.strip.addEventListener('pointercancel', end, { signal });
      this.strip.addEventListener('click', (e) => {
        if (this.moved) {
          e.preventDefault();
          e.stopPropagation();
          this.moved = false;
        }
      }, { capture: true, signal });
      this.strip.addEventListener('dragstart', (e) => e.preventDefault(), { signal });
    }
  }

  customElements.define('perfume-lineup', PerfumeLineup);
})();
