/*
  <perfume-guide> (sections/perfume-scent-guide.liquid)
  The pyramid layers and the scent-wheel families are tabs: choosing one shows its
  panel (arrow keys move between them). Without JS every panel simply shows.
*/
(() => {
  if (customElements.get('perfume-guide')) return;

  class PerfumeGuide extends HTMLElement {
    connectedCallback() {
      this.querySelectorAll('[data-pgd-tabs]').forEach((group) => this.bindTabs(group));
    }

    bindTabs(group) {
      const tabs = [...group.querySelectorAll('[role="tab"]')];
      const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
      const select = (i, focus) => {
        tabs.forEach((t, j) => {
          const on = j === i;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.tabIndex = on ? 0 : -1;
          if (panels[j]) {
            panels[j].hidden = !on;
            panels[j].classList.toggle('is-shown', on);
          }
        });
        if (focus) tabs[i].focus();
      };
      tabs.forEach((t, i) => {
        t.addEventListener('click', () => select(i));
        t.addEventListener('keydown', (e) => {
          const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
          if (!step) return;
          e.preventDefault();
          select((i + step + tabs.length) % tabs.length, true);
        });
      });
      const start = Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'));
      select(start);
      panels[start]?.classList.remove('is-shown');
    }
  }

  customElements.define('perfume-guide', PerfumeGuide);
})();
