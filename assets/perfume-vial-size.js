/* Vial size guide, "Hold it up" (snippets/perfume-vial-size.liquid).
   --pxmm = CSS pixels per millimetre on this screen.

   Browsers don't expose a screen's physical size, so the first value is an
   estimate for the kind of device, from typical screens:
   - phones: about 6.1 px/mm (iPhones and Android phones are 6.0–6.4),
   - tablets: about 5.2 px/mm (iPads),
   - Mac laptops: about 5.0 px/mm; large Mac displays about 4.3,
   - other laptops: about 4.3 px/mm; desktop monitors about 3.8.
   That is usually within 5–15%. Matching a real bank card (85.6 mm, the same on
   every card) makes it exact; the matched value is kept in this browser. */
(() => {
  if (customElements.get('perfume-vial-size')) return;
  const KEY = 'samyo-px-per-mm';
  const CARD_W = 85.6;
  const CARD_H = 53.98;

  function estimate() {
    const shortSide = Math.min(screen.width, screen.height);
    const coarse = matchMedia('(pointer: coarse)').matches;
    const ua = navigator.userAgent;
    if (coarse && shortSide < 520) return 6.1; // phone
    if (coarse || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 5.2; // tablet / iPad
    if (/Macintosh|Mac OS X/.test(ua)) return screen.width <= 1800 ? 5.0 : 4.3;
    return screen.width <= 1600 ? 4.3 : 3.8;
  }
  const read = () => {
    try {
      const v = parseFloat(localStorage.getItem(KEY));
      return v > 1 && v < 12 ? v : null;
    } catch (e) {
      return null;
    }
  };
  const write = (v) => {
    try {
      if (v == null) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, String(v));
    } catch (e) {
      /* private mode: works for this visit only */
    }
  };
  const ticks = (mm, every) => {
    let out = '';
    for (let m = 0; m <= mm; m += every) {
      const cm = m % 10 === 0;
      const half = m % 5 === 0;
      out += `<span class="pvs__tick${cm ? ' is-cm' : half ? ' is-half' : ''}" style="--m:${m}">${cm && m ? m / 10 : ''}</span>`;
    }
    return `${out}<span class="pvs__unit">cm</span>`;
  };

  customElements.define(
    'perfume-vial-size',
    class extends HTMLElement {
      connectedCallback() {
        this.toggle = this.querySelector('[data-pvs-toggle]');
        this.dialog = this.querySelector('[data-pvs-dialog]');
        this.range = this.querySelector('[data-pvs-scale]');
        this.state = this.querySelector('[data-pvs-state]');
        this.ruler = this.querySelector('[data-pvs-ruler]');
        this.holdView = this.querySelector('[data-pvs-holdview]');
        this.holdStage = this.querySelector('[data-pvs-holdstage]');
        this.holdRuler = this.querySelector('[data-pvs-holdruler]');
        this.card = this.querySelector('[data-pvs-card]');
        this.goBtn = this.querySelector('[data-pvs-hold]');
        this.doneBtn = this.querySelector('[data-pvs-done]');
        this.maxMm = parseFloat(this.dataset.maxMm) || 85;
        this.guess = estimate();
        this.holding = false;

        this.toggle.addEventListener('click', () => this.open());
        this.querySelector('[data-pvs-close]').addEventListener('click', () => this.close());
        this.dialog.addEventListener('click', (e) => {
          if (e.target === this.dialog) this.close();
        });
        // Esc: leave Hold it up first, then close.
        this.dialog.addEventListener('cancel', (e) => {
          if (this.holding) {
            e.preventDefault();
            this.release();
          }
        });
        this.dialog.addEventListener('close', () => {
          this.release();
          document.documentElement.classList.remove('pvs-open');
        });
        this.querySelectorAll('[data-pvs-pick]').forEach((b) => b.addEventListener('click', () => this.pick(b.dataset.pvsPick)));
        this.dialog.addEventListener('keydown', (e) => {
          if (!e.target.closest('[data-pvs-pick]') || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
          const sizes = ['1', '2', '5', '10'];
          const next = sizes[(sizes.indexOf(this.ml) + (e.key === 'ArrowRight' ? 1 : 3)) % 4];
          this.pick(next);
          e.target.closest('[role=group]').querySelector(`[data-pvs-pick="${next}"]`)?.focus();
        });
        this.range.addEventListener('input', () => {
          write(parseFloat(this.range.value));
          this.set(parseFloat(this.range.value));
        });
        this.querySelectorAll('[data-pvs-step]').forEach((b) =>
          b.addEventListener('click', () => {
            const v = Math.min(8, Math.max(2.4, this.px + parseFloat(b.dataset.pvsStep)));
            write(v);
            this.set(v);
          })
        );
        this.querySelector('[data-pvs-reset]').addEventListener('click', () => {
          write(null);
          this.set(this.guess);
        });
        this.goBtn.addEventListener('click', () => this.hold());
        this.doneBtn.addEventListener('click', () => this.release());
        this.onFs = () => {
          const fs = document.fullscreenElement || document.webkitFullscreenElement;
          if (fs === this.dialog) requestAnimationFrame(() => this.drawHold());
          else if (this.holding && this.usedFs) this.release();
        };
        document.addEventListener('fullscreenchange', this.onFs);
        document.addEventListener('webkitfullscreenchange', this.onFs);
        this.onResize = () => this.holding && this.drawHold();
        window.addEventListener('resize', this.onResize, { passive: true });
        this.pick('1');
      }

      disconnectedCallback() {
        document.removeEventListener('fullscreenchange', this.onFs);
        document.removeEventListener('webkitfullscreenchange', this.onFs);
        window.removeEventListener('resize', this.onResize);
      }

      open() {
        this.set(read() || this.guess);
        if (typeof this.dialog.showModal === 'function') this.dialog.showModal();
        else this.dialog.setAttribute('open', '');
        document.documentElement.classList.add('pvs-open');
      }

      close() {
        this.release();
        if (typeof this.dialog.close === 'function') this.dialog.close();
        else this.dialog.removeAttribute('open');
        document.documentElement.classList.remove('pvs-open');
        this.toggle.focus({ preventScroll: true });
      }

      // One size in focus: chips pressed, its details and vial shown, compare strip marked.
      pick(ml) {
        this.ml = String(ml);
        this.querySelectorAll('[data-pvs-pick]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pvsPick === this.ml)));
        this.querySelectorAll('[data-pvs-info]').forEach((d) => { d.hidden = d.dataset.pvsInfo !== this.ml; });
        this.querySelectorAll('[data-pvs-vial]').forEach((v) => { v.hidden = v.dataset.pvsVial !== this.ml; });
        this.querySelectorAll('[data-pvs-cmp]').forEach((c) => c.classList.toggle('is-on', c.dataset.pvsCmp === this.ml));
        this.drawRuler();
      }

      set(px) {
        this.px = px;
        this.range.value = px.toFixed(2);
        this.style.setProperty('--pxmm', px.toFixed(3));
        if (this.state) this.state.textContent = read() ? 'Matched to your card ✓' : 'Estimated for this device';
        this.drawRuler();
        if (this.holding) this.drawHold();
      }

      // Ruler beside the vial: one cm taller than the chosen vial, a tick each 5 mm.
      drawRuler() {
        if (!this.ruler || !this.px) return;
        const fig = this.querySelector(`.pvs__stage [data-pvs-vial="${this.ml}"]`);
        const h = fig ? parseFloat(fig.style.getPropertyValue('--h')) || this.maxMm : this.maxMm;
        const mm = (Math.ceil(h / 10) + 1) * 10;
        this.ruler.style.setProperty('--rmm', mm);
        this.ruler.innerHTML = ticks(mm, 5);
      }

      // Hold it up: the popup fills the screen (true full screen where allowed).
      hold() {
        this.holding = true;
        this.dialog.classList.add('is-holding');
        this.holdView.hidden = false;
        this.usedFs = false;
        const req = this.dialog.requestFullscreen || this.dialog.webkitRequestFullscreen;
        if (req) {
          try {
            const p = req.call(this.dialog);
            this.usedFs = true;
            if (p && p.catch) p.catch(() => { this.usedFs = false; });
          } catch (e) {
            this.usedFs = false;
          }
        }
        requestAnimationFrame(() => this.drawHold());
        this.doneBtn.focus({ preventScroll: true });
      }

      release() {
        if (!this.holding) return;
        this.holding = false;
        const fs = document.fullscreenElement || document.webkitFullscreenElement;
        if (fs === this.dialog) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        this.dialog.classList.remove('is-holding');
        this.holdView.hidden = true;
        if (this.dialog.open) this.goBtn.focus({ preventScroll: true });
      }

      // The full-screen ruler runs as tall as the screen allows, a tick every mm; the
      // card stands upright when it is wider than the screen.
      drawHold() {
        const h = this.holdStage.clientHeight - 40;
        const mm = Math.max(10, Math.floor(h / this.px));
        this.holdRuler.style.setProperty('--rmm', mm);
        this.holdRuler.innerHTML = ticks(mm, 1);
        this.card.classList.toggle('is-upright', CARD_W * this.px > this.holdStage.clientWidth - 90 && CARD_H * this.px <= this.holdStage.clientWidth);
      }
    }
  );
})();
