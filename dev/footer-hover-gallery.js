(() => {
  const ideas = JSON.parse(document.getElementById('hover-config').textContent);
  const frame = document.querySelector('iframe');
  const choices = [...document.querySelectorAll('[data-hover-choice]')];
  let selected = Math.max(0, Math.min(9, Number(location.hash.match(/idea-(\d+)/)?.[1] || 1) - 1));
  let context = 'wordmark';
  let reduced = false;
  function show() {
    const [name, description] = ideas[selected];
    document.getElementById('hover-title').textContent = `${selected + 1}. ${name}`;
    document.getElementById('hover-description').textContent = description;
    document.getElementById('hover-live').textContent = 'Loading signature…';
    choices.forEach((button, i) => button.setAttribute('aria-pressed', String(i === selected)));
    frame.title = `Perfume hover ${selected + 1}: ${name}`;
    frame.src = `footer-hover-idea-${selected + 1}.html?context=${context}&motion=${reduced ? 'reduce' : 'normal'}`;
    history.replaceState(null, '', `#idea-${selected + 1}`);
  }
  choices.forEach((button, i) => button.addEventListener('click', () => { selected = i; show(); }));
  const send = action => frame.contentWindow.postMessage({ kind: 'samyo-hover-control', action }, location.origin);
  document.querySelector('[data-play-hover]').addEventListener('click', () => send('hover'));
  document.querySelector('[data-entrance]').addEventListener('click', () => send('entrance'));
  document.querySelectorAll('[data-context]').forEach(button => button.addEventListener('click', () => {
    context = button.dataset.context;
    document.querySelectorAll('[data-context]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    show();
  }));
  document.querySelectorAll('[data-size]').forEach(button => button.addEventListener('click', () => {
    document.querySelector('.frame-surround').classList.toggle('phone', button.dataset.size === 'phone');
    document.querySelectorAll('[data-size]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
  }));
  document.querySelector('[data-reduced]').addEventListener('click', event => {
    reduced = !reduced;
    event.currentTarget.setAttribute('aria-pressed', String(reduced));
    show();
  });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
    if (event.data?.kind === 'samyo-hover-height') {
      const height = Math.ceil(Number(event.data.height));
      if (height > 0 && height < 10000) frame.style.height = `${height}px`;
    }
    if (event.data?.kind === 'samyo-hover-state') {
      document.getElementById('hover-live').textContent = event.data.message;
      document.querySelector('[data-entrance]').disabled = event.data.reduced;
    }
  });
  show();
})();
