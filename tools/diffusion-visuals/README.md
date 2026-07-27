# Diffusion visuals

Offline Remotion source for the lead figure and animation in the medical
diffusion explainer. The public site consumes only the rendered PNG and MP4.

The clean endpoint uses an unmodified crop from a real CC0 axial head CT. Noise
states use a fixed, seeded Gaussian field and the normalized cosine schedule
described in the post. The reverse segment replays the path for illustration; it
is explicitly not presented as output from a trained model.

```bash
npm install
npm run lint
npm run render:figure
npm run render:video
```

Source CT: Mikael Häggström, M.D., via Wikimedia Commons, CC0 1.0.

The visual backdrop at `public/diffusion-editorial-backdrop.png` was generated
with the built-in GPT Image 2 workflow. It intentionally contains no generated
medical image; the Remotion composition overlays the cited CT and calculated
noise states.
