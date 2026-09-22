const cine = document.getElementById('voldit-cine');
const player = document.querySelector('.v-cine-player');
const videoStatus = document.querySelector('.v-video-status');
const playButton = document.querySelector('.v-play');
const muteButton = document.querySelector('.v-mute');
const timeline = document.getElementById('v-video-progress');
const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

if (cine && player) {
  // The committed 800x256 videos contain three complete 256px planes at
  // x=0,272,544. Reframe them in equal columns without stretching anatomy.
  const planes = document.querySelector('.v-cine-planes');
  const canvases = [...planes.querySelectorAll('canvas')];
  const contexts = canvases.map((canvas) => canvas.getContext('2d'));
  let poster;
  let showPoster = true;
  let frameRequest;
  const useVideoFrames = typeof cine.requestVideoFrameCallback === 'function';
  function drawPlanes() {
    const source = showPoster ? poster : cine;
    if (!source || (showPoster ? !source.complete || !source.naturalWidth : cine.readyState < 2)) return;
    canvases.forEach((canvas, index) => {
      const context = contexts[index];
      context.fillStyle = '#000';
      context.fillRect(0, 0, canvas.width, canvas.height);
      const size = Math.min(canvas.width, canvas.height);
      context.drawImage(source, index * 272, 0, 256, 256,
        (canvas.width - size) / 2, (canvas.height - size) / 2, size, size);
    });
    planes.hidden = false;
    cine.parentElement.classList.add('has-planes');
  }
  function loadPoster() {
    showPoster = true;
    planes.hidden = true;
    cine.parentElement.classList.remove('has-planes');
    const next = new Image();
    next.addEventListener('load', () => { if (next === poster) drawPlanes(); });
    poster = next;
    next.src = cine.poster;
  }
  function paintVideo() {
    if (cine.paused) return;
    drawPlanes();
    frameRequest = useVideoFrames ? cine.requestVideoFrameCallback(paintVideo) : requestAnimationFrame(paintVideo);
  }
  if (contexts.every(Boolean)) {
    new ResizeObserver(() => {
      const box = cine.parentElement.getBoundingClientRect();
      canvases.forEach((canvas) => {
        canvas.width = Math.max(1, Math.round(box.width / 3 * devicePixelRatio));
        canvas.height = Math.max(1, Math.round(box.height * devicePixelRatio));
      });
      drawPlanes();
    }).observe(cine.parentElement);
    cine.addEventListener('play', () => { showPoster = false; paintVideo(); });
    cine.addEventListener('pause', () => {
      if (useVideoFrames) cine.cancelVideoFrameCallback(frameRequest);
      else cancelAnimationFrame(frameRequest);
    });
    cine.addEventListener('seeked', () => { showPoster = false; drawPlanes(); });
    cine.addEventListener('loadeddata', () => { if (!showPoster) drawPlanes(); });
    cine.addEventListener('emptied', loadPoster);
    loadPoster();
  }
  const duration = () => Number.isFinite(cine.duration) ? cine.duration : 8;
  const syncPlayback = () => {
    const playing = !cine.paused;
    playButton.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} synthetic CT video`);
    playButton.querySelector('i').className = `bi bi-${playing ? 'pause' : 'play'}-fill`;
    document.querySelector('.v-time').textContent = `${clock(cine.currentTime)} / ${clock(duration())}`;
    timeline.max = duration();
    timeline.value = cine.currentTime;
    timeline.setAttribute('aria-valuetext', `${cine.currentTime.toFixed(1)} seconds of ${duration().toFixed(1)} seconds`);
  };
  cine.controls = false;
  document.querySelector('.v-player-controls').hidden = false;
  playButton.addEventListener('click', async () => {
    if (!cine.paused) return cine.pause();
    try {
      await cine.play();
      videoStatus.textContent = '';
    } catch {
      videoStatus.textContent = 'The video could not play. Select another example or try again.';
    }
  });
  ['play', 'pause', 'timeupdate', 'loadedmetadata', 'emptied', 'ended'].forEach((event) => cine.addEventListener(event, syncPlayback));
  cine.addEventListener('error', () => { videoStatus.textContent = 'This video could not load. Select another example or try again.'; });
  timeline.addEventListener('input', () => { if (cine.readyState) cine.currentTime = Number(timeline.value); });
  muteButton.addEventListener('click', () => {
    cine.muted = !cine.muted;
    muteButton.setAttribute('aria-label', cine.muted ? 'Unmute video' : 'Mute video');
    muteButton.querySelector('i').className = `bi bi-volume-${cine.muted ? 'mute' : 'up'}`;
  });
  const fullscreen = document.querySelector('.v-video-fullscreen');
  fullscreen.hidden = !player.requestFullscreen;
  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement === player) await document.exitFullscreen();
      else await player.requestFullscreen();
    } catch { videoStatus.textContent = 'Fullscreen is unavailable in this browser.'; }
  });
  document.addEventListener('fullscreenchange', () => {
    fullscreen.setAttribute('aria-label', document.fullscreenElement === player ? 'Exit video fullscreen' : 'View video fullscreen');
  });
  document.querySelectorAll('[data-cine]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-pressed') === 'true') return;
      const example = button.dataset.cine;
      cine.pause();
      cine.poster = `assets/${example}.jpg`;
      cine.querySelector('source').src = `assets/${example}.mp4`;
      cine.querySelector('a').href = `assets/${example}.mp4`;
      cine.setAttribute('aria-label', `Synthetic ${button.getAttribute('aria-label')}, scrolling through axial, coronal and sagittal views`);
      cine.load();
      videoStatus.textContent = '';
      document.querySelectorAll('[data-cine]').forEach((choice) => choice.setAttribute('aria-pressed', String(choice === button)));
    });
  });
  // Media does not keep playing after the reader leaves the opening section.
  new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) cine.pause(); }).observe(player);
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
