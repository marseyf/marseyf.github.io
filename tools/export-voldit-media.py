#!/usr/bin/env python3
"""Export existing synthetic CT examples for the website (no model inference).

Authoring only: requires numpy, nibabel, Pillow and ffmpeg. The website serves
the committed exports. Never point this script at patient or reconstruction data.
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


def sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(4 * 1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def panel(array, width, height):
    pixels = (np.clip((array.astype(np.float32) + 1000) / 1300, 0, 1) * 255).astype(np.uint8)
    image = Image.fromarray(pixels).resize((width, height), Image.Resampling.LANCZOS)
    result = Image.new('L', (256, 256))
    result.paste(image, ((256 - width) // 2, (256 - height) // 2))
    return np.asarray(result)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, required=True)
    parser.add_argument('--output-dir', type=Path, required=True)
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    manifest, provenance = [], []
    for number in range(2):
        source = args.source_dir / f'sample_{number}_0.nii.gz'
        # One sequential read from the archive; decompression uses a local copy.
        digest = hashlib.sha256()
        with tempfile.TemporaryDirectory(prefix='voldit-export-') as temporary:
            cached = Path(temporary) / source.name
            with source.open('rb') as incoming, cached.open('wb') as outgoing:
                for chunk in iter(lambda: incoming.read(4 * 1024 * 1024), b''):
                    digest.update(chunk)
                    outgoing.write(chunk)
            original = nib.load(cached)
            data = np.asanyarray(original.dataobj)
            if data.shape != (512, 512, 256) or data.dtype != np.dtype('int16'):
                raise ValueError(f'Unexpected source dimensions or type: {source.name}')
            if data.min() < -1200 or data.max() > 300:
                raise ValueError('Source does not match the original LUNA16 HU export')
            reduced = data.reshape(256, 2, 256, 2, 128, 2).mean(axis=(1, 3, 5))
            reduced = np.rint(reduced).astype(np.int16)
            # Each target voxel represents the center of a 2x2x2 source block.
            transform = np.diag([2., 2., 2., 1.])
            transform[:3, 3] = .5
            affine = original.affine @ transform
            output = nib.Nifti1Image(reduced, affine)  # Fresh header, no source metadata.
            output.header.set_xyzt_units('mm')
            output.header['cal_min'], output.header['cal_max'] = -1000, 300
            output.set_qform(affine, code=1)
            output.set_sform(affine, code=1)
            stem = f'lung-example-{number + 1}'
            volume_path = args.output_dir / f'{stem}.nii.gz'
            nib.save(output, volume_path)

            frames = []
            for position in np.linspace(.1, .9, 96):
                x, y, z = [round(position * (size - 1)) for size in reduced.shape]
                frame = np.zeros((256, 800), dtype=np.uint8)
                frame[:, :256] = panel(reduced[:, :, z].T, 256, 256)
                frame[:, 272:528] = panel(np.flipud(reduced[:, y, :].T), 256, 229)
                frame[:, 544:] = panel(np.flipud(reduced[x, :, :].T), 256, 229)
                frames.append(frame)
            Image.fromarray(frames[len(frames) // 2]).save(args.output_dir / f'{stem}.jpg', quality=92)
            subprocess.run([
                'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo',
                '-pixel_format', 'gray', '-video_size', '800x256', '-framerate', '12',
                '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-crf', '20', '-pix_fmt',
                'yuv420p', '-movflags', '+faststart', str(args.output_dir / f'{stem}.mp4')
            ], input=np.stack(frames).tobytes(), check=True)
            manifest.append(dict(id=f'lung-{number + 1}', label=f'Lung CT {number + 1}',
                                 url=volume_path.name, dimensions=list(reduced.shape),
                                 spacing=[float(v) for v in output.header.get_zooms()],
                                 sizeBytes=volume_path.stat().st_size, calMin=-1000, calMax=300))
            provenance.append(dict(
                export=stem, source_collection='sd/samples_final/luna_xl4', source_file=source.name,
                source_sha256=digest.hexdigest(), source_dimensions=list(data.shape),
                source_affine=original.affine.tolist(), source_hu_range=[-1200, 300],
                export_dimensions=list(reduced.shape), export_affine=affine.tolist(),
                export_sha256=sha256(volume_path),
                transform='2x2x2 block average, rounded to int16 HU; preserve block-center geometry',
                video='96 positions from 10% to 90% along each axis, 12 fps, lung window [-1000,300] HU',
                provenance_limit='Final synthetic export collection; exact generating checkpoint is not recorded.'))
            print(f'Exported {stem}: {volume_path.stat().st_size / 1024**2:.1f} MiB', flush=True)
    manifest_path = args.output_dir / 'volumes.json'
    existing = json.loads(manifest_path.read_text())['volumes'] if manifest_path.exists() else []
    manifest += [entry for entry in existing if not entry['id'].startswith('lung-')]
    manifest_path.write_text(json.dumps(dict(volumes=manifest), indent=2) + '\n')
    (args.output_dir / 'provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')


if __name__ == '__main__':
    main()
