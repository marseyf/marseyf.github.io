# Maintaining the portfolio

The site stays on Quarto and GitHub Pages. Install Quarto and Python 3, then use `quarto preview` or `quarto render`. No Python packages or JavaScript dependency installation are required for the website.

## Shared content

Edit `_data/site.json` for the profile, News, and Talks & Outreach. Edit `_data/publications.json` for papers. Quarto's pre-render hook runs `tools/build-content.py`; the `portfolio` shortcode inserts the resulting HTML. `_generated/` is build output and should not be edited or committed.

The homepage opens with one introduction panel containing the profile, portrait, and About text, followed by News, Publications, Talks & Outreach, and Notes. Every section heading sits above its content. Navigation jumps to these sections. All publications appear on the homepage, grouped by citation year, with concise summaries and direct resource links. Abstracts and citations remain in the publication data for future project pages. News uses a compact date-and-headline layout and shows the three newest items and reveals the remaining entries inline with a native “See more” disclosure; it needs no JavaScript. The homepage shows the newest talk; the talk's wider session title stays on the full Outreach page. Existing About, News, and Publications URLs remain available for older links. ISO dates (`YYYY-MM-DD`) keep sorting reliable; the upcoming label is calculated at build time. Rebuild the site after an event to update that label. Resource links appear only when a URL is supplied.

### Typography

Page and section headings use Source Serif 4; item titles, body text, and navigation use Source Sans 3. The shared CSS type scale defines display titles (40–56 px), section headings (32 px), item titles (20 px), body text (18 px), metadata (14 px), and controls (16 px). Use these roles instead of adding per-section font sizes. Sections use flat backgrounds and restrained rules, without gradients or decorative animation. Variable WOFF2 files are self-hosted in `assets/fonts/`, with upstream revisions and licenses recorded there. Font faces and fallback stacks are defined in `styles.css`; `theme.scss` disables external theme font imports.

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

CardioDiT is the first project page at `projects/cardiodit/`. Publication titles link only to their configured `project_url`; records without a project page use plain titles, with Paper and Code links still available. To add the next page, create `projects/<id>/index.qmd` and set its `project_url` to `projects/<id>/`. The project render glob is already enabled. Keep IDs stable so existing publication anchors continue to work. The verifier requires each configured project URL to resolve to a page with one H1.

The CardioDiT page includes three selectable synthetic cine examples, a lazy-loaded 4D viewer, and a separate development update. Its sources and video export details are in `docs/cardiodit-project-sources.md`. Media generation is a separate authoring step; the build serves committed assets. Add project assets referenced only through JavaScript to Quarto resources so they are included in the output.

VolDiT at `projects/voldit/` includes two synthetic lung CT and two TAVI-CT examples as videos and interactive volumes, using a lazy-loaded NiiVue renderer. `assets/volumes.json` defines the available NIfTI files. The bundled renderer in `assets/vendor/niivue/` and all volume assets must remain in Quarto resources. The verifier checks the lazy import, volume sizes, NIfTI dimensions and metadata-extension exclusion. Sources, intensity conventions, export instructions and development caveats are in `docs/voldit-project-sources.md`.

## Verification and publishing

```bash
quarto render
python3 tools/verify-site.py
```

The verifier checks generated local links/assets/anchors, key routes, publication coverage, accessible social labels, draft exclusion, and palette text contrast. It does not replace browser layout/keyboard testing. `node tools/verify-homepage.mjs` remains a compatible alias.

The pull-request workflow renders and checks the site. The existing publication workflow remains manual; merging a change does not automatically publish it. After reviewing the changes, run **Publish Quarto site** from GitHub Actions to deploy to the existing GitHub Pages address.

Existing article URLs and research-note media remain intact. The excluded draft stays excluded from the public site and search.

### Shared project-page layout

VolDiT and CardioDiT share the approved September 2026 design through `assets/project-pages.css`, imported by each page's `project.css`. They use the `research-project-page` body class; the rest of the portfolio is unaffected. Inter is self-hosted, with provenance recorded in `assets/fonts/README.md`. Keep shared typography, spacing, and colors in that common stylesheet and content-specific fit adjustments in the page stylesheet.

Edit text in `projects/<project>/index.qmd`. VolDiT's five sections are `overview` (paper identity and samples), `explore`, `method`, `results`, and `resources` (including citation and ongoing work). CardioDiT has the same structure with a separate `development` section before `resources`. The title's header must keep `id="title-block-header"` so Quarto does not move the H1 outside its hero.

At desktop sizes of at least 1000 × 740 CSS pixels for VolDiT and 1200 × 740 for CardioDiT, each section occupies the viewport below the 54px navigation bar. Shorter desktop layouts reduce gaps and media size. Smaller windows and mobile use normal document flow; content is never hidden to force a fixed height. Test changes at 1440 × 900, 1366 × 768, 1920 × 1080 and a narrow mobile viewport.

Each page's `project.js` provides custom video controls, sample choices, smooth section navigation, active navigation state, and citation copying. Without JavaScript, native video controls and direct sample links remain available. Each `viewer.js` lazy-loads the renderer and supports full-volume cutaway and fullscreen. Media and scientific diagrams always use their original aspect ratios, even where the generated design reference illustrated them differently. The authoring mockups are not scientific assets.

The sample player draws the original video into three synchronized canvas columns. Each source is an 800 × 256 triptych with complete 256 × 256 planes starting at x=0, 272 and 544; only the gutters are omitted. If replacement videos use a different layout, update these coordinates in `project.js`. Anatomy is contained within each column without stretching or cropping.

### CardioDiT 4D viewer and exports

`projects/cardiodit/assets/volumes.json` lists the three sequences, dimensions, frame counts, contrast presets, and presentation playback rate. Every sequence retains the source's 256 × 256 × 6 voxels and all 32 frames. The viewer switches frames in the same volume while preserving the camera and cutaway. Playback pauses offscreen and when the browser tab is hidden. Visitors explicitly load the viewer; each compressed sequence is approximately 5–6 MiB. At most two compressed sequences are cached in memory.

For export authoring only, install NumPy and NiBabel in a separate Python environment, then run:

```bash
python tools/export-cardiodit-volumes.py \
  --source-dir /path/to/samples_final/CardioDiT/public_l4 \
  --output-dir projects/cardiodit/assets
```

The script verifies source hashes against the existing video provenance, applies the same fixed percentile window across every frame, and writes display-ready uint8 NIfTI files. It neither resamples space/time nor infers segmentation. Round-trip voxel equality, the affine, and nonconstant adjacent frames are checked. `volume-provenance.json` records source/export hashes and transformations; the site verifier checks deployed payload sizes, frame counts, and export hashes.

The sources have only six through-plane slices and do not establish anatomical orientation or a physical frame period. Therefore the viewer omits anatomical orientation labels and uses an 8 fps presentation rate, not a measured heart rate. Keep that distinction when replacing samples or editing descriptions. Slice views expose the source detail; do not add interpolated geometry and describe it as model output.
