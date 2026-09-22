const cine = document.getElementById('voldit-cine');
document.querySelectorAll('[data-cine]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!cine || button.getAttribute('aria-pressed') === 'true') return;
    const example = button.dataset.cine;
    cine.pause();
    cine.poster = `assets/lung-example-${example}.jpg`;
    cine.querySelector('source').src = `assets/lung-example-${example}.mp4`;
    cine.querySelector('a').href = `assets/lung-example-${example}.mp4`;
    cine.setAttribute('aria-label', `Synthetic VolDiT example ${example}, scrolling through axial, coronal and sagittal views`);
    cine.load();
    document.querySelectorAll('[data-cine]').forEach((choice) => {
      choice.setAttribute('aria-pressed', String(choice === button));
    });
  });
});
