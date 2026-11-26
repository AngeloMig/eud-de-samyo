/* Decant pop-up (sections/perfume-decant-pop.liquid). Opens after [delay]s once per [days]
   days; after closing, a floating button bottom-left reopens it. Esc / scrim / × close. */
(() => {
  const root = document.querySelector('[data-pdp]');
  if (!root) return;
  const dialog = root.querySelector('[data-pdp-dialog]');
  const fab = root.querySelector('[data-pdp-open]');
  const key = root.dataset.key || 'pf-dpop';
  const days = parseInt(root.dataset.days, 10) || 7;
  const delay = (parseInt(root.dataset.delay, 10) || 30) * 1000;
  const store = {
    get() { try { return Number(localStorage.getItem(key)) || 0; } catch (e) { return 0; } },
    set() { try { localStorage.setItem(key, String(Date.now())); } catch (e) { /* private mode */ } },
  };
  let lastFocus = null;

  const showFab = () => { fab.hidden = false; requestAnimationFrame(() => fab.classList.add('is-in')); };
  const busy = () => document.querySelector('.pcd.is-open, .ph.is-open, dialog[open]');

  function open() {
    lastFocus = document.activeElement;
    dialog.inert = false;
    root.classList.add('is-open');
    fab.classList.remove('is-in');
    setTimeout(() => dialog.querySelector('.pdp__btn')?.focus({ preventScroll: true }), 60);
  }
  function close() {
    if (!root.classList.contains('is-open')) return;
    root.classList.remove('is-open');
    dialog.inert = true;
    store.set();
    showFab();
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  root.querySelectorAll('[data-pdp-close]').forEach((el) => el.addEventListener('click', close));
  fab.addEventListener('click', open);
  document.addEventListener('keydown', (e) => {
    if (!root.classList.contains('is-open')) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') {
      const f = [...dialog.querySelectorAll('a[href], button:not([disabled])')];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  const closedAt = store.get();
  if (closedAt && Date.now() - closedAt < days * 864e5) { showFab(); return; }
  const tryOpen = () => { if (busy()) { setTimeout(tryOpen, 5000); return; } open(); };
  setTimeout(tryOpen, delay);
})();
