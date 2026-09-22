// The renderer and synthetic volumes are fetched only after an explicit click.
const root = document.getElementById('cardiodit-viewer');

if (root) {
  const loadButton = root.querySelector('.volume-load-button');
  const status = root.querySelector('.volume-status');
  const stage = root.querySelector('.volume-viewer-stage');
  // MRI intensities are fixed display values, not CT Hounsfield units.
  const defaultPresets = { balanced: [0, 255], detail: [25, 220] };
  let nv;
  let manifest;
  let busy = false;
  let generation = 0;
  let request;
  let mode = 'render';
  let currentVolume;
  let playing = false;
  let playbackRequest;
  let lastFrameTime = 0;
  const volumeCache = new Map();
  const query = (selector) => stage.querySelector(selector);

  function setBusy(value) {
    if (value) pausePlayback();
    busy = value;
    root.setAttribute('aria-busy', String(value));
    loadButton.disabled = value;
    stage.querySelectorAll('button, select, input').forEach((control) => {
      control.disabled = value;
    });
    stage.classList.toggle('is-loading', value);
    if (!value && nv) updateModeControls();
  }

  function dispose() {
    pausePlayback();
    generation += 1;
    request?.abort();
    nv?.cleanup();
    nv = undefined;
  }

  function fail(message) {
    dispose();
    stage.hidden = true;
    loadButton.hidden = false;
    loadButton.textContent = 'Try loading again';
    status.textContent = message;
    root.classList.remove('is-ready');
    setBusy(false);
  }

  async function fetchAsset(url, format) {
    request?.abort();
    request = new AbortController();
    const timeout = window.setTimeout(() => request?.abort(), 45000);
    try {
      const response = await fetch(url, { signal: request.signal });
      if (!response.ok) throw new Error(`Asset request failed: ${response.status}`);
      return await response[format]();
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function readManifest() {
    const manifestURL = new URL(root.dataset.manifest || 'assets/volumes.json', document.baseURI);
    const data = await fetchAsset(manifestURL, 'json');
    const entries = Array.isArray(data) ? data : data.volumes;
    if (!Array.isArray(entries) || !entries.length) throw new Error('No volumes available');
    return entries.map((entry) => {
      // Prefer paths relative to the manifest; accept page-relative assets/ paths too.
      const url = new URL(entry.url, entry.url.startsWith('assets/') ? document.baseURI : manifestURL);
      if (url.origin !== location.origin || !url.pathname.endsWith('.nii.gz')) {
        throw new Error('Unsupported volume URL');
      }
      if (!entry.id || !entry.label || !Array.isArray(entry.dimensions) || !Number.isInteger(entry.frames) || entry.frames < 2) {
        throw new Error('Incomplete volume metadata');
      }
      return { ...entry, url: url.href };
    });
  }

  function buildControls() {
    stage.innerHTML = `
      <div class="volume-toolbar">
        <div class="volume-fields">
          <label class="volume-field">Volume<select class="volume-sample" aria-label="Synthetic volume sample"></select></label>
          <label class="volume-field">Contrast<select class="volume-preset" aria-label="MRI contrast"><option value="balanced">Balanced</option><option value="detail">Detail</option></select></label>
        </div>
        <div class="volume-modes" role="group" aria-label="Volume view">
          <button type="button" data-mode="render" aria-pressed="true">3D</button>
          <button type="button" data-mode="slices" aria-pressed="false">Slices</button>
          <button type="button" data-mode="combined" aria-pressed="false">Combined</button>
        </div>
      </div>
      <div class="volume-canvas-wrap">
        <canvas class="volume-canvas" tabindex="0" aria-label="Interactive synthetic 4D MRI volume" aria-describedby="volume-help volume-keyboard-help">Your browser cannot display the interactive volume. The videos above remain available.</canvas>
        <button type="button" class="volume-fullscreen" aria-label="View volume fullscreen"><i class="bi bi-fullscreen" aria-hidden="true"></i></button>
      </div>
      <div class="volume-playback">
        <button type="button" class="volume-play" aria-label="Play cardiac motion" aria-pressed="false"><i class="bi bi-play-fill" aria-hidden="true"></i></button>
        <label class="volume-frame-control"><span>Frame</span><output aria-live="off">01 / 32</output><input class="volume-frame" type="range" min="0" max="31" step="1" value="0" aria-label="Cardiac motion frame" aria-valuetext="Frame 1 of 32"></label>
        <select class="volume-speed" aria-label="Playback speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select>
      </div>
      <div class="volume-controls">
        <label class="volume-cutaway"><span>Cutaway</span><span class="volume-range"><input type="range" min="0" max="100" step="1" value="0" aria-label="3D cutaway depth" aria-valuetext="Whole volume"><span class="volume-range-endpoints" aria-hidden="true"><span>Full volume</span><span>Fully cut</span></span></span><output>0%</output></label>
        <button type="button" class="volume-reset" aria-label="Reset view"><i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Reset</button>
      </div>
      <div class="volume-footer"><p class="volume-help" id="volume-help"></p><p class="volume-metadata"></p></div>
      <span class="visually-hidden" id="volume-keyboard-help">In 3D, use arrow keys to rotate. Plus and minus zoom. In slice views, Page Up and Page Down move through depth.</span>`;
    for (const entry of manifest) {
      const option = document.createElement('option');
      option.value = entry.id;
      option.textContent = entry.label;
      query('.volume-sample').append(option);
    }
    query('.volume-sample').addEventListener('change', (event) => loadSample(event.target.value));
    query('.volume-preset').addEventListener('change', applyPreset);
    query('.volume-play').addEventListener('click', () => playing ? pausePlayback() : playSequence());
    query('.volume-frame').addEventListener('input', (event) => {
      pausePlayback();
      setFrame(Number(event.target.value));
    });
    query('.volume-speed').addEventListener('change', () => { lastFrameTime = performance.now(); });
    stage.querySelectorAll('[data-mode]').forEach((button) => {
      button.addEventListener('click', () => { mode = button.dataset.mode; applyMode(); });
    });
    query('.volume-cutaway input').addEventListener('input', applyCutaway);
    query('.volume-reset').addEventListener('click', resetView);
    const fullscreen = query('.volume-fullscreen');
    fullscreen.hidden = !stage.requestFullscreen;
    fullscreen.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement === stage) await document.exitFullscreen();
        else await stage.requestFullscreen();
      } catch { status.textContent = 'Fullscreen is unavailable in this browser.'; }
    });
    query('.volume-canvas').addEventListener('keydown', (event) => {
      const rotation = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, 10], ArrowDown: [0, -10] }[event.key];
      const handled = (rotation && mode !== 'slices') || ['+', '=', '-', '_'].includes(event.key)
        || (mode !== 'render' && ['PageUp', 'PageDown'].includes(event.key));
      if (!handled) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!nv || busy) return;
      if (rotation && mode !== 'slices') {
        event.preventDefault();
        nv.setRenderAzimuthElevation(nv.scene.renderAzimuth + rotation[0], Math.max(-89, Math.min(89, nv.scene.renderElevation + rotation[1])));
      } else if (['+', '=', '-', '_'].includes(event.key)) {
        event.preventDefault();
        const factor = ['+', '='].includes(event.key) ? 1.1 : 1 / 1.1;
        nv.setScale(Math.max(.4, Math.min(4, nv.scene.volScaleMultiplier * factor)));
        const pan = [...nv.scene.pan2Dxyzmm];
        pan[3] = Math.max(.4, Math.min(4, pan[3] * factor));
        nv.setPan2Dxyzmm(pan);
      } else if (mode !== 'render' && ['PageUp', 'PageDown'].includes(event.key)) {
        event.preventDefault();
        const position = [...nv.scene.crosshairPos];
        position[2] = Math.max(0, Math.min(1, position[2] + (event.key === 'PageUp' ? .02 : -.02)));
        nv.scene.crosshairPos = position;
        nv.drawScene();
      }
    });
  }

  function updateModeControls() {
    stage.querySelectorAll('[data-mode]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    });
    query('.volume-cutaway').hidden = mode === 'slices';
    query('.volume-help').textContent = mode === 'render'
      ? 'Drag to rotate · Focus and scroll to zoom'
      : 'Click to position · Focus and scroll through slices';
  }

  function applyMode() {
    nv.opts.multiplanarShowRender = mode === 'combined' ? 1 : 0;
    nv.setMultiplanarLayout(mode === 'combined' ? 2 : 0);
    nv.setSliceType(mode === 'render' ? nv.sliceTypeRender : nv.sliceTypeMultiplanar);
    updateModeControls();
  }

  function applyPreset() {
    if (!nv?.volumes.length) return;
    const presets = currentVolume?.presets || defaultPresets;
    const [minimum, maximum] = presets[query('.volume-preset').value];
    if (nv.volumes[0].cal_min === minimum && nv.volumes[0].cal_max === maximum) return;
    nv.volumes[0].cal_min = minimum;
    nv.volumes[0].cal_max = maximum;
    nv.updateGLVolume();
  }

  function applyCutaway() {
    const value = Number(query('.volume-cutaway input').value);
    const text = value === 0 ? 'Whole volume' : value === 100 ? 'Fully cut through' : `${value}% through volume`;
    query('.volume-cutaway output').textContent = `${value}%`;
    query('.volume-cutaway input').setAttribute('aria-valuetext', text);
    // Traverse the complete normalized cube: +0.5 at the front, 0 at its
    // centre, -0.5 at the back. Slightly pass the far face to remove its edge.
    // Keep the plane fixed in anatomical coordinates while rotating the view.
    nv.setClipPlane([value === 0 ? 2 : value === 100 ? -.501 : .5 - value / 100, 180, 0]);
  }

  function resetView() {
    pausePlayback();
    setFrame(0);
    nv.setRenderAzimuthElevation(150, 35);
    nv.setScale(1.35);
    nv.setPan2Dxyzmm([0, 0, 0, 1]);
    nv.scene.crosshairPos = [.5, .5, .5];
    query('.volume-cutaway input').value = 0;
    query('.volume-preset').value = currentVolume?.defaultPreset || 'balanced';
    applyPreset();
    applyCutaway();
    nv.drawScene();
  }

  async function loadSample(id) {
    if (busy) return;
    const entry = manifest.find((volume) => volume.id === id);
    if (!entry) return;
    const token = ++generation;
    setBusy(true);
    status.textContent = `Loading ${entry.label.toLowerCase()}…`;
    try {
      let buffer = volumeCache.get(id);
      if (!buffer) {
        buffer = await fetchAsset(entry.url, 'arrayBuffer');
        if (volumeCache.size >= 2) volumeCache.delete(volumeCache.keys().next().value);
        volumeCache.set(id, buffer);
      }
      if (token !== generation) return;
      // Passing the fetched buffer avoids an unabortable second request inside NiiVue.
      const presets = entry.presets || defaultPresets;
      const [minimum, maximum] = presets[entry.defaultPreset || 'balanced'];
      await nv.loadVolumes([{ url: buffer, name: `${entry.id}.nii.gz`, colormap: 'gray', cal_min: minimum, cal_max: maximum }]);
      if (token !== generation) return;
      if (!nv.volumes.length || nv.volumes[0].nFrame4D !== entry.frames) throw new Error('The full 4D sequence did not load');
      // Keep the standard ray caster to avoid the extra GPU refresh required
      // by optional gradient illumination, especially on constrained devices.
      currentVolume = entry;
      const windowSelect = query('.volume-preset');
      windowSelect.replaceChildren();
      const labels = { balanced: 'Balanced', detail: 'Detail' };
      for (const name of Object.keys(presets)) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = labels[name] || name;
        windowSelect.append(option);
      }
      query('.volume-sample').value = id;
      query('.volume-canvas').setAttribute('aria-label', `Interactive synthetic 4D MRI volume: ${entry.label}`);
      const dimensions = entry.dimensions.join(' × ');
      query('.volume-metadata').textContent = `Synthetic cine MRI · ${dimensions} · ${entry.frames} frames`;
      query('.volume-frame').max = entry.frames - 1;
      resetView();
      applyMode();
      status.textContent = `${entry.label} ready. All ${entry.frames} frames loaded.`;
      root.classList.add('is-ready');
      loadButton.hidden = true;
      setBusy(false);
    } catch (error) {
      if (token !== generation) return;
      console.error('CardioDiT volume load failed:', error);
      fail('The interactive sequence could not be loaded. Please try again; the videos above remain available.');
    }
  }


  function syncFrame() {
    if (!nv?.volumes.length || !currentVolume) return;
    const frame = nv.getFrame4D(nv.volumes[0].id);
    query('.volume-frame').value = frame;
    query('.volume-frame').setAttribute('aria-valuetext', `Frame ${frame + 1} of ${currentVolume.frames}`);
    query('.volume-frame-control output').textContent = `${String(frame + 1).padStart(2, '0')} / ${currentVolume.frames}`;
  }

  function setFrame(frame) {
    if (!nv?.volumes.length || !currentVolume) return;
    nv.setFrame4D(nv.volumes[0].id, Math.max(0, Math.min(currentVolume.frames - 1, Math.round(frame))));
    syncFrame();
  }

  function pausePlayback() {
    playing = false;
    cancelAnimationFrame(playbackRequest);
    const button = query('.volume-play');
    if (!button) return;
    button.setAttribute('aria-label', 'Play cardiac motion');
    button.setAttribute('aria-pressed', 'false');
    button.querySelector('i').className = 'bi bi-play-fill';
  }

  function playSequence() {
    if (!nv?.volumes.length || busy || playing) return;
    playing = true;
    const button = query('.volume-play');
    button.setAttribute('aria-label', 'Pause cardiac motion');
    button.setAttribute('aria-pressed', 'true');
    button.querySelector('i').className = 'bi bi-pause-fill';
    lastFrameTime = performance.now();
    function tick(now) {
      if (!playing || busy || !nv?.volumes.length) return;
      const interval = 1000 / (currentVolume.displayFps * Number(query('.volume-speed').value));
      if (now - lastFrameTime >= interval) {
        // Preserve every source frame. Slow devices play more slowly rather than skipping anatomy.
        setFrame((nv.getFrame4D(nv.volumes[0].id) + 1) % currentVolume.frames);
        lastFrameTime = now;
      }
      playbackRequest = requestAnimationFrame(tick);
    }
    playbackRequest = requestAnimationFrame(tick);
  }

  new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) pausePlayback(); }).observe(root);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pausePlayback(); });
  window.addEventListener('pagehide', (event) => {
    pausePlayback();
    // Keep a paused viewer usable when Back restores this page from the browser cache.
    if (!event.persisted) dispose();
  });

  loadButton.addEventListener('click', async () => {
    if (busy) return;
    dispose();
    const token = generation;
    setBusy(true);
    status.textContent = 'Preparing the interactive viewer…';
    try {
      manifest ||= await readManifest();
      if (token !== generation) return;
      buildControls();
      setBusy(true);
      stage.hidden = false;
      const canvas = query('.volume-canvas');
      if (!canvas.getContext('webgl2', { antialias: true })) {
        fail('This browser does not support the 4D viewer. You can still explore the volumes in the videos above.');
        return;
      }
      const { Niivue } = await import('../../assets/vendor/niivue/niivue-0.69.0.js');
      if (token !== generation) return;
      nv = new Niivue({
        backColor: [16 / 255, 29 / 255, 36 / 255, 1],
        fontColor: [.8, .88, .9, 1],
        crosshairColor: [.35, .8, .88, .8],
        clipPlaneColor: [1, 1, 1, 0],
        isOrientCube: false,
        isOrientationTextVisible: false,
        forceDevicePixelRatio: 1,
        isColorbar: false,
        isRadiologicalConvention: false,
        dragAndDropEnabled: false,
        scrollRequiresFocus: true,
        clipPlaneHotKey: '',
        cycleClipPlaneHotKey: '',
        viewModeHotKey: '',
        logLevel: 'error'
      });
      canvas.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        fail('The 4D viewer lost its graphics connection. Try loading it again, or use the videos above.');
      }, { once: true });
      nv.onFrameChange = syncFrame;
      await nv.attachToCanvas(canvas, true);
      if (token !== generation) return;
      setBusy(false);
      await loadSample(currentVolume?.id || manifest[0].id);
      if (nv && root.classList.contains('is-ready') && query('.volume-canvas') === canvas) {
        canvas.focus({ preventScroll: true });
      }
    } catch (error) {
      if (token !== generation) return;
      console.error('CardioDiT viewer initialization failed:', error);
      fail('The interactive viewer is unavailable in this browser right now. Try again, or use the videos above.');
    }
  });
}

document.addEventListener('fullscreenchange', () => {
  const button = document.querySelector('.volume-fullscreen');
  if (button) button.setAttribute('aria-label', document.fullscreenElement?.classList.contains('volume-viewer-stage') ? 'Exit volume fullscreen' : 'View volume fullscreen');
});
