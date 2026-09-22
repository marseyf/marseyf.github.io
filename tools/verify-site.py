#!/usr/bin/env python3
"""Verify rendered routes, assets, anchors, and key publication/profile content."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import re
import gzip
import struct
import hashlib
import math

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / '_site'
errors = []


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.ids = set()
        self.links = []
        self.h1 = 0
        self.sections = []
        self.profile_h1 = 0
        self.project_hero_h1 = 0
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        if tag == 'section':
            self.sections.append(attrs.get('class', '').split())
        self.h1 += tag == 'h1'
        if tag == 'h1' and any('profile-band' in classes for classes in self.sections):
            self.profile_h1 += 1
        if tag == 'h1' and any('v-landing' in classes for classes in self.sections):
            self.project_hero_h1 += 1
        if tag == 'img' and 'alt' not in attrs:
            errors.append(f'{self.path}: image without alt text')
        for key in ('href', 'src', 'poster', 'data-manifest'):
            if key in attrs:
                self.links.append(attrs[key])
        if tag == 'a' and attrs.get('href') == '' and 'quarto-color-scheme-toggle' not in attrs.get('class', '').split():
            errors.append(f'{self.path}: empty link')

    def handle_endtag(self, tag):
        if tag == 'section' and self.sections:
            self.sections.pop()


pages = {p.resolve(): Page(p) for p in SITE.rglob('*.html')}
assert pages, 'Render the website first'
for path, page in pages.items():
    for link in page.links:
        parsed = urlsplit(link)
        if parsed.scheme or parsed.netloc:
            continue
        target = ((SITE / parsed.path.lstrip('/')) if parsed.path.startswith('/') else path.parent / unquote(parsed.path)).resolve() if parsed.path else path
        if target.is_dir():
            target /= 'index.html'
        if not target.exists():
            errors.append(f'{path.relative_to(SITE)}: missing local target {link}')
        elif parsed.fragment and target in pages and unquote(parsed.fragment) not in pages[target].ids:
            errors.append(f'{path.relative_to(SITE)}: missing anchor {link}')

routes = ['index', 'research', 'publications', 'blog', 'about', 'news', 'outreach']
for name in routes:
    path = (SITE / f'{name}.html').resolve()
    if path not in pages:
        errors.append(f'Missing page: {name}')
    elif pages[path].h1 != 1:
        errors.append(f'{name}: expected one H1, got {pages[path].h1}')

if pages[(SITE / 'index.html').resolve()].profile_h1 != 1:
    errors.append('Homepage name must stay inside the colored profile panel')

for project in ['voldit', 'cardiodit']:
    project_page = (SITE / f'projects/{project}/index.html').resolve()
    if project_page in pages and pages[project_page].project_hero_h1 != 1:
        errors.append(f'{project}: title must stay inside its landing section, not the generated Quarto header')

# CSS imports and fonts are not ordinary HTML links.
for css_path in [SITE / 'assets/project-pages.css',
                 SITE / 'projects/voldit/project.css', SITE / 'projects/cardiodit/project.css']:
    if not css_path.is_file():
        errors.append(f'Missing project stylesheet: {css_path}')
        continue
    for url in re.findall(r'url\([\'\"]?([^\'\")]+)', css_path.read_text()):
        parsed = urlsplit(url)
        if not parsed.scheme and not (css_path.parent / parsed.path).resolve().is_file():
            errors.append(f'{css_path.name}: missing CSS resource {url}')

home = (SITE / 'index.html').read_text()
pub = pages[(SITE / 'publications.html').resolve()]
data = json.loads((ROOT / '_data/publications.json').read_text())
profile = json.loads((ROOT / '_data/site.json').read_text())['profile']
for paper in data:
    if paper['id'] not in pub.ids or paper['id'] not in pages[(SITE / 'index.html').resolve()].ids:
        errors.append(f'Missing publication: {paper["id"]}')
    if paper.get('project_url'):
        project_page = (SITE / paper['project_url'] / 'index.html').resolve()
        if project_page not in pages or pages[project_page].h1 != 1:
            errors.append(f'Missing project page or invalid H1: {paper["id"]}')
for key in ['linkedin', 'github', 'lab_github']:
    if profile.get(key) and profile[key] not in home:
        errors.append(f'Missing homepage profile link: {key}')
for label in ['LinkedIn', 'Cardio-AI lab on GitHub', 'Personal GitHub']:
    if f'aria-label="{label}"' not in home:
        errors.append(f'Missing accessible profile icon label: {label}')
if '{{<' in home or '```' in home:
    errors.append('Unrendered shortcode or code fence on homepage')
if re.search(r'class="(?:portfolio-home|home-columns)[^"]*page-columns', home):
    errors.append('Quarto margin layout overrides the homepage grid')
if 'posts/first-article' in (SITE / 'search.json').read_text():
    errors.append('Draft included in search')
if (SITE / 'posts/first-article/index.html').exists():
    errors.append('Draft page published')
if '2026-11-13' not in (SITE / 'outreach.html').read_text():
    errors.append('Missing ESC talk date')
if any(p.name.startswith('_data') for p in SITE.iterdir()):
    errors.append('Source content data copied to public output')

# Lazy imports and manifest-selected volumes are not ordinary HTML asset links.
for project in ['voldit', 'cardiodit']:
    viewer = SITE / f'projects/{project}/viewer.js'
    if not viewer.exists():
        errors.append(f'Missing {project} viewer')
        continue
    for module in re.findall(r"import\(['\"]([^'\"]+)['\"]\)", viewer.read_text()):
        if not (viewer.parent / module).resolve().is_file():
            errors.append(f'Missing lazy viewer module: {module}')
    manifest_path = viewer.parent / 'assets/volumes.json'
    if not manifest_path.exists():
        errors.append('Missing interactive-volume manifest')
    else:
        for volume in json.loads(manifest_path.read_text())['volumes']:
            path = manifest_path.parent / volume['url']
            if not path.is_file():
                errors.append(f'Missing interactive volume: {path.name}')
                continue
            if path.stat().st_size != volume['sizeBytes']:
                errors.append(f'Volume download size differs from manifest: {path.name}')
            with gzip.open(path, 'rb') as stream:
                contents = stream.read()
            header = contents[:352]
            if len(header) != 352 or struct.unpack_from('<i', header)[0] != 348:
                errors.append(f'Invalid NIfTI header: {path.name}')
                continue
            if list(struct.unpack_from('<3h', header, 42)) != volume['dimensions']:
                errors.append(f'Volume dimensions differ from manifest: {path.name}')
            expected_datatype = 2 if project == 'cardiodit' else 4
            if struct.unpack_from('<h', header, 70)[0] != expected_datatype or header[348:352] != b'\0\0\0\0':
                errors.append(f'Unexpected volume datatype or metadata extensions: {path.name}')
            frames = volume.get('frames', 1)
            if struct.unpack_from('<h', header, 48)[0] != frames:
                errors.append(f'Frame count differs from manifest: {path.name}')
            bytes_per_voxel = 1 if expected_datatype == 2 else 2
            offset = int(struct.unpack_from('<f', header, 108)[0])
            if len(contents) != offset + math.prod(volume['dimensions']) * frames * bytes_per_voxel:
                errors.append(f'Incomplete volume payload: {path.name}')
        if project == 'cardiodit':
            provenance = json.loads((manifest_path.parent / 'volume-provenance.json').read_text())
            for record in provenance:
                path = manifest_path.parent / record['export']
                if path.is_file() and hashlib.sha256(path.read_bytes()).hexdigest() != record['export_sha256']:
                    errors.append(f'4D export differs from verified provenance: {path.name}')

# Validate essential color pairs in both CSS palettes (not a browser layout test).
css = (ROOT / 'styles.css').read_text()
palettes = [block for block in re.findall(r'\{([^{}]+)\}', css) if '--site-canvas:' in block]
def luminance(color):
    rgb = [int(color[i:i+2], 16) / 255 for i in (1, 3, 5)]
    linear = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in rgb]
    return sum(x*y for x, y in zip(linear, [.2126, .7152, .0722]))
for block in palettes:
    tokens = dict(re.findall(r'(--[\w-]+):\s*(#[0-9a-fA-F]{6})', block))
    for foreground in ['--site-ink', '--site-muted', '--site-cyan']:
        for background in ['--site-canvas', '--site-surface']:
            a, b = sorted([luminance(tokens[foreground]), luminance(tokens[background])])
            if (b+.05)/(a+.05) < 4.5:
                errors.append(f'Contrast below 4.5:1: {foreground} / {background}')
if len(palettes) != 2:
    errors.append('Expected light and dark palettes')

if errors:
    raise SystemExit('Site checks failed:\n- ' + '\n- '.join(errors))
print(f'Passed: {len(pages)} HTML pages, local links/assets/anchors, {len(data)} publications, project titles/styles, 3D/4D volume integrity, profile icons, draft exclusion, and light/dark text contrast.')
