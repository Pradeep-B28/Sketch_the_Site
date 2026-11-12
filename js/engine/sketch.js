// LOCKED. Do not edit. Sketch to Site engine: no DOM, no network, no storage.
// A sketch is a list of boxes on a 360 x 480 page. Sketches are never changed in place.
// Every change returns a new sketch, which makes undo easy.

export const PAGE = { w: 360, h: 480 };
export const LIMITS = { boxes: 12, minSize: 24, flat: 16, points: 20000, codeLength: 20000 };
export const KINDS = ["header", "image", "text", "button"];
export const STROKE_REASONS = ["small", "full", "invalid"];
export const KIND_REASONS = ["unknown", "kind", "oneHeader"];
export const MISSION_IDS = ["words", "colour", "round", "shadow", "font", "hover"];
export const DEFAULT_TEXT = {
  header: "My site",
  heading: "Your heading here",
  text: "Write a line or two about your site here.",
  button: "Click me"
};
export const FILE_NAME = "my-sketch-site.html";

const DEFAULT_COLOURS = new Set(["#222222", "#ffffff", "#eeeeee", "#dddddd"]);
const fail = (reason) => ({ ok: false, reason });
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const copy = (s) => ({ v: 1, boxes: s.boxes.map((b) => ({ ...b })), nextId: s.nextId });

export function newSketch() {
  return { v: 1, boxes: [], nextId: 1 };
}

// points: [[x, y], ...] in page units. Finds the smallest box that holds the whole stroke.
// A flat line (like a squiggle) becomes a thin text box.
export function boxFromStroke(points) {
  if (!Array.isArray(points) || points.length > LIMITS.points) return fail("invalid");
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of points) {
    if (!Array.isArray(p) || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) return fail("invalid");
    const x = clamp(p[0], 0, PAGE.w), y = clamp(p[1], 0, PAGE.h);
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  if (points.length < 2) return fail("small");
  const x = Math.round(x0), w = Math.round(x1) - x;
  let y = Math.round(y0), h = Math.round(y1) - y;
  if (w < LIMITS.minSize) return fail("small");
  const flat = h < LIMITS.flat;
  if (flat) {
    y = Math.round(clamp(y + h / 2 - 12, 0, PAGE.h - 24));
    h = 24;
  }
  return { ok: true, box: { x, y, w, h }, flat };
}

// The decision rules. Checked from top to bottom, first match wins.
export function classify(box, hasHeader = false, flat = false) {
  if (flat) return "text";
  if (!hasHeader && box.w >= 216 && box.y + box.h / 2 <= 86 && box.h <= 90) return "header";
  if (box.h >= 90) return "image";
  if (box.w <= 170) return box.h <= 64 ? "button" : "image";
  return "text";
}

export function addStroke(sketch, points) {
  const r = boxFromStroke(points);
  if (!r.ok) return r;
  if (sketch.boxes.length >= LIMITS.boxes) return fail("full");
  const s = copy(sketch);
  const kind = classify(r.box, s.boxes.some((b) => b.kind === "header"), r.flat);
  const box = { id: s.nextId++, ...r.box, kind };
  s.boxes.push(box);
  return { ok: true, sketch: s, box };
}

export function removeBox(sketch, id) {
  if (!sketch.boxes.some((b) => b.id === id)) return fail("unknown");
  const s = copy(sketch);
  s.boxes = s.boxes.filter((b) => b.id !== id);
  return { ok: true, sketch: s };
}

export function setKind(sketch, id, kind) {
  if (!KINDS.includes(kind)) return fail("kind");
  if (!sketch.boxes.some((b) => b.id === id)) return fail("unknown");
  if (kind === "header" && sketch.boxes.some((b) => b.kind === "header" && b.id !== id)) return fail("oneHeader");
  const s = copy(sketch);
  s.boxes.find((b) => b.id === id).kind = kind;
  return { ok: true, sketch: s };
}

// The kind a box changes to when its label is tapped. Skips "header" when another box is already the header.
export function nextKind(sketch, id) {
  const box = sketch.boxes.find((b) => b.id === id);
  if (!box) return null;
  const taken = sketch.boxes.some((b) => b.kind === "header" && b.id !== id);
  let i = KINDS.indexOf(box.kind);
  for (let n = 0; n < KINDS.length; n++) {
    i = (i + 1) % KINDS.length;
    if (KINDS[i] !== "header" || !taken) return KINDS[i];
  }
  return box.kind;
}

// Sorts boxes top to bottom, groups boxes that sit side by side into rows, then sorts each row left to right.
export function layout(sketch) {
  const header = sketch.boxes.find((b) => b.kind === "header") ?? null;
  const rest = sketch.boxes.filter((b) => b !== header).sort((a, b) => a.y - b.y || a.x - b.x || a.id - b.id);
  const groups = [];
  for (const b of rest) {
    const cur = groups[groups.length - 1];
    const cy = b.y + b.h / 2;
    if (cur && cy >= cur.top && cy <= cur.bottom) {
      cur.boxes.push(b);
      cur.bottom = Math.max(cur.bottom, b.y + b.h);
    } else groups.push({ top: b.y, bottom: b.y + b.h, boxes: [b] });
  }
  let headingUsed = false;
  const rows = groups.map((g) => {
    const boxes = g.boxes.sort((a, b) => a.x - b.x || a.id - b.id);
    const items = boxes.map((b) => {
      const width = clamp(Math.round((b.w / PAGE.w) * 20) * 5, 10, 100);
      let part = b.kind;
      if (b.kind === "text" && !headingUsed) { part = "heading"; headingUsed = true; }
      return { id: b.id, kind: b.kind, part, width, height: clamp(Math.round((b.h / PAGE.h) * 60) * 10, 60, 600) };
    });
    let align = "";
    if (boxes.length === 1 && (boxes[0].kind === "button" || items[0].width < 100)) {
      const cx = boxes[0].x + boxes[0].w / 2;
      align = cx < 150 ? "" : cx > 210 ? "right" : "center";
    }
    return { align, items };
  });
  return { header: header ? { id: header.id } : null, rows };
}

// The one function the website uses to write code. Every number on screen comes from here.
export function generate(sketch) {
  const n = sketch.boxes.length;
  const counts = { header: 0, image: 0, heading: 0, text: 0, button: 0 };
  if (n === 0) {
    return { empty: true, code: "", lines: 0, boxes: 0, headline: "Draw a box to start.", counts, dsa: { rows: 0, tags: 0, rules: 0 } };
  }
  const { header, rows } = layout(sketch);
  if (header) counts.header = 1;
  for (const r of rows) for (const it of r.items) counts[it.part]++;
  const aligns = new Set(rows.map((r) => r.align));

  const L = [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    "  <title>My sketch site</title>",
    "  <style>",
    "    /* Plain on purpose. Change these values to make the site yours. */"
  ];
  let rules = 0;
  const rule = (selector, decls) => {
    rules++;
    L.push(`    ${selector} {`, ...decls.map((d) => `      ${d};`), "    }");
  };
  rule("body", ["margin: 0", "font-family: sans-serif", "color: #222222", "background: #ffffff"]);
  if (counts.header) rule(".header", ["padding: 16px", "font-weight: bold", "background: #eeeeee"]);
  if (rows.length) rule(".row", ["display: flex", "gap: 16px", "padding: 16px"]);
  if (aligns.has("center")) rule(".center", ["justify-content: center"]);
  if (aligns.has("right")) rule(".right", ["justify-content: flex-end"]);
  if (counts.image) rule(".image", ["background: #dddddd"]);
  if (counts.heading) rule(".heading", ["margin: 0", "font-size: 28px"]);
  if (counts.text) rule(".text", ["margin: 0", "line-height: 1.5"]);
  if (counts.button) rule(".button", ["padding: 12px 20px", "font-size: 16px", "color: #222222", "background: #dddddd", "border: 1px solid #999999"]);
  L.push("  </style>", "</head>", "<body>");

  let tags = 0;
  if (header) {
    tags++;
    L.push(`  <header class="header">${DEFAULT_TEXT.header}</header>`);
  }
  for (const r of rows) {
    tags++;
    L.push("", `  <div class="row${r.align ? " " + r.align : ""}">`);
    for (const it of r.items) {
      tags++;
      if (it.part === "image") L.push(`    <div class="image" style="width: ${it.width}%; height: ${it.height}px"></div>`);
      else if (it.part === "heading") L.push(`    <h1 class="heading" style="width: ${it.width}%">${DEFAULT_TEXT.heading}</h1>`);
      else if (it.part === "text") L.push(`    <p class="text" style="width: ${it.width}%">${DEFAULT_TEXT.text}</p>`);
      else L.push(`    <button class="button">${DEFAULT_TEXT.button}</button>`);
    }
    L.push("  </div>");
  }
  L.push("</body>", "</html>");

  return {
    empty: false,
    code: L.join("\n"),
    lines: L.length,
    boxes: n,
    headline: `${n} ${n === 1 ? "box" : "boxes"} became ${L.length} lines of real code.`,
    counts,
    dsa: { rows: rows.length, tags, rules }
  };
}

export function lineCount(code) {
  const s = String(code ?? "");
  return s === "" ? 0 : s.replace(/\n+$/, "").split("\n").length;
}

// ---- Reading the learner's edited code. Written as plain loops so odd input can never slow the page. ----

// Removes <name>...</name> blocks. With keep = true it returns only what is inside them.
function blocks(code, name, keep) {
  const low = code.toLowerCase();
  let out = "", i = 0;
  for (;;) {
    const a = low.indexOf("<" + name, i);
    if (a < 0) { if (!keep) out += code.slice(i); break; }
    const open = low.indexOf(">", a);
    if (!keep) out += code.slice(i, a);
    if (open < 0) break;
    const b = low.indexOf("</" + name, open);
    const end = b < 0 ? code.length : b;
    if (keep) out += code.slice(open + 1, end) + "\n";
    if (b < 0) break;
    const close = low.indexOf(">", b);
    if (close < 0) break;
    i = close + 1;
  }
  return out;
}

function stripComments(css) {
  let out = "", i = 0;
  for (;;) {
    const a = css.indexOf("/*", i);
    if (a < 0) { out += css.slice(i); break; }
    out += css.slice(i, a);
    const b = css.indexOf("*/", a + 2);
    if (b < 0) break;
    i = b + 2;
  }
  return out;
}

function decls(text) {
  const out = [];
  for (const d of text.split(";")) {
    const i = d.indexOf(":");
    if (i < 1) continue;
    const prop = d.slice(0, i).trim().toLowerCase();
    const value = d.slice(i + 1).trim().toLowerCase().replace(/\s+/g, " ").replace(/ ?!important$/, "");
    if (prop && value) out.push({ prop, value });
  }
  return out;
}

// Every style rule in the code: [{ selector, decls: [{ prop, value }] }]. Inline style="" counts too.
export function parseCss(code) {
  const src = String(code ?? "").slice(0, LIMITS.codeLength);
  const css = stripComments(blocks(src, "style", true));
  const rules = [];
  let buf = "", selector = null;
  for (const ch of css) {
    if (ch === "{") { selector = buf.trim().toLowerCase(); buf = ""; }
    else if (ch === "}") {
      if (selector !== null) rules.push({ selector, decls: decls(buf) });
      selector = null;
      buf = "";
    } else buf += ch;
  }
  for (const m of src.matchAll(/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    rules.push({ selector: "(inline)", decls: decls(m[1] ?? m[2]) });
  }
  return rules;
}

// The words a visitor would read on the page.
export function visibleText(code) {
  let src = String(code ?? "").slice(0, LIMITS.codeLength);
  src = blocks(blocks(src, "style", false), "script", false);
  const low = src.toLowerCase();
  const b = low.indexOf("<body");
  if (b >= 0) {
    const open = low.indexOf(">", b);
    const end = low.indexOf("</body", b);
    src = open < 0 ? "" : src.slice(open + 1, end < 0 ? src.length : end);
  }
  let out = "", inTag = false;
  for (const ch of src) {
    if (ch === "<") { inTag = true; out += " "; }
    else if (ch === ">") inTag = false;
    else if (!inTag) out += ch;
  }
  return out.replace(/\s+/g, " ").trim();
}

function range(code, needles) {
  for (const needle of needles) {
    const i = needle ? code.indexOf(needle) : -1;
    if (i >= 0) return { start: i, end: i + needle.length };
  }
  return null;
}

// Checks the six upgrades against the learner's code. sketch is the sketch the code was made from.
// Fresh code from generate() always scores 0. Never throws.
export function missions(code, sketch) {
  const src = String(code ?? "").slice(0, LIMITS.codeLength);
  const base = generate(sketch);
  const rules = parseCss(src);
  const all = rules.flatMap((r) => r.decls);
  const text = visibleText(src);
  const done = {
    words: text !== "" && text !== visibleText(base.code),
    colour: all.some((d) => (d.prop === "color" || d.prop === "background" || d.prop === "background-color") && !DEFAULT_COLOURS.has(d.value)),
    round: all.some((d) => /^border(-[a-z]+){0,2}-radius$/.test(d.prop) && /[1-9]/.test(d.value)),
    shadow: all.some((d) => (d.prop === "box-shadow" || d.prop === "text-shadow") && /\d/.test(d.value)),
    font: all.some((d) => d.prop === "font-family" && d.value !== "sans-serif"),
    hover: rules.some((r) => r.selector.includes(":hover") && r.decls.length > 0)
  };
  const c = base.counts;
  const focus = c.button ? ".button" : c.image ? ".image" : c.header ? ".header" : c.heading ? ".heading" : c.text ? ".text" : "body";
  const rule = range(src, [focus + " {", "body {"]);
  const where = {
    words: range(src, [c.heading && DEFAULT_TEXT.heading, c.button && DEFAULT_TEXT.button, c.header && DEFAULT_TEXT.header, c.text && DEFAULT_TEXT.text, "<body>"]),
    colour: rule,
    round: rule,
    shadow: rule,
    font: range(src, ["font-family: sans-serif", "body {"]),
    hover: rule
  };
  const items = MISSION_IDS.map((id) => ({ id, done: done[id], range: where[id] }));
  const count = items.filter((x) => x.done).length;
  return {
    items,
    done: count,
    total: items.length,
    complete: count === items.length,
    focus,
    headline: `${count} of ${items.length} upgrades done.`
  };
}

// The WhatsApp text. result is from generate(), m is from missions(), link is the site link or "".
export function shareText(result, m, link = "") {
  const first = `I drew ${result.boxes} ${result.boxes === 1 ? "box" : "boxes"} and turned ${result.boxes === 1 ? "it" : "them"} into a real website`;
  const lines = [
    m.done === 0
      ? `${first} with ${result.lines} lines of code.`
      : `${first}, then coded ${m.done} of ${m.total} upgrades myself.`
  ];
  if (link) lines.push(`Try it: ${link}`);
  lines.push("", "Made with Sketch to Site by Wrench Wise");
  return lines.join("\n");
}

// Saved sketches use this compact form.
export function encodeSketch(sketch) {
  return JSON.stringify([1, sketch.boxes.map((b) => [b.x, b.y, b.w, b.h, KINDS.indexOf(b.kind)])]);
}

// Never throws. Anything odd returns { ok: false, reason: "invalid" }.
export function decodeSketch(text) {
  const bad = { ok: false, reason: "invalid" };
  try {
    const s = String(text ?? "");
    if (!s || s.length > 2000) return bad;
    const data = JSON.parse(s);
    if (!Array.isArray(data) || data.length !== 2 || data[0] !== 1 || !Array.isArray(data[1])) return bad;
    if (data[1].length > LIMITS.boxes) return bad;
    const sketch = newSketch();
    for (const row of data[1]) {
      if (!Array.isArray(row) || row.length !== 5 || !row.every(Number.isInteger)) return bad;
      const [x, y, w, h, k] = row;
      if (x < 0 || y < 0 || w < LIMITS.minSize || h < LIMITS.flat || x + w > PAGE.w || y + h > PAGE.h) return bad;
      if (k < 0 || k >= KINDS.length) return bad;
      if (KINDS[k] === "header" && sketch.boxes.some((b) => b.kind === "header")) return bad;
      sketch.boxes.push({ id: sketch.nextId++, x, y, w, h, kind: KINDS[k] });
    }
    return { ok: true, sketch };
  } catch {
    return bad;
  }
}

// Saved code is read back with this. Returns the code, or null if it is missing or too long.
export function cleanCode(text) {
  if (typeof text !== "string" || text === "" || text.length > LIMITS.codeLength) return null;
  return text;
}
