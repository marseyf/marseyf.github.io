# Public site content plan

## Purpose and guardrails

This is a copy plan for the unpublished redesign. It proposes no new research results, affiliations, project availability, or professional links. Every factual statement below is traceable to the current public site in the source ledger. Labels, CTAs, and layout instructions are editorial/UI direction rather than new factual claims.

**Editorial rule:** give each landing-page card one idea, one short supporting line, and one action. Put full abstracts, author lists, methods, caveats, and technical explanations behind an existing `<details>` disclosure or on the destination page. Do not reproduce paper abstracts on overview pages.

## Global language and hierarchy

### Retain

- The site-wide topic: efficient generative models for medical imaging. [S1]
- The three research themes: efficient 3D/4D generation, evaluation, and reproducible scientific infrastructure. [S2]
- Research notes as original, reviewed public syntheses rather than exports of private material. [S5]
- The current five-item navigation and GitHub link. [S6]

### Remove or replace

- Remove `Project pages and verified public resources will be added as they are ready for release.` Do not replace it with a future-facing promise. [S2]
- Replace `For now` and `Additional professional links will be added after verification` with the current verified GitHub link alone. [S4]
- Do not surface the excluded draft titled `First article in preparation` or its topic-selection language. It is explicitly a private, excluded placeholder. [S8]
- Avoid early-stage/filler language such as *coming soon*, *will be added*, *for now*, *pipeline*, and *ready for release* in public-facing copy.

### CTA hierarchy

1. **Primary:** `Explore research` → `research.qmd` (the main entry to the stated research focus). [S1, S2]
2. **Secondary:** `Selected publications` → `publications.qmd` (the verified scholarly record). [S3]
3. **Tertiary:** `Read research notes` → `blog.qmd` (the explanatory/synthesis layer). [S1, S5]
4. **Utility:** `GitHub` → `https://github.com/marseyf` (retain in the global navigation/about contact). [S4, S6]

Use a single filled primary button per view. Make subsequent actions quiet text links or outline buttons; paper/code links remain compact per-card actions.

## Page copy plan

### Home (`index.qmd`)

**Hero replacement**

> ## Efficient 3D + 4D generative models for medical imaging
>
> I study high-resolution volumetric and temporal medical-image generation, synthetic-data evaluation, and trustworthy research workflows.

This keeps the present focus while removing repeated framing. [S1]

**Primary CTA row**

`Explore research` · `Selected publications` · `Research notes`

**Retain as three compact theme cards**

| Label | One-line copy | Action |
|---|---|---|
| `01 / Generation` | High-resolution volumetric and temporal medical imaging under practical memory and compute constraints. [S1, S2] | `Explore generation` → Research |
| `02 / Evaluation` | Assessing fidelity, diversity, memorisation, privacy, anatomy, and downstream utility. [S1] | `Explore evaluation` → Research |
| `03 / Research systems` | Connecting evidence, experiments, code, and scientific communication. [S1, S2] | `Explore research systems` → Research |

**Featured-work section**

Use heading `Selected work`, maximum three cards, and a `View all publications` link. Cards must use the facts in the project-card table below; do not add performance superlatives or outcomes beyond those source entries.

**Research-notes section**

Replace the current future tense with:

> ## Research notes
>
> Accessible, technically grounded explanations of medical generative modelling and evaluation.

Then show the existing listing; do not promise a future publishing cadence. [S5]

### Research (`research.qmd`)

**Intro replacement**

> ## Research directions
>
> Efficient and trustworthy generative modelling for medical imaging.

[S2]

**Direction cards**

| Label | One-line copy | Keep expandable |
|---|---|---|
| `3D + 4D generation` | Synthesising high-resolution volumetric and temporal data under realistic memory and compute constraints. [S2] | Method distinctions, model architecture, and examples. |
| `Evaluation beyond realism` | Evaluating diversity, memorisation, privacy, anatomical validity, and downstream utility alongside fidelity. [S2] | Metric definitions, limitations, and use-case-specific evaluation detail. |
| `Scientific infrastructure` | Linking literature, code, experiments, evaluation, and communication reproducibly. [S2] | Workflow/process details and only verified public resources. |

End with `Selected publications` and `Research notes` actions. Delete the current release/readiness sentence rather than replacing it. [S2]

### Publications (`publications.qmd`)

**Opening replacement**

> ## Publications
>
> Verified scholarly publications, with paper links and public code links where an exact repository is available.

[S3]

**Card treatment**

- Keep reverse chronological grouping, paper links, code links when verified, and the explicit unavailable-code state. [S3]
- Reduce each closed card to: title; year; venue/status; a 7–16-word research-focus line; `Paper`; and `Code` or `No public code repository`.
- Keep complete authors and the official abstract expandable. This preserves the existing evidence without forcing abstracts into the scan path. [S3]
- Retain exact venue/status wording in the expanded metadata when it is a preprint, abstract supplement, or version of record. [S3]

### About (`about.qmd`)

**Replacement**

> ## About
>
> Marvin Seyfarth researches efficient generative models for medical imaging.
>
> This site brings together research themes, publications, projects, and research notes, with technical ideas presented alongside evidence, limitations, and practical context.
>
> **Contact**: [GitHub](https://github.com/marseyf)

[S4]

Do not add an affiliation, email address, social profile, or an implied future contact channel.

### Research notes / Blog (`blog.qmd`)

**Replacement intro**

> Original, reviewed syntheses of medical generative modelling and evaluation. Articles are public-facing explanations, not direct exports of private research notes.

[S5]

Keep the grid listing, categories, and feed. [S5] Use `Research note` as the card eyebrow; let the title and existing description carry the topic. The currently published article can be labeled `Foundations` because it describes denoising, conditioning, latent spaces, and evaluation; do not use this label to imply a series or a future schedule. [S7]

## Project-card facts for featured work

These are the only proposed featured-work facts. Use the exact titles as card titles; shorten only the supporting focus line. The final site must retain the destination URLs already present in the publications page.

| Card label | Exact title | Compact, sourced focus line | Status / actions | Source |
|---|---|---|---|---|
| `4D cardiac MRI` | `CardioDiT: Latent Diffusion Transformers for 4D Cardiac MRI Synthesis` | A fully 4D latent-diffusion framework for short-axis cine CMR synthesis. | arXiv preprint; `Paper`; `Code`. | [S3] |
| `Volumetric synthesis` | `VolDiT: Controllable Volumetric Medical Image Synthesis with Diffusion Transformers` | Transformer-based 3D medical-image synthesis with mask-based spatial control. | arXiv preprint; `Paper`; `Code`. | [S3] |
| `Diversity evaluation` | `Rethinking Diversity Metrics in Medical Imaging with Wasserstein Distance` | A feature-space diversity metric for medical-image datasets. | BVM Workshop 2026 version of record; `Publication`; `No public code repository`. | [S3] |

Optional fourth card only if layout needs it:

| Card label | Exact title | Compact, sourced focus line | Status / actions | Source |
|---|---|---|---|---|
| `Privacy` | `Unconditional latent diffusion models memorize patient imaging data` | An assessment of patient-data memorization in unconditional latent diffusion models. | Nature Biomedical Engineering version of record; `Publication`; `Code`. | [S3] |

## What remains expandable or destination-only

- **Publication cards:** full author lists, official abstracts, detailed venue/status, and precise availability statements. [S3]
- **Research-direction cards:** methodological detail, metric definitions, limitations, and workflow detail. [S2]
- **Research notes:** equations, citations, technical notes, interactive visualisation context, and the article’s qualification that synthetic medical images should not be called privacy-preserving or clinically ready without explicit evidence. [S7]
- **Do not expand on overview pages:** claims of improved performance, clinical readiness, privacy preservation, or project availability. Those need their full scoped source context. [S3, S7]

## Source ledger

| ID | Current-site source | Evidence used |
|---|---|---|
| S1 | `index.qmd` lines 8–38 | Homepage research statement, themes, and current CTAs. |
| S2 | `research.qmd` lines 6–20 | Three research directions and current future-facing release sentence. |
| S3 | `publications.qmd` lines 3–134 | Publication descriptions, titles, author/venue/status metadata, paper/code links, abstracts, and code availability. |
| S4 | `about.qmd` lines 5–11 | Identity statement, site purpose, verified GitHub contact, and future-link phrasing. |
| S5 | `blog.qmd` lines 2–14 | Notes page description, listing settings, and public/reviewed/private-boundary language. |
| S6 | `_quarto.yml` lines 12–40 | Navigation labels and GitHub URL. |
| S7 | `posts/diffusion-models-medical-image-synthesis/index.qmd` lines 2–30, 59–68, 135–151 | Published-note title/description, foundation topics, expandable technical note, educational visualisation context, privacy/clinical caveats. |
| S8 | `posts/first-article/index.qmd` lines 2–9 | Draft/placeholder status and exclusion from the public site. |

## Acceptance check for implementation

- No public overview copy retains early-stage or placeholder wording listed above.
- Every overview claim either appears verbatim in the cited source or is a shorter, non-strengthening paraphrase of it.
- Overview cards contain one idea and one action; details move to existing disclosures/destination pages.
- Any visual using the existing CT diffusion asset preserves its existing context: it is a real source CT and an educational visualisation, not generated clinical output. [S7]
- No production page is changed by this content-planning task.
