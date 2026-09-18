# Maintaining the portfolio

The site stays on Quarto and GitHub Pages. Install Quarto and Python 3, then use `quarto preview` or `quarto render`. No Python packages or JavaScript dependency installation are required for the website.

## Shared content

Edit `_data/site.json` for the profile, News, and Talks & Outreach. Edit `_data/publications.json` for papers. Quarto's pre-render hook runs `tools/build-content.py`; the `portfolio` shortcode inserts the resulting HTML. `_generated/` is build output and should not be edited or committed.

The homepage presents one topic at a time: profile, About, News, Publications, Talks & Outreach, and Notes. Navigation jumps to these sections. All publications appear on the homepage, grouped by citation year, with abstracts and citations collapsed by default. News shows the three newest items and reveals the remaining entries inline with a native “See more” disclosure; it needs no JavaScript. The homepage shows the newest talk; the talk's wider session title stays on the full Outreach page. Existing About, News, and Publications URLs remain available for older links. ISO dates (`YYYY-MM-DD`) keep sorting reliable; the upcoming label is calculated at build time. Rebuild the site after an event to update that label. Resource links appear only when a URL is supplied.

### Typography

Headings use Source Serif 4; body text and navigation use Source Sans 3. Variable WOFF2 files are self-hosted in `assets/fonts/`, with upstream revisions and licenses recorded there. Font faces and fallback stacks are defined in `styles.css`; `theme.scss` disables external theme font imports.

### Portrait and social icons

1. Place your portrait at `assets/profile.jpg` (or another image path). A 6:7 portrait around 960 × 1120 pixels works well. The small mobile layout uses a square crop.
2. Set `profile.portrait` in `_data/site.json` to `assets/profile.jpg` and check `portrait_alt`.
3. Rebuild. Without an image, the profile shows a deliberate initials block with the same reserved space.

The `linkedin`, `lab_github`, and `github` values control the labeled icon links on Home and About. A null value hides the corresponding icon. Icons have accessible names and native hover tooltips. No broken/disabled social placeholders are published.

### News

Append an object with `date`, `title`, `text`, and `url` to `news`. Use an actual announcement or publication date, not an inferred conference acceptance date. The initial records were checked against the linked arXiv and publisher pages.

### Talks and outreach

Append an object to `talks`, for example:

```json
{
  "title": "Your actual presentation title",
  "type": "Talk",
  "date": "2026-11-13",
  "event": "Event name",
  "location": "City, country",
  "session": "Optional wider session title",
  "url": "https://example.org/programme",
  "slides": null,
  "video": null
}
```

Use `type` for Talk, Poster, Workshop, or Panel. Leave optional links null until materials are available. Remove `session` if it does not apply. The initial ESC entry uses Marvin's presentation title from the official programme, not the broader session title; the talk is scheduled for 13 November 2026.

## Publications and future project pages

Each publication has a stable `id`, authors, summary, abstract, citation, type, and resource URLs. `year` is the citation year. Conference year and online date can differ; preserve those in the citation and optional date fields. Homepage and publication archive use the same renderer: descending citation year, then data-file order within each year. The earlier `featured` fields are retained as metadata but do not restrict the homepage list.

Every current `project_url` is null. Paper titles link to the paper until a real project page exists. No individual project pages or placeholder buttons are part of this redesign. In a later phase, add `projects/<id>/index.qmd`, include `projects/**/*.qmd` in `_quarto.yml`'s render list, and set that publication's `project_url` to `projects/<id>/`. Keep IDs stable so existing publication anchors continue to work. Update the phase-specific project-page check in `tools/verify-site.py` when beginning that phase.

## Verification and publishing

```bash
quarto render
python3 tools/verify-site.py
```

The verifier checks generated local links/assets/anchors, key routes, publication coverage, accessible social labels, draft exclusion, and palette text contrast. It does not replace browser layout/keyboard testing. `node tools/verify-homepage.mjs` remains a compatible alias.

The pull-request workflow renders and checks the site. The existing publication workflow remains manual; merging a change does not automatically publish it. After reviewing the changes, run **Publish Quarto site** from GitHub Actions to deploy to the existing GitHub Pages address.

Existing article URLs and research-note media remain intact. The excluded draft stays excluded from the public site and search.
