# Paper-figure replacement review — 2026-08-25

## Verdict: APPROVED

No Critical, Important, or Minor findings. Commit `0a33ccb` satisfies the authentic-figure replacement requirements.

## Authenticity and mapping

- The three source PDF SHA-256 values match `docs/paper-figure-replacement-map.md:89-93`.
- CardioDiT PDF page 3 identifies Figure 1 as the CardioDiT framework. The shipped 1358 × 930 JPEG is byte-identical to embedded page image 0 (`fc936bbcad46ae754fd2f63ae24fcb972dd30a5bff0d35f614145de4bf2cda0c`).
- VolDiT PDF page 3 identifies Figure 1 as the VolDiT framework. The shipped 1472 × 879 JPEG is byte-identical to embedded page image 0 (`2538694efb2ee246acde50dbbfdc3811472fe060d108cb68fa1eec6e642d9145`).
- WAD-Div PDF page 4 identifies Figure 2 below MS-SSIM Figure 1. Recombining embedded RGB image 2 with soft mask 3 and flattening on white produced the same decoded 1615 × 1016 RGB frame as the shipped PNG (MD5 `1862625393175c4dae2eb5b1a1f564f4`).
- Visual inspection found all three complete canvases intact. CardioDiT retains the latent-learning and 4D DiT sections; VolDiT retains the input, transformer, and gated-control branches; WAD-Div retains all four plots, row/column labels, axes, and legends. No panel or edge label is misleadingly cropped.

## Placement, semantics, and presentation

- `index.qmd:21-31` replaces the hero with CardioDiT Figure 1; `index.qmd:79-137` uses the corresponding CardioDiT, VolDiT, and WAD-Div figures for selected work.
- `research.qmd:16-63` uses CardioDiT plus VolDiT for generation and WAD-Div for evaluation; the unsupported systems mini-diagram is removed.
- Searches of source and generated HTML found no `scan-ledger`, `project-diagram`, `research-mini-diagram`, removed animation name, or conceptual-result label in the replaced locations.
- Every placement renders as a semantic linked `<img>` inside `<figure>` with useful subject-specific alt text, a visible figure-number/source caption, author/year provenance, and a separate full-resolution link. The two arXiv records and the Springer DOI resolve to the named publications.
- `_site/index.html` contains four full-resolution figure links and `_site/research.html` contains three. Local HTTP checks returned 200 for both pages and all three full-resolution assets.
- `styles.css:280-344` preserves the white figure canvas and published colors with `width: 100%`, `height: auto`, and `object-fit: contain`. The responsive rules at `styles.css:856-939` stack the hero, work cards, and research pair without fixed-height cropping.
- Caption text/link contrast is at least 6.17:1 in the light theme and 8.63:1 in the dark theme for the checked muted, link, and amber token pairs. The paper figures remain on a white matte in both themes.
- Figure links are native keyboard-focusable anchors. The global 3 px `:focus-visible` outline remains in `styles.css:82-88`; caption links retain 44 px minimum height.

## Unrelated visual regression check

- The diffusion research-note asset is unchanged before and after `0a33ccb` (SHA-256 `ea76b66106ea132c49e6f798fc6dfdd1e93ce8bb803378a2539d72e20048aca7`).
- `git blame` confirms the research-note image/caption at `index.qmd:165-169` was not changed by the paper-figure implementation.

## Verification

- `quarto render`: passed all 7 configured pages.
- `node --check tools/verify-homepage.mjs`: passed.
- `node tools/verify-homepage.mjs`: passed (`paperAssetCount: 3`, 18,411-byte CSS, 32,516-byte research-note derivative).
- Recursive local `wget --spider` from `index.html` and `research.html`: 29 resources checked; no broken internal links.
- Source/generated asset comparison: all three copied figure files are byte-identical.
- `git show --check 0a33ccb`: passed.
- Implementation commit scope is focused: three figure assets plus `index.qmd`, `research.qmd`, `styles.css`, and `tools/verify-homepage.mjs`; no generated `_site` files are committed.
- The pre-review worktree was clean. This report is the only review deliverable added by this task; the final post-commit clean-worktree check is recorded in the Kanban handoff.

## Verification limitation

The browser harness reported `chrome-not-running`, and no supported Chrome/Chromium/Firefox binary is installed. I therefore could not capture live viewport screenshots or a tab-order trace. Responsive sizing, focus treatment, light/dark presentation, and link semantics were checked from the rendered DOM/CSS; source-resolution figures were visually inspected directly. The downstream final-QA card should preserve this browser-level limitation if its environment is the same.
