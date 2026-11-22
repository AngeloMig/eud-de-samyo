/*
  Scroll reveal shared by the perfume sections. Any element with [data-pf-reveal]
  gets .is-in once a quarter of it is on screen; CSS in perfume-tokens.css (and each
  section's own CSS) decides what "in" looks like. Children can stagger with --i.
  Without JS or with reduced motion everything is simply shown.
*/
(() => {
  if (window.__pfReveal) return;
  window.__pfReveal = true;

  const show = (el) => el.classList.add('is-in');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('pf-js');

  const observer =
    !reduced && 'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) =>
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              show(entry.target);
              observer.unobserve(entry.target);
            }),
          { threshold: 0.25, rootMargin: '0px 0px -5% 0px' }
        )
      : null;

  // Anything already on screen, or already scrolled past, shows straight away.
  const inOrAbove = (el) => el.getBoundingClientRect().top < window.innerHeight * 0.95;

  const scan = (root = document) =>
    root.querySelectorAll('[data-pf-reveal]:not(.is-in)').forEach((el) => {
      if (!observer || inOrAbove(el)) show(el);
      else observer.observe(el);
    });

  scan();
  // Safety net: a fast jump (anchor link, "back" restoring the scroll) can skip the
  // observer's threshold; catch up after scrolling settles.
  let settle;
  window.addEventListener(
    'scroll',
    () => {
      clearTimeout(settle);
      settle = setTimeout(() => document.querySelectorAll('[data-pf-reveal]:not(.is-in)').forEach((el) => inOrAbove(el) && show(el)), 150);
    },
    { passive: true }
  );
  // Theme editor: sections are re-rendered in place.
  document.addEventListener('shopify:section:load', (e) => scan(e.target));
})();
