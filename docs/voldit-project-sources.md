# VolDiT project page: sources and media

## Scientific content

MICCAI 2026 acceptance was confirmed by Marvin. Paper links and citation retain the available arXiv version until proceedings details are supplied.

- Paper: https://arxiv.org/abs/2603.25181 (v1, 26 March 2026).
- Framework: existing `assets/paper-figures/voldit-figure-1-framework.jpg`, Figure 1.
- Table 1 supplies the two unconditional comparisons, each with 100 generated volumes. LUNA16 uses MedicalNet 3D features; TaviCT uses ImageNet features and 2.5D FID averaged over three axes. Absolute FID scales are not comparable between datasets. No metrics were recomputed for this page.
- Table 3 supplies the learned-gate heart/aorta Dice and U-Net comparison.
- Official implementation: https://github.com/Cardio-AI/voldit; public weights: https://huggingface.co/AICM-HD/voldit.

## Synthetic examples

The first two numbered generated lung volumes, `sample_0_0.nii.gz` and `sample_1_0.nii.gz`, come from `Miccai26_DIT/sd/samples_final/luna_xl4`. The two generated cardiac volumes use the same filenames in `sd/samples_final/tavi_l2`. No patient scans, reconstructions, or conditioning masks are published. Selection is by filename, not visual quality. Marvin explicitly authorized adding TAVI-CT showcases.

The original sampler (`/mnt/sds/sd20i001/marvin/code/diffusion_transformer/src/python/testing/sample.py`, lines 109–111 and 149–156) records a synthetic LPS affine with 0.7 × 0.7 × 1.25 mm spacing and maps decoded values using `(x+1)*750-1200`. Both source files are int16, 512 × 512 × 256, with actual values −1200…300 HU and empty descriptive metadata. This matches the paper's LUNA16 clipping; the current public README's generic −1000…1000 preprocessing must not be applied to these historical exports.

The surviving sampler is configured for another run. No per-sample checkpoint hash was found. The historical `dit_ds8_xl4.yaml` describes 28 layers, whereas `dit_ds8_l4.yaml` has 24; therefore the displayed examples are identified as VolDiT LUNA16 examples, not as the exact model row in the paper's table.

`tools/export-voldit-media.py` performs a 2 × 2 × 2 block average to 256 × 256 × 128, rounds to int16 HU, and preserves each block's physical center. It writes a fresh NIfTI header, with no source identifiers or extensions. The full field of view remains. `assets/provenance.json` stores source and export hashes, affines and transformations, without machine paths.

Videos sweep 96 positions through the central 80% of each axis at 12 fps. Axial, coronal and sagittal panes use the synthetic export orientation and a fixed −1000…300 HU window. Voxel spacing determines display proportions. The synthetic affine represents the generation grid, not patient coordinates.

Regeneration requires NumPy, nibabel, Pillow and FFmpeg, but standard builds use committed assets only:

```sh
python tools/export-voldit-media.py --source-dir /path/to/sd/samples_final/luna_xl4 --output-dir projects/voldit/assets
```

## Interactive renderer

The TAVI-CT exports retain their native 192 × 192 × 192 grid and LPS affine with unit spacing. Their historical sampler maps decoded values to −1000…2000 HU, verified against both files; this differs from the paper's described preprocessing and is preserved without remapping. Videos use a fixed −200…1200 HU window. The exact generating checkpoint is unavailable, so these are illustrative outputs from the evaluation archive, not presented as a particular benchmark checkpoint. `tools/export-voldit-tavi.py` records hashes, geometry, display settings and provenance in `assets/tavi-provenance.json`. Both export scripts preserve the other dataset's entries in `assets/volumes.json`.

NiiVue 0.69.0 is vendored from the official npm release, verified against its registry SHA-512 integrity. The BSD-2-Clause license is included. The browser requests the renderer and one NIfTI volume only after an explicit Load action. No remote renderer service, uploaded data, analytics, or CDN dependency is involved. Sample switching retains downloaded buffers for reuse.

The viewer offers actual volumetric ray casting, orthogonal slices, combined view, rotation, zoom, cutaway and dataset-specific CT windows. Cutaway traverses the full normalized volume from +0.5 to −0.5, with 0% disabling clipping and 100% passing the far boundary. A compact toolbar and direct mouse/touch controls replace the navigation disclosure; keyboard rotation, zoom and axial stepping remain available on the focused canvas. Windowing cannot recover intensities clipped in the original generation export. It falls back to the videos if WebGL2 or loading fails.

## VolDiT v2 development

Read-only review of `/mnt/ssd/code/VolDiT_v2` verified these implemented experiment directions:

- Flow matching: `src/models/flow_matching_scheduler.py` (interpolation/velocity and Euler integration), `src/scripts/train_dit.py`, `src/scripts/sample_dit.py`.
- Spacing-aware positional embeddings: `src/models/dit.py:97` and `configs/transformer/test_configs/flow_matching/02_aniso_pos_embed.yaml`. This is configured axis spacing, not verified arbitrary-resolution support or RoPE.
- Channel-wise latent normalization: `src/training/dit_trainer.py:99,435,522` and inverse scaling in the sampler. Training schedules: `src/scripts/train_dit.py:193`.

No improved generation metric was established from the local evaluation evidence. Self-conditioning training code exists, but the audited sampler lacks iterative feedback, so it is not advertised as a verified inference feature. Speculative gains in planning files are excluded. None of the displayed media are presented as v2 outputs.
