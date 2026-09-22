#!/usr/bin/env python3
"""Export the first two existing unconditional synthetic TAVI-CT examples.

Authoring only; requires numpy, nibabel, Pillow and ffmpeg. The source is the
final synthetic VolDiT evaluation collection, never patient images, masks or
reconstructions. This script performs no model inference.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile

import nibabel as nib
import numpy as np
from PIL import Image


SOURCE = Path('/mnt/sds/sd20i001/marvin/evaluation/Miccai26_DIT/sd/samples_final/tavi_l2')
WINDOW = (-200, 1200)


def sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(4 * 1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def panel(array):
    minimum, maximum = WINDOW
    pixels = (np.clip((array.astype(np.float32) - minimum) / (maximum - minimum), 0, 1) * 255).astype(np.uint8)
    return np.asarray(Image.fromarray(pixels).resize((256, 256), Image.Resampling.LANCZOS))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, default=SOURCE)
    parser.add_argument('--output-dir', type=Path, required=True)
    args = parser.parse_args()
    if args.source_dir.resolve() != SOURCE.resolve():
        raise ValueError('Source must be the verified final synthetic tavi_l2 collection.')
    args.output_dir.mkdir(parents=True, exist_ok=True)
    manifest, provenance = [], []
    for number in range(2):
        source = args.source_dir / f'sample_{number}_0.nii.gz'
        digest = hashlib.sha256()
        with tempfile.TemporaryDirectory(prefix='voldit-tavi-export-') as temporary:
            cached = Path(temporary) / source.name
            with source.open('rb') as incoming, cached.open('wb') as outgoing:
                for chunk in iter(lambda: incoming.read(4 * 1024 * 1024), b''):
                    digest.update(chunk)
                    outgoing.write(chunk)
            original = nib.load(cached)
            data = np.asanyarray(original.dataobj)
            if data.shape != (192, 192, 192) or data.dtype != np.dtype('int16'):
                raise ValueError(f'Unexpected source dimensions or type: {source.name}')
            if not np.allclose(original.affine, np.diag([-1., -1., 1., 1.])):
                raise ValueError(f'Unexpected source geometry: {source.name}')
            if data.min() < -1000 or data.max() > 2000:
                raise ValueError('Source does not match the original TAVI-CT HU export.')

            # Keep the complete 192^3 volume and its encoded coordinate system.
            # A fresh header prevents unrelated source metadata being published.
            output = nib.Nifti1Image(data, original.affine)
            output.header.set_xyzt_units('mm')
            output.header['cal_min'], output.header['cal_max'] = WINDOW
            output.set_qform(original.affine, code=1)
            output.set_sform(original.affine, code=1)
            stem = f'tavi-example-{number + 1}'
            volume_path = args.output_dir / f'{stem}.nii.gz'
            nib.save(output, volume_path)

            frames = []
            for position in np.linspace(.1, .9, 96):
                x, y, z = [round(position * (size - 1)) for size in data.shape]
                frame = np.zeros((256, 800), dtype=np.uint8)
                frame[:, :256] = panel(data[:, :, z].T)
                frame[:, 272:528] = panel(np.flipud(data[:, y, :].T))
                frame[:, 544:] = panel(np.flipud(data[x, :, :].T))
                frames.append(frame)
            Image.fromarray(frames[len(frames) // 2]).save(args.output_dir / f'{stem}.jpg', quality=92)
            subprocess.run([
                'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo',
                '-pixel_format', 'gray', '-video_size', '800x256', '-framerate', '12',
                '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-crf', '20', '-pix_fmt',
                'yuv420p', '-movflags', '+faststart', str(args.output_dir / f'{stem}.mp4')
            ], input=np.stack(frames).tobytes(), check=True)
            manifest.append(dict(
                id=f'tavi-{number + 1}', label=f'TAVI-CT {number + 1}',
                dataset='tavi', url=volume_path.name, dimensions=list(data.shape),
                spacing=[float(v) for v in output.header.get_zooms()],
                sizeBytes=volume_path.stat().st_size, calMin=WINDOW[0], calMax=WINDOW[1],
                presets=dict(cta=list(WINDOW), tissue=[-160, 240], bone=[150, 1500]),
                defaultPreset='cta'))
            provenance.append(dict(
                export=stem, source_collection='sd/samples_final/tavi_l2', source_file=source.name,
                source_sha256=digest.hexdigest(), source_dimensions=list(data.shape),
                source_dtype=str(data.dtype), source_affine=original.affine.tolist(),
                source_orientation=list(nib.aff2axcodes(original.affine)),
                source_hu_range=[int(data.min()), int(data.max())],
                export_dimensions=list(data.shape), export_affine=original.affine.tolist(),
                export_sha256=sha256(volume_path),
                transform='Original int16 HU voxels and geometry retained; fresh NIfTI header with millimeter units.',
                video='96 positions from 10% to 90% along each axis, 12 fps, 800x256, CTA display window [-200,1200] HU.',
                intensity_evidence='Original evaluation sampler maps TAVI decoded [-1,1] values to [-1000,2000] HU; source voxel bounds verified.',
                geometry_evidence='NIfTI affine encodes LPS at unit spacing; no patient-coordinate labels are burned into the videos.',
                provenance_limit='Final unconditional synthetic export collection tavi_l2; exact generating checkpoint is not recorded.',
                source_sampler='marvin/code/diffusion_transformer/src/python/testing/sample.py'))
            print(f'Exported {stem}: {data.shape}, {int(data.min())} to {int(data.max())} HU, {volume_path.stat().st_size / 1024**2:.1f} MiB', flush=True)
    (args.output_dir / 'tavi-volumes.json').write_text(json.dumps(dict(volumes=manifest), indent=2) + '\n')
    combined_path = args.output_dir / 'volumes.json'
    existing = json.loads(combined_path.read_text())['volumes'] if combined_path.exists() else []
    combined = [entry for entry in existing if not entry['id'].startswith('tavi-')] + manifest
    combined_path.write_text(json.dumps(dict(volumes=combined), indent=2) + '\n')
    (args.output_dir / 'tavi-provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')


if __name__ == '__main__':
    main()
