// Select among existing synthetic examples. Playback always remains user initiated.
(() => {
  const video = document.getElementById('cardiodit-cine');
  const buttons = document.querySelectorAll('[data-cine]');
  if (!video) return;
  buttons.forEach((button) => button.addEventListener('click', () => {
    if (button.getAttribute('aria-pressed') === 'true') return;
    const sample = button.dataset.cine;
    video.pause();
    video.poster = `assets/public-example-${sample}.jpg`;
    video.querySelector('source').src = `assets/public-example-${sample}.mp4`;
    video.querySelector('a').href = `assets/public-example-${sample}.mp4`;
    video.setAttribute('aria-label', `Synthetic CardioDiT example ${sample}: three synchronized short-axis slices`);
    video.load();
    buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  }));
})();
