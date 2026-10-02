# Maintaining the portfolio

The site stays on Quarto and GitHub Pages. Install Quarto and Python 3, then use `quarto preview` or `quarto render`. No Python packages or JavaScript dependency installation are required for the website.

## Shared content

Edit `_data/site.json` for the profile, News, and Talks & Outreach. Edit `_data/publications.json` for papers. Quarto's pre-render hook runs `tools/build-content.py`; the `portfolio` shortcode inserts the resulting HTML. `_generated/` is build output and should not be edited or committed.

The slate homepage follows five screens: introduction and latest news, two publication screens, News, and Talks & Research Notes. At standard desktop sizes (1366 × 768 and larger), each screen fills the viewport below the navigation. Smaller windows use natural document flow. Expanding News may lengthen its screen. Section links scroll smoothly unless the visitor requests reduced motion.

Homepage-only copy and presentation settings live in the `homepage` object in `_data/site.json`: the second About paragraph, featured milestone, publication order, short talk preview, and research note. The shared profile, news records, talks, and publications remain the source of their corresponding content. `tools/homepage.py` renders the homepage; the archive includes still come from `tools/build-content.py`. News initially shows three records; the centered button reveals older records above itself. If JavaScript is unavailable, every record is visible. Existing About, News, Publications, and article URLs remain available.

ISO dates (`YYYY-MM-DD`) keep sorting reliable; the upcoming talk label is calculated at build time. Rebuild after an event to update that label. Resource links appear only when a URL is supplied.

### Typography

The homepage uses self-hosted Source Sans 3, flat slate backgrounds, and pale teal accents. Its desktop type scale is fixed by role: name 52 px, section headings 36 px, subheadings 24 px, item titles 20 px, body 17 px, metadata/authors 14 px, and controls 15 px. Headings use semibold weight with restrained tracking; descriptive copy uses regular weight. Mobile reduces the larger heading sizes and keeps body text at 16 px. Do not introduce viewport-dependent desktop scaling or per-section font sizes. Its CSS and small progressive-enhancement script are isolated in `assets/homepage.css` and `assets/homepage.js`, loaded only by the homepage. At shorter desktop heights, publication resource links sit alongside author lines to preserve readable text and viewport fit.

The archive pages retain Source Serif 4 and Source Sans 3 through `styles.css`. Project pages retain their independent shared stylesheet, `assets/project-pages.css`. Do not change those styles to adjust the homepage. Font provenance and licenses are recorded in `assets/fonts/`.

### Portrait and social icons

The homepage uses the original uploaded portrait at `assets/profile.png`, displayed at its original 3:4 aspect ratio without cropping or image generation. To replace it, supply an actual portrait, update `profile.portrait` and `profile.portrait_alt`, and update the intrinsic dimensions in `tools/homepage.py` if needed. Keep the original asset unless a replacement is explicitly requested.

The `linkedin`, `lab_github`, and `github` values control labeled icon links in the homepage navigation, contact band, and About archive. A null value hides the corresponding icon. Icons have accessible names and native hover tooltips.

### News

Append an object with `date`, `title`, `text`, and `url` to `news`. Use an actual announcement or publication date, not an inferred conference acceptance date. The initial records were checked against the linked arXiv and publisher pages. An optional `homepage_text` supplies a shorter homepage summary while the archive keeps the full `text`. The featured milestone has no invented acceptance date and is edited separately under `homepage.milestone`.

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

Each publication has a stable `id`, authors, summary, abstract, citation, type, and resource URLs. `year` is the citation year. Conference year and online date can differ; preserve those in the citation and optional date fields. The publication archive uses descending citation year, then data-file order within each year. The homepage displays every paper in groups of four, ordered by `homepage.publication_order`, with concise author lines and separate Paper/Code links. New records omitted from that order are appended automatically; update the order when curating the next screen. Full author lists, abstracts, and citations remain in the shared data and archive. The earlier `featured` fields are retained as metadata but do not restrict the homepage list.

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
