import { readFileSync, statSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const source = read("index.qmd");
const html = read("_site/index.html");
const css = read("styles.css");
const asset = "posts/diffusion-models-medical-image-synthesis/assets/home-diffusion-ct.webp";
const skipInclude = read("includes/skip-link.html");
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
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
expect((html.match(/Conceptual schematic—not a result/g) || []).length === 3, "every work plate must be visibly labelled as conceptual, not a result");
expect(html.includes('Conceptual 4D scan ledger'), "hero SVG must expose a programmatic name");
expect(html.includes('contains no patient data or model results'), "hero SVG must expose its non-result description");
expect(html.includes('home-diffusion-ct.webp'), "homepage must use the compressed research-note derivative");
expect(!html.includes('diffusion-process-ct.png'), "homepage must not request the original 2.6 MB PNG");
expect(!html.includes('diffusion-process-ct.mp4'), "homepage must not request the article MP4");
expect(!/<(?:script|link|img)\b[^>]+(?:src|href)="https?:\/\//i.test(html), "homepage must not introduce external resource requests");
expect(!/\b(?:cdn|fonts\.googleapis|google-analytics)\b/i.test(html), "homepage must not introduce CDN, font, or analytics requests");
expect(statSync("styles.css").size <= 32_768, "styles.css exceeds the 32 KiB source budget");
expect(statSync(asset).size <= 163_840, "research-note derivative exceeds the 160 KiB asset budget");

const svg = source.match(/<svg\b[\s\S]*?<\/svg>/i)?.[0] ?? "";
const svgElements = (svg.match(/<(?:svg|defs|pattern|path|rect|g|text)\b/gi) || []).length;
expect(svg.length > 0 && Buffer.byteLength(svg) <= 24_576, "inline SVG exceeds the 24 KiB budget");
expect(svgElements <= 80, "inline SVG exceeds the 80-element budget");
expect(/animation:\s*scan-traverse\s+2\.4s/.test(css), "hero scan traversal must be a single 2.4-second animation");
expect(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.scan-plane[\s\S]*?animation:\s*none/.test(css), "reduced-motion mode must retain a static scan-plane frame");
expect(/min-height:\s*44px/.test(css), "interactive controls must retain 44px minimum targets");
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
  inlineSvgBytes: Buffer.byteLength(svg),
  inlineSvgElements: svgElements,
}, null, 2));
