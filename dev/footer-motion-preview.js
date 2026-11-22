// Comparison controls, separate from the storefront code.
(() => {
  const config = JSON.parse(document.getElementById('motion-config').textContent);
  const frame = document.querySelector('iframe');
  const choices = [...document.querySelectorAll('[data-idea]')];
  let selected = Math.max(0, Math.min(9, Number(location.hash.match(/idea-(\d+)/)?.[1] || 5) - 1));
  let context = 'wordmark';
  let reduced = false;
  function show() {
    const [name, description] = config.ideas[selected];
    document.getElementById('idea-title').textContent = `${selected + 1}. ${name}`;
    document.getElementById('idea-description').textContent = description;
    document.getElementById('motion-live').textContent = 'Loading preview…';
    choices.forEach((choice, i) => choice.setAttribute('aria-pressed', String(i === selected)));
    frame.title = `Footer animation ${selected + 1}: ${name}`;
    frame.src = `footer-motion-idea-${selected + 1}.html?context=${context}&motion=${reduced ? 'reduce' : 'normal'}`;
    history.replaceState(null, '', `#idea-${selected + 1}`);
  }
  choices.forEach((choice, i) => choice.addEventListener('click', () => { selected = i; show(); }));
  document.querySelector('[data-replay]').addEventListener('click', () => {
    frame.contentWindow.postMessage({ kind: 'samyo-motion-replay' }, location.origin);
  });
  document.querySelectorAll('[data-size]').forEach(button => button.addEventListener('click', () => {
    document.querySelector('.frame-surround').classList.toggle('phone', button.dataset.size === 'phone');
    document.querySelectorAll('[data-size]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
  }));
  document.querySelectorAll('[data-context]').forEach(button => button.addEventListener('click', () => {
    context = button.dataset.context;
    document.querySelectorAll('[data-context]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    show();
  }));
  document.querySelector('[data-reduced]').addEventListener('click', event => {
    reduced = !reduced;
    event.currentTarget.setAttribute('aria-pressed', String(reduced));
    show();
  });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
    if (event.data?.kind === 'samyo-idea-height') {
      const height = Math.ceil(Number(event.data.height));
      if (height > 0 && height < 10000) frame.style.height = `${height}px`;
    }
    if (event.data?.kind === 'samyo-motion-state') {
      document.getElementById('motion-live').textContent = event.data.message;
      document.querySelector('[data-replay]').disabled = event.data.reduced;
    }
  });
  show();
})();
