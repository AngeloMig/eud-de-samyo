(() => {
  const config = JSON.parse(document.getElementById('idea-config').textContent);
  const frame = document.querySelector('iframe');
  const buttons = [...document.querySelectorAll('[data-idea]')];
  function select(index) {
    const idea = config.ideas[index];
    document.getElementById('idea-title').textContent = `${index + 1}. ${idea[0]}`;
    document.getElementById('idea-description').textContent = idea[1];
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(index === i)));
    frame.title = `${config.title}: ${idea[0]}`;
    frame.src = `${config.prefix}-idea-${index + 1}.html`;
    history.replaceState(null, '', `#idea-${index + 1}`);
  }
  buttons.forEach((button, index) => button.addEventListener('click', () => select(index)));
  document.querySelectorAll('[data-size]').forEach(button => button.addEventListener('click', () => {
    document.querySelector('.frame-surround').classList.toggle('phone', button.dataset.size === 'phone');
    document.querySelectorAll('[data-size]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
  }));
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.kind !== 'samyo-idea-height') return;
    const height = Math.ceil(Number(event.data.height));
    if (Number.isFinite(height) && height > 0 && height < 10000) {
      frame.style.height = `${height}px`;
      document.getElementById('measurement').textContent = `Rendered section height: ${height}px`;
    }
  });
  const initial = Number(location.hash.match(/idea-(\d+)/)?.[1] || 1) - 1;
  select(Math.max(0, Math.min(9, initial)));
})();
