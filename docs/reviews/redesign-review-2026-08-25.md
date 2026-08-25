# Redesign review — 2026-08-25

## Verdict: REQUEST_CHANGES

No Critical findings. Three Important findings prevent approval.

## Important

### I1. Quarto rewrites several schematic layouts into a structure the CSS does not support

Locations:

- `index.qmd:119-121`, `index.qmd:134-136`, `index.qmd:171-172`
- `research.qmd:15-16`, `research.qmd:28-29`, `research.qmd:41-42`
- `styles.css:493-642`, `styles.css:827-875`

Reproduction:

1. Run `quarto render`.
2. Inspect `_site/index.html:420-454` and `_site/index.html:538-540`.
3. Inspect `_site/research.html:360-361`, `_site/research.html:382-383`, and `_site/research.html:404-405`.

Quarto wraps the inline schematic children in generated `<p>` elements. As a result, `.project-diagram--volume` receives one paragraph as its grid item; its nine empty inline `<span>` elements have no rendered grid dimensions. `.evaluation-rail` receives one paragraph as its flex/grid item, so the six criteria are not distributed by the intended desktop or mobile layout. The three research mini-diagrams have the same problem; their container-level flex/grid and gap rules operate on one paragraph rather than the labels/connectors.

Required outcome: make the rendered HTML match the intended flex/grid item structure (for example, by using a raw block that prevents paragraph insertion or by explicitly supporting the generated wrapper), then add rendered-HTML assertions for these structures. Recheck all affected schematics at 320, 768, and 1440 CSS px.

### I2. The redesign does not enforce the required 44×44 CSS-pixel target size for all controls

Locations:

- `publications.qmd:19-28` and the seven sibling publication entries
- `research.qmd:21-22`, `research.qmd:34-35`, `research.qmd:47-48`
- `styles.css:736-750`, `styles.css:878-890`
- generated theme controls, e.g. `_site/index.html:298-300`
- superficial verifier assertion at `tools/verify-homepage.mjs:42`

Rendered evidence:

- `_site/publications.html` contains 8 `.btn-sm` publication/code links and 16 disclosure summaries.
- `_site/research.html` contains 3 more disclosure summaries.
- Their project CSS adds margins, color, and `width: fit-content`, but no `min-height`, `min-width`, or equivalent hit-area padding. Bootstrap `.btn-sm` is intentionally compact.
- The Quarto theme-toggle link is not a `.navbar .nav-link`, so the navbar's `min-height: 44px` rule does not apply to it.

The verifier only checks that the stylesheet contains *some* `min-height: 44px`, so it returns a false pass while these control classes remain uncovered.

Required outcome: ensure the publication buttons, all `summary` controls, and navbar tools have computed hit areas of at least 44×44 CSS px, with at least 8 px separation for adjacent standalone controls. Replace the blanket verifier regex with element-specific or browser-computed assertions.

### I3. The homepage derivative drops part of the article-level image provenance required by the brief

Locations:

- `index.qmd:178-180`
- `posts/diffusion-models-medical-image-synthesis/index.qmd:33-35`
- brief requirement `docs/site-redesign-brief.md:280-282`

The homepage correctly identifies the real CC0 CT, author, source, deterministic noising sequence, and non-model-output status. However, the article's provenance also states: “Visual treatment created with GPT Image 2; CT pixels and diffusion states were composed deterministically.” The homepage derivative is a compressed version of that same visual composition but omits the visual-treatment disclosure.

Required outcome: carry the omitted visual-treatment provenance into the nearby homepage caption or an accessible disclosure, while preserving the existing CT/license and “not model output” statements.

## Minor

### M1. The static verifier can report a green result without validating the acceptance criterion it names

`tools/verify-homepage.mjs:42` proves only that one 44 px rule exists anywhere in CSS. Similar token checks at lines 46-48 prove names exist, not that both themes define every token correctly. Tighten these assertions while fixing I1/I2 so future regressions do not receive a false green.

## Checks that passed

- `quarto render`: successful, no missing-resource warning.
- `node tools/verify-homepage.mjs`: reported pass (`styles.css` 21,663 bytes; derivative 32,516 bytes; inline SVG 2,604 bytes / 42 elements).
- `git diff --check main...HEAD`: passed.
- Branch diff contains source/docs only; no `_site/`, `.quarto/`, or vendor output is committed; worktree remained clean after rendering.
- Local recursive `wget --spider` found no broken internal route or asset.
- Homepage source does not request the original 2.6 MB PNG or article MP4 and introduces no external resource request.
- Calculated semantic token contrast passed the specified pairs in both themes: normal text/link pairs were at least 5.75:1 in light and 7.85:1 in dark; strong rule/focus-adjacent pairs were at least 3.24:1 in light and 3.37:1 in dark.
- Featured CardioDiT, VolDiT, and WAD-Div titles/status/focus lines matched live arXiv/Springer records. All listed paper/code/source URLs returned usable records (the two Oxford DOI endpoints returned bot-protection 403 to curl but were successfully extracted separately).
- Wikimedia Commons confirms the CT source, author, and CC0 status. No new email address, affiliation, patient identifier, metric, clinical-readiness claim, or private note was found in the changed public copy.
- Reduced-motion CSS disables the scan animation and smooth scrolling while retaining the final scan-plane transform.

## Verification limitation

A real desktop/mobile keyboard, console, and automated axe run could not be completed because the browser harness reported `chrome-not-running` and no supported Chrome/Chromium/Firefox binary is installed locally. The rendered HTML/CSS was inspected directly instead, and that inspection produced I1/I2. Browser-level checks remain mandatory after those fixes.
