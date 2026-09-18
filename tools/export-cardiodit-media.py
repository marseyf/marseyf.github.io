#!/usr/bin/env python3
"""Render existing synthetic volumes for the project page; never runs a model.

Optional authoring dependencies: numpy, nibabel, Pillow, ffmpeg.
The website build uses the committed exports and does not run this script.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

import nibabel as nib
import numpy as np
from PIL import Image, ImageSequence

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source-dir', type=Path, required=True)
parser.add_argument('--development-gif', type=Path, required=True)
parser.add_argument('--output-dir', type=Path, required=True)
args = parser.parse_args()
args.output_dir.mkdir(parents=True, exist_ok=True)
records = []

for sample in range(3):
    source = args.source_dir / f'sample_{sample}_0.nii.gz'
    volume = nib.load(source).get_fdata(dtype=np.float32)
    if volume.shape != (256, 256, 6, 32) or not np.isfinite(volume).all():
        raise ValueError(f'Unexpected sample shape or nonfinite data: {source.name}')
    low, high = np.percentile(volume, [1, 99.5])
    pixels = np.clip((volume - low) / (high - low), 0, 1)
    pixels = (pixels * 255).astype(np.uint8)
    frames = []
    for time in range(32):
        frame = np.zeros((256, 800), dtype=np.uint8)
        for col, depth in enumerate([1, 3, 5]):
            frame[:, col * 272:col * 272 + 256] = pixels[:, :, depth, time].T
        frames.append(frame)
    stem = f'public-example-{sample + 1}'
    Image.fromarray(frames[0]).save(args.output_dir / f'{stem}.jpg', quality=92)
    subprocess.run([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'rawvideo', '-pixel_format', 'gray', '-video_size', '800x256',
        '-framerate', '8', '-i', 'pipe:0', '-an', '-c:v', 'libx264',
        '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
        str(args.output_dir / f'{stem}.mp4')
    ], input=np.stack(frames).tobytes(), check=True)
    records.append(dict(export=stem, source_collection='samples_final/CardioDiT/public_l4',
                        source_file=source.name, source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
                        shape=list(volume.shape), slices_one_based=[2, 4, 6],
                        frame_count=32, playback_fps=8, percentile_window=[1, 99.5],
                        display_window=[float(low), float(high)],
                        orientation='Transpose H/W for display; no anatomical orientation labels'))

# Preserve all source frames; use an explicit 8 fps display rate for both exports.
with Image.open(args.development_gif) as image:
    frames = [np.array(frame.convert('RGB')) for frame in ImageSequence.Iterator(image)]
if len(frames) != 32:
    raise ValueError('Expected 32 frames in the development example')
height, width, _ = frames[0].shape
Image.fromarray(frames[0]).save(args.output_dir / 'development-f07.jpg', quality=92)
subprocess.run([
    'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'rawvideo', '-pixel_format', 'rgb24', '-video_size', f'{width}x{height}',
    '-framerate', '8', '-i', 'pipe:0',
    '-an', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', str(args.output_dir / 'development-f07.mp4')
], input=np.stack(frames).tobytes(), check=True)
records.append(dict(export='development-f07', source_file=args.development_gif.name,
                    source_sha256=hashlib.sha256(args.development_gif.read_bytes()).hexdigest(),
                    training_updates=300000, sampling_steps=100, output='quantized',
                    source_shape=[12, 224, 224, 32], slice_zero_based=6,
                    frame_count=32, playback_fps=8, status='Development example; not a paper benchmark'))
(args.output_dir / 'provenance.json').write_text(json.dumps(records, indent=2) + '\n')
print('Exported 3 public evaluation examples and 1 development example.')
