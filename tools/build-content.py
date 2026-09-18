#!/usr/bin/env python3
"""Render shared site data into Quarto includes; Python standard library only."""
from datetime import date
from html import escape
import json
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "_generated"
OUT.mkdir(exist_ok=True)
site = json.loads((ROOT / "_data/site.json").read_text())
papers = json.loads((ROOT / "_data/publications.json").read_text())
profile = site["profile"]


def e(value):
    return escape(str(value), quote=True)


def url(value):
    """Reject accidental unsafe links in manually edited content."""
    if not value or urlsplit(value).scheme not in ("https", "http", ""):
        raise ValueError(f"Invalid content URL: {value!r}")
    if value.startswith("//"):
        raise ValueError("Use an explicit https URL")
    return e(value)


def write(name, markup):
    (OUT / f"{name}.html").write_text(markup + "\n")


def icon(name):
    return f'<i class="bi bi-{name}" aria-hidden="true"></i>'


def socials():
    entries = [("linkedin", "linkedin", "LinkedIn"),
               ("lab_github", "building", "Cardio-AI lab on GitHub"),
               ("github", "github", "Personal GitHub")]
    return '<nav class="social-links" aria-label="Professional profiles">' + "".join(
        f'<a href="{url(profile[key])}" aria-label="{label}" title="{label}">{icon(symbol)}</a>'
        for key, symbol, label in entries if profile.get(key)
    ) + '</nav>'


def portrait():
    if profile.get("portrait"):
        path = ROOT / profile["portrait"]
        if not path.is_file():
            raise ValueError(f"Portrait file not found: {path}")
        return f'<div class="portrait"><img src="{url(profile["portrait"])}" width="480" height="560" alt="{e(profile["portrait_alt"])}" decoding="async"></div>'
    initials = "".join(part[0] for part in profile["name"].split())
    return f'<div class="portrait portrait--initials" role="img" aria-label="{e(profile["name"])} initials"><span aria-hidden="true">{e(initials)}</span></div>'


def resource_links(paper):
    entries = [("project_url", "Project", "arrow-up-right"), ("paper_url", "Paper", "file-earmark-text"), ("code_url", "Code", "code-slash")]
    return '<div class="resource-links">' + "".join(
        f'<a href="{url(paper[key])}">{icon(symbol)}<span>{label}</span></a>'
        for key, label, symbol in entries if paper.get(key)
    ) + '</div>'


def news_list(limit=None, compact=False):
    items = sorted(site["news"], key=lambda item: item["date"], reverse=True)
    if limit is not None:
        items = items[:limit]
    rows = []
    for item in items:
        when = date.fromisoformat(item["date"])
        description = '' if compact else f'<p>{e(item["text"])}</p>'
        rows.append(f'<li><time datetime="{when.isoformat()}">{when:%d %b %Y}</time><div><h3><a href="{url(item["url"])}">{e(item["title"])}</a></h3>{description}</div></li>')
    return '<ol class="news-list">' + "".join(rows) + '</ol>'


def talk_list(limit=None, compact=False):
    items = sorted(site["talks"], key=lambda item: item["date"], reverse=True)
    if limit is not None:
        items = items[:limit]
    if not items:
        return '<p class="empty-state">No talks or presentations listed yet.</p>'
    rows = []
    for item in items:
        when = date.fromisoformat(item["date"])
        links = ''.join(f'<a href="{url(item[key])}">{label} {icon("arrow-up-right")}</a>' for key, label in [('slides', 'Slides'), ('video', 'Recording'), ('url', 'Event')] if item.get(key))
        place = ' · '.join(e(item[key]) for key in ['event', 'location'] if item.get(key))
        status = 'Upcoming · ' if when >= date.today() else ''
        session = f'<p class="talk-session">Session: {e(item["session"])}</p>' if item.get('session') and not compact else ''
        rows.append(f'<article class="talk-entry"><p class="eyebrow">{status}{e(item.get("type", "Talk"))} · <time datetime="{when.isoformat()}">{when:%d %b %Y}</time></p><h3>{e(item["title"])}</h3><p>{place}</p>{session}<div class="resource-links">{links}</div></article>')
    return ''.join(rows)


def selected_work():
    selected = sorted((p for p in papers if p.get('featured')), key=lambda p: p.get('featured_order', 99))
    rows = []
    for paper in selected:
        suffix = paper['publication_type'] if paper.get('conference_year') else paper['year']
        rows.append(f'<article class="selected-paper"><p class="paper-status">{e(paper["display_venue"])} · {e(suffix)}</p><h3><a href="{url(paper.get("project_url") or paper["paper_url"])}">{e(paper["short_title"])}</a></h3><p class="paper-description">{e(paper["summary"])}</p>{resource_links(paper)}</article>')
    return ''.join(rows)


def section_heading(title, href, label):
    return f'<div class="section-heading"><h2>{title}</h2><a class="text-link" href="{href}">{label} {icon("arrow-up-right")}</a></div>'


note_link = 'posts/diffusion-models-medical-image-synthesis/'
note_card = f'<article class="note-feature"><p class="eyebrow">Research notes / Foundations</p><h3><a href="{note_link}">From noise to anatomy</a></h3><p>Diffusion models for medical image synthesis: denoising, conditioning, latent spaces, and evaluation.</p><a class="text-link" href="{note_link}">Read the article {icon("arrow-up-right")}</a></article>'

write('home', f'''<div class="portfolio-home" id="main-content">
<section class="profile-band" aria-labelledby="hero-title"><div class="section-inner profile-hero"><div class="profile-copy"><p class="profile-field">Generative medical imaging</p><h1 id="hero-title">{e(profile["name"])}</h1><p class="affiliation">{e(profile["institute"])}<br><span>{e(profile["institution"])}</span></p>{socials()}</div>{portrait()}</div></section>
<section class="home-section" id="about" aria-labelledby="about-title"><div class="section-inner"><h2 id="about-title">About me</h2><div class="about-summary"><p class="section-lead">{e(profile["intro"])}</p><p>My work connects high-resolution image synthesis with the questions that make synthetic data useful: computational efficiency, anatomical and temporal structure, diversity, and memorization.</p></div><a class="text-link" href="about.html">More about me {icon("arrow-up-right")}</a></div></section>
<section class="home-section home-section--tinted" id="news" aria-labelledby="news-title"><div class="section-inner"><h2 id="news-title">News</h2>{news_list(3)}<a class="text-link section-link" href="news.html">All updates {icon("arrow-up-right")}</a></div></section>
<section class="home-section" id="research" aria-labelledby="research-title"><div class="section-inner"><h2 id="research-title">Selected research</h2><p class="section-intro">Efficient generation. Coherent anatomy. Careful evaluation.</p><div class="selected-papers">{selected_work()}</div><div class="section-actions"><a class="section-button" href="publications.html">All publications {icon("arrow-up-right")}</a><a class="text-link" href="research.html">Research directions {icon("arrow-up-right")}</a></div></div></section>
<section class="home-section home-section--tinted" id="talks" aria-labelledby="outreach-title"><div class="section-inner"><h2 id="outreach-title">Talks &amp; outreach</h2>{talk_list(1, compact=True)}<a class="text-link section-link" href="outreach.html">All presentations &amp; resources {icon("arrow-up-right")}</a></div></section>
<section class="home-section" id="notes" aria-labelledby="notes-title"><div class="section-inner"><h2 id="notes-title">Research notes</h2>{note_card}<a class="text-link section-link" href="blog.html">All notes {icon("arrow-up-right")}</a></div></section>
</div>''')

write('news', '<div class="news-archive">' + news_list() + '</div>')
write('outreach', f'<section class="talks-section"><h2>Talks &amp; presentations</h2>{talk_list()}</section><section class="outreach-resources"><h2>Explainers</h2>{note_card}</section>')
write('about', f'''<div class="about-layout"><div><p class="about-lead">{e(profile["intro"])}</p><p>I work at the {e(profile["institute"])}, {e(profile["institution"])}.</p><p>My research connects high-resolution image generation with questions of efficiency, anatomical and temporal structure, diversity, and memorization.</p><p>This site brings together my publications, research notes, and presentations.</p><h2>Find me online</h2>{socials()}</div>{portrait()}</div>''')

sections = []
for year in sorted({p['year'] for p in papers}, reverse=True):
    entries = []
    for paper in (p for p in papers if p['year'] == year):
        authors = ', '.join(f'<strong>{e(author)}</strong>' if author in ['Marvin Seyfarth', 'M Seyfarth'] else e(author) for author in paper['authors'])
        entries.append(f'''<article class="publication-entry" id="{e(paper['id'])}"><p class="eyebrow">{e(paper['display_venue'])} · {e(paper['publication_type'])}</p><h3><a href="{url(paper.get('project_url') or paper['paper_url'])}">{e(paper['title'])}</a></h3><p class="publication-authors">{authors}</p><p class="publication-focus">{e(paper['summary'])}</p>{resource_links(paper)}<details><summary>Abstract &amp; citation</summary><div class="publication-detail"><p>{e(paper['abstract'])}</p><p class="citation"><strong>Publication details:</strong> {e(paper['citation'])}</p></div></details></article>''')
    sections.append(f'<section class="publication-year"><h2>{year}</h2><div>{"".join(entries)}</div></section>')
write('publications', '<div class="publication-list">' + ''.join(sections) + '</div>')
print(f"Generated 5 content includes from {len(papers)} publications, {len(site['news'])} news items, and {len(site['talks'])} talks.")
