# Authentic paper figure replacement map

This map identifies the original paper figures to use in place of the site's generated conceptual schematics. The three mappings below were checked against rendered PDF pages and the embedded image objects themselves. Use the complete figures as published: do not redraw, recolor, filter, or crop individual panels.

## Verified mapping

| Site subject | Exact source | Embedded asset | Recommended public filename |
|---|---|---|---|
| CardioDiT | `/root/Wiki/Wiki/raw/papers/cardiodit.pdf`, PDF page 3, Figure 1 | Page image `0`; native JPEG, 1358 × 930 px | `assets/paper-figures/cardiodit-figure-1-framework.jpg` |
| VolDiT | `/root/Wiki/Wiki/raw/papers/voldit.pdf`, PDF page 3, Figure 1 | Page image `0`; native JPEG, 1472 × 879 px | `assets/paper-figures/voldit-figure-1-framework.jpg` |
| WAD-Div | `/root/Wiki/Wiki/raw/papers/waddiv.pdf`, PDF page 4, Figure 2 | Page image `2` plus soft mask `3`; native 1615 × 1016 px | `assets/paper-figures/wad-div-figure-2-intrinsic-diversity.png` |

`pdfimages -list` numbers images from zero. When extraction is restricted to the target page as shown below, its output files use three-digit numbering (`-000`, `-002`, and so on).

## CardioDiT — Figure 1

- **Verified figure:** Figure 1, “CardioDiT framework for 4D CMR synthesis,” on PDF page 3.
- **Visual check:** This is the full framework overview. It shows latent-representation learning from depth-wise CMR slices, construction and diffusion of a 4D latent volume, a time-resolved cardiac volume, and the internal 4D Diffusion Transformer/DiT block. The embedded image includes the complete diagram but not the paper caption.
- **Exact extraction:** Preserve the embedded JPEG rather than rasterizing the page:

  ```sh
  pdfimages -f 3 -l 3 -j \
    /root/Wiki/Wiki/raw/papers/cardiodit.pdf /tmp/cardiodit
  # /tmp/cardiodit-000.jpg -> assets/paper-figures/cardiodit-figure-1-framework.jpg
  ```

- **Alt text:** `CardioDiT framework: CMR slices are encoded into a 4D latent volume, denoised by a 4D diffusion transformer, and decoded into a time-resolved cardiac volume.`
- **Suggested caption/provenance:** `Figure 1 — CardioDiT framework for 4D cardiac MRI synthesis. Source: Seyfarth et al., “CardioDiT: Latent Diffusion Transformers for 4D Cardiac MRI Synthesis” (2026).`
- **Paper link:** `https://arxiv.org/abs/2603.25194`
- **Legibility/cropping caution:** The native aspect ratio is 1.460:1 and the lower DiT inset has small labels. Render the full 1358 × 930 image with `height: auto`/`object-fit: contain`; never use `cover` or crop the left latent-learning panel or right DiT block. At card or mobile scale it works as an overview, but labels require a link to the full-resolution asset. Do not apply dark-mode inversion or color filters.

## VolDiT — Figure 1

- **Verified figure:** Figure 1, “Overview of the VolDiT framework,” on PDF page 3.
- **Visual check:** This is the full framework overview. It traces an input image through encoding/noising and 3D latent patch tokens into stacked DiT blocks, with timestep-gated spatial control injected through the control adapter. The embedded image includes the complete diagram but not the paper caption.
- **Exact extraction:** Preserve the embedded JPEG rather than rasterizing the page:

  ```sh
  pdfimages -f 3 -l 3 -j \
    /root/Wiki/Wiki/raw/papers/voldit.pdf /tmp/voldit
  # /tmp/voldit-000.jpg -> assets/paper-figures/voldit-figure-1-framework.jpg
  ```

- **Alt text:** `VolDiT architecture from input-image encoding to 3D latent patch tokens and stacked diffusion-transformer blocks, guided by a timestep-gated spatial-control adapter.`
- **Suggested caption/provenance:** `Figure 1 — VolDiT framework with timestep-gated spatial control. Source: Seyfarth et al., “VolDiT: Controllable Volumetric Medical Image Synthesis with Diffusion Transformers” (2026).`
- **Paper link:** `https://arxiv.org/abs/2603.25181`
- **Legibility/cropping caution:** The native aspect ratio is 1.675:1. The orange control paths, formulas, and adapter labels become difficult to read in a narrow card. Keep the complete 1472 × 879 canvas, provide a full-resolution link, and use `object-fit: contain`; do not isolate the transformer stack or remove the input/control branches. Do not apply dark-mode inversion or color filters.

## WAD-Div — Figure 2

- **Verified figure:** Figure 2, “Intrinsic dataset diversity via WAD-Div,” on PDF page 4. It is the second substantive figure on that page, below MS-SSIM Figure 1.
- **Visual check:** This is the complete four-panel result figure. Rows are Chest X-ray (top) and Lung CT (bottom); columns are raw WAD-Div (left) and normalized WAD-Div (right). Each plot tracks the number of unique samples for exponential reference distributions and the zero baseline. Raw scores rise as unique samples are added, while normalized scores approach one. The embedded image includes all four plots, row/column labels, axes, and legends, but not the paper caption.
- **Exact extraction:** Page 4 contains Figure 1 RGB (`000`), Figure 1 soft mask (`001`), Figure 2 RGB (`002`), and Figure 2 soft mask (`003`). Do not ship `002` alone: its black matte is removed by `003`. Combine them, then flatten onto white to reproduce the PDF appearance and keep black labels visible in dark mode.

  ```sh
  pdfimages -f 4 -l 4 -png \
    /root/Wiki/Wiki/raw/papers/waddiv.pdf /tmp/wad-div

  python3 - <<'PY'
  from PIL import Image

  rgb = Image.open('/tmp/wad-div-002.png').convert('RGB')
  alpha = Image.open('/tmp/wad-div-003.png').convert('L')
  rgb.putalpha(alpha)
  canvas = Image.new('RGBA', rgb.size, (255, 255, 255, 255))
  canvas.alpha_composite(rgb)
  canvas.convert('RGB').save(
      'assets/paper-figures/wad-div-figure-2-intrinsic-diversity.png',
      optimize=True,
  )
  PY
  ```

- **Alt text:** `Four WAD-Div plots for chest X-ray and lung CT show raw and normalized diversity scores increasing with the number of unique samples across exponential and zero reference distributions.`
- **Suggested caption/provenance:** `Figure 2 — Intrinsic dataset diversity measured with WAD-Div for chest X-ray and lung CT. Source: Seyfarth, Dar & Engelhardt, “Rethinking Diversity Metrics in Medical Imaging with Wasserstein Distance” (BVM Workshop 2026).`
- **Paper link:** `https://doi.org/10.1007/978-3-658-51100-5_83`
- **Legibility/cropping caution:** The native aspect ratio is 1.590:1 and axis/legend text is the smallest of the three figures. Preserve the full 1615 × 1016 canvas, including the outer row and column labels; do not crop to a single plot or trim the left margin. Display it on a white matte in both themes and provide a full-resolution link. A narrow thumbnail communicates only the trend, not the legend detail.

## Implementation guardrails

- The CardioDiT figure is the strongest authentic homepage hero anchor: it contains both cardiac imagery and the complete 4D method, but its relatively tall, dense composition must remain uncropped.
- Use the corresponding figure for each selected-work plate. WAD-Div Figure 2 is a result figure; CardioDiT and VolDiT Figure 1 are published framework figures. Remove “conceptual schematic—not a result” language rather than carrying it over to these authentic assets.
- Keep the original figure colors and a neutral/white image surface in both themes. Do not recolor paper figures to match site tokens.
- Captions should visibly include the figure number and source title, with the title linked to the existing paper/publication URL. The full-resolution image itself should also be reachable.
- This map establishes provenance, not a separate reuse licence. Do not add a Creative Commons or public-domain claim unless the publication record explicitly supplies one.

## Verification record

| Source PDF | SHA-256 |
|---|---|
| `cardiodit.pdf` | `524731a90a37cd7adb6bf159a32e6f6ea09f5c6ea89cd7667257e6ce014490b8` |
| `voldit.pdf` | `0e6ec31a1f30d94f3b7431fc82b6e630414c16016ada037f9eafee57d4719188` |
| `waddiv.pdf` | `a1d18938a6e7cfe88b261c49d0c8c199e1d751edb15a3fc8bce755d04ed1a842` |

Visual verification used 200 dpi renders of CardioDiT page 3, VolDiT page 3, and WAD-Div page 4, plus direct inspection of the extracted native assets. The WAD-Div RGB/soft-mask reconstruction was additionally checked on a white canvas against the rendered PDF page.
