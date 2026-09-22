// The renderer and synthetic volumes are fetched only after an explicit click.
const root = document.getElementById('voldit-viewer');

if (root) {
  const loadButton = root.querySelector('.volume-load-button');
  const status = root.querySelector('.volume-status');
  const stage = root.querySelector('.volume-viewer-stage');
  // These synthetic exports are clipped at 300 HU; windowing does not imply
  // that higher-density values can be recovered from the browser examples.
  const presets = { lung: [-1000, 300], tissue: [-160, 240], bone: [0, 300] };
  let nv;
  let manifest;
  let busy = false;
  let generation = 0;
  let request;
  let mode = 'render';
  let currentVolume;
  const volumeCache = new Map();
  const query = (selector) => stage.querySelector(selector);

  function setBusy(value) {
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
      if (!entry.id || !entry.label || !Array.isArray(entry.dimensions)) {
        throw new Error('Incomplete volume metadata');
      }
      return { ...entry, url: url.href };
    });
  }

  function buildControls() {
    stage.innerHTML = `
      <div class="volume-toolbar">
        <label class="volume-field">Sample<select class="volume-sample" aria-label="Synthetic volume sample"></select></label>
        <label class="volume-field">CT window<select class="volume-preset" aria-label="CT window"><option value="lung">Lung</option><option value="tissue">Soft tissue</option><option value="bone" selected>Bone</option></select></label>
        <div class="volume-modes" role="group" aria-label="Volume view">
          <button type="button" data-mode="render" aria-pressed="true">3D</button>
          <button type="button" data-mode="slices" aria-pressed="false">Slices</button>
          <button type="button" data-mode="combined" aria-pressed="false">Slices + 3D</button>
        </div>
      </div>
      <div class="volume-canvas-wrap">
        <canvas class="volume-canvas" tabindex="0" aria-label="Interactive synthetic CT volume" aria-describedby="volume-help">Your browser cannot display the interactive volume. The videos above remain available.</canvas>
      </div>
      <div class="volume-controls">
        <label class="volume-cutaway">Cutaway<input type="range" min="0" max="100" step="1" value="0" aria-label="3D cutaway depth" aria-valuetext="Whole volume"><output>Whole volume</output></label>
        <button type="button" class="volume-reset">Reset view</button>
      </div>
      <p class="volume-help" id="volume-help">Drag to rotate. Focus the viewer and scroll to zoom, or use the navigation controls below.</p>
      <details class="volume-navigation">
        <summary>Navigation controls</summary>
        <div class="volume-navigation-content">
          <div class="volume-rotation" role="group" aria-label="Rotate volume">
            <button type="button" data-rotate="left" aria-label="Rotate volume left">← Left</button>
            <button type="button" data-rotate="right" aria-label="Rotate volume right">Right →</button>
            <button type="button" data-rotate="up" aria-label="Tilt volume up">↑ Up</button>
            <button type="button" data-rotate="down" aria-label="Tilt volume down">↓ Down</button>
          </div>
          <div class="volume-zoom" role="group" aria-label="Zoom volume">
            <button type="button" data-zoom="out" aria-label="Zoom out">− Zoom out</button>
            <button type="button" data-zoom="in" aria-label="Zoom in">+ Zoom in</button>
          </div>
          <div class="volume-slice-controls" hidden>
            <label>Axial<input type="range" min="0" max="100" value="50" data-axis="2" aria-label="Axial slice position"></label>
            <label>Coronal<input type="range" min="0" max="100" value="50" data-axis="1" aria-label="Coronal slice position"></label>
            <label>Sagittal<input type="range" min="0" max="100" value="50" data-axis="0" aria-label="Sagittal slice position"></label>
          </div>
        </div>
      </details>
      <p class="volume-metadata"></p>`;
    for (const entry of manifest) {
      const option = document.createElement('option');
      option.value = entry.id;
      option.textContent = entry.label;
      query('.volume-sample').append(option);
    }
    query('.volume-sample').addEventListener('change', (event) => loadSample(event.target.value));
    query('.volume-preset').addEventListener('change', applyPreset);
    stage.querySelectorAll('[data-mode]').forEach((button) => {
      button.addEventListener('click', () => { mode = button.dataset.mode; applyMode(); });
    });
    query('.volume-cutaway input').addEventListener('input', applyCutaway);
    query('.volume-reset').addEventListener('click', resetView);
    stage.querySelectorAll('[data-rotate]').forEach((button) => {
      button.addEventListener('click', () => {
        const { renderAzimuth: azimuth, renderElevation: elevation } = nv.scene;
        const [horizontal, vertical] = { left: [-15, 0], right: [15, 0], up: [0, 15], down: [0, -15] }[button.dataset.rotate];
        nv.setRenderAzimuthElevation(azimuth + horizontal, Math.max(-89, Math.min(89, elevation + vertical)));
      });
    });
    stage.querySelectorAll('[data-zoom]').forEach((button) => {
      button.addEventListener('click', () => {
        const factor = button.dataset.zoom === 'in' ? 1.15 : 1 / 1.15;
        nv.setScale(Math.max(.4, Math.min(4, nv.scene.volScaleMultiplier * factor)));
        const pan = [...nv.scene.pan2Dxyzmm];
        pan[3] = Math.max(.4, Math.min(4, pan[3] * factor));
        nv.setPan2Dxyzmm(pan);
      });
    });
    stage.querySelectorAll('[data-axis]').forEach((slider) => {
      slider.addEventListener('input', () => {
        const position = [...nv.scene.crosshairPos];
        position[Number(slider.dataset.axis)] = Number(slider.value) / 100;
        nv.scene.crosshairPos = position;
        nv.drawScene();
        updateSliceControls();
      });
    });
  }

  function updateSliceControls() {
    if (!nv) return;
    stage.querySelectorAll('[data-axis]').forEach((slider) => {
      const value = Math.round(nv.scene.crosshairPos[Number(slider.dataset.axis)] * 100);
      slider.value = value;
      slider.setAttribute('aria-valuetext', `${value}% through volume`);
    });
  }

  function updateModeControls() {
    const hasRender = mode !== 'slices';
    stage.querySelectorAll('[data-mode]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    });
    query('.volume-cutaway input').disabled = !hasRender || busy;
    stage.querySelectorAll('[data-rotate]').forEach((button) => { button.disabled = !hasRender || busy; });
    query('.volume-slice-controls').hidden = mode === 'render';
    query('.volume-help').textContent = mode === 'render'
      ? 'Drag to rotate. Focus the viewer and scroll to zoom, or use the navigation controls below.'
      : 'Click a slice to move the crosshairs. Focus the viewer and scroll through slices, or use the navigation controls below.';
  }

  function applyMode() {
    nv.opts.multiplanarShowRender = mode === 'combined' ? 1 : 0;
    nv.setMultiplanarLayout(mode === 'combined' ? 2 : 0);
    nv.setSliceType(mode === 'render' ? nv.sliceTypeRender : nv.sliceTypeMultiplanar);
    updateModeControls();
  }

  function applyPreset() {
    if (!nv?.volumes.length) return;
    const [minimum, maximum] = presets[query('.volume-preset').value];
    nv.volumes[0].cal_min = minimum;
    nv.volumes[0].cal_max = maximum;
    nv.updateGLVolume();
  }

  function applyCutaway() {
    const value = Number(query('.volume-cutaway input').value);
    const text = value === 0 ? 'Whole volume' : `${value}% to centre`;
    query('.volume-cutaway output').textContent = text;
    query('.volume-cutaway input').setAttribute('aria-valuetext', text);
    // This plane is axis-aligned in NiiVue's unit cube, so the front boundary
    // is 0.5 from its centre. A generic diagonal distance leaves most of the
    // slider outside the volume and appears unresponsive.
    // Remove the front half relative to the opening 150° camera view.
    // The cut remains anatomically fixed when the user rotates the volume.
    nv.setClipPlane([value === 0 ? 2 : .5 * (1 - value / 100), 180, 0]);
  }

  function resetView() {
    nv.setRenderAzimuthElevation(150, 15);
    nv.setScale(1);
    nv.setPan2Dxyzmm([0, 0, 0, 1]);
    nv.scene.crosshairPos = [.5, .5, .5];
    query('.volume-cutaway input').value = 0;
    query('.volume-preset').value = 'bone';
    applyPreset();
    applyCutaway();
    updateSliceControls();
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
        volumeCache.set(id, buffer);
      }
      if (token !== generation) return;
      // Passing the fetched buffer avoids an unabortable second request inside NiiVue.
      await nv.loadVolumes([{ url: buffer, name: `${entry.id}.nii.gz`, colormap: 'gray', cal_min: presets.bone[0], cal_max: presets.bone[1] }]);
      if (token !== generation) return;
      if (!nv.volumes.length) throw new Error('Volume did not load');
      await nv.setVolumeRenderIllumination(.4);
      if (token !== generation) return;
      currentVolume = entry;
      query('.volume-sample').value = id;
      query('.volume-canvas').setAttribute('aria-label', `Interactive synthetic CT volume: ${entry.label}`);
      const dimensions = entry.dimensions.join(' × ');
      const spacing = Array.isArray(entry.spacing) ? ` · ${entry.spacing.map((number) => Number(number.toFixed(2))).join(' × ')} mm voxels` : '';
      query('.volume-metadata').textContent = `${dimensions} voxels${spacing} · Synthetic sample`;
      resetView();
      applyMode();
      status.textContent = `${entry.label} ready.`;
      root.classList.add('is-ready');
      loadButton.hidden = true;
      setBusy(false);
    } catch (error) {
      if (token !== generation) return;
      console.error('VolDiT volume load failed:', error);
      fail('The interactive volume could not be loaded. Please try again; the videos above remain available.');
    }
  }

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
        fail('This browser does not support the 3D viewer. You can still explore the volumes in the videos above.');
        return;
      }
      const { Niivue } = await import('../../assets/vendor/niivue/niivue-0.69.0.js');
      if (token !== generation) return;
      nv = new Niivue({
        backColor: [.055, .09, .11, 1],
        fontColor: [.8, .88, .9, 1],
        crosshairColor: [.35, .8, .88, .8],
        clipPlaneColor: [1, 1, 1, 0],
        isOrientCube: true,
        isColorbar: false,
        isRadiologicalConvention: true,
        dragAndDropEnabled: false,
        scrollRequiresFocus: true,
        clipPlaneHotKey: '',
        cycleClipPlaneHotKey: '',
        viewModeHotKey: '',
        logLevel: 'error',
        onLocationChange: updateSliceControls
      });
      canvas.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        fail('The 3D viewer lost its graphics connection. Try loading it again, or use the videos above.');
      }, { once: true });
      await nv.attachToCanvas(canvas, true);
      if (token !== generation) return;
      setBusy(false);
      await loadSample(currentVolume?.id || manifest[0].id);
      if (nv && root.classList.contains('is-ready') && query('.volume-canvas') === canvas) {
        canvas.focus({ preventScroll: true });
      }
    } catch (error) {
      if (token !== generation) return;
      console.error('VolDiT viewer initialization failed:', error);
      fail('The interactive viewer is unavailable in this browser right now. Try again, or use the videos above.');
    }
  });
}
