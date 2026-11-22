// Development controls only; the storefront uses pointer hover and OS preferences.
customElements.whenDefined('perfume-footer').then(() => {
  const footer = document.querySelector('perfume-footer');
  const signature = footer?.querySelector('.pfo-signature');
  const pressed = document.querySelector('[data-signature-pressed]');
  if (!signature || !pressed) return;
  pressed.addEventListener('click', () => {
    const show = pressed.getAttribute('aria-pressed') !== 'true';
    pressed.setAttribute('aria-pressed', String(show));
    if (show) { signature.style.setProperty('--pfo-pressed', '1'); footer.spraySignature(); }
    else signature.style.removeProperty('--pfo-pressed');
  });
  document.querySelector('[data-signature-replay]')?.addEventListener('click', () => {
    pressed.setAttribute('aria-pressed', 'false');
    signature.style.removeProperty('--pfo-pressed');
    footer.finishMist();
    footer.revealSignature();
  });
});
