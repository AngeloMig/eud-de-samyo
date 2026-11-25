/* Vial picker (sections/perfume-vial-picker.liquid): choose a set, fill its vials
   with scents, add it to the bag. Each perfume has its own price per vial size (its
   size variants); the set costs the vials picked, added up. After Add set to bag the cart drawer opens
   (perfume:cart-open), as everywhere else in the theme. */
(() => {
  const SET_ID = () => Math.random().toString(36).slice(2, 6);

  function init(root) {
    if (root.dataset.pvpInit) return;
    root.dataset.pvpInit = '1';
    root.classList.add('pvp-ready');

    const t = (k) => root.dataset['t' + k] || '';
    const repeats = root.dataset.repeats === 'true';
    const currency = root.dataset.currency || 'PHP';
    let fmt;
    try {
      fmt = new Intl.NumberFormat(document.documentElement.lang || 'en-PH', { style: 'currency', currency });
    } catch (e) {
      fmt = { format: (n) => n.toFixed(2) };
    }
    let fmt0;
    try {
      fmt0 = new Intl.NumberFormat(document.documentElement.lang || 'en-PH', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
    } catch (e) {
      fmt0 = fmt;
    }
    // Whole pesos without ".00"; centavos only when there are some (e.g. ₱814.50).
    const esc = (x) => String(x || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const money = (cents) => (Math.round(cents) % 100 === 0 ? fmt0 : fmt).format(cents / 100);

    const setInputs = [...root.querySelectorAll('.pvp__set input')];
    const list = root.querySelector('[data-scents]');
    const scents = [...root.querySelectorAll('[data-scent]')];
    const slotsEl = root.querySelector('[data-slots]');
    const statusEl = root.querySelector('[data-status]');
    const setNameEl = root.querySelector('[data-set-name]');
    const totalEl = root.querySelector('[data-total]');
    const submit = root.querySelector('[data-submit]');
    const form = root.querySelector('[data-form]');
    const barEl = root.querySelector('[data-bar]');
    const trayBody = root.querySelector('[data-tray-body]');
    const mq = matchMedia('(max-width: 989px)');
    if (!setInputs.length || !slotsEl) return;

    // Each scent's vials: { "1": { id, price, available }, ... }
    scents.forEach((li) => {
      li._vials = {};
      (li.dataset.vials || '').split(';').forEach((entry) => {
        const [size, id, price, available] = entry.split(':');
        if (size && id) li._vials[size] = { id: Number(id), price: Number(price), available: available === 'true' };
      });
    });
    const vialOf = (li, size) => {
      const v = li._vials[size];
      return v && v.available ? v : null;
    };

    // picks: [{ li, name }]
    let picks = [];
    const current = () => setInputs.find((i) => i.checked) || setInputs[0];

    // ?set=3x1 opens with that set chosen.
    const wanted = new URLSearchParams(location.search).get('set');
    const match = wanted && setInputs.find((i) => i.value === wanted);
    if (match) match.checked = true;

    const discountOf = (input) => (parseInt(input.dataset.discount, 10) || 0) / 100;
    const afterDiscount = (cents, input) => cents - Math.round(cents * discountOf(input));
    // Total of a set of vial prices, the way it is shown: cheapest/dearest different
    // scents (or one scent repeated when repeats are allowed).
    function setRange(input) {
      const size = input.dataset.size;
      const count = parseInt(input.dataset.count, 10) || 1;
      const prices = scents.map((li) => vialOf(li, size)).filter(Boolean).map((v) => v.price).sort((a, b) => a - b);
      if (!prices.length) return null;
      const pick = (list) => Array.from({ length: count }, (_, i) => list[i % list.length]).reduce((a, b) => a + b, 0);
      const lo = repeats ? prices[0] * count : pick(prices);
      const hi = repeats ? prices[prices.length - 1] * count : pick(prices.slice().reverse());
      return [afterDiscount(lo, input), afterDiscount(hi, input)];
    }

    // Set cards: the lowest and highest price for that set.
    setInputs.forEach((input) => {
      const card = input.closest('.pvp__set');
      const lo = card.querySelector('[data-range-lo]');
      const hi = card.querySelector('[data-range-hi]');
      const r = setRange(input);
      if (!lo || !r) return;
      lo.textContent = (t('From') || '[price]').replace('[price]', money(r[0]));
      if (hi) {
        hi.hidden = r[0] === r[1];
        hi.textContent = (t('To') || '[price]').replace('[price]', money(r[1]));
      }
    });

    // Fill empty vials with the cheapest scents not yet picked, so a fresh set shows
    // its lowest price (the one on the set card).
    function prefill() {
      const set = current();
      const count = parseInt(set.dataset.count, 10) || 1;
      const size = set.dataset.size;
      picks = picks.filter((p) => vialOf(p.li, size)).slice(0, count);
      const free = scents
        .filter((li) => vialOf(li, size) && (repeats || !picks.some((p) => p.li === li)))
        .sort((a, b) => vialOf(a, size).price - vialOf(b, size).price);
      for (let i = 0; picks.length < count && free.length; i++) {
        const li = free[repeats ? 0 : i];
        if (!li) break;
        picks.push({ li, name: li.dataset.scent });
      }
    }

    function draw(focusSlot) {
      const set = current();
      const count = parseInt(set.dataset.count, 10) || 1;
      const size = set.dataset.size;
      // Drop picks this size doesn't offer, and extras beyond the set.
      picks = picks.filter((p) => vialOf(p.li, size)).slice(0, count);
      const vialImg = root.getAttribute('data-vial-' + size);

      setNameEl.textContent = `${set.dataset.title} · ${count} × ${size} ml`;
      slotsEl.innerHTML = '';
      for (let i = 0; i < count; i++) {
        const li = document.createElement('li');
        const pick = picks[i];
        li.className = 'pvp__slot' + (pick ? ' is-full' : '');
        li.innerHTML = `<span class="pvp__slot-vial"><img src="${vialImg}" alt="" width="40" height="160" loading="lazy"></span>
          <span class="pvp__slot-text"><span class="pvp__slot-n">${i + 1}</span><span class="pvp__slot-name"></span><span class="pvp__slot-up"></span></span>`;
        li.querySelector('.pvp__slot-name').textContent = pick ? pick.name : t('Empty');
        if (pick) {
          li.querySelector('.pvp__slot-up').textContent = money(vialOf(pick.li, size).price);
          const rm = document.createElement('button');
          rm.type = 'button';
          rm.className = 'pvp__remove';
          rm.setAttribute('aria-label', `${t('Remove')}: ${pick.name}`);
          rm.textContent = '×';
          rm.addEventListener('click', () => {
            picks.splice(i, 1);
            draw(i);
          });
          li.appendChild(rm);
        }
        slotsEl.appendChild(li);
      }

      const full = picks.length >= count;
      statusEl.textContent = full
        ? t('Full')
        : t('Picked').replace('[n]', picks.length).replace('[total]', count);
      const removeLabel = t('Remove');
      const addLabel = root.dataset.tAddScent || '';

      // Scent cards: price per vial in this size, cheapest first.
      scents.forEach((li) => {
        const v = vialOf(li, size);
        const n = picks.filter((p) => p.li === li).length;
        const badge = li.querySelector('[data-count]');
        badge.hidden = n === 0 || !repeats;
        badge.textContent = '× ' + n;
        li.classList.toggle('is-picked', n > 0);
        // Its vial number in the tray (1, 2, 3), so card and tray match (owner).
        const num = li.querySelector('[data-num]');
        if (num) {
          const at = picks.findIndex((p) => p.li === li);
          num.hidden = repeats || at < 0;
          num.textContent = at < 0 ? '' : String(at + 1);
        }
        li.classList.toggle('is-off', !v);
        // With a set discount: the price in this set, the solo price struck through and
        // the % off, so the saving is obvious (owner). Without one: the vial price.
        const priceEl = li.querySelector('[data-vial-price]');
        const pct = Math.round(discountOf(set) * 100);
        if (!v) priceEl.textContent = t('Unavailable');
        else if (pct > 0) {
          const inSet = afterDiscount(v.price, set);
          priceEl.innerHTML = `${esc(t('PerVial').replace('[price]', money(inSet)).replace('[size]', size))} <s>${esc(money(v.price))}</s> <span class="pvp__off">${esc((t('Less') || 'Save [price] · [percent]%').replace('[price]', money(v.price - inSet)).replace('[percent]', pct))}</span>`;
          priceEl.setAttribute('aria-label', `${t('PerVial').replace('[price]', money(inSet)).replace('[size]', size)}, ${money(v.price)} on its own, ${money(v.price - inSet)} (${pct}%) less`);
        } else {
          priceEl.textContent = t('PerVial').replace('[price]', money(v.price)).replace('[size]', size);
          priceEl.removeAttribute('aria-label');
        }
        const btn = li.querySelector('[data-add]');
        const toggle = !repeats && n > 0;
        // Set full: the button stays reachable and explains itself instead of going dead.
        const blocked = !!v && !toggle && full;
        btn.disabled = !v;
        btn.toggleAttribute('aria-disabled', blocked);
        if (blocked) btn.setAttribute('aria-disabled', 'true');
        const tip = li.querySelector('[data-tip]');
        if (tip) {
          tip.hidden = !blocked;
          if (blocked) btn.setAttribute('aria-describedby', tip.id);
          else btn.removeAttribute('aria-describedby');
          if (!blocked) li.classList.remove('show-tip');
        }
        btn.classList.toggle('is-remove', toggle);
        btn.setAttribute('aria-label', `${toggle ? removeLabel : addLabel}: ${li.dataset.scent}`);
        btn.querySelector('[data-add-text]').textContent = toggle ? removeLabel : addLabel;
        btn.querySelector('[data-add-icon]').textContent = toggle ? '−' : '+';
      });
      if (list) {
        scents
          .slice()
          .sort((a, b) => {
            const va = vialOf(a, size);
            const vb = vialOf(b, size);
            if (!va || !vb) return va ? -1 : vb ? 1 : 0;
            return va.price - vb.price;
          })
          .forEach((li) => list.appendChild(li));
      }

      // Total = the vials picked, added up, less the set's discount.
      const sub = picks.reduce((a, p) => a + vialOf(p.li, size).price, 0);
      const pctOff = discountOf(set);
      const off = Math.round(sub * pctOff);
      const subLine = root.querySelector('[data-sub-line]');
      const offLine = root.querySelector('[data-off-line]');
      if (subLine && offLine) {
        subLine.hidden = offLine.hidden = !(pctOff && sub);
        root.querySelector('[data-sub]').textContent = money(sub);
        root.querySelector('[data-off]').textContent = '− ' + money(off);
        root.querySelector('[data-off-label]').textContent = t('Discount').replace('[n]', Math.round(pctOff * 100));
      }
      totalEl.textContent = money(sub - off);
      submit.disabled = !full;

      // Phone bar: a little vial per slot (filled ones amber), the total and progress.
      if (barEl) {
        const vials = root.querySelector('[data-bar-vials]');
        vials.innerHTML = Array.from({ length: Math.min(count, 10) }, (_, i) => `<i class="${i < picks.length ? 'on' : ''}"></i>`).join('');
        root.querySelector('[data-bar-total]').textContent = money(sub - off);
        root.querySelector('[data-bar-n]').textContent = (t('Bar') || '[n] of [total] picked').replace('[n]', picks.length).replace('[total]', count);
        barEl.classList.toggle('is-full', full);
      }

      if (focusSlot != null) {
        const target = slotsEl.children[Math.min(focusSlot, slotsEl.children.length - 1)];
        const btn = target && target.querySelector('.pvp__remove');
        (btn || statusEl).focus();
      }
    }

    scents.forEach((li) => {
      li.querySelector('[data-add]').addEventListener('click', () => {
        const count = parseInt(current().dataset.count, 10) || 1;
        // Picked already (one of each scent): this button removes it.
        if (!repeats && picks.some((p) => p.li === li)) {
          picks = picks.filter((p) => p.li !== li);
          draw();
          return;
        }
        if (picks.length >= count) {
          // Full: say what to do, and nudge the tray.
          statusEl.textContent = li.querySelector('[data-tip]')?.textContent.trim() || t('Full');
          li.classList.add('show-tip');
          clearTimeout(li._tipTimer);
          li._tipTimer = setTimeout(() => li.classList.remove('show-tip'), 2200);
          const tray = root.querySelector('.pvp__tray');
          if (tray) {
            tray.classList.remove('is-nudge');
            void tray.offsetWidth;
            tray.classList.add('is-nudge');
          }
          return;
        }
        picks.push({ li, name: li.dataset.scent });
        draw();
        const slot = slotsEl.children[picks.length - 1];
        if (slot) slot.classList.add('is-new');
      });
    });
    setInputs.forEach((i) => i.addEventListener('change', () => {
      prefill();
      draw();
    }));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const set = current();
      const count = parseInt(set.dataset.count, 10) || 1;
      const size = set.dataset.size;
      if (picks.length < count) return;
      // One line per perfume (same perfume twice = quantity 2), all marked with this set.
      // Visible on the order: "Set: Try trio · 3 × 1 ml". Hidden (_set): which set,
      // so two trios in one cart stay apart.
      const label = `${set.dataset.title} · ${count} × ${size} ml`;
      const setId = SET_ID();
      const byId = new Map();
      picks.forEach((p) => {
        const v = vialOf(p.li, size);
        byId.set(v.id, (byId.get(v.id) || 0) + 1);
      });
      const items = [...byId].map(([id, quantity]) => ({ id, quantity, properties: { Set: label, _set: setId } }));

      submit.disabled = true;
      try {
        const res = await fetch(`${root.dataset.cartAdd}.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ items }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.description || data.message || '');
        // Same as every other Add to bag in the theme: tell the header, then open the
        // cart drawer. Without the drawer (turned off in the header), go to the cart page.
        if (typeof window.publish === 'function' && window.PUB_SUB_EVENTS?.cartUpdate) {
          window.publish(window.PUB_SUB_EVENTS.cartUpdate, { source: 'perfume-vial-picker', cartData: data });
        }
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: data }));
        if (document.querySelector('perfume-cart-drawer')) {
          const first = (data.items || [])[0] || {};
          document.dispatchEvent(new CustomEvent('perfume:cart-open', { detail: { variant_id: first.variant_id || first.id } }));
          statusEl.textContent = t('Added') || 'Added to your bag.';
          submit.disabled = false;
        } else {
          location.href = root.dataset.cart || '/cart';
        }
      } catch (err) {
        statusEl.textContent = err.message || t('Error');
        statusEl.focus();
        submit.disabled = false;
      }
    });

    // Keep the tray clear of the sticky header (its height changes with the
    // announcement bar and screen size).
    const header = document.querySelector('perfume-header, .shopify-section-group-header-group');
    const placeTray = () => {
      if (!header) return;
      const h = Math.round(header.getBoundingClientRect().height);
      if (h > 0) root.style.setProperty('--pvp-sticky-top', `${h + 16}px`);
    };
    placeTray();
    window.addEventListener('resize', placeTray, { passive: true });
    if (header && 'ResizeObserver' in window) new ResizeObserver(placeTray).observe(header);

    statusEl.tabIndex = -1;
    // ?scent=<handle> (from a product page): that perfume goes in first, in a set
    // whose size it comes in. ?scent=a,b,c (a finished Try trio from a product page)
    // puts those perfumes in the vials in that order; any vial left over is filled as
    // usual.
    const wantedScents = (new URLSearchParams(location.search).get('scent') || '')
      .split(',').map((h) => h.trim()).filter(Boolean)
      .map((h) => scents.find((li) => li.dataset.handle === h)).filter(Boolean);
    const first = wantedScents[0];
    if (first) {
      if (!vialOf(first, current().dataset.size)) {
        const fit = setInputs.find((i) => vialOf(first, i.dataset.size));
        if (fit) fit.checked = true;
      }
      const size = current().dataset.size;
      const count = parseInt(current().dataset.count, 10) || 1;
      picks = [];
      wantedScents.forEach((li) => {
        if (picks.length >= count || !vialOf(li, size)) return;
        if (!repeats && picks.some((p) => p.li === li)) return;
        picks.push({ li, name: li.dataset.scent });
      });
    }
    // Compact tiles: a pop-up by the mouse with the scent's details (owner). Touch
    // screens get the short caption under each tile instead (CSS).
    if (root.classList.contains('pvp--compact') && matchMedia('(any-hover: hover)').matches) {
      const pop = document.createElement('div');
      pop.className = 'pvp__pop';
      pop.setAttribute('aria-hidden', 'true');
      root.appendChild(pop);
      let popLi = null, lastLi = null;
      const fill = (li) => {
        const forEl = li.querySelector('.pvp__for');
        const btn = li.querySelector('[data-add]');
        const picked = li.classList.contains('is-picked');
        const blocked = btn.getAttribute('aria-disabled') === 'true';
        const act = picked ? t('PopRemove') : blocked ? (li.querySelector('[data-tip]')?.textContent.trim() || t('Full')) : t('PopAdd');
        const img = li.querySelector('.pvp__scent-img img');
        const notes = [...(li.querySelector('template[data-notes]')?.content.querySelectorAll('.pvp__pn') || [])];
        const noteArt = notes.length ? `<span class="pvp__pop-notes">${notes.map((n, i) => `<span class="pvp__pn" style="--i:${i}">${n.innerHTML}</span>`).join('')}</span>` : '';
        pop.classList.toggle('has-notes', notes.length > 0);
        pop.innerHTML = `${img ? `<span class="pvp__pop-img"><img src="${esc((img.srcset || '').split(',').pop().trim().split(' ')[0] || img.currentSrc || img.src)}" alt="">${noteArt}</span>` : ''}${notes.length ? `<p class="pvp__pop-names">${notes.map((n) => esc(n.dataset.name)).join(' · ')}</p>` : ''}<p class="pvp__pop-top"><span>${esc(li.dataset.vendor || '')}</span>${forEl ? `<span class="pvp__pop-for">${esc(forEl.textContent)}</span>` : ''}</p>
          <p class="pvp__pop-n">${esc(li.dataset.scent)}</p>
          <p class="pvp__pop-p">${li.querySelector('[data-vial-price]').innerHTML}</p>
          ${act ? `<p class="pvp__pop-act${picked || blocked ? ' is-muted' : ''}"><i aria-hidden="true">${picked ? '−' : blocked ? '!' : '+'}</i>${esc(act)}</p>` : ''}`;
      };
      const place = (x, y) => {
        const w = pop.offsetWidth, h = pop.offsetHeight, g = 16;
        let px = x + g, py = y + g;
        if (px + w > innerWidth - 8) px = x - w - g;
        if (py + h > innerHeight - 8) py = y - h - g;
        pop.style.translate = `${Math.max(8, px)}px ${Math.max(8, py)}px`;
      };
      const show = (li, x, y) => {
        const wasOn = pop.classList.contains('is-on') && lastLi && lastLi !== li;
        popLi = li; lastLi = li; fill(li); pop.classList.add('is-on'); place(x, y);
        if (wasOn) { pop.classList.remove('is-swap'); void pop.offsetWidth; pop.classList.add('is-swap'); }
      };
      let hideT;
      const hide = () => { clearTimeout(hideT); hideT = setTimeout(() => { if (!popLi) pop.classList.remove('is-on'); }, 60); popLi = null; };
      scents.forEach((li) => {
        li.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') show(li, e.clientX, e.clientY); });
        li.addEventListener('pointermove', (e) => { if (popLi === li) place(e.clientX, e.clientY); });
        li.addEventListener('pointerleave', hide);
        const btn = li.querySelector('[data-add]');
        btn.addEventListener('focus', () => { if (!btn.matches(':focus-visible')) return; const r = li.getBoundingClientRect(); show(li, r.right - 6, r.top + 6); });
        btn.addEventListener('blur', hide);
        btn.addEventListener('click', () => { if (popLi === li) requestAnimationFrame(() => fill(li)); });
      });
      window.addEventListener('scroll', () => popLi && hide(), { passive: true });
    }

    // Quick fills (owner): lowest price, one of each brand, or a random mix.
    root.querySelectorAll('[data-fill]').forEach((b) => b.addEventListener('click', () => {
      const set = current();
      const count = parseInt(set.dataset.count, 10) || 1;
      const size = set.dataset.size;
      const avail = scents.filter((li) => vialOf(li, size));
      const byPrice = avail.slice().sort((a, c) => vialOf(a, size).price - vialOf(c, size).price);
      let pick = [];
      if (b.dataset.fill === 'low') pick = byPrice;
      else if (b.dataset.fill === 'surprise') {
        pick = avail.slice();
        for (let i = pick.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pick[i], pick[j]] = [pick[j], pick[i]]; }
      } else {
        const seen = new Set();
        const shuffled = avail.slice().sort(() => Math.random() - 0.5);
        const first = shuffled.filter((li) => !seen.has(li.dataset.vendor) && seen.add(li.dataset.vendor));
        pick = first.concat(byPrice.filter((li) => !first.includes(li)));
      }
      if (!repeats) pick = pick.filter((li, i) => pick.indexOf(li) === i);
      let list2 = pick.slice(0, count);
      if (repeats && list2.length < count && list2.length) while (list2.length < count) list2.push(list2[list2.length % pick.length]);
      picks = list2.map((li) => ({ li, name: li.dataset.scent }));
      draw();
      [...slotsEl.children].forEach((sl) => sl.classList.add('is-new'));
      statusEl.textContent = (t('Filled') || 'Filled [n] vials.').replace('[n]', picks.length);
      if (barEl && mq.matches) setOpen(true);
    }));

    // Phones: the tray is a drawer behind a bar; desktop shows it open as before.
    function setOpen(open) {
      if (!barEl) return;
      const drawer = mq.matches;
      root.classList.toggle('is-tray-open', drawer && open);
      barEl.setAttribute('aria-expanded', String(!drawer || open));
      if (trayBody) trayBody.inert = drawer && !open;
    }
    if (barEl) {
      barEl.addEventListener('click', () => setOpen(!root.classList.contains('is-tray-open')));
      const sync = () => setOpen(false);
      mq.addEventListener ? mq.addEventListener('change', sync) : mq.addListener(sync);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && root.classList.contains('is-tray-open')) { setOpen(false); barEl.focus(); }
      });
      sync();
    }

    prefill();
    draw();
  }

  const run = () => document.querySelectorAll('[data-pvp]').forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  document.addEventListener('shopify:section:load', (e) => {
    const root = e.target.querySelector('[data-pvp]');
    if (root) init(root);
  });
})();
