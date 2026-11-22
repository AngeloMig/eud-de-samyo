// Ten real, finite motion studies using the rendered footer lettering.
(() => {
  const params = new URLSearchParams(location.search);
  const idea = Number(document.body.dataset.motionIdea);
  const wordmark = document.querySelector('[data-pfo-wordmark]');
  if (!wordmark) return;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const forcedReduced = params.get('motion') === 'reduce';
  const wrap = document.createElement('div');
  wrap.className = 'motion-wordmark-wrap';
  wordmark.before(wrap);
  wrap.append(wordmark);
  const letters = [...wordmark.querySelectorAll('.pfo-wordmark__ch')];
  const prefix = wordmark.querySelector('.pfo-wordmark__pre');
  const parts = prefix ? [prefix, ...letters] : letters;
  const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';
  let active = [];
  let run = 0;
  let queuedPointer = 0;
  let x = 0;
  let y = 0;
  function report(message) {
    parent.postMessage({ kind: 'samyo-motion-state', message, reduced: forcedReduced || media.matches }, location.origin);
  }
  function clean() {
    cancelAnimationFrame(queuedPointer);
    queuedPointer = 0;
    active.forEach(animation => animation.cancel());
    active = [];
    wrap.querySelectorAll('.motion-spritz,.pfo-wordmark__outline').forEach(el => el.remove());
    wordmark.style.removeProperty('transform');
    document.body.dataset.motionActive = '0';
  }
  function animate(el, frames, duration, delay = 0, easing = ease) {
    if (!el) return;
    const animation = el.animate(frames, { duration, delay, easing, fill: 'both' });
    active.push(animation);
    return animation;
  }
  async function play() {
    const thisRun = ++run;
    clean();
    if (forcedReduced || media.matches) {
      document.body.dataset.motionState = 'reduced';
      report('Reduced motion: the signature stays still.');
      return;
    }
    document.body.dataset.motionState = 'playing';
    report(idea === 9 ? 'Playing a small hover demonstration. Move your pointer over the lettering afterward.' : 'Playing…');
    switch (idea) {
      case 1:
        animate(wordmark, [
          { clipPath: 'inset(0 100% 0 0)', opacity: 0.35 },
          { clipPath: 'inset(0 0% 0 0)', opacity: 1 },
        ], 1500);
        for (let i = 0; i < 18; i++) {
          const dot = document.createElement('span');
          dot.className = 'motion-spritz';
          dot.style.setProperty('--droplet-size', `${2 + i % 3}px`);
          wrap.append(dot);
          const dx = wrap.clientWidth * (0.18 + (i % 6) * 0.075);
          const dy = ((i % 7) - 3) * 14;
          animate(dot, [
            { opacity: 0, transform: 'translate(0, 0) scale(0.4)' },
            { opacity: 0.24, offset: 0.15 },
            { opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(0.9)` },
          ], 1050, i * 24);
        }
        break;
      case 2:
        parts.forEach((part, i) => animate(part, [
          { opacity: 0, transform: 'translateY(65%)' }, { opacity: 1, transform: 'translateY(0)' },
        ], 1000, i * 70));
        break;
      case 3:
        animate(wordmark, [
          { transform: 'scale(1)' }, { transform: 'scale(1.025)', offset: 0.48 }, { transform: 'scale(1)' },
        ], 2400, 0, 'cubic-bezier(0.45, 0, 0.3, 1)');
        break;
      case 4:
        animate(wordmark, [
          { clipPath: 'inset(100% 0 0 0)', transform: 'translateY(24px)' },
          { clipPath: 'inset(0% 0 0 0)', transform: 'translateY(0)' },
        ], 1500);
        break;
      case 5:
        animate(prefix, [
          { opacity: 0, transform: 'translateX(-18px)' }, { opacity: 1, transform: 'translateX(0)' },
        ], 700);
        letters.forEach((part, i) => animate(part, [
          { opacity: 0, transform: 'translateY(28%)' }, { opacity: 1, transform: 'translateY(0)' },
        ], 1000, 500 + i * 65));
        break;
      case 6:
        parts.slice(0, -1).forEach(part => animate(part, [{ opacity: 0 }, { opacity: 1 }], 650));
        animate(letters.at(-1), [
          { opacity: 0, transform: 'translateY(-32%) rotate(-4deg)' },
          { opacity: 1, transform: 'translateY(4%) rotate(1deg)', offset: 0.62 },
          { opacity: 1, transform: 'translateY(0) rotate(0)' },
        ], 1100, 350);
        break;
      case 7: {
        const middle = (letters.length - 1) / 2;
        letters.forEach((part, i) => animate(part, [
          { opacity: 0, transform: `translateX(${(i - middle) * 9}px) scale(0.96)` },
          { opacity: 1, transform: 'translateX(0) scale(1)' },
        ], 950, Math.abs(i - middle) * 130));
        animate(prefix, [{ opacity: 0 }, { opacity: 1 }], 700, 550);
        break;
      }
      case 8:
        animate(wordmark, [
          { opacity: 0, transform: 'perspective(1000px) rotateX(24deg) translateY(24px)' },
          { opacity: 1, transform: 'perspective(1000px) rotateX(0) translateY(0)' },
        ], 1600);
        break;
      case 9:
        animate(wordmark, [
          { transform: 'translate(0, 0)' }, { transform: 'translate(5px, -3px)' },
          { transform: 'translate(-4px, 2px)' }, { transform: 'translate(0, 0)' },
        ], 2000, 0, 'ease-in-out');
        break;
      case 10: {
        const outline = wordmark.cloneNode(true);
        outline.removeAttribute('data-pfo-wordmark');
        outline.classList.add('pfo-wordmark__outline');
        wrap.append(outline);
        animate(wordmark, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], 1600, 120);
        animate(outline, [{ opacity: 1 }, { opacity: 1, offset: 0.4 }, { opacity: 0 }], 1720);
        break;
      }
    }
    document.body.dataset.motionActive = String(active.length);
    await Promise.allSettled(active.map(animation => animation.finished));
    if (run !== thisRun) return;
    clean();
    document.body.dataset.motionState = 'finished';
    report(idea === 9 ? 'Move your pointer over the wordmark, or replay the demonstration.' : 'Ready to replay.');
  }
  wrap.addEventListener('pointermove', event => {
    if (idea !== 9 || forcedReduced || media.matches || document.body.dataset.motionState === 'playing' || event.pointerType !== 'mouse') return;
    active.forEach(animation => animation.cancel());
    active = [];
    const rect = wrap.getBoundingClientRect();
    x = ((event.clientX - rect.left) / rect.width - 0.5) * 12;
    y = ((event.clientY - rect.top) / rect.height - 0.5) * 8;
    if (!queuedPointer) queuedPointer = requestAnimationFrame(() => {
      queuedPointer = 0;
      wordmark.style.transform = `translate(${x}px, ${y}px)`;
    });
  });
  wrap.addEventListener('pointerleave', () => {
    if (idea !== 9 || forcedReduced || media.matches) return;
    cancelAnimationFrame(queuedPointer);
    queuedPointer = 0;
    const from = wordmark.style.transform || 'translate(0, 0)';
    wordmark.style.removeProperty('transform');
    animate(wordmark, [{ transform: from }, { transform: 'translate(0, 0)' }], 450);
  });
  window.addEventListener('message', event => {
    if (event.origin === location.origin && event.source === parent && event.data?.kind === 'samyo-motion-replay') play();
  });
  media.addEventListener('change', () => play());
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    ++run;
    clean();
    document.body.dataset.motionState = 'finished';
    report('Ready to replay.');
  });
  // This is a visual preview, never a fake newsletter signup.
  document.querySelector('.pfo-news')?.addEventListener('submit', event => {
    event.preventDefault();
    report('The newsletter form is shown for layout preview only.');
  });
  new ResizeObserver(() => parent.postMessage({ kind: 'samyo-idea-height', height: document.body.scrollHeight }, location.origin)).observe(document.body);
  const start = async () => {
    await document.fonts.ready;
    if (forcedReduced || media.matches || params.get('context') !== 'footer') return play();
    report('Scroll the full footer into view to reveal the signature, or press Replay.');
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      play();
    }, { threshold: 0.35 });
    observer.observe(wrap);
  };
  start().catch(() => { clean(); report('Static signature shown.'); });
})();
