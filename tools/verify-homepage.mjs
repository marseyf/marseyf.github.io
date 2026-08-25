import { existsSync, readFileSync, statSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const source = read("index.qmd");
const html = read("_site/index.html");
const researchHtml = read("_site/research.html");
const publicationsHtml = read("_site/publications.html");
const css = read("styles.css");
const asset = "posts/diffusion-models-medical-image-synthesis/assets/home-diffusion-ct.webp";
const paperAssets = [
  "assets/paper-figures/cardiodit-figure-1-framework.jpg",
  "assets/paper-figures/voldit-figure-1-framework.jpg",
  "assets/paper-figures/wad-div-figure-2-intrinsic-diversity.png",
];
const skipInclude = read("includes/skip-link.html");
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const voidElements = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

function directChildTags(document, className) {
  const classPattern = escapeRegExp(className);
  const match = document.match(new RegExp(`<div\\b[^>]*class="[^"]*\\b${classPattern}\\b[^"]*"[^>]*>([\\s\\S]*?)</div>`, "i"));
  if (!match) return [];

  const tags = [];
  let depth = 0;
  for (const tagMatch of match[1].matchAll(/<\/?([a-z][\w:-]*)\b[^>]*>/gi)) {
    const tag = tagMatch[1].toLowerCase();
    const closing = tagMatch[0].startsWith("</");
    const selfClosing = tagMatch[0].endsWith("/>") || voidElements.has(tag);
    if (closing) {
      depth -= 1;
    } else {
      if (depth === 0) tags.push(tag);
      if (!selfClosing) depth += 1;
    }
  }
  return tags;
}

function expectDirectChildren(document, className, expectedTags) {
  const actualTags = directChildTags(document, className);
  expect(
    actualTags.join(",") === expectedTags.join(","),
    `${className} must render ${expectedTags.join(", ")} as direct children, received ${actualTags.join(", ") || "none"}`,
  );
}

function hasDeclarations(selector, declarations) {
  const block = css.match(new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`, "m"))?.[1] ?? "";
  return declarations.every(([property, value]) => new RegExp(`${escapeRegExp(property)}\\s*:\\s*${escapeRegExp(value)}\\s*;?`).test(block));
}

const homepageH1Count = (html.match(/<h1\b/gi) || []).length;
const visibleHeroH1 = (html.match(/<h1 id="hero-title"/gi) || []).length;
expect(homepageH1Count === 1 && visibleHeroH1 === 1, "generated homepage must have exactly one H1, the hero research statement");
expect(html.includes("<title>Marvin Seyfarth</title>"), "homepage must retain its document title after removing the visible Quarto title block");
expect(!/<pre><code>/i.test(html), "homepage source must not render as a code block");
expect(html.includes('id="site-skip-link" class="skip-link" href="#quarto-document-content"'), "skip link must target Quarto main content");
expect(/getElementById\("quarto-header"\)[\s\S]*?header\.before\(skip\)/.test(skipInclude), "skip-link include must move the focus target before navigation");
expect(Buffer.byteLength(skipInclude) <= 8_192, "homepage-specific skip-link script exceeds the 8 KiB JavaScript budget");
expect(html.includes('id="main-content"'), "homepage must expose a main-content target");
expect(html.includes('Mikael Häggström, M.D., via Wikimedia Commons (CC0 1.0)'), "research-note preview must retain full CT provenance");
expect(html.includes("Visual treatment created with GPT Image 2"), "research-note preview must retain the GPT Image 2 visual-treatment disclosure");
expect(!source.includes("scan-ledger"), "homepage source must not retain the conceptual hero schematic");
expect(!source.includes("project-diagram"), "homepage source must not retain conceptual work schematics");
expect(!researchHtml.includes("research-mini-diagram"), "research output must not retain conceptual mini-diagrams");
expect(!html.includes("Conceptual schematic—not a result"), "homepage must not label authentic paper figures as conceptual");
expect(!researchHtml.includes("Conceptual schematic"), "research page must not label authentic paper figures as conceptual");
for (const paperAsset of paperAssets) {
  expect(existsSync(paperAsset), `missing authentic paper figure asset: ${paperAsset}`);
  if (existsSync(paperAsset)) expect(statSync(paperAsset).size > 0, `empty authentic paper figure asset: ${paperAsset}`);
  expect(html.includes(paperAsset), `homepage must include the authentic figure ${paperAsset}`);
  expect(researchHtml.includes(paperAsset), `research page must include the authentic figure ${paperAsset}`);
}
expect(html.includes("CardioDiT framework: CMR slices are encoded into a 4D latent volume"), "homepage CardioDiT figure must retain useful alt text");
expect(html.includes("VolDiT architecture from input-image encoding to 3D latent patch tokens"), "homepage VolDiT figure must retain useful alt text");
expect(html.includes("Four WAD-Div plots for chest X-ray and lung CT"), "homepage WAD-Div figure must retain useful alt text");
expect((html.match(/Open full-resolution figure/g) || []).length === 4, "homepage must expose four full-resolution paper-figure links");
expect((researchHtml.match(/Open full-resolution figure/g) || []).length === 3, "research page must expose three full-resolution paper-figure links");
expect(html.includes("Figure 1 — CardioDiT framework") && html.includes("Figure 1 — VolDiT framework") && html.includes("Figure 2 — Intrinsic dataset diversity"), "homepage must visibly caption every authentic paper figure with its figure number and source");
expect(html.includes('home-diffusion-ct.webp'), "homepage must use the compressed research-note derivative");
expect(!html.includes('diffusion-process-ct.png'), "homepage must not request the original 2.6 MB PNG");
expect(!html.includes('diffusion-process-ct.mp4'), "homepage must not request the article MP4");
expect(!/<(?:script|link|img)\b[^>]+(?:src|href)="https?:\/\//i.test(html), "homepage must not introduce external resource requests");
expect(!/\b(?:cdn|fonts\.googleapis|google-analytics)\b/i.test(html), "homepage must not introduce CDN, font, or analytics requests");
expect(statSync("styles.css").size <= 32_768, "styles.css exceeds the 32 KiB source budget");
expect(statSync(asset).size <= 163_840, "research-note derivative exceeds the 160 KiB asset budget");

expectDirectChildren(html, "evaluation-rail", ["span", "span", "span", "span", "span", "span"]);

const publicationButtonCount = (publicationsHtml.match(/class="[^"]*\bbtn-sm\b[^"]*"/gi) || []).length;
const summaryCount = (publicationsHtml.match(/<summary\b/gi) || []).length + (researchHtml.match(/<summary\b/gi) || []).length;
const navbarToolCount = (html.match(/class="[^"]*\bquarto-navigation-tool\b[^"]*"/gi) || []).length;
expect(publicationButtonCount > 0, "generated publications page must retain publication buttons");
expect(summaryCount > 0, "generated research and publications pages must retain disclosure summaries");
expect(navbarToolCount > 0, "generated homepage must retain navbar tools");
expect(hasDeclarations("summary", [["min-width", "44px"], ["min-height", "44px"]]), "all summary controls must have 44px minimum hit targets");
expect(hasDeclarations(".publication-entry .btn", [["min-width", "44px"], ["min-height", "44px"]]), "publication buttons must have 44px minimum hit targets");
expect(hasDeclarations(".publication-entry p:has(.btn)", [["display", "flex"], ["gap", "8px"]]), "adjacent publication buttons must be separated by an 8px flex gap");
expect(hasDeclarations(".navbar .nav-link", [["min-width", "44px"], ["min-height", "44px"]]), "navbar links must have 44px minimum hit targets");
expect(hasDeclarations(".navbar-toggler", [["min-width", "44px"], ["min-height", "44px"]]), "navbar toggle must have 44px minimum hit targets");
expect(hasDeclarations(".quarto-navbar-tools .quarto-navigation-tool", [["min-width", "44px"], ["min-height", "44px"]]), "Quarto navbar tools must have 44px minimum hit targets");

expect(!/scan-traverse|scan-ledger|project-diagram|research-mini-diagram/.test(css), "styles must not retain removed conceptual-schematic selectors or animation");
expect(/outline:\s*3px solid var\(--site-focus\)/.test(css), "focus treatment must use a 3px semantic outline");
expect(!/gradient/i.test(css), "visual system must not use gradients");

for (const token of ["--site-canvas", "--site-surface", "--site-surface-raised", "--site-ink", "--site-muted", "--site-line", "--site-line-strong", "--site-cyan", "--site-cyan-soft", "--site-amber", "--site-amber-soft", "--site-action-ink", "--site-focus"]) {
  expect(css.includes(token), `missing semantic theme token: ${token}`);
}

if (failures.length) {
  console.error(`Homepage verification failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "passed",
  h1Count: visibleHeroH1,
  cssBytes: statSync("styles.css").size,
  assetBytes: statSync(asset).size,
  paperAssetCount: paperAssets.length,
  publicationButtonCount,
  summaryCount,
  navbarToolCount,
}, null, 2));
