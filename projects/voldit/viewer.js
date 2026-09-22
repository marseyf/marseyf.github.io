// The renderer and synthetic volumes are fetched only after an explicit click.
const root = document.getElementById('voldit-viewer');

if (root) {
  const loadButton = root.querySelector('.volume-load-button');
  const status = root.querySelector('.volume-status');
  const stage = root.querySelector('.volume-viewer-stage');
  // These synthetic exports are clipped at 300 HU; windowing does not imply
  // that higher-density values can be recovered from the browser examples.
  const defaultPresets = { lung: [-1000, 300], tissue: [-160, 240], bone: [0, 300] };
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
        <div class="volume-fields">
          <label class="volume-field">Volume<select class="volume-sample" aria-label="Synthetic volume sample"></select></label>
          <label class="volume-field">Window<select class="volume-preset" aria-label="CT window"><option value="lung">Lung</option><option value="tissue">Soft tissue</option><option value="bone" selected>Bone</option></select></label>
        </div>
        <div class="volume-modes" role="group" aria-label="Volume view">
          <button type="button" data-mode="render" aria-pressed="true">3D</button>
          <button type="button" data-mode="slices" aria-pressed="false">Slices</button>
          <button type="button" data-mode="combined" aria-pressed="false">Combined</button>
        </div>
      </div>
      <div class="volume-canvas-wrap">
        <canvas class="volume-canvas" tabindex="0" aria-label="Interactive synthetic CT volume" aria-describedby="volume-help volume-keyboard-help">Your browser cannot display the interactive volume. The videos above remain available.</canvas>
      </div>
      <div class="volume-controls">
        <label class="volume-cutaway"><span>Cutaway</span><input type="range" min="0" max="100" step="1" value="0" aria-label="3D cutaway depth" aria-valuetext="Whole volume"><output>0%</output></label>
        <button type="button" class="volume-reset" aria-label="Reset view"><i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Reset</button>
      </div>
      <div class="volume-footer"><p class="volume-help" id="volume-help"></p><p class="volume-metadata"></p></div>
      <span class="visually-hidden" id="volume-keyboard-help">In 3D, use arrow keys to rotate. Plus and minus zoom. In slice views, Page Up and Page Down move the axial plane.</span>`;
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
    nv.setRenderAzimuthElevation(150, 15);
    nv.setScale(1);
    nv.setPan2Dxyzmm([0, 0, 0, 1]);
    nv.scene.crosshairPos = [.5, .5, .5];
    query('.volume-cutaway input').value = 0;
    query('.volume-preset').value = currentVolume?.defaultPreset || 'bone';
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
        volumeCache.set(id, buffer);
      }
      if (token !== generation) return;
      // Passing the fetched buffer avoids an unabortable second request inside NiiVue.
      const presets = entry.presets || defaultPresets;
      const [minimum, maximum] = presets[entry.defaultPreset || 'bone'];
      await nv.loadVolumes([{ url: buffer, name: `${entry.id}.nii.gz`, colormap: 'gray', cal_min: minimum, cal_max: maximum }]);
      if (token !== generation) return;
      if (!nv.volumes.length) throw new Error('Volume did not load');
      // Keep the standard ray caster to avoid the extra GPU refresh required
      // by optional gradient illumination, especially on constrained devices.
      currentVolume = entry;
      const windowSelect = query('.volume-preset');
      windowSelect.replaceChildren();
      const labels = { lung: 'Lung', cta: 'Angiography', tissue: 'Soft tissue', bone: 'Bone' };
      for (const name of Object.keys(presets)) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = labels[name] || name;
        windowSelect.append(option);
      }
      query('.volume-sample').value = id;
      query('.volume-canvas').setAttribute('aria-label', `Interactive synthetic CT volume: ${entry.label}`);
      const dimensions = entry.dimensions.join(' × ');
      query('.volume-metadata').textContent = `${dimensions} · Synthetic CT`;
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
        backColor: [16 / 255, 29 / 255, 36 / 255, 1],
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
        logLevel: 'error'
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
