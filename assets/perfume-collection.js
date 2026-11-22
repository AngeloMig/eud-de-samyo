/*
  <perfume-collection> (sections/main-collection-perfume.liquid)
  The filter drawer (open/close, focus in and back, Escape, scrim) and the sort
  select that reloads on change. Filters submit with "Show results"; without JS the
  forms still work (noscript Apply for sort).
*/
(() => {
  if (customElements.get('perfume-collection')) return;

  class PerfumeCollection extends HTMLElement {
    connectedCallback() {
      this.drawer = this.querySelector('[data-pcol-drawer]');
      this.abort = new AbortController();
      const signal = this.abort.signal;

      this.querySelectorAll('[data-pcol-autosubmit] select').forEach((select) =>
        select.addEventListener('change', () => select.form.submit(), { signal })
      );

      if (!this.drawer) return;
      // Live at the end of <body> so no section can cover it.
      document.body.appendChild(this.drawer);
      this.querySelectorAll('[data-pcol-open]').forEach((b) =>
        b.addEventListener('click', () => this.open(b), { signal })
      );
      this.drawer.querySelectorAll('[data-pcol-close]').forEach((b) =>
        b.addEventListener('click', () => this.close(), { signal })
      );
      this.drawer.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.close();
        if (e.key !== 'Tab') return;
        const items = [...this.drawer.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), summary')].filter(
          (el) => el.offsetParent !== null
        );
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }, { signal });
      // Drop empty price fields so they don't become filters.
      this.drawer.querySelector('[data-pcol-form]')?.addEventListener('submit', (e) => {
        e.target.querySelectorAll('input[type="number"]').forEach((input) => {
          if (input.value === '') input.disabled = true;
          else input.value = Math.round(Number(input.value) * 100);
        });
      }, { signal });
    }

    disconnectedCallback() {
      this.abort?.abort();
      if (this.drawer?.parentElement === document.body) this.drawer.remove();
    }

    open(opener) {
      this.opener = opener;
      this.drawer.inert = false;
      this.drawer.classList.add('is-open');
      document.documentElement.style.overflow = 'hidden';
      requestAnimationFrame(() => this.drawer.querySelector('.pcol-drawer__close')?.focus({ preventScroll: true }));
    }

    close() {
      this.drawer.classList.remove('is-open');
      this.drawer.inert = true;
      document.documentElement.style.overflow = '';
      this.opener?.focus({ preventScroll: true });
    }
  }

  customElements.define('perfume-collection', PerfumeCollection);
})();
