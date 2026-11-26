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
      // Lead with what this vial costs in the set, then spell out its saving.
      let price = '';
      if (v) {
        const paid = inSet(v.price), less = v.price - paid;
        const label = !t('SaveShort') || t('SaveShort') === '[price] less in a trio' ? 'Save [price] · [percent]%' : t('SaveShort');
        const saving = label.replace('[price]', money(less)).replace('[percent]', Math.round(off * 100));
        price = `<span class="ptt__slot-p">${size} ml · <b>${money(paid)}</b></span>${off && less > 0 ? `<span class="ptt__slot-save">${esc(saving)}</span>` : ''}`;
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
      const builderLink = $('[data-builder-link]');
      if (builderLink) builderLink.href = builderURL();
      const chosen = picks.map((h) => scents.get(h)).filter((s) => vial(s));
      const n = picks.length;
      const alone = chosen.reduce((a, s) => a + vial(s).price, 0);
      const total = inSet(alone);
      $('[data-alone]').textContent = money(alone);
      $('[data-alone]').parentElement.hidden = !off; // no set discount: nothing to compare
      $('[data-total]').textContent = money(total);
      $('[data-n]').textContent = t('Of').replace('[n]', n).replace('[total]', count);
      const saveKey = n < count ? 'SaveSoFar' : 'Save';
      const pct = alone ? Math.round(((alone - total) / alone) * 100) : 0;
      $('[data-save]').textContent = alone > total ? t(saveKey).replace('[price]', money(alone - total)).replace('[percent]', pct) : '';

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

    // Pop-up (owner 2026-11-26): the same card as the decant builder: big photo with the
    // perfume's note pictures resting on its edge, brand + men/women icon, name, the set
    // price with the solo price struck and the saving. Mouse: follows the pointer. Touch:
    // the first tap opens it as a card with Add / Take it out, so phones see it too.
    // Warm the note photos so the first pop-up shows them straight away (owner).
    const warm = () => root.querySelectorAll('template[data-notes]').forEach((tp) => tp.content.querySelectorAll('img').forEach((im) => { const i = new Image(); i.src = im.getAttribute('src'); }));
    if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 3000 }); else setTimeout(warm, 1500);
    let popFor = null, lastFor = null, isTap = false;
    function drawPop(s) {
      const inT = picks.includes(s.handle);
      const full = picks.length >= count;
      const isOwn = s.handle === own;
      const v = s.vials[size];
      const inSets = setSizes.includes(String(size)) && off > 0;
      const tile = s.tile;
      const forEl = tile && tile.querySelector('.pf-for');
      const notes = [...((tile && tile.querySelector('template[data-notes]')?.content.querySelectorAll('.pf-pn')) || [])];
      const art = notes.length ? `<span class="ptt__pop-notes">${notes.map((n, i) => `<span class="pf-pn${n.innerHTML.trim() ? '' : ' pf-pn--txt'}" style="--i:${i}">${n.innerHTML.trim() || `<b>${esc(n.dataset.i || '')}</b>`}</span>`).join('')}</span>` : '';
      pop.classList.toggle('has-notes', notes.length > 0);
      const per = esc((t('Per') || 'per [size] ml vial').replace('[size]', size));
      const price = v ? (inSets
        ? `<p class="ptt__pop-p"><span>${money(inSet(v.price))} <span class="ptt__pop-per">${per}</span></span><s>${money(v.price)}</s><span class="ptt__pop-save">${esc((t('PopSave') || 'Save [price] · [percent]').replace('[price]', money(v.price - inSet(v.price))).replace('[percent]', Math.round(off * 100) + '%'))}</span></p>`
        : `<p class="ptt__pop-p"><span>${money(v.price)} <span class="ptt__pop-per">${per}</span></span></p>`) : '';
      let foot;
      if (isTap) {
        const dis = !inT && full;
        const label = inT ? (t('PopRemoveTap') || t('PopRemove')) : full ? t('PopFull') : (t('PopAddTap') || t('PopAdd'));
        foot = `<div class="ptt__pop-row"><button type="button" class="ptt__pop-btn${inT ? ' is-remove' : ''}" data-pop-act${dis || (isOwn && inT) ? ' disabled' : ''}>${esc(isOwn && inT ? t('Pin') || label : label)}</button><button type="button" class="ptt__pop-x" data-pop-x aria-label="Close">×</button></div>`;
      } else {
        const act = inT ? ['is-muted', '−', t('PopRemove')] : full ? ['is-muted', '!', t('PopFull')] : ['', '+', t('PopAdd')];
        foot = `<p class="ptt__pop-act ${act[0]}"><i aria-hidden="true">${act[1]}</i>${esc(act[2])}</p>`;
      }
      pop.innerHTML = `${s.img ? `<span class="ptt__pop-img"><img src="${s.img}" alt="">${art}</span>` : ''}
        ${notes.length ? `<p class="ptt__pop-names">${notes.map((n) => esc(n.dataset.name)).join(' · ')}</p>` : ''}
        <p class="ptt__pop-top"><span>${esc(s.vendor)}</span>${forEl ? `<span class="ptt__pop-for pf-for--${forEl.dataset.for}">${forEl.innerHTML}</span>` : ''}</p>
        <p class="ptt__pop-n">${esc(s.name)}</p>
        ${price}${foot}`;
    }
    function swapAnim(s) {
      if (pop.classList.contains('is-on') && lastFor && lastFor !== s) { pop.classList.remove('is-swap'); void pop.offsetWidth; pop.classList.add('is-swap'); }
      lastFor = s;
    }
    function showPop(s, x, y) { isTap = false; pop.classList.remove('is-tap'); swapAnim(s); popFor = s; drawPop(s); pop.classList.add('is-on'); movePop(x, y); }
    let pointer = null;
    function fitPop(x, y) {
      const v = window.visualViewport;
      const left = (v?.offsetLeft || 0) + 8, top = (v?.offsetTop || 0) + 8;
      const right = left + (v?.width || innerWidth) - 16, bottom = top + (v?.height || innerHeight) - 16;
      pop.style.maxHeight = `${Math.max(1, bottom - top)}px`;
      pop.style.translate = `${Math.max(left, Math.min(x, right - pop.offsetWidth))}px ${Math.max(top, Math.min(y, bottom - pop.offsetHeight))}px`;
    }
    function movePop(x, y) {
      pointer = { x, y };
      const w = pop.offsetWidth, h = pop.offsetHeight, g = 18;
      let px = x + g, py = y + g, ox = '0%', oy = '0%';
      if (px + w > innerWidth - 8) { px = x - w - g; ox = '100%'; }
      if (py + h > innerHeight - 8) { py = y - h - g; oy = '100%'; }
      fitPop(px, py);
      pop.style.setProperty('--ox', ox);
      pop.style.setProperty('--oy', oy);
    }
    let hideT;
    function hidePop() { if (isTap) return; clearTimeout(hideT); popFor = null; hideT = setTimeout(() => { if (!popFor) pop.classList.remove('is-on'); }, 60); }
    function placeTap(b) {
      const r = b.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
      const x = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8);
      const below = r.bottom + 8, above = r.top - h - 8;
      const y = below + h < innerHeight - 8 ? below : above > 8 ? above : Math.max(8, (innerHeight - h) / 2);
      fitPop(x, y);
      pop.style.setProperty('--ox', '50%');
      pop.style.setProperty('--oy', y < r.top ? '100%' : '0%');
    }
    function openTap(s) { isTap = true; pop.classList.add('is-tap'); swapAnim(s); popFor = s; drawPop(s); pop.classList.add('is-on'); placeTap(s.tile); }
    function closeTap() { isTap = false; popFor = null; pop.classList.remove('is-on'); setTimeout(() => { if (!isTap) pop.classList.remove('is-tap'); }, 250); }
    const reposition = () => {
      if (!popFor || !pop.classList.contains('is-on')) return;
      if (isTap) placeTap(popFor.tile);
      else if (pointer) movePop(pointer.x, pointer.y);
    };
    if ('ResizeObserver' in window) new ResizeObserver(reposition).observe(pop);
    window.addEventListener('resize', reposition, { passive: true });
    window.visualViewport?.addEventListener('resize', reposition, { passive: true });

    let lastPT = '';
    tiles.forEach((b) => {
      const s = scents.get(b.dataset.handle);
      b.addEventListener('pointerdown', (e) => { lastPT = e.pointerType; });
      b.addEventListener('click', () => {
        if (lastPT === 'touch' || touch) { lastPT = ''; if (isTap && popFor === s) closeTap(); else openTap(s); return; }
        toggle(s.handle);
      });
      b.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch' && !touch) showPop(s, e.clientX, e.clientY); });
      b.addEventListener('pointermove', (e) => { if (popFor && !isTap) movePop(e.clientX, e.clientY); });
      b.addEventListener('pointerleave', hidePop);
      b.addEventListener('focus', () => { if (!b.matches(':focus-visible')) return; const r = b.getBoundingClientRect(); showPop(s, r.right - 8, r.top + 12); });
      b.addEventListener('blur', hidePop);
    });
    pop.addEventListener('click', (e) => {
      if (e.target.closest('[data-pop-x]')) { closeTap(); return; }
      if (!e.target.closest('[data-pop-act]') || !popFor) return;
      toggle(popFor.handle);
      closeTap();
    });
    document.addEventListener('pointerdown', (e) => { if (isTap && !pop.contains(e.target) && !e.target.closest('[data-tile]')) closeTap(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isTap) closeTap(); });
    window.addEventListener('scroll', () => {
      if (isTap) { if (popFor && popFor.tile) placeTap(popFor.tile); }
      else if (popFor && !root.matches(':hover')) hidePop();
    }, { passive: true });

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
