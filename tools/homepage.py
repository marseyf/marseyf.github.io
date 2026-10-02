"""Homepage-only presentation of the shared, editable portfolio content."""
from datetime import date
from html import escape
from urllib.parse import urlsplit


def e(value):
    return escape(str(value), quote=True)


def link(value):
    if not value or value.startswith('//') or urlsplit(value).scheme not in ('', 'http', 'https'):
        raise ValueError(f'Invalid homepage URL: {value!r}')
    return e(value)


def icon(name):
    return f'<i class="bi bi-{name}" aria-hidden="true"></i>'


def render_homepage(site, papers):
    profile, content = site['profile'], site['homepage']
    by_id = {paper['id']: paper for paper in papers}
    order = content['publication_order']
    if len(order) != len(set(order)) or any(key not in by_id for key in order):
        raise ValueError('Homepage publication order contains a duplicate or unknown ID')
    # Newly added publications remain visible even before the editorial order is updated.
    ordered = [by_id[key] for key in order] + [p for p in papers if p['id'] not in order]
    groups = [ordered[i:i + 4] for i in range(0, len(ordered), 4)]
    screen_count = len(groups) + 3
    milestone = content['milestone']
    talk = sorted(site['talks'], key=lambda item: item['date'], reverse=True)[0] if site['talks'] else None
    note = content['note']

    def socials(label):
        entries = [('linkedin', 'linkedin', 'LinkedIn'),
                   ('lab_github', 'bank2', 'Cardio-AI lab on GitHub'),
                   ('github', 'github', 'Personal GitHub')]
        return f'<nav class="h-socials" aria-label="{e(label)}">' + ''.join(
            f'<a href="{link(profile[key])}" aria-label="{title}" title="{title}">{icon(symbol)}</a>'
            for key, symbol, title in entries if profile.get(key)
        ) + '</nav>'

    def onward(target, title, number, extra=''):
        return f'''<footer class="h-screen-footer h-container">{extra}
        <a class="h-next" href="#{target}">{e(title)} {icon('arrow-down')}</a>
        <span class="h-screen-number" aria-label="Section {number} of {screen_count}">{number:02} / {screen_count:02}</span></footer>'''

    def heading(title, subtitle, identifier, number=''):
        count = f'<span class="h-page-number" aria-label="Publication section {number}">{number}</span>' if number else ''
        return f'<header class="h-section-heading"><h2 id="{identifier}">{e(title)}</h2><p>{e(subtitle)}</p>{count}</header>'

    def short_authors(paper):
        aliases = {'M Seyfarth': 'Marvin Seyfarth', 'A Ghanaat': 'Arman Ghanaat',
                   'Salman U. H. Dar': 'Salman Ul Hassan Dar'}
        authors = [aliases.get(a.rstrip('.'), a.rstrip('.')) for a in paper['authors']]
        if len(authors) > 3:
            count = 1 if authors[0] == profile['name'] else 2
            return e(', '.join(authors[:count])) + ' et al.'
        return e(', '.join(authors))

    def publication(paper):
        title = e(paper['title'])
        if paper.get('project_url'):
            title = f'<a href="{link(paper["project_url"])}">{title} {icon("arrow-up-right")}</a>'
        meta = paper['publication_type']
        if str(paper.get('conference_year', paper['year'])) not in paper['display_venue']:
            meta = f'{paper["year"]} · {meta}'
        resources = ''.join(
            f'<a href="{link(paper[key])}" aria-label="{label}: {e(paper["short_title"])}">{icon(symbol)}<span>{label}</span></a>'
            for key, label, symbol in [('paper_url', 'Paper', 'file-earmark-text'), ('code_url', 'Code', 'github')]
            if paper.get(key)
        )
        return f'''<article class="h-publication" id="{e(paper['id'])}">
        <div class="h-publication-meta"><p>{e(paper['display_venue'])}</p><span>{e(meta)}</span></div>
        <div class="h-publication-copy"><h3>{title}</h3><p class="h-authors">{short_authors(paper)}</p><div class="h-resources">{resources}</div></div></article>'''

    def news_rows(items, start=1):
        return f'<ol class="h-news-list" start="{start}">' + ''.join(
            f'''<li><time datetime="{e(item['date'])}">{date.fromisoformat(item['date']):%d %b %Y}</time>
            <div><h3><a href="{link(item['url'])}">{e(item['title'])}{icon('arrow-up-right')}</a></h3>
            <p>{e(item.get('homepage_text', item['text']))}</p></div></li>'''
            for item in items
        ) + '</ol>'

    talk_status = 'Upcoming' if talk and date.fromisoformat(talk['date']) >= date.today() else 'Talk'
    preview_status = 'Upcoming talk' if talk_status == 'Upcoming' else 'Talk'
    latest_talk = ''
    if talk:
        latest_talk = f'''<article><p class="h-eyebrow">{preview_status} · <time datetime="{e(talk['date'])}">{date.fromisoformat(talk['date']):%d %b %Y}</time></p>
        <h3><a href="{link(talk['url'])}">{e(content['talk_preview_title'])} {icon('arrow-up-right')}</a></h3>
        <p>{e(talk['event'])} · {e(talk['location'].split(',')[0])}</p></article>'''

    markup = f'''<link rel="stylesheet" href="assets/homepage.css?v=1">
    <a class="skip-link h-skip-link" href="#main-content">Skip to main content</a>
    <header class="h-nav"><div class="h-nav-inner h-container">
      <a class="h-wordmark" href="#about">{e(profile['name'])}</a>
      <nav class="h-nav-sections" aria-label="Homepage sections">
        <a href="#about" aria-current="location">About</a><a href="#publications">Publications</a><a href="#news">News</a><a href="#talks">Talks &amp; notes</a>
      </nav>{socials('Professional profiles')}</div></header>
    <div class="h-home" id="main-content" tabindex="-1">
    <section class="h-screen h-introduction profile-band" id="about" aria-labelledby="hero-title" data-nav="about">
      <div class="h-profile h-container"><div class="h-profile-copy">
        <header id="title-block-header" class="h-identity quarto-title-block">
          <h1 id="hero-title">{e(profile['name'])}</h1><p class="h-role">{e(profile['role'])}</p>
          <p class="h-affiliation">{e(profile['institute'])}<br>{e(profile['institution'])}</p>
        </header>
        <div class="h-about"><h2>About me</h2><p>{e(profile['intro'])}</p><p>{e(content['about_detail'])}</p></div>
      </div>
      <img class="h-portrait" src="{link(profile['portrait'])}" width="288" height="384" alt="{e(profile['portrait_alt'])}" fetchpriority="high" decoding="async">
      </div>
      <aside class="h-latest" aria-labelledby="latest-title"><div class="h-container">
        <h2 id="latest-title">Latest news</h2><div class="h-latest-grid">
          <article><p class="h-eyebrow">{e(milestone['venue'])}</p><h3><a href="#news">{e(milestone['preview_title'])} {icon('arrow-up-right')}</a></h3><p>{e(milestone['preview_text'])}</p></article>
          {latest_talk}
        </div></div></aside>
      {onward('publications', 'Explore publications', 1)}
    </section>'''

    for i, group in enumerate(groups):
        identifier = 'publications' if i == 0 else f'publications-{i + 1}'
        next_id = f'publications-{i + 2}' if i + 1 < len(groups) else 'news'
        next_title = 'Continue publications' if i + 1 < len(groups) else 'Research updates'
        research_link = '<a class="h-secondary-link" href="research.html">Research directions ' + icon('arrow-up-right') + '</a>' if i + 1 == len(groups) else ''
        legacy = '<span id="research" class="h-anchor" aria-hidden="true"></span>' if i == 0 else ''
        markup += f'''<section class="h-screen h-publications" id="{identifier}" aria-labelledby="{identifier}-title" data-nav="publications">{legacy}
        <div class="h-section-body h-container">{heading('Publications', content['publications_subtitle'], identifier + '-title', f'{i + 1:02} / {len(groups):02}')}
        <div class="h-publication-list">{''.join(publication(p) for p in group)}</div></div>
        {onward(next_id, next_title, i + 2, research_link)}</section>'''

    news = sorted(site['news'], key=lambda item: item['date'], reverse=True)
    older_news = ''
    if len(news) > 3:
        older_news = f'''<div id="older-news">{news_rows(news[3:], start=4)}</div>
        <div class="h-news-toggle-wrap"><button class="h-news-toggle" type="button" aria-expanded="true" aria-controls="older-news" data-count="{len(news) - 3}" hidden>See less {icon('chevron-up')}</button></div>'''
    projects = ''.join(f'<a href="{link(by_id[key]["project_url"])}">{e(by_id[key]["short_title"])} {icon("arrow-up-right")}</a>' for key in milestone['publications'])
    markup += f'''<section class="h-screen h-news" id="news" aria-labelledby="news-title" data-nav="news"><div class="h-section-body h-container">
      {heading('News', 'Papers, milestones, and research updates.', 'news-title')}
      <article class="h-milestone"><p class="h-eyebrow">Research milestone</p><h3>{e(milestone['title'])}</h3><p>{e(milestone['text'])}</p><div class="h-resources">{projects}</div></article>
      <div class="h-news-feed">{news_rows(news[:3])}{older_news}</div>
      </div>{onward('talks', 'Talks & research notes', len(groups) + 2)}</section>'''

    talk_card = '<p>New presentations will be added here.</p>'
    if talk:
        title, separator, subtitle = talk['title'].partition(': ')
        subtitle = subtitle[:1].upper() + subtitle[1:] if separator else ''
        media = ''.join(f'<a href="{link(talk[key])}">{label} {icon("arrow-up-right")}</a>' for key, label in [('slides', 'Slides'), ('video', 'Recording')] if talk.get(key))
        talk_card = f'''<article class="h-talk-card"><p class="h-eyebrow">{talk_status} · <time datetime="{e(talk['date'])}">{date.fromisoformat(talk['date']):%d %b %Y}</time></p>
        <h4>{e(title)}</h4>{f'<p class="h-talk-subtitle">{e(subtitle)}</p>' if subtitle else ''}
        <p class="h-talk-place">{e(talk['event'])}<br>{e(talk['location'])}</p>
        <div class="h-talk-links"><a href="{link(talk['url'])}">View session {icon('arrow-up-right')}</a>{media}<a href="outreach.html">Presentations &amp; resources {icon('arrow-up-right')}</a></div></article>'''
    topics = ''.join(f'<li><span aria-hidden="true">{i:02}</span>{e(topic)}</li>' for i, topic in enumerate(note['topics'], 1))
    markup += f'''<section class="h-screen h-outreach" id="talks" aria-labelledby="talks-title" data-nav="talks">
      <div class="h-section-body h-container">{heading('Talks & research notes', 'Presentations and explanations of my research.', 'talks-title')}
        <div class="h-outreach-grid"><div><h3 class="h-column-title">Talks &amp; outreach</h3>{talk_card}</div>
          <div id="notes"><h3 class="h-column-title">Research notes</h3><article class="h-note-card">
            <p class="h-eyebrow">{e(note['category'])} · <time datetime="{e(note['date'])}">{date.fromisoformat(note['date']):%d %b %Y}</time></p>
            <h4><a href="{link(note['url'])}">{e(note['title'])}</a></h4><p class="h-note-subtitle">{e(note['subtitle'])}</p><p>{e(note['text'])}</p>
            <ol class="h-note-topics">{topics}</ol><a class="h-text-link" href="{link(note['url'])}">Read the article {icon('arrow-up-right')}</a>
          </article></div></div>
      </div>
      <aside class="h-contact" aria-labelledby="contact-title"><h3 id="contact-title">Find me online</h3>{socials('Find me online')}</aside>
      <footer class="h-end-footer h-container"><p>{e(profile['name'])} <span aria-hidden="true">·</span> {e(profile['institution'])}</p><a href="#about">Back to top {icon('arrow-up')}</a><span class="h-screen-number" aria-label="Section {screen_count} of {screen_count}">{screen_count:02} / {screen_count:02}</span></footer>
    </section></div><script src="assets/homepage.js?v=1" defer></script>'''
    return markup
