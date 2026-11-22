/*
  <perfume-families> (sections/perfume-families.liquid)
  When the tiles overflow sideways (phones, under 750px), the row becomes a carousel:
  native swipe with scroll-snap, mouse drag (snap waits for the release), arrows that
  move one tile, and dots that follow the tile in front. Controls stay hidden when
  everything fits (the desktop grid), and without JavaScript the row still swipes.
*/
(() => {
  if (customElements.get('perfume-families')) return;

  class PerfumeFamilies extends HTMLElement {
    connectedCallback() {
      this.list = this.querySelector('[data-pfa-list]');
      this.controls = this.querySelector('[data-pfa-controls]');
      this.prev = this.querySelector('[data-pfa-prev]');
      this.next = this.querySelector('[data-pfa-next]');
      this.dots = [...this.querySelectorAll('[data-pfa-dot]')];
      if (!this.list) return;
      this.tiles = [...this.list.children];
      this.abort = new AbortController();
      const signal = this.abort.signal;

      this.prev?.addEventListener('click', () => this.goTo(this.index - 1), { signal });
      this.next?.addEventListener('click', () => this.goTo(this.index + 1), { signal });
      this.dots.forEach((dot) => dot.addEventListener('click', () => this.goTo(Number(dot.dataset.pfaDot)), { signal }));

      let frame = 0;
      this.list.addEventListener(
        'scroll',
        () => {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => this.sync());
        },
        { passive: true, signal }
      );
      new ResizeObserver(() => this.layout()).observe(this.list);
      this.bindDrag(signal);
      this.layout();
    }

    disconnectedCallback() {
      this.abort?.abort();
    }

    get scrollable() {
      return this.list.scrollWidth > this.list.clientWidth + 2;
    }

    layout() {
      const on = this.scrollable;
      if (this.controls) this.controls.hidden = !on;
      this.list.classList.toggle('is-draggable', on);
      this.sync();
    }

    // The tile whose left edge is closest to where snapping puts it.
    sync() {
      const pad = parseFloat(getComputedStyle(this.list).scrollPaddingLeft) || 0;
      const start = this.list.getBoundingClientRect().left + pad;
      let best = 0;
      let bestDist = Infinity;
      this.tiles.forEach((tile, i) => {
        const d = Math.abs(tile.getBoundingClientRect().left - start);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      const atEnd = this.list.scrollLeft + this.list.clientWidth >= this.list.scrollWidth - 2;
      this.index = atEnd ? this.tiles.length - 1 : best;
      this.dots.forEach((dot, i) => dot.setAttribute('aria-current', i === this.index ? 'true' : 'false'));
      if (this.prev) this.prev.disabled = this.list.scrollLeft <= 2;
      if (this.next) this.next.disabled = atEnd;
    }

    goTo(i) {
      const tile = this.tiles[Math.max(0, Math.min(this.tiles.length - 1, i))];
      if (!tile) return;
      const pad = parseFloat(getComputedStyle(this.list).scrollPaddingLeft) || 0;
      const left = tile.offsetLeft - this.list.offsetLeft - pad;
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.list.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
    }

    // Mouse only: touch and pens already swipe natively.
    bindDrag(signal) {
      let startX = 0;
      let startLeft = 0;
      let moved = false;
      let down = false;
      this.list.addEventListener(
        'pointerdown',
        (e) => {
          if (e.pointerType !== 'mouse' || e.button !== 0 || !this.scrollable) return;
          down = true;
          moved = false;
          startX = e.clientX;
          startLeft = this.list.scrollLeft;
        },
        { signal }
      );
      window.addEventListener(
        'pointermove',
        (e) => {
          if (!down) return;
          const dx = e.clientX - startX;
          if (!moved && Math.abs(dx) > 5) {
            moved = true;
            this.list.classList.add('is-dragging');
          }
          if (moved) this.list.scrollLeft = startLeft - dx;
        },
        { signal }
      );
      const end = (e) => {
        if (!down) return;
        down = false;
        if (!moved) return;
        const dx = e.clientX - startX;
        this.list.classList.remove('is-dragging');
        // Settle on the tile in front, nudged one way by the drag's direction.
        this.sync();
        const shouldStep = Math.abs(dx) > this.list.clientWidth * 0.12;
        const target = shouldStep && dx < 0 ? Math.max(this.index, this.indexFrom(startLeft) + 1)
          : shouldStep && dx > 0 ? Math.min(this.index, this.indexFrom(startLeft) - 1)
          : this.index;
        this.goTo(target);
      };
      window.addEventListener('pointerup', end, { signal });
      window.addEventListener('pointercancel', end, { signal });
      // A drag is not a click on the tile's link.
      this.list.addEventListener(
        'click',
        (e) => {
          if (moved) {
            e.preventDefault();
            e.stopPropagation();
            moved = false;
          }
        },
        { capture: true, signal }
      );
      this.list.addEventListener('dragstart', (e) => e.preventDefault(), { signal });
    }

    indexFrom(left) {
      const pad = parseFloat(getComputedStyle(this.list).scrollPaddingLeft) || 0;
      let best = 0;
      let bestDist = Infinity;
      this.tiles.forEach((tile, i) => {
        const d = Math.abs(tile.offsetLeft - this.list.offsetLeft - pad - left);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    }
  }

  customElements.define('perfume-families', PerfumeFamilies);
})();
