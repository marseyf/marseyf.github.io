# CardioDiT project page: sources and media

## Scientific content

- Paper: https://arxiv.org/abs/2603.25194 (v1, 26 March 2026).
- Framework: existing `assets/paper-figures/cardiodit-figure-1-framework.jpg`, Figure 1 from the paper.
- Public-dataset comparison: Table 1, public dataset block. The page reports FID, precision and recall for the three generated-data models, with the sample count and feature extractor. It does not recompute these results or present development samples as paper benchmarks.
- Public implementation: https://github.com/Cardio-AI/cardiodit. Its README describes the two-stage pipeline; pretrained weights were listed as forthcoming when this page was built.
- Layout inspiration: https://pfriedri.github.io/wdm-3d-io/. No template, prose, or assets were copied from that page.

## Original synthetic examples

`public-example-1` through `public-example-3` derive from `sample_0_0.nii.gz`, `sample_1_0.nii.gz`, and `sample_2_0.nii.gz` in the user-supplied `4D_DiT/samples_final/CardioDiT/public_l4` evaluation collection. These are the first three numbered synthetic samples, not a quality-ranked selection. No real patient scans are included.

Each source volume is H×W×D×T = 256×256×6×32. The videos show slices 2, 4, and 6 (one-based), with all 32 frames synchronized at 8 fps for display. Intensities are windowed once per volume using its 1st and 99.5th percentiles, held constant across slices and frames. In-plane arrays are transposed for display; no anatomical orientation or physiological timing is inferred. The exact historical checkpoint is not recorded in this collection.

`tools/export-cardiodit-media.py` performs the numerical rendering and video encoding. It requires NumPy, nibabel, Pillow, and FFmpeg only when regenerating media; normal Quarto builds need none of these dependencies. Pass `--source-dir`, `--development-gif`, and `--output-dir projects/cardiodit/assets`. The source files remain outside the website repository.

## Subsequent development

The user-supplied `CardioDiT_MNM2_evolution_20260616` checkout was reviewed read-only:

- `Plan.md` and `src/models/dit.py` support the implementation of axis-aware RoPE4D and variable patch-divisible shapes.
- `src/scripts/encode_latents.py` supports native temporal lengths.
- `configs/dit/fixed/F07_flow_matching_rope4d_selfcond.yaml` and actual generated samples establish flow matching and self-conditioning experiments.
- `outputs/cardiodit_middle_slice_gifs/F07_examples/README.md` identifies the canonical 300,000-update checkpoint examples.
- The exported development clip is `F07_last_checkpoint_sample_000_quantized_middle_slice.gif`, converted to MP4 without frame interpolation. It shows central slice index 6 of a 12×224×224×32 synthetic volume at 8 fps.
- The matching archived `sample_metadata.json` records EMA weights, 100 sampling steps, RoPE4D, self-conditioning, and `variable_shape: false`. Thus this example is explicitly described as fixed-shape even though the development code also supports variable-shape experiments.

No comparative improvement is claimed for this development example. It is clearly separated from the preprint results. Per-asset source filenames, SHA-256 hashes, and display parameters are recorded in `projects/cardiodit/assets/provenance.json`; research-machine paths and patient metadata are not included in the public assets.
