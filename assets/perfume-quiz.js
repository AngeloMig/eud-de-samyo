/*
  <perfume-quiz> (sections/perfume-quiz.liquid)
  One question at a time: choosing an answer moves on (a beat later, so the choice is
  seen), Back and Skip move too, the step line and "Question 2 of 5" follow, and the
  background takes the question's colour. At the end every candidate perfume scores
  one point per answer that shares a tag with it; the best few show, each with the
  answers it matched. Ties keep the collection's order. No answers or no matches:
  an honest "nothing matches yet" with a link to all perfumes.
*/
(() => {
  if (customElements.get('perfume-quiz')) return;

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  class PerfumeQuiz extends HTMLElement {
    connectedCallback() {
      this.qs = [...this.querySelectorAll('[data-pq-q]')];
      if (!this.qs.length) return;
      this.steps = [...this.querySelectorAll('.pq__steps li')];
      this.count = this.querySelector('[data-pq-count]');
      this.result = this.querySelector('[data-pq-result]');
      this.matches = this.querySelector('[data-pq-matches]');
      this.pool = [...this.querySelectorAll('[data-pq-pool] > li')];
      this.limit = Number(this.dataset.results) || 3;
      this.answers = new Array(this.qs.length).fill(null);
      this.classList.add('is-ready');

      this.qs.forEach((q, i) => {
        q.addEventListener('change', (e) => {
          const input = e.target;
          this.answers[i] = { tags: input.value.split(',').map((t) => t.trim()).filter(Boolean), label: input.dataset.label };
          clearTimeout(this.timer);
          this.timer = setTimeout(() => this.show(i + 1), reduced() ? 0 : 380);
        });
        q.querySelector('[data-pq-back]')?.addEventListener('click', () => this.show(i - 1));
        q.querySelector('[data-pq-skip]')?.addEventListener('click', () => {
          this.answers[i] = null;
          q.querySelectorAll('input').forEach((x) => (x.checked = false));
          this.show(i + 1);
        });
      });
      this.querySelector('[data-pq-restart]')?.addEventListener('click', () => {
        this.answers.fill(null);
        this.querySelectorAll('[data-pq-q] input').forEach((x) => (x.checked = false));
        this.show(0);
      });
      this.show(0, true);
    }

    show(i, first) {
      if (i >= this.qs.length) return this.finish();
      if (i < 0) return;
      this.current = i;
      this.qs.forEach((q, j) => {
        q.hidden = j !== i;
        q.classList.toggle('is-in', j === i && !first);
      });
      this.result.hidden = true;
      this.steps.forEach((s, j) => {
        s.classList.toggle('is-done', j < i);
        s.classList.toggle('is-current', j === i);
      });
      if (this.count) this.count.textContent = `Question ${i + 1} of ${this.qs.length}`;
      this.style.setProperty('--pq-cur', this.qs[i].style.getPropertyValue('--bg') || '');
      if (!first) {
        const legend = this.qs[i].querySelector('legend');
        this.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
        // Move focus to the first answer so keyboard and screen reader users follow.
        this.qs[i].querySelector('input')?.focus({ preventScroll: true });
        if (legend) legend.id = legend.id || `pq-legend-${i}`;
      }
    }

    finish() {
      this.qs.forEach((q) => (q.hidden = true));
      this.steps.forEach((s, j) => {
        s.classList.add('is-done');
        s.classList.toggle('is-current', j === this.steps.length - 1);
      });
      if (this.count) this.count.textContent = 'Your result';
      this.style.removeProperty('--pq-cur');

      const chosen = this.answers.filter(Boolean);
      const scored = this.pool
        .map((li, order) => {
          const tags = new Set((li.dataset.tags || '').split(',').map((t) => t.trim()).filter(Boolean));
          const hits = chosen.filter((a) => a.tags.some((t) => tags.has(t)));
          return { li, order, score: hits.length, hits };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score || a.order - b.order)
        .slice(0, this.limit);

      this.matches.innerHTML = '';
      scored.forEach((x, i) => {
        const li = x.li.cloneNode(true);
        li.style.setProperty('--i', i);
        const why = li.querySelector('[data-pq-why]');
        if (why) {
          why.textContent = '';
          const b = document.createElement('b');
          b.textContent = `Matches ${x.score} of ${chosen.length}: `;
          why.append(b, x.hits.map((h) => h.label).join(' · '));
        }
        this.matches.appendChild(li);
      });
      this.querySelector('[data-pq-none]').hidden = scored.length > 0;
      const summary = this.querySelector('[data-pq-summary]');
      if (summary) summary.textContent = chosen.length ? `You chose: ${chosen.map((a) => a.label).join(', ')}.` : 'You skipped every question.';

      this.result.hidden = false;
      this.result.classList.remove('is-in');
      void this.result.offsetWidth;
      this.result.classList.add('is-in');
      this.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      this.result.querySelector('[tabindex="-1"]')?.focus({ preventScroll: true });
    }
  }

  customElements.define('perfume-quiz', PerfumeQuiz);
})();
