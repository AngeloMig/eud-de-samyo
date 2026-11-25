/* Try trio (sections/perfume-try-trio.liquid). Vanilla JS, no dependencies.
   Picks: this perfume first, then whatever the shopper clicks in the grid.
   Button: "Pick n more" → "Continue with your trio" (builder link with the picks)
   plus "Or add to bag now". Cart lines match the builder (perfume-vial-picker.js). */
(() => {
  const SET_ID = () => Math.random().toString(36).slice(2, 6);
  const UP = [1, 2, 5];

  function init(root) {
    if (root.dataset.pttInit) return;
    root.dataset.pttInit = '1';

    const $ = (s) => root.querySelector(s);
    const t = (k) => root.dataset['t' + k] || '';
    const count = parseInt(root.dataset.count, 10) || 3;
    const size = root.dataset.size || '1';
    const off = (parseInt(root.dataset.discount, 10) || 0) / 100;
    const own = root.dataset.own;
    // Sizes the store's set discounts cover (others show "—" in the pop-up's set column).
    const setSizes = (root.dataset.setSizes || '1,2').split(',').map((x) => x.trim().replace(/\s*ml$/i, ''));
    const currency = root.dataset.currency || 'PHP';
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Touch only = no mouse or trackpad at all (a touch laptop still gets the pop-up).
    const touch = !matchMedia('(any-hover: hover)').matches;

    let fmt, fmt0;
    try { fmt = new Intl.NumberFormat(document.documentElement.lang || 'en-PH', { style: 'currency', currency }); }
    catch (e) { fmt = { format: (n) => n.toFixed(2) }; }
    try { fmt0 = new Intl.NumberFormat(document.documentElement.lang || 'en-PH', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
    catch (e) { fmt0 = fmt; }
    const money = (c) => (Math.round(c) % 100 === 0 ? fmt0 : fmt).format(Math.round(c) / 100);
    const inSet = (c) => c - Math.round(c * off);

    const grid = $('[data-grid]');
    const slotsEl = $('[data-slots]');
    const cta = $('[data-cta]');
    const addNow = $('[data-add-now]');
    const clear = $('[data-clear]');
    const statusEl = $('[data-status]');
    const live = $('[data-live]');
    const pop = $('[data-pop]');
    const hint = $('[data-hint]');
    const tiles = [...root.querySelectorAll('[data-tile]')];
    // Lowest to highest price for the set's vial size (owner).
    {
      const priceOf = (b) => {
        const m = (';' + (b.dataset.vials || '')).match(new RegExp(';' + root.dataset.size + ':\\d+:(\\d+):'));
        return m ? Number(m[1]) : Infinity;
      };
      const list = root.querySelector('[data-grid]');
      tiles.sort((a, b) => priceOf(a) - priceOf(b)).forEach((b) => list.appendChild(b.closest('li')));
    }

    const parseVials = (str) => {
      const out = {};
      (str || '').split(';').forEach((e) => {
        const [z, id, price, avail] = e.split(':');
        if (z && id) out[z] = { id: Number(id), price: Number(price), available: avail === 'true' };
      });
      return out;
    };
    const scents = new Map();
    tiles.forEach((b) => {
      const vials = parseVials(b.dataset.vials);
      scents.set(b.dataset.handle, { handle: b.dataset.handle, name: b.dataset.name, vendor: b.dataset.vendor, img: b.dataset.img, vials, tile: b });
    });
    // This perfume may be outside the grid's collection: its data comes from the section.
    if (!scents.has(own)) {
      scents.set(own, { handle: own, name: root.dataset.ownName, vendor: root.dataset.ownVendor, img: root.dataset.ownImg, vials: parseVials(root.dataset.ownVials), tile: null });
    }
    const vial = (s) => (s && s.vials[size] && s.vials[size].available ? s.vials[size] : null);

    let picks = [own];
    let state = 'pick';

    const vialImg = root.dataset.vial;
    function slotHTML(s, i) {
      const v = vial(s);
      const name = (s.name || '').replace(/ Eau de Parfum$/i, ' EDP').replace(/ Eau de Toilette$/i, ' EDT');
      // Its price on its own, with a tiny "−₱…" next to it: what it saves in the set.
      let price = '';
      if (v) {
        const less = v.price - inSet(v.price);
        price = `<span class="ptt__slot-p">${size} ml · <b>${money(v.price)}</b>${off && less > 0 ? ` <em title="${esc(t('SaveShort').replace('[price]', money(less)))}">−${money(less)}</em>` : ''}</span>`;
      }
      return `${s.handle === own ? `<span class="ptt__pin">${esc(t('Pin'))}</span>` : ''}
        <img src="${vialImg}" alt="" width="40" height="160"><b class="ptt__slot-n">${esc(name)}</b>${price}
        <button type="button" class="ptt__x" data-i="${i}" aria-label="${esc(t('Remove'))}: ${esc(s.name)}">×</button>`;
    }
    const esc = (x) => String(x || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    function drawSlots(changed) {
      slotsEl.innerHTML = '';
      for (let i = 0; i < count; i++) {
        const li = document.createElement('li');
        const s = scents.get(picks[i]);
        if (s) {
          li.className = 'ptt__slot ptt__slot--on' + (changed === i ? ' is-new' : '');
          li.innerHTML = slotHTML(s, i);
          li.querySelector('.ptt__x').addEventListener('click', () => toggle(s.handle));
        } else {
          li.className = 'ptt__slot ptt__slot--empty';
          li.innerHTML = `<button type="button" class="ptt__slot-btn"><span class="ptt__slot-in"><span class="ptt__plus" aria-hidden="true">+</span><small>${esc(t('Empty'))}</small></span></button>`;
          li.querySelector('button').addEventListener('click', toGrid);
        }
        slotsEl.appendChild(li);
      }
    }

    function builderURL() {
      const url = new URL(root.dataset.picker, location.origin);
      url.searchParams.set('set', root.dataset.setKey);
      url.searchParams.set('scent', picks.join(','));
      return url.pathname + url.search;
    }

    function update(changed) {
      drawSlots(changed);
      const chosen = picks.map((h) => scents.get(h)).filter((s) => vial(s));
      const n = picks.length;
      const alone = chosen.reduce((a, s) => a + vial(s).price, 0);
      const total = inSet(alone);
      $('[data-alone]').textContent = money(alone);
      $('[data-alone]').parentElement.hidden = !off; // no set discount: nothing to compare
      $('[data-total]').textContent = money(total);
      $('[data-n]').textContent = t('Of').replace('[n]', n).replace('[total]', count);
      const saveKey = n < count ? 'SaveSoFar' : 'Save';
      $('[data-save]').textContent = alone > total ? t(saveKey).replace('[price]', money(alone - total)) : '';

      tiles.forEach((b) => {
        const on = picks.includes(b.dataset.handle);
        b.classList.toggle('is-in', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      grid.classList.toggle('is-full', n >= count);
      clear.hidden = n <= 1 && picks[0] === own;

      if (state === 'added') {
        cta.dataset.state = 'added';
        cta.innerHTML = esc(t('Added'));
        cta.href = builderURL();
        addNow.hidden = true;
        return;
      }
      if (n < count) {
        state = 'pick';
        cta.dataset.state = 'pick';
        cta.setAttribute('role', 'button');
        cta.href = '#' + grid.id;
        cta.innerHTML = `${esc(t('Pick').replace('[n]', count - n))} <span aria-hidden="true">↓</span>`;
        addNow.hidden = true;
        hint.textContent = touch ? t('HintTouch') : t('Hint');
      } else {
        state = 'ready';
        cta.dataset.state = 'ready';
        cta.removeAttribute('role');
        cta.href = builderURL();
        cta.innerHTML = `${esc(t('Continue'))} <span aria-hidden="true">→</span>`;
        addNow.hidden = !chosen.length || chosen.length < count;
        addNow.textContent = t('AddNow').replace('[price]', money(total));
        hint.textContent = t('HintFull');
      }
    }

    function say(msg) { live.textContent = ''; requestAnimationFrame(() => { live.textContent = msg; }); }

    function toggle(handle) {
      if (state === 'busy') return;
      const i = picks.indexOf(handle);
      const s = scents.get(handle);
      let changed = null;
      statusEl.textContent = '';
      if (i > -1) {
        picks.splice(i, 1);
        say(t('RemovedOne').replace('[name]', s.name));
      } else {
        if (picks.length >= count) { flash(t('Full')); return; }
        picks.push(handle);
        changed = picks.length - 1;
        say(t('AddedOne').replace('[name]', s.name));
      }
      if (state === 'added') state = 'pick';
      update(changed);
      if (popFor) drawPop(popFor);
    }

    let flashT;
    function flash(msg) {
      statusEl.textContent = msg;
      statusEl.classList.add('is-warn');
      clearTimeout(flashT);
      flashT = setTimeout(() => { statusEl.textContent = ''; statusEl.classList.remove('is-warn'); }, 2800);
      say(msg);
    }

    function toGrid() {
      grid.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      const first = tiles.find((b) => !b.classList.contains('is-in'));
      if (first) setTimeout(() => first.focus({ preventScroll: true }), reduce ? 0 : 450);
    }

    // Pop-up next to the mouse (keyboard: next to the tile).
    let popFor = null;
    function drawPop(s) {
      const inT = picks.includes(s.handle);
      const full = picks.length >= count;
      const act = inT ? ['is-muted', '−', t('PopRemove')] : full ? ['is-muted', '!', t('PopFull')] : ['', '+', t('PopAdd')];
      const rows = UP.map((z) => {
        const v = s.vials[z];
        if (!v) return '';
        const inSets = setSizes.includes(String(z));
        return `<tr><td>${z} ml</td><td>${money(v.price)}</td><td class="ptt__pop-set">${inSets && off ? money(inSet(v.price)) : '—'}</td></tr>`;
      }).join('');
      pop.innerHTML = `<div class="ptt__pop-h">${s.img ? `<img src="${s.img}" alt="" width="46" height="62">` : ''}<div><small>${esc(s.vendor)}</small><b>${esc(s.name)}</b></div></div>
        <table><thead><tr><th>${esc(t('Vial'))}</th><th>${esc(t('Alone'))}</th><th>${esc(t('InSet'))}</th></tr></thead><tbody>${rows}</tbody></table>
        ${t('PopNote') ? `<p class="ptt__pop-note">${esc(t('PopNote'))}</p>` : ''}
        <p class="ptt__pop-act ${act[0]}"><i aria-hidden="true">${act[1]}</i>${esc(act[2])}</p>`;
    }
    function showPop(s, x, y) { popFor = s; drawPop(s); pop.classList.add('is-on'); movePop(x, y); }
    function movePop(x, y) {
      const w = pop.offsetWidth, h = pop.offsetHeight, g = 18;
      let px = x + g, py = y + g, ox = '0%', oy = '0%';
      if (px + w > innerWidth - 8) { px = x - w - g; ox = '100%'; }
      if (py + h > innerHeight - 8) { py = y - h - g; oy = '100%'; }
      pop.style.translate = `${Math.max(8, px)}px ${Math.max(8, py)}px`;
      pop.style.setProperty('--ox', ox);
      pop.style.setProperty('--oy', oy);
    }
    function hidePop() { popFor = null; pop.classList.remove('is-on'); }

    tiles.forEach((b) => {
      const s = scents.get(b.dataset.handle);
      b.addEventListener('click', () => toggle(s.handle));
      if (!touch) {
        b.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') showPop(s, e.clientX, e.clientY); });
        b.addEventListener('pointermove', (e) => { if (popFor) movePop(e.clientX, e.clientY); });
        b.addEventListener('pointerleave', hidePop);
      }
      b.addEventListener('focus', () => { if (!b.matches(':focus-visible')) return; const r = b.getBoundingClientRect(); showPop(s, r.right - 8, r.top + 12); });
      b.addEventListener('blur', hidePop);
    });
    window.addEventListener('scroll', () => { if (popFor && !root.matches(':hover')) hidePop(); }, { passive: true });

    cta.addEventListener('click', (e) => {
      if (cta.dataset.state === 'pick') { e.preventDefault(); toGrid(); }
      else if (cta.dataset.state === 'added') {
        if (document.querySelector('perfume-cart-drawer')) { e.preventDefault(); document.dispatchEvent(new CustomEvent('perfume:cart-open', { detail: {} })); }
        else { e.preventDefault(); location.href = root.dataset.cart || '/cart'; }
      }
      // ready: follow the link to the builder with the picks.
    });

    addNow.addEventListener('click', async () => {
      if (state !== 'ready') return;
      const label = root.dataset.setLabel;
      const setId = SET_ID();
      const items = picks.map((h) => vial(scents.get(h))).filter(Boolean)
        .map((v) => ({ id: v.id, quantity: 1, properties: { Set: label, _set: setId } }));
      if (items.length < count) return;
      state = 'busy';
      addNow.disabled = true;
      addNow.textContent = t('Adding');
      try {
        const res = await fetch(`${root.dataset.cartAdd}.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ items }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.description || data.message || '');
        if (typeof window.publish === 'function' && window.PUB_SUB_EVENTS?.cartUpdate) {
          window.publish(window.PUB_SUB_EVENTS.cartUpdate, { source: 'perfume-try-trio', cartData: data });
        }
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: data }));
        state = 'added';
        addNow.disabled = false;
        update();
        say(t('Added'));
        if (document.querySelector('perfume-cart-drawer')) {
          const first = (data.items || [])[0] || {};
          document.dispatchEvent(new CustomEvent('perfume:cart-open', { detail: { variant_id: first.variant_id || first.id } }));
        } else {
          location.href = root.dataset.cart || '/cart';
        }
      } catch (err) {
        state = 'ready';
        addNow.disabled = false;
        update();
        flash(err.message || t('Error'));
      }
    });

    clear.addEventListener('click', () => { picks = [own]; state = 'pick'; statusEl.textContent = ''; update(); });

    grid.id = grid.id || root.id + '-grid';
    root.querySelector('[data-sum]').hidden = false;
    root.querySelector('[data-grid-h]').hidden = false;
    grid.hidden = false;
    root.classList.add('is-ready');
    update();
  }

  const run = () => document.querySelectorAll('[data-ptt]').forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  document.addEventListener('shopify:section:load', (e) => {
    const root = e.target.querySelector('[data-ptt]');
    if (root) init(root);
  });
})();
