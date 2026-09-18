#!/usr/bin/env python3
"""Verify rendered routes, assets, anchors, and key publication/profile content."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import re

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
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        self.h1 += tag == 'h1'
        if tag == 'img' and 'alt' not in attrs:
            errors.append(f'{self.path}: image without alt text')
        for key in ('href', 'src', 'poster'):
            if key in attrs:
                self.links.append(attrs[key])
        if tag == 'a' and attrs.get('href') == '' and 'quarto-color-scheme-toggle' not in attrs.get('class', '').split():
            errors.append(f'{self.path}: empty link')


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
print(f'Passed: {len(pages)} HTML pages, local links/assets/anchors, {len(data)} publications, profile icons, draft exclusion, and light/dark text contrast.')
