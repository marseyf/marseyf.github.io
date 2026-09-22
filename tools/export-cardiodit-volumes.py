#!/usr/bin/env python3
"""Export the three already-published synthetic CardioDiT examples for WebGL.

Authoring only: numpy and nibabel. No inference or source modification. Only
sources matching the existing public video provenance are accepted.
"""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import tempfile

import nibabel as nib
import numpy as np


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, required=True)
    parser.add_argument('--output-dir', type=Path, required=True)
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    media = json.loads((args.output_dir / 'provenance.json').read_text())
    entries, records = [], []
    for index, reference in enumerate(media[:3]):
        source = args.source_dir / reference['source_file']
        # Read shared storage once; all processing and output stay local.
        with tempfile.TemporaryDirectory(prefix='cardiodit-volume-') as temporary:
            cached = Path(temporary) / source.name
            digest = hashlib.sha256()
            with source.open('rb') as incoming, cached.open('wb') as outgoing:
                for chunk in iter(lambda: incoming.read(4 * 1024 * 1024), b''):
                    digest.update(chunk)
                    outgoing.write(chunk)
            if digest.hexdigest() != reference['source_sha256']:
                raise ValueError(f'Source does not match published synthetic provenance: {source.name}')
            original = nib.load(cached)
            data = original.get_fdata(dtype=np.float32)
            if data.shape != (256, 256, 6, 32) or not np.isfinite(data).all():
                raise ValueError(f'Invalid 4D source: {source.name}')
            low, high = np.percentile(data, [1, 99.5])
            if not np.allclose([low, high], reference['display_window'], atol=1e-7):
                raise ValueError('Display normalization differs from the existing videos')
            # Match the public videos, retaining every voxel and time point.
            display = (np.clip((data - low) / (high - low), 0, 1) * 255).astype(np.uint8)
            affine = original.affine.copy()
            output = nib.Nifti1Image(display, affine)  # Fresh header; no source extensions/text.
            output.set_sform(affine, code=2)
            output.set_qform(affine, code=0)
            output.header.set_xyzt_units('unknown', 'unknown')
            output.header.set_zooms((*original.header.get_zooms()[:3], 1.0))
            output.header['cal_min'], output.header['cal_max'] = 0, 255
            output.header['scl_slope'], output.header['scl_inter'] = 1, 0
            stem = f'public-example-{index + 1}'
            path = args.output_dir / f'{stem}.nii.gz'
            # Fixed gzip metadata makes a repeat export byte-for-byte reproducible.
            with path.open('wb') as raw, gzip.GzipFile(fileobj=raw, mode='wb', filename='', mtime=0) as stream:
                stream.write(output.to_bytes())
            restored = nib.load(path)
            if restored.shape != data.shape or not np.array_equal(np.asanyarray(restored.dataobj), display):
                raise ValueError('Export round-trip changed the data or time ordering')
            if not np.allclose(restored.affine, affine):
                raise ValueError('Export changed the spatial aspect')
            # Confirm the sequence contains motion, including its final frame.
            differences = np.mean(np.abs(np.diff(display.astype(np.int16), axis=3)), axis=(0, 1, 2))
            if not np.all(differences > 0):
                raise ValueError('Unexpected duplicate adjacent frames')
            entries.append(dict(
                id=f'cine-{index + 1}', label=f'Example {index + 1:02}', url=path.name,
                dimensions=list(display.shape[:3]), frames=32, datatype=2,
                spacing=[float(v) for v in restored.header.get_zooms()[:3]],
                sizeBytes=path.stat().st_size, displayFps=8,
                defaultPreset='balanced', presets={'balanced': [0, 255], 'detail': [25, 220]},
            ))
            records.append(dict(
                export=path.name, source_collection=reference['source_collection'],
                source_file=source.name, source_sha256=digest.hexdigest(),
                export_sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                source_shape=list(data.shape), export_shape=list(display.shape),
                source_affine=affine.tolist(), export_affine=restored.affine.tolist(),
                display_window=[float(low), float(high)],
                transform='Fixed whole-sequence 1st/99.5th-percentile window to uint8, matching the videos; no spatial or temporal resampling',
                frame_index='Source time order preserved; 8 fps is display speed, not physiological timing',
                orientation='Synthetic diagonal affine; preserve aspect, do not infer anatomical direction labels',
                min_adjacent_frame_difference=float(differences.min()),
                provenance_limit='Existing final synthetic export; exact generating checkpoint is not recorded',
            ))
            print(f'{stem}: all 32 frames verified; {path.stat().st_size / 1024**2:.2f} MiB', flush=True)
    (args.output_dir / 'volumes.json').write_text(json.dumps({'volumes': entries}, indent=2) + '\n')
    (args.output_dir / 'volume-provenance.json').write_text(json.dumps(records, indent=2) + '\n')


if __name__ == '__main__':
    main()
