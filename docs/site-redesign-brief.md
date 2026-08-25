---
version: alpha
name: Spatiotemporal Field Notes
description: A scientific editorial system with the precision of an imaging console and the restraint of a methods paper.
colors:
  primary: "#00687A"
  secondary: "#8A4B00"
  neutral: "#F4F2EC"
  ink: "#141A1C"
  muted: "#526064"
  surface: "#FBFAF6"
  white: "#FFFFFF"
  dark-canvas: "#0B1012"
  dark-ink: "#EFF4F2"
  dark-muted: "#ACB8B5"
  dark-primary: "#65D4E6"
  dark-secondary: "#F1B65E"
typography:
  display:
    fontFamily: Iowan Old Style
    fontSize: 6rem
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.035em"
  heading:
    fontFamily: Iowan Old Style
    fontSize: 3.5rem
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  body-md:
    fontFamily: system-ui
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: ui-monospace
    fontSize: 0.75rem
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.08em"
rounded:
  sm: 2px
  md: 4px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  4xl: 96px
components:
  button-primary-light:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: 12px
  link-light:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
  body-light:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
  secondary-text-light:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.muted}"
    typography: "{typography.body-md}"
  sampling-label-light:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.secondary}"
    typography: "{typography.label}"
  surface-copy-light:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
  button-primary-dark:
    backgroundColor: "{colors.dark-primary}"
    textColor: "{colors.dark-canvas}"
    rounded: "{rounded.sm}"
    padding: 12px
  body-dark:
    backgroundColor: "{colors.dark-canvas}"
    textColor: "{colors.dark-ink}"
    typography: "{typography.body-md}"
  secondary-text-dark:
    backgroundColor: "{colors.dark-canvas}"
    textColor: "{colors.dark-muted}"
    typography: "{typography.body-md}"
  link-dark:
    backgroundColor: "{colors.dark-canvas}"
    textColor: "{colors.dark-primary}"
    typography: "{typography.body-md}"
  sampling-label-dark:
    backgroundColor: "{colors.dark-canvas}"
    textColor: "{colors.dark-secondary}"
    typography: "{typography.label}"
---

# Site redesign brief: Spatiotemporal Field Notes

## 1. Intent and source-grounded constraints

The site should feel like a methods paper laid across a calibrated imaging console: editorial typography, precise rules, coordinate labels, flat instrument panels, and a small amount of purposeful motion. The visual language must communicate dimensionality, time, sampling, and evaluation without pretending that a decorative schematic is a clinical result.

This direction is original to the site. It borrows broad principles from scientific publishing and lab instrumentation—not the identity or component system of another organization.

### Current implementation and factual source material

- The site is a Quarto website configured in `_quarto.yml`, with `flatly`/`darkly` Bootstrap themes and one global `styles.css` override.
- The current homepage already states the defensible scope: efficient 3D/4D generation, synthetic medical-image evaluation, and reproducible research workflows. Preserve or tighten this public copy; do not expand it into clinical, deployment, privacy, or performance claims.
- Existing verified routes are Home, Research, Publications, Blog/Research Notes, and About. The redesign may improve labels and hierarchy but must not create empty destinations.
- `publications.qmd` is the source of truth for project names, author lists, venue/status text, links, and reported results. Homepage summaries must be traceable to that file or to the separately approved content plan.
- The repository has no general-purpose portrait, lab, or project-result image set. Do not fill this gap with stock medical imagery or generated “results.” Use authored conceptual diagrams and label them as such.

### Available public assets

| Asset | Current facts | Permitted redesign use |
| --- | --- | --- |
| `posts/diffusion-models-medical-image-synthesis/assets/diffusion-process-ct.png` | 1920×1080; 2,596,645 bytes; real CC0 axial CT shown through a deterministic noising sequence; cyan forward path and amber idealized reverse path | A Research Notes preview only, with the article's existing provenance and “not model output” framing. Never present it as a project result. Create a responsive derivative before homepage use. |
| `posts/diffusion-models-medical-image-synthesis/assets/diffusion-process-ct.mp4` | 1,308,660 bytes; article animation | Keep on the article page. Do not autoplay or load it on the homepage. |
| `tools/diffusion-visuals/public/diffusion-editorial-backdrop.png` | 1672×941; 2,023,106 bytes; dark particle field with cyan/amber trajectories and five empty frames | Mood/reference source only. It is too heavy and too presentation-like to become the homepage hero unchanged. Rebuild the useful geometry as a lightweight inline SVG. |
| `tools/diffusion-visuals/public/ct-normal-brain-axial-25.png` and the corresponding article source asset | 155,693 bytes for the tools copy; a real CT whose provenance is documented in the article | Do not reuse outside the credited article context unless the attribution travels with it. |

### Anti-direction

Do not use blurred AI gradients, glassmorphism, glowing orbs, rainbow accents, floating pill cards, fake scanner controls, decorative patient data, stock hospital photography, animated noise clouds, or invented metrics. There is no gradient token in this system. Depth comes from rules, value changes, and spatial offset—not shadows.

## 2. Art direction

**Name:** Spatiotemporal Field Notes

**Visual thesis:** A warm off-white editorial field carries the research narrative. Graphite type and hairline rules provide paper-like structure. Cyan identifies observation, measurement, navigation, and the known forward path. Amber identifies synthesis, sampling, and the reverse path. Monospaced labels behave like figure annotations; a restrained serif gives the research statement the authority of an article headline.

The system has three recurring visual ideas:

1. **Volume as stacked planes:** offset rectangular slice frames create depth without literal anatomy.
2. **Time as a registered rail:** repeated frames use `t0…t4`, a baseline, and a moving scan plane—not a generic carousel.
3. **Evaluation as calibration:** ticks, reference lines, and named criteria make evaluation visible without displaying fabricated scores.

A section should use no more than one of these ideas at high signal. Whitespace and typography should do most of the work.

## 3. Color tokens

These values are normative. Implement them as semantic CSS custom properties so Quarto light/dark themes swap values without changing component rules.

| Semantic token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--site-canvas` | `#F4F2EC` | `#0B1012` | Page field |
| `--site-surface` | `#FBFAF6` | `#121A1D` | Section or instrument panel |
| `--site-surface-raised` | `#FFFFFF` | `#192326` | Navigation, focused/selected plate |
| `--site-ink` | `#141A1C` | `#EFF4F2` | Primary text |
| `--site-muted` | `#526064` | `#ACB8B5` | Secondary text and metadata |
| `--site-line` | `#C8D0CE` | `#344347` | Hairlines and grids |
| `--site-line-strong` | `#7B898B` | `#64767A` | Axes, active dividers, non-text controls |
| `--site-cyan` | `#00687A` | `#65D4E6` | Links, focus, observed/forward path, primary CTA |
| `--site-cyan-soft` | `#DCEDEF` | `#16343B` | Selected measured/observed region |
| `--site-amber` | `#8A4B00` | `#F1B65E` | Sampled/reverse path and small labels |
| `--site-amber-soft` | `#F2E4CE` | `#3A2B16` | Sampled/generative region |
| `--site-action-ink` | `#FFFFFF` | `#081012` | Text on cyan primary controls |
| `--site-focus` | `#00687A` | `#65D4E6` | Keyboard focus outline |

Rules:

- Cyan is the only general interaction color. Amber is semantic, not a competing CTA color.
- Every cyan/amber distinction also needs a text label, shape, or direction marker.
- Body links are underlined. Hover may increase underline thickness; it must not be color-only.
- Primary buttons use `--site-cyan` with `--site-action-ink`. Secondary actions are transparent with a 1px strong rule.
- Card/surface depth uses background changes and 1px lines. No drop shadows.
- Required text/background pairs must pass WCAG AA: 4.5:1 for normal text, 3:1 for large text. Focus indicators and meaningful diagram strokes must reach 3:1 against adjacent colors.

## 4. Typography

No external font or CDN request is allowed. Use system-resident stacks and let font metrics degrade gracefully.

```css
--font-display: "Iowan Old Style", "Palatino Linotype", "URW Palladio L", Palatino, Georgia, serif;
--font-body: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
--font-data: ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace;
```

| Role | Token | Size / leading | Weight / tracking | Use |
| --- | --- | --- | --- | --- |
| Display | `--type-display` | `clamp(3rem, 6vw, 6rem)` / `0.95` | 400 / `-0.035em` | Homepage H1 only |
| Section | `--type-section` | `clamp(2rem, 3.4vw, 3.5rem)` / `1.02` | 400 / `-0.025em` | Major H2 headings |
| Subhead | `--type-subhead` | `clamp(1.2rem, 1.8vw, 1.5rem)` / `1.25` | 600 / `-0.01em` | H3 and project titles; body stack |
| Lead | `--type-lead` | `clamp(1.1rem, 1.6vw, 1.3rem)` / `1.55` | 400 / normal | Research statement |
| Body | `--type-body` | `1rem` / `1.65` | 400 / normal | Reading text |
| Small | `--type-small` | `0.875rem` / `1.5` | 400 / normal | Metadata |
| Data label | `--type-label` | `0.75rem` / `1.3` | 600 / `0.08em` | Short uppercase figure/axis labels |

Rules:

- Serif is reserved for the H1, major H2s, and at most one pull statement. Body, navigation, controls, and project titles remain sans serif.
- Monospace labels are annotations, not paragraphs. Keep them to a short line and never below 12px.
- Target body line length is 58–68 characters; never exceed 72 characters for continuous prose.
- Use sentence case. Do not create all-caps headings; uppercase is reserved for short data labels.
- Rely on size, position, and rules before adding font weight or boxes.

## 5. Spacing, grid, and shape tokens

```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-24: 6rem;    /* 96px */
--site-gutter: clamp(1rem, 4vw, 2.5rem);
--site-max: 76rem;
--measure: 68ch;
--radius-s: 2px;
--radius-m: 4px;
```

- Use a 12-column desktop grid with a `clamp(1rem, 2vw, 1.5rem)` gap.
- Align the navbar, hero copy, section labels, and footer to the same max-width grid.
- Desktop hero: copy spans 7 columns; visual spans 5. Project plates use an asymmetric 7/5 or 6/6 composition rather than three equal SaaS cards.
- Major sections use `clamp(4rem, 9vw, 7rem)` block padding. Internal component padding is 16–32px.
- Components are rectangular. Use 2px on controls and 4px only on large media frames. Do not use pills.
- Default separation is a 1px rule. A 2px rule denotes the active dimension, selection, or focus—not decoration.

## 6. Homepage information hierarchy

The homepage should answer, in order: **What is the research? How is it organized? What work is public? How can I go deeper?**

### 0. Global navigation

Keep the existing routes and GitHub link. Use a 48–56px pinned bar with a solid canvas/surface background and a bottom hairline; no translucent blur. Keep the theme control supplied by Quarto. Include a visible-on-focus skip link before navigation.

### 1. Hero: research statement + 4D scan ledger

- Data label: `3D + 4D GENERATIVE MEDICAL IMAGING`.
- One H1: “Efficient generative models for medical imaging.” This is existing public copy, not a new claim.
- Lead: a tightened version of the existing sentence covering efficient 3D/4D generation, evaluation beyond realism, and trustworthy/reproducible workflows.
- Primary CTA: **Explore research** → `research.qmd`.
- Secondary CTA: **View publications** → `publications.qmd`.
- Right-side visual: the authored **4D scan ledger** described in section 7. It must never resemble a diagnostic viewer or imply patient-specific data.

At 1440px the hero should land within the first viewport without forcing a fixed `100vh`. At 320px the H1 may wrap to four lines, but no word or CTA may clip.

### 2. Research coordinates

Present the three existing themes as three ruled rows, not generic icon cards:

1. **Volume + time** — efficient high-resolution 3D and 4D generation.
2. **Evaluation beyond realism** — diversity, memorisation/privacy, anatomy, and downstream utility.
3. **Research systems** — reproducible links between evidence, experiments, code, and communication.

Each row has a coordinate label (`X/Y/Z/T`, `EVAL`, `TRACE`), a short heading, no more than two lines of supporting copy, and a text link where a real destination exists. The labels are navigational metaphors, not measurements.

### 3. Selected work

Use an asymmetric set of three diagram-led research plates. The preferred public set is CardioDiT (4D), VolDiT (3D), and WAD-Div (evaluation), because all three are already verified in `publications.qmd`. If the approved content plan selects different work, preserve the roles “4D / 3D / evaluation” and source every claim from that plan.

Each plate contains:

- an authored, explicitly labeled **Conceptual schematic—not a result**;
- verified project/publication title and venue/status;
- one factual sentence, at most 28 words;
- at most three short method/theme tags;
- direct publication and code links only where `publications.qmd` verifies them.

Never place a fabricated metric in a plate. Never recolor a real CT and present it as generated output. Diagram grammar:

- CardioDiT: registered slice outlines repeated across `t0…t4`;
- VolDiT: a volume subdivided into patch/token planes;
- WAD-Div: two unlabeled distributions connected by a distance bracket, with no numeric score.

### 4. Evaluation lens

Create one full-width calibration rail naming the site's evaluation concerns: fidelity, diversity, memorisation, privacy, anatomy, and downstream utility. This is a conceptual index, not a dashboard. Use text and tick positions without scores, gauges, red/green verdicts, or implied clinical thresholds. Link to the relevant research/publication destination if the content plan provides one.

### 5. Research note feature

Feature the existing diffusion-models article as one editorial split: compressed still on one side, title/description and **Read the research note** on the other. Preserve the image's article-level caption/provenance nearby or in an accessible disclosure. The homepage must load a derivative, not the 2,596,645-byte source PNG or the MP4.

### 6. Closing route

End with a restrained two-line closing: a short About statement and the verified GitHub contact route. Do not add an email address, affiliation, availability badge, newsletter form, collaborator logo strip, or social proof unless separately verified.

## 7. Signature visual and motion concepts

### 4D scan ledger (hero)

Build as inline SVG or semantic HTML/CSS, ideally under 16 KiB:

- five offset rectangular planes on a fine 8px/16px grid;
- one contour that changes subtly across `t0…t4` to suggest time, not anatomy;
- labeled `x`, `y`, `z`, and `t` axes;
- a cyan observed/forward rail and amber sampled/reverse rail, each named in text;
- a calibration baseline with non-numeric ticks;
- one scan plane that traverses the stack once and stops at the central frame.

The graphic must include `<title>` and `<desc>` if it conveys content. The description must call it a conceptual illustration and say that it contains no patient data or model results. If the surrounding text already communicates all meaning, mark purely decorative sublayers `aria-hidden="true"`.

### Motion posture

- On initial load, the hero scan plane moves once for 2.4s with `cubic-bezier(0.22, 1, 0.36, 1)` and stops. No infinite animation.
- The five time contours may resolve from noise to linework during the same single sequence, using only `opacity`, `transform`, or `stroke-dashoffset`.
- Link underline and panel state transitions use 120–180ms. Do not animate layout dimensions, blur, box-shadow, background particles, or scroll position.
- Scroll-triggered reveal is unnecessary. If the implementation uses an observer, it may only start the one-shot ledger when the hero first enters the viewport; it must not repeatedly replay.
- Motion must explain dimensional traversal or state change. It must not delay reading or be required to understand the page.

### Section and card motifs

- Coordinate rails can extend by 8px on hover/focus to show interactivity.
- Project diagrams may highlight the relevant plane/rail on card hover and keyboard focus; the title and link remain visible without interaction.
- Use one small cyan square for observed/input and one amber triangle for sampled/output. Repeat these shapes consistently and include a visible legend when both appear together.

## 8. Responsive, theme, and reduced-motion behavior

### Responsive behavior

- **≥64rem:** 12-column grid; hero 7/5; asymmetric project composition.
- **48–63.99rem:** 8-column grid; hero copy full width with visual below at max 36rem; project plates may use 4/4 pairs.
- **<48rem:** one column; 16px minimum side gutter; all project plates and research rows stack; metadata moves below diagrams.
- The hero visual uses `aspect-ratio: 4 / 3` and scales with the container. Labels may shorten, but axes and the “conceptual” description must remain.
- At 320 CSS px there must be no horizontal page scroll. Long publication titles, URLs, and mono labels must wrap safely.
- Interactive targets must be at least 44×44 CSS px with at least 8px between adjacent standalone controls.
- Do not hide research content on mobile; change composition, not information.

### Theme behavior

- Use Quarto's existing light/dark mechanism. Components consume only the semantic `--site-*` tokens.
- Default should follow the current site/user preference. Do not force dark mode because the visual references an imaging console.
- The warm light field and blue-black dark field must feel like the same system: same rules, spacing, type, and semantic cyan/amber roles.
- Native controls and SVG labels must inherit theme tokens rather than hard-coded light colors.

### `prefers-reduced-motion`

Under `@media (prefers-reduced-motion: reduce)`:

- set the scan plane at its final central position;
- reveal all contour/ledger information immediately;
- remove nonessential animation and transition durations;
- override smooth scrolling with `scroll-behavior: auto`;
- do not autoplay video or animated images.

The static frame must preserve the full volume/time story. Reduced motion is not a blank or simplified placeholder.

## 9. Accessibility and performance budgets

### Accessibility budget

- Exactly one page H1; section headings follow H2 → H3 order.
- All navigation and CTAs are keyboard reachable in a logical DOM order; visual reordering must not change reading order.
- Focus uses a visible 3px `--site-focus` outline with at least 2px offset and is never removed.
- Normal text contrast ≥4.5:1; large text and meaningful UI/diagram boundaries ≥3:1.
- Links in prose are underlined; active/selected states use text or shape in addition to color.
- Informative SVGs have a programmatic name and description. Decorative SVG layers are hidden from assistive technology.
- Conceptual images are visibly labeled. Real medical imagery retains provenance and unambiguous “real/source/generated” status.
- No hover-only content, focus traps, scroll-jacking, flashing, or motion required for comprehension.
- Browser zoom at 200% must preserve content and actions without overlap or two-dimensional scrolling at a 1280×720 viewport.

### Performance budget for new homepage work

Budgets are measured on authored source additions; the existing Quarto/Bootstrap vendor baseline is tracked separately.

- `styles.css` total uncompressed size: **≤32,768 bytes**.
- Homepage-specific JavaScript total uncompressed size: **≤8,192 bytes**; zero JS is preferred.
- All new inline homepage SVG markup combined: **≤24,576 bytes** and **≤80 rendered SVG elements**.
- Any new homepage raster derivative: **≤163,840 bytes each**; all homepage-specific raster assets combined: **≤307,200 bytes**.
- New external requests: **0**. No CDN, webfont, analytics, framework, or remote hero asset.
- Homepage autoplay media: **0**. The existing MP4 remains article-only.
- Animate only `transform`, `opacity`, or SVG stroke properties. Avoid CSS filters and large paint-heavy shadows.
- Hero text must remain the LCP candidate where practical; the schematic is inline and must not block it.

## 10. Exact implementation acceptance checks

The implementation task is accepted only when all checks below pass.

### Source and factual integrity

- [ ] Only approved source files are changed; `_site/`, `.quarto/`, vendor, and other generated output remain untracked/uncommitted.
- [ ] Homepage copy and work selections trace to `index.qmd`, `research.qmd`, `publications.qmd`, the existing published article, or the approved content plan.
- [ ] No new result, affiliation, role, clinical claim, privacy claim, metric, testimonial, or availability statement appears.
- [ ] Any conceptual visual is labeled “Conceptual schematic” and cannot be mistaken for patient data or model output.
- [ ] Any real CT preview retains the article's provenance/status context and uses a compressed derivative.

### Visual system

- [ ] Light and dark modes implement every semantic color token in section 3; components do not maintain separate ad hoc palettes.
- [ ] Cyan is used for interaction/observed-forward semantics and amber only for sampled-reverse semantics.
- [ ] There are no gradients, glass surfaces, glow effects, pill-shaped cards, stock photos, or generic icon grids.
- [ ] Serif/ sans/mono roles match section 4; no external font request is made.
- [ ] The grid, 76rem max width, spacing scale, 2px/4px radii, and rule-based depth are evident at 1440px.

### Content hierarchy

- [ ] DOM order is navigation → hero → research coordinates → selected work → evaluation lens → research note → closing route/footer.
- [ ] The hero has one H1, a defensible lead, Explore Research and View Publications CTAs, and the 4D scan ledger.
- [ ] Research coordinates preserve the three existing themes.
- [ ] Selected work contains one 4D, one 3D, and one evaluation plate, with verified links and no fabricated numbers.
- [ ] The evaluation rail names criteria without scores or implied thresholds.

### Interaction and accessibility

- [ ] Keyboard-only testing reaches skip link, navigation, theme control, CTAs, project links, note link, and footer in a logical order.
- [ ] Every interactive element shows the 3px/2px-offset focus treatment in both themes.
- [ ] Automated accessibility testing reports zero critical or serious issues; manual heading, link-purpose, and SVG-name checks pass.
- [ ] Tested text/background token pairs meet WCAG AA; meaningful diagram strokes and focus indicators meet 3:1.
- [ ] At 200% zoom on 1280×720, no text/action overlaps or becomes unreachable.

### Responsive and motion

- [ ] At 320×568, 768×1024, and 1440×900, there is no horizontal page scroll, clipping, overlap, or off-screen CTA.
- [ ] All tap targets are at least 44×44 CSS px.
- [ ] The scan ledger plays once for 2.4s and ends on a legible central frame; no animation loops indefinitely.
- [ ] With reduced motion enabled, animation/smooth scrolling are disabled and the complete static ledger remains visible.
- [ ] Theme switching does not flash unreadable text or leave hard-coded light/dark SVG colors.

### Build and performance

- [ ] `quarto render` exits successfully with no missing-resource warning.
- [ ] Generated homepage HTML contains no unexpected external font, CDN, analytics, or framework request.
- [ ] Source-size checks satisfy every byte/element budget in section 9.
- [ ] The 2,596,645-byte PNG and 1,308,660-byte MP4 are not requested by the homepage.
- [ ] Browser inspection in both themes shows no console error and no broken image/SVG resource.
- [ ] `git diff --check` passes, and the implementation commit contains source files only.

## 11. Handoff priority

If implementation time is constrained, preserve this order: (1) hierarchy and factual integrity, (2) typography/grid/tokens, (3) accessible 4D ledger, (4) responsive and reduced-motion behavior, (5) secondary hover polish. Do not trade correctness, legibility, or payload budgets for extra animation.
