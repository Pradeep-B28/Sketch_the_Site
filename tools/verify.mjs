// LOCKED. Run with: node tools/verify.mjs
// Must end with RESULT: ALL PASS at the start of every phase and before deploy.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const E = await import("../js/engine/sketch.js");
const { SAMPLE, sampleSketch, sampleStrokes } = await import("../js/sample-data.js");
const { CONFIG } = await import("../config.js");
const { COPY, t } = await import("../js/copy.js");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let fails = 0, passes = 0;
const check = (ok, name) => {
  if (ok) passes++;
  else { fails++; if (fails <= 40) console.log("FAIL  " + name); }
};
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const sha = (s) => createHash("sha256").update(s).digest("hex");
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const count = (text, re) => (text.match(re) ?? []).length;

// 1. Locked files have not changed. Line endings are ignored so Windows is fine.
const HASHES = {
  "js/engine/sketch.js": "67a0a46b249b8ddd6df8aa87929f884eb8dccd19aba6f116b1f288bbab06bc51",
  "js/sample-data.js": "83c9748b0b3fc7c28ae96e587766f55901b9932535b73f9b93e3d8dd6fa5395f",
  "vercel.json": "b9b9880c6f99b4a30de62fda37122a54e15e3aa372226a111dff63c58e41df10"
};
for (const [file, hash] of Object.entries(HASHES)) {
  check(sha(read(file).replace(/\r/g, "")) === hash, `Locked file was changed: ${file}`);
}

// 2. The sample sketch: the exact numbers the site and the reel show.
const S = sampleSketch();
const G = E.generate(S);
check(same(S.boxes.map((b) => b.kind), ["header", "image", "text", "text", "button"]), `sample kinds ${S.boxes.map((b) => b.kind)}`);
check(same(S.boxes.map((b) => b.kind), SAMPLE.map((x) => x[0])), "sample kinds match what was drawn");
check(same(S.boxes.map((b) => [b.x, b.y, b.w, b.h]), [[11, 9, 338, 46], [23, 73, 314, 170], [39, 261, 282, 36], [44, 306, 264, 24], [117, 355, 126, 48]]), "sample boxes");
check(G.headline === "5 boxes became 67 lines of real code.", `sample headline is "${G.headline}"`);
check(G.lines === 67 && E.lineCount(G.code) === 67 && G.boxes === 5, "sample line count");
check(same(G.counts, { header: 1, image: 1, heading: 1, text: 1, button: 1 }), `sample counts ${JSON.stringify(G.counts)}`);
check(same(G.dsa, { rows: 4, tags: 9, rules: 8 }), `sample DSA ${JSON.stringify(G.dsa)}`);
check(G.code.startsWith("<!doctype html>\n<html lang=\"en\">") && G.code.endsWith("</body>\n</html>"), "sample code shape");
check(G.code.includes('    <div class="image" style="width: 85%; height: 210px"></div>'), "sample image line");
check(G.code.includes('  <div class="row center">\n    <button class="button">Click me</button>'), "sample button is centred");
const M0 = E.missions(G.code, S);
check(M0.done === 0 && M0.total === 6 && !M0.complete && M0.headline === "0 of 6 upgrades done.", "fresh sample has 0 upgrades");
check(M0.focus === ".button" && same(M0.items.map((x) => x.id), E.MISSION_IDS), "sample missions list");
check(M0.items.every((x) => x.range && x.range.end > x.range.start), "every mission can show where to edit");
check(G.code.slice(M0.items[0].range.start, M0.items[0].range.end) === "Your heading here", "words mission points at the heading");
check(G.code.slice(M0.items[1].range.start, M0.items[1].range.end) === ".button {", "colour mission points at the button rule");
check(G.code.slice(M0.items[4].range.start, M0.items[4].range.end) === "font-family: sans-serif", "font mission points at the font");
check(E.shareText(G, M0, "https://x.test/") === "I drew 5 boxes and turned them into a real website with 67 lines of code.\nTry it: https://x.test/\n\nMade with Sketch to Site by Wrench Wise", "sample share text");
check(!E.shareText(G, M0).includes("Try it"), "share text without a link");

// 3. Each upgrade turns on with exactly the edit the site teaches, and only that one.
const EDITS = {
  words: (c) => c.replace("Your heading here", "Chennai Bakes"),
  colour: (c) => c.replace("background: #dddddd;\n      border", "background: #059669;\n      border"),
  round: (c) => c.replace("      border: 1px solid #999999;", "      border: 1px solid #999999;\n      border-radius: 12px;"),
  shadow: (c) => c.replace("      border: 1px solid #999999;", "      border: 1px solid #999999;\n      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);"),
  font: (c) => c.replace("font-family: sans-serif", "font-family: Georgia, serif"),
  hover: (c) => c.replace("  </style>", "    .button:hover {\n      background: #dddddd;\n    }\n  </style>")
};
let all = G.code;
for (const id of E.MISSION_IDS) {
  const edited = EDITS[id](G.code);
  const m = E.missions(edited, S);
  check(edited !== G.code && m.done === 1 && m.items.find((x) => x.id === id).done, `upgrade "${id}" turns on alone (${m.items.filter((x) => x.done).map((x) => x.id)})`);
  all = EDITS[id](all);
}
const M6 = E.missions(all, S);
check(M6.done === 6 && M6.complete && M6.headline === "6 of 6 upgrades done.", "all six upgrades");
check(E.shareText(G, M6, "") === "I drew 5 boxes and turned them into a real website, then coded 6 of 6 upgrades myself.\n\nMade with Sketch to Site by Wrench Wise", "share text after upgrades");
const NOT = [
  ["comment is not an upgrade", G.code.replace("/* Plain on purpose.", "/* border-radius: 9px; box-shadow: 0 0 1px red; color: red; Plain on purpose.")],
  ["zero radius is not round", EDITS.round(G.code).replace("border-radius: 12px", "border-radius: 0")],
  ["empty hover rule is not hover", G.code.replace("  </style>", "    .button:hover {\n    }\n  </style>")],
  ["same colour in capitals is not a new colour", G.code.replace("background: #ffffff", "background: #FFFFFF")],
  ["spaces only is not new words", G.code.replace("Your heading here", "Your  heading   here")],
  ["title is not visible words", G.code.replace("<title>My sketch site</title>", "<title>Chennai Bakes</title>")],
  ["text typed inside style is not words", G.code.replace("  </style>", "  hello </style>")]
];
for (const [name, code] of NOT) check(E.missions(code, S).done === 0, name);
check(E.missions(G.code.replace('class="button"', 'class="button" style="border-radius: 8px"'), S).items[2].done, "inline style counts");
check(E.missions(G.code.replace("background: #dddddd;\n      border", "BACKGROUND-COLOR : Tomato ;\n      border"), S).items[1].done, "capitals and spaces in CSS are fine");
check(E.missions("", S).done === 0 && E.missions(null, S).done === 0 && E.missions("<<<<", S).done === 0, "empty or broken code scores 0");
check(E.visibleText(G.code) === "My site Your heading here Write a line or two about your site here. Click me", "visible text of the sample");
check(same(E.parseCss("<style>a{color:red}/*x{y:z}*/ b , c { margin : 0 ; }</style>"), [{ selector: "a", decls: [{ prop: "color", value: "red" }] }, { selector: "b , c", decls: [{ prop: "margin", value: "0" }] }]), "parseCss");

// 4. The decision rules, checked against a hand-written table.
const RULES = [
  [{ x: 10, y: 10, w: 340, h: 44 }, false, false, "header"],
  [{ x: 10, y: 10, w: 340, h: 44 }, true, false, "text"],
  [{ x: 10, y: 10, w: 200, h: 44 }, false, false, "text"],
  [{ x: 10, y: 80, w: 340, h: 44 }, false, false, "text"],
  [{ x: 10, y: 0, w: 340, h: 100 }, false, false, "image"],
  [{ x: 20, y: 100, w: 300, h: 180 }, false, false, "image"],
  [{ x: 20, y: 100, w: 100, h: 80 }, false, false, "image"],
  [{ x: 20, y: 100, w: 100, h: 90 }, false, false, "image"],
  [{ x: 120, y: 380, w: 120, h: 44 }, false, false, "button"],
  [{ x: 120, y: 380, w: 170, h: 64 }, false, false, "button"],
  [{ x: 120, y: 380, w: 171, h: 64 }, false, false, "text"],
  [{ x: 40, y: 300, w: 280, h: 24 }, false, true, "text"],
  [{ x: 10, y: 10, w: 340, h: 24 }, false, true, "text"]
];
for (const [box, hasHeader, flat, want] of RULES) check(E.classify(box, hasHeader, flat) === want, `classify ${JSON.stringify(box)} gave ${E.classify(box, hasHeader, flat)}, want ${want}`);

const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
check(same(E.boxFromStroke(rect(20, 30, 100, 50)), { ok: true, box: { x: 20, y: 30, w: 100, h: 50 }, flat: false }), "box from a clean stroke");
check(same(E.boxFromStroke([[40, 300], [300, 304]]), { ok: true, box: { x: 40, y: 290, w: 260, h: 24 }, flat: true }), "a line becomes a thin text box");
check(same(E.boxFromStroke(rect(-50, -50, 600, 700)).box, { x: 0, y: 0, w: 360, h: 480 }), "strokes are kept inside the page");
check(E.boxFromStroke([[5, 5]]).reason === "small" && E.boxFromStroke(rect(5, 5, 20, 80)).reason === "small" && E.boxFromStroke([]).reason === "small", "small strokes");
for (const bad of [null, "x", [[1]], [[1, NaN], [5, 5]], [["1", 2], [3, 4]], [null, [1, 2]]]) check(E.boxFromStroke(bad).reason === "invalid", `bad stroke ${JSON.stringify(bad)}`);

let s3 = E.newSketch();
check(E.generate(s3).empty && E.generate(s3).headline === "Draw a box to start." && E.generate(s3).code === "", "empty sketch");
s3 = E.addStroke(s3, rect(10, 10, 340, 44)).sketch;
check(E.generate(s3).headline === "1 box became 25 lines of real code.", `one box wording: ${E.generate(s3).headline}`);
s3 = E.addStroke(s3, rect(10, 60, 340, 30)).sketch;
check(s3.boxes[1].kind === "text", "second top box is not a header");
check(E.setKind(s3, 2, "header").reason === "oneHeader", "only one header");
check(E.setKind(s3, 2, "video").reason === "kind" && E.setKind(s3, 99, "text").reason === "unknown", "setKind reasons");
check(E.nextKind(s3, 2) === "button" && E.nextKind(s3, 1) === "image" && E.nextKind(s3, 99) === null, "nextKind");
const before = JSON.stringify(s3);
check(E.setKind(s3, 2, "button").sketch.boxes[1].kind === "button" && E.removeBox(s3, 1).sketch.boxes.length === 1, "setKind and removeBox");
check(E.removeBox(s3, 99).reason === "unknown", "remove unknown box");
check(JSON.stringify(s3) === before, "sketches are never changed in place");
check(E.nextKind(E.removeBox(s3, 1).sketch, 2) === "button" && E.nextKind(E.setKind(E.removeBox(s3, 1).sketch, 2, "button").sketch, 2) === "header", "header is offered again once free");
let full = E.newSketch();
for (let i = 0; i < 12; i++) full = E.addStroke(full, rect(10, 10 + i * 30, 100, 28)).sketch;
check(E.addStroke(full, rect(10, 400, 100, 28)).reason === "full", "12 box limit");

// Side by side boxes share a row, sorted left to right, whatever order they were drawn in.
let row = E.newSketch();
for (const r of [rect(200, 100, 140, 120), rect(20, 110, 140, 100), rect(120, 300, 120, 44), rect(20, 20, 320, 40)]) row = E.addStroke(row, r).sketch;
const LR = E.layout(row);
check(LR.header?.id === 4 && same(LR.rows.map((r) => r.items.map((i) => i.id)), [[2, 1], [3]]), `rows ${JSON.stringify(LR.rows.map((r) => r.items.map((i) => i.id)))}`);
check(LR.rows[0].align === "" && LR.rows[1].align === "center", "row alignment");
check(E.layout(E.addStroke(E.newSketch(), rect(220, 300, 120, 44)).sketch).rows[0].align === "right", "right aligned button");

// 5. 3,000 random sketches. Every result is checked against independent counts.
let seed = 2026;
const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return Math.floor((seed / 2147483648) * n); };
for (let i = 0; i < 3000; i++) {
  let s = E.newSketch();
  const want = 1 + rnd(12);
  for (let k = 0; k < want; k++) {
    const pts = [];
    const x = rnd(380) - 10, y = rnd(500) - 10, w = rnd(360), h = rnd(3) ? rnd(300) : rnd(14);
    for (let p = 2 + rnd(30); p > 0; p--) pts.push([x + rnd(w + 1) + rnd(100) / 100, y + rnd(h + 1) + rnd(100) / 100]);
    const r = E.addStroke(s, pts);
    if (r.ok) s = r.sketch;
    else check(E.STROKE_REASONS.includes(r.reason), `sketch ${i}: stroke reason ${r.reason}`);
    if (r.ok && rnd(4) === 0) {
      const k2 = E.setKind(s, r.box.id, E.KINDS[rnd(4)]);
      if (k2.ok) s = k2.sketch;
    }
  }
  const tag = `sketch ${i}`;
  const g = E.generate(s);
  const n = s.boxes.length;
  if (n === 0) { check(g.empty, `${tag}: empty`); continue; }
  check(s.boxes.every((b) => Number.isInteger(b.x) && Number.isInteger(b.w) && b.x >= 0 && b.y >= 0 && b.w >= 24 && b.h >= 16 && b.x + b.w <= 360 && b.y + b.h <= 480), `${tag}: boxes stay on the page`);
  check(s.boxes.filter((b) => b.kind === "header").length <= 1, `${tag}: at most one header`);
  const kinds = { header: 0, image: 0, text: 0, button: 0 };
  for (const b of s.boxes) kinds[b.kind]++;
  check(g.lines === g.code.split("\n").length && g.lines === E.lineCount(g.code), `${tag}: line count`);
  check(g.headline === `${n} ${n === 1 ? "box" : "boxes"} became ${g.lines} lines of real code.`, `${tag}: headline`);
  check(count(g.code, /<header class="header">/g) === kinds.header && count(g.code, /<div class="image"/g) === kinds.image && count(g.code, /<button class="button">/g) === kinds.button
    && count(g.code, /<h1 class="heading"/g) === Math.min(1, kinds.text) && count(g.code, /<p class="text"/g) === Math.max(0, kinds.text - 1), `${tag}: one tag per box`);
  check(g.counts.header + g.counts.image + g.counts.heading + g.counts.text + g.counts.button === n, `${tag}: counts add up to the boxes`);
  const rows = count(g.code, /<div class="row/g);
  check(g.dsa.rows === rows && g.dsa.tags === n + rows && g.dsa.rules === count(g.code, /^    \S.* \{$/gm), `${tag}: DSA numbers`);
  check(count(g.code, /\{$/gm) === count(g.code, /^    \}$/gm), `${tag}: every rule is closed`);
  check(!/<script|javascript:|\bon[a-z]+=|https?:/i.test(g.code), `${tag}: code has no scripts or links`);
  check([...g.code.matchAll(/width: (\d+)%/g)].every((m) => +m[1] >= 10 && +m[1] <= 100 && +m[1] % 5 === 0) && [...g.code.matchAll(/height: (\d+)px/g)].every((m) => +m[1] >= 60 && +m[1] <= 600), `${tag}: sizes in range`);
  const ids = E.layout(s).rows.flatMap((r) => r.items.map((it) => it.id)).concat(E.layout(s).header ? [E.layout(s).header.id] : []);
  check(same([...ids].sort((a, b) => a - b), s.boxes.map((b) => b.id)), `${tag}: every box is placed once`);
  const m = E.missions(g.code, s);
  check(m.done === 0 && m.items.every((x) => x.range), `${tag}: fresh code has 0 upgrades and every hint has a place`);
  check(E.missions(g.code.replace("font-family: sans-serif", "font-family: Georgia, serif"), s).done === 1, `${tag}: font edit is seen`);
  check(same(E.decodeSketch(E.encodeSketch(s)).sketch?.boxes.map((b) => [b.x, b.y, b.w, b.h, b.kind]), s.boxes.map((b) => [b.x, b.y, b.w, b.h, b.kind])), `${tag}: save and load`);
}

// 6. Damaged saved data and odd code never break the page.
const BAD = ["", "abc", "null", "[]", "[2,[]]", "[1,{}]", "[1,[[0,0,10,10,0]]]", "[1,[[0,0,100,100,9]]]", "[1,[[0,0,100,100]]]", "[1,[[0,0,500,100,1]]]",
  "[1,[[0,0,100.5,100,1]]]", "[1,[[0,0,300,40,0],[0,50,300,40,0]]]", "[1,[" + Array(13).fill("[0,0,100,100,1]").join(",") + "]]", "x".repeat(2001), '[1,[["0",0,100,100,1]]]'];
for (const b of BAD) {
  let r;
  try { r = E.decodeSketch(b); } catch { r = "threw"; }
  check(r !== "threw" && r.ok === false && r.reason === "invalid", `bad saved sketch rejected: ${b.slice(0, 40)}`);
}
check(E.decodeSketch(null).ok === false && E.decodeSketch(undefined).ok === false, "missing saved sketch");
check(E.cleanCode(null) === null && E.cleanCode("") === null && E.cleanCode("x".repeat(20001)) === null && E.cleanCode("<p>hi</p>") === "<p>hi</p>", "cleanCode");
const t0 = performance.now();
for (const odd of ["<".repeat(20000), "/*".repeat(10000), "<style>".repeat(2800), "<style>" + "a{".repeat(9000), ' style="'.repeat(2500), "</style>".repeat(2500), "<body".repeat(4000), "}{".repeat(10000), "\u0000￿<style>a{b:c".repeat(900)]) {
  let r;
  try { r = E.missions(odd, S); } catch { r = "threw"; }
  check(r !== "threw" && r.total === 6, `odd code handled: ${JSON.stringify(odd.slice(0, 16))}`);
}
for (let i = 0; i < 2000; i++) {
  let code = "";
  for (let k = rnd(120); k > 0; k--) code += ["<", ">", "{", "}", ":", ";", "style", "/", "*", "body", " ", "a", "\n", '"', "=", "hover", "color", "#059669", "script"][rnd(19)];
  let r;
  try { r = E.missions(code, S); } catch { r = "threw"; }
  check(r !== "threw" && r.done >= 0 && r.done <= 6, `random code ${i}`);
}
check(performance.now() - t0 < 3000, "odd code is read quickly");

// 7. Copy has every reason and mission, and fills values.
for (const code of E.STROKE_REASONS) check(!!COPY.reasons.stroke[code], `stroke reason copy: ${code}`);
for (const code of E.KIND_REASONS) check(!!COPY.reasons.kind[code], `kind reason copy: ${code}`);
for (const kind of E.KINDS) check(!!COPY.kinds[kind], `kind copy: ${kind}`);
for (const id of E.MISSION_IDS) check(!!COPY.missions[id]?.title && !!COPY.missions[id]?.hint && !!COPY.missions[id]?.example, `mission copy: ${id}`);
check(t("draw.count", { count: "3", max: "12" }) === "3 of 12 boxes", "t() fills values");
check(typeof CONFIG.program.name === "string" && CONFIG.program.name.length > 10, "config program name");
check(sampleStrokes().length === 5 && sampleStrokes().every((p) => p.length > 10), "sample strokes");

// 8. Privacy and writing rules across everything built so far.
const SKIP_DIRS = new Set(["node_modules", ".git", ".vercel", "tools"]);
const walk = (dir) => readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) => {
  const path = dir ? `${dir}/${e.name}` : e.name;
  if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(path);
  return /\.(js|html|css|md|json)$/.test(e.name) ? [path] : [];
});
const files = walk("");
const NEVER = [
  ["XMLHttpRequest", /XMLHttpRequest/], ["sendBeacon", /sendBeacon/], ["WebSocket", /WebSocket/],
  ["EventSource", /EventSource/], ["innerHTML", /innerHTML|outerHTML|insertAdjacentHTML/],
  ["document.write", /document\.write/], ["eval", /\beval\(|new Function\(/],
  ["console output", /console\.\w+\(/], ["analytics", /googletagmanager|gtag\(|fbq\(|connect\.facebook|clarity\.ms|hotjar/i],
  ["outside file", /<(script|link)[^>]+(src|href)=["']https?:/i], ["web font", /fonts\.googleapis|@import\s+url\(["']?http/i],
  ["confirm or alert box", /\b(window\.)?(alert|confirm|prompt)\(/],
  ["unsafe preview", /allow-scripts|allow-same-origin|allow-top-navigation|allow-popups|allow-forms/]
];
const STORAGE_FILES = new Set(["js/store.js", "js/theme-init.js", "js/selftest.js"]);
const ENGINE_FILES = new Set(["js/engine/sketch.js", "js/sample-data.js"]);
for (const file of files) {
  const body = read(file);
  if (/\.(js|html|css)$/.test(file)) {
    for (const [name, re] of NEVER) check(!re.test(body), `${file}: ${name} is not allowed`);
    if (file !== "js/selftest.js") check(!/\bfetch\(/.test(body), `${file}: fetch is not allowed`);
    if (!STORAGE_FILES.has(file)) check(!/localStorage|sessionStorage|indexedDB/.test(body), `${file}: storage is only allowed in js/store.js`);
    if (file !== "js/preview-ui.js" && file !== "js/selftest.js") check(!/srcdoc/i.test(body), `${file}: the preview frame is only filled in js/preview-ui.js`);
    if (file.endsWith(".js") && !ENGINE_FILES.has(file) && file !== "js/selftest.js") check(!/createObjectURL/.test(body) || file === "js/code-ui.js", `${file}: downloads are only made in js/code-ui.js`);
  }
  check(!/[‒-―]/.test(body), `${file}: long dash found`);
  if (!file.endsWith(".md")) check(!/(?![©®™₹])\p{Extended_Pictographic}/u.test(body), `${file}: emoji found`);
}
for (const file of ["js/store.js", "js/theme-init.js"]) {
  if (!existsSync(join(ROOT, file))) continue;
  const keys = [...read(file).matchAll(/["'`](sts-[\w-]+)["'`]/g)].map((x) => x[1]);
  check(keys.every((k) => ["sts-theme", "sts-sketch", "sts-code", "sts-intro-seen"].includes(k)), `${file} keys: ${keys}`);
}
const CSP = JSON.parse(read("vercel.json")).headers[0].headers.find((h) => h.key === "Content-Security-Policy").value;
check(CSP.includes("connect-src 'none'") && CSP.includes("script-src 'self'") && CSP.includes("frame-src 'none'"), "vercel.json lock");
if (existsSync(join(ROOT, "index.html"))) {
  const html = read("index.html");
  check(/<meta[^>]+Content-Security-Policy[^>]+connect-src 'none'/i.test(html) && /<meta[^>]+Content-Security-Policy[^>]+script-src 'self';/i.test(html), "index.html: CSP meta tag missing");
  check(!/\sstyle=/i.test(html), "index.html: inline style attribute is not allowed in the site's own page");
  check(!/\son[a-z]+=/i.test(html), "index.html: inline event handler is blocked by the lock");
  check(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), "index.html: inline script is blocked by the lock");
  check(!/<style\b/i.test(html), "index.html: style tag is not allowed in the site's own page");
  const frames = html.match(/<iframe\b[^>]*>/gi) ?? [];
  check(frames.length === 1 && /\ssandbox(=""|='')?[\s>]/i.test(frames[0]) && /id=["']preview["']/i.test(frames[0]), 'index.html: needs exactly one <iframe id="preview" sandbox="">');
  check(/<textarea[^>]+id=["']code["'][^>]*spellcheck=["']false["']|<textarea[^>]+spellcheck=["']false["'][^>]*id=["']code["']/i.test(html), 'index.html: needs <textarea id="code" spellcheck="false">');
}

console.log(`${passes} checks passed, ${fails} failed (${files.length} files scanned)`);
console.log(fails ? "RESULT: FAILED" : "RESULT: ALL PASS");
process.exit(fails ? 1 : 0);
