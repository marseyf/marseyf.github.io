/* Progressive enhancement for the homepage; project pages never load this file. */
(() => {
  if (!document.body.classList.contains('slate-homepage')) return;

  const toggle = document.querySelector('.h-news-toggle');
  const older = document.getElementById('older-news');
  if (toggle && older) {
    const setExpanded = expanded => {
      older.hidden = !expanded;
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.replaceChildren(document.createTextNode(expanded ? 'See less ' : `See more (${toggle.dataset.count}) `));
      const chevron = document.createElement('i');
      chevron.className = `bi bi-chevron-${expanded ? 'up' : 'down'}`;
      chevron.setAttribute('aria-hidden', 'true');
      toggle.append(chevron);
    };
    setExpanded(false);
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') !== 'true';
      setExpanded(expanded);
      // Keep the focused control visible when the extra rows collapse above it.
      if (!expanded) toggle.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    });
  }

  const sections = [...document.querySelectorAll('.h-screen[data-nav]')];
  const links = [...document.querySelectorAll('.h-nav-sections a')];
  const nav = document.querySelector('.h-nav');
  let scheduled = false;
  function updateCurrentSection() {
    const readingLine = nav.getBoundingClientRect().bottom + (window.innerHeight - nav.offsetHeight) * .3;
    const current = [...sections].reverse().find(section => section.getBoundingClientRect().top <= readingLine) || sections[0];
    for (const anchor of links) {
      if (anchor.hash === `#${current.dataset.nav}`) anchor.setAttribute('aria-current', 'location');
      else anchor.removeAttribute('aria-current');
    }
    scheduled = false;
  }
  const schedule = () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateCurrentSection); }
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  updateCurrentSection();
})();
