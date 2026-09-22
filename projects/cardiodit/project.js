// Native video is the fallback; custom controls enhance each MRI player.
const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
for (const player of document.querySelectorAll('[data-video-player]')) {
  const cine = player.querySelector('video');
  const query = (selector) => player.querySelector(selector);
  const label = player.dataset.videoLabel;
  const status = query('.v-video-status');
  const playButton = query('.v-play');
  const timeline = query('.v-video-progress');
  const planes = query('.v-cine-planes');
  if (planes) {
    // Source triptychs contain three complete 256px views at x=0,272,544.
    // Only gutters are omitted; anatomy is neither stretched nor cropped.
    const canvases = [...planes.querySelectorAll('canvas')];
    const contexts = canvases.map((canvas) => canvas.getContext('2d'));
    let poster, frameRequest;
    let showPoster = true;
    const useVideoFrames = typeof cine.requestVideoFrameCallback === 'function';
    const draw = () => {
      const source = showPoster ? poster : cine;
      if (!source || (showPoster ? !source.complete || !source.naturalWidth : cine.readyState < 2)) return;
      canvases.forEach((canvas, index) => {
        const ctx = contexts[index];
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const size = Math.min(canvas.width, canvas.height);
        ctx.drawImage(source, index * 272, 0, 256, 256, (canvas.width - size) / 2, (canvas.height - size) / 2, size, size);
      });
      planes.hidden = false;
      cine.parentElement.classList.add('has-planes');
    };
    const loadPoster = () => {
      showPoster = true;
      planes.hidden = true;
      cine.parentElement.classList.remove('has-planes');
      const next = new Image();
      next.addEventListener('load', () => { if (poster === next) draw(); });
      poster = next;
      next.src = cine.poster;
    };
    const paint = () => {
      if (cine.paused) return;
      draw();
      frameRequest = useVideoFrames ? cine.requestVideoFrameCallback(paint) : requestAnimationFrame(paint);
    };
    if (contexts.every(Boolean)) {
      new ResizeObserver(() => {
        const box = cine.parentElement.getBoundingClientRect();
        for (const canvas of canvases) {
          canvas.width = Math.max(1, Math.round(box.width / 3 * devicePixelRatio));
          canvas.height = Math.max(1, Math.round(box.height * devicePixelRatio));
        }
        draw();
      }).observe(cine.parentElement);
      cine.addEventListener('play', () => { showPoster = false; paint(); });
      cine.addEventListener('pause', () => {
        if (useVideoFrames) cine.cancelVideoFrameCallback(frameRequest);
        else cancelAnimationFrame(frameRequest);
      });
      cine.addEventListener('seeked', () => { showPoster = false; draw(); });
      cine.addEventListener('loadeddata', () => { if (!showPoster) draw(); });
      cine.addEventListener('emptied', loadPoster);
      loadPoster();
    }
  }
  const duration = () => Number.isFinite(cine.duration) ? cine.duration : 4;
  const sync = () => {
    playButton.setAttribute('aria-label', `${cine.paused ? 'Play' : 'Pause'} ${label}`);
    playButton.querySelector('i').className = `bi bi-${cine.paused ? 'play' : 'pause'}-fill`;
    query('.v-time').textContent = `${clock(cine.currentTime)} / ${clock(duration())}`;
    timeline.max = duration();
    timeline.value = cine.currentTime;
    timeline.setAttribute('aria-valuetext', `${cine.currentTime.toFixed(1)} seconds of ${duration().toFixed(1)} seconds`);
  };
  cine.controls = false;
  query('.v-player-controls').hidden = false;
  playButton.addEventListener('click', async () => {
    if (!cine.paused) return cine.pause();
    try { await cine.play(); status.textContent = ''; }
    catch { status.textContent = 'The video could not play. Please try again.'; }
  });
  for (const event of ['play', 'pause', 'timeupdate', 'loadedmetadata', 'emptied', 'ended']) cine.addEventListener(event, sync);
  cine.addEventListener('error', () => { status.textContent = 'This video could not load. Please try another example.'; });
  timeline.addEventListener('input', () => { if (cine.readyState) cine.currentTime = Number(timeline.value); });
  const fullscreen = query('.v-video-fullscreen');
  fullscreen.hidden = !player.requestFullscreen;
  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement === player) await document.exitFullscreen();
      else await player.requestFullscreen();
    } catch { status.textContent = 'Fullscreen is unavailable in this browser.'; }
  });
  document.addEventListener('fullscreenchange', () => {
    fullscreen.setAttribute('aria-label', `${document.fullscreenElement === player ? 'Exit' : 'View'} ${label} fullscreen`);
  });
  if (cine.id === 'cardiodit-cine') {
    const buttons = [...document.querySelectorAll('[data-cine]')];
    for (const button of buttons) button.addEventListener('click', () => {
      if (button.getAttribute('aria-pressed') === 'true') return;
      cine.pause();
      const stem = button.dataset.cine;
      cine.poster = `assets/${stem}.jpg`;
      cine.querySelector('source').src = `assets/${stem}.mp4`;
      cine.querySelector('a').href = `assets/${stem}.mp4`;
      cine.setAttribute('aria-label', `Synthetic cardiac MRI ${button.textContent}: synchronized through-plane views`);
      cine.load();
      status.textContent = '';
      buttons.forEach((choice) => choice.setAttribute('aria-pressed', String(choice === button)));
    });
  }
  new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) cine.pause(); }).observe(player);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cine.pause(); });
}

const copyButton = document.querySelector('.v-copy');
if (copyButton) {
  copyButton.hidden = false;
  let resetCopy;
  copyButton.addEventListener('click', async () => {
    const code = document.querySelector('.v-citation code');
    const status = document.querySelector('.v-copy-status');
    try {
      await navigator.clipboard.writeText(code.textContent);
      copyButton.querySelector('span').textContent = 'Copied';
      status.textContent = 'BibTeX citation copied.';
      clearTimeout(resetCopy);
      resetCopy = setTimeout(() => { copyButton.querySelector('span').textContent = 'Copy'; }, 2500);
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'Citation selected. Press Control+C or Command+C to copy.';
    }
  });
}

const sections = [...document.querySelectorAll('.v-section')];
const navLinks = [...document.querySelectorAll('.v-nav-sections a')];
let scrollPending = false;
function updateNavigation() {
  const headerBottom = document.querySelector('.v-nav').getBoundingClientRect().bottom;
  const current = sections.findLast((section) => section.getBoundingClientRect().top <= headerBottom + 80) || sections[0];
  navLinks.forEach((link) => {
    if (link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  scrollPending = false;
}
window.addEventListener('scroll', () => {
  if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateNavigation); }
}, { passive: true });
window.addEventListener('resize', updateNavigation);
updateNavigation();
