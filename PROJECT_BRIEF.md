# Sketch to Site: Project Brief

## 1. What we are building

A polished Wrench Wise website for PC and mobile. A visitor draws rough boxes with a finger or mouse: a header, an image, some text and a button. They press "Build my site" and the sketch becomes real HTML and CSS, shown next to a live preview. The site it makes is plain on purpose. To make it look good, the visitor edits the code themselves, guided by six small upgrades, then downloads their site as a real HTML file.

**Who it is for:** students and beginners, most of whom have never written code and many of whom are on a phone.

**Already done and tested for you:** the sketch engine (`js/engine/sketch.js`), a sample sketch that draws itself, all the words on the site (`js/copy.js`) and the settings (`config.js`). Your job is everything the visitor sees and touches.

**Time target:** 1 hour in total. Keep it simple and finish it properly.

When there is a trade-off, follow this order:
1. Drawing works first time with a finger on a phone.
2. The code and every number shown are exactly what the engine gives.
3. It looks professional and feels instant on a phone.
4. Editing the code changes the preview at once, and each upgrade ticks itself.
5. The DSA section teaches clearly.
6. The Wrench Wise CTA works in one tap.
7. It is easy to upgrade.
8. Everything else.

---

## 2. Hard rules

1. **Code.** Plain HTML, CSS and JavaScript (ES modules). No frameworks, libraries, CDNs, npm packages or web fonts. No code editor library: the editor is a plain `<textarea>`. The only image files are the logo, the link preview image and app icons. Draw everything else with inline SVG and CSS.
2. **Locked files.** Never edit `js/engine/`, `js/sample-data.js`, `tools/`, `vercel.json` or `package.json`. Change `js/copy.js` and `config.js` only if I ask, except `siteUrl` in Phase 4. At the start of every phase, run `node tools/verify.mjs`. It must end with `RESULT: ALL PASS`. If you think a locked file is wrong, stop and tell me.
3. **No backend.** No server, database, API calls, AI calls or accounts. No GA4, Meta Pixel or any other outside script. Normal links to wrench-wise.com and WhatsApp are fine.
4. **Privacy lock.** Put this as the first tag in `<head>`, after the charset:
   `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; manifest-src 'self'; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'">`
   `'unsafe-inline'` for styles is there only so the visitor's own code can be styled inside the preview. The site's own `index.html` still has no inline scripts, no `<style>` tags, no `style=""` attributes and no `onclick=""`. Setting `element.style` from JavaScript is fine. Use `meta` tags for link previews, with no canonical `link` tag.
5. **One source for every number and every line of code.** The code comes only from `generate()`. Never write, fix or add to the generated HTML or CSS yourself. Every count, headline and DSA number comes from `generate()`, and every upgrade tick from `missions()`. Every change to the sketch goes through `addStroke()`, `removeBox()` or `setKind()`. Never classify a box or count lines anywhere else.
6. **The preview is locked down.** The visitor's code is shown only in `<iframe id="preview" sandbox="">`, filled only by setting `srcdoc` in `js/preview-ui.js`. The `sandbox` attribute stays empty: never add `allow-scripts`, `allow-same-origin` or any other value. Never put the visitor's code into the main page.
7. **Storage.** `localStorage` may hold only `sts-theme`, `sts-sketch` (saved as `encodeSketch(sketch)`) and `sts-code` (the visitor's edited code). `sessionStorage` may hold only `sts-intro-seen`. Use them only in `js/store.js` and `js/theme-init.js`, wrapped in try and catch. The site must work when storage is blocked. Read a saved sketch back only with `decodeSketch()` and saved code only with `cleanCode()`. If either fails, start fresh.
8. **The visitor's code stays out of places it does not belong.** Never put it in the page title, a log, an error message, a URL or the `aria-live` region.
9. **Tone.** Calm and encouraging. Never promise a job or a result. Never use these where a user can see them: stupid, dumb, useless, guarantee, placement, salary, lakh, "get hired", "seats left", "100% accurate", or any countdown to buy.
10. **Words.** All text comes from `js/copy.js` through `t()`. Program names always use the full name from `config.js`. No emojis. No em dashes.
11. **Safety.** Never use `innerHTML` or `insertAdjacentHTML`. Use `textContent`. No `console` output. No `alert()`, `confirm()` or `prompt()`. Use the inline confirms described below.
12. **No overlap.** Nothing overlaps, clips or scrolls sideways at 320, 360, 390, 768, 1280 or 1440 px wide. Long code lines scroll inside the code box, never the page.
13. **No placeholder look.** No grey boxes, lorem ipsum, stock icons or unfinished sections. The only plain-looking thing on the page is the visitor's preview, and that is on purpose. Remove any debug panel before Phase 4 ends.
14. **Phone drawing and typing.** The drawing area has `touch-action: none` so the page does not scroll while drawing, and uses Pointer Events with `setPointerCapture`. The page must still scroll normally everywhere else. The code box is `<textarea id="code" spellcheck="false" autocapitalize="off" autocomplete="off">` with text at least 16px on phones so they do not zoom in.

---

## 3. Keep it easy to upgrade

- The engine has no page code. Sketches are never changed in place, so every change gives a new sketch and undo is just going back to the previous one.
- All words are in `js/copy.js`. All settings are in `config.js`.
- Each `config.features` switch set to `false` hides that feature with no errors.
- Each section has its own file and render function. A new section means one new file and one line in `main.js`.
- Colours, spacing and timing live only in `styles/tokens.css`.
- Upgrades are a list (`MISSION_IDS`). A new upgrade later means one engine check and one block of words.

---

## 4. Tech setup and file structure

ES modules need a local server. Use `npx --yes serve .` from the project folder, or Antigravity's built-in preview. Vercel needs no build command. Set up git in Phase 1 and commit at the end of every phase.

```
sketch-to-site/
  index.html
  config.js            given
  vercel.json          given, LOCKED
  package.json         given, LOCKED
  manifest.json
  og-image.png         made in Phase 4
  assets/logo.png      I add this. If missing, show "Wrench Wise" as text
  assets/icon.svg      a pencil stroke turning into a code bracket, drawn in code
  js/
    engine/sketch.js   LOCKED
    sample-data.js     LOCKED. sampleStrokes() gives the 5 hand-drawn strokes
    copy.js            given
    theme-init.js      plain script in head. Sets theme and intro class before first paint
    main.js            starts everything. Holds sketch, history, code and built. One render() for all sections
    store.js           safe storage: load and save sketch, code and theme
    links.js           WhatsApp share link, program and sales links with UTM
    draw-ui.js         drawing area, strokes, snapping, labels, undo, clear, sample, Build button
    code-ui.js         code box, line numbers, copy, reset, download
    preview-ui.js      the sandboxed preview and the Phone and Laptop switch
    missions-ui.js     the six upgrades, hints, Show me where, progress
    result-ui.js       headline, count-up, share
    sections-ui.js     how it works, privacy strip, DSA section, CTA, footer
    motion.js          loader, count-up, typing effect, scroll reveal, reduced motion check
    selftest.js        ?test=1
  styles/
    tokens.css  base.css  components.css  motion.css
  tools/verify.mjs     LOCKED
```

**The engine**
- The drawing page is always 360 wide and 480 tall (`PAGE`). Convert pointer positions to these units before calling the engine: `x = (clientX - rect.left) / rect.width * 360`, and the same for `y` with 480.
- `newSketch()` gives an empty sketch: `{ v, boxes: [{ id, x, y, w, h, kind }], nextId }`. `kind` is `header`, `image`, `text` or `button`.
- `addStroke(sketch, points)` takes one finished stroke as `[[x, y], ...]` and returns `{ ok: true, sketch, box }` or `{ ok: false, reason }`. It finds the box and decides what it is. Reasons have words in `copy.reasons.stroke`.
- `removeBox(sketch, id)` and `setKind(sketch, id, kind)` return `{ ok: true, sketch }` or `{ ok: false, reason }`, with words in `copy.reasons.kind`. `nextKind(sketch, id)` gives the kind to switch to when a label is tapped.
- `generate(sketch)` returns `{ empty, code, lines, boxes, headline, counts, dsa }`:
  - `code`: the full HTML and CSS as one string.
  - `headline`: for example "5 boxes became 67 lines of real code."
  - `counts`: `{ header, image, heading, text, button }`.
  - `dsa`: `{ rows, tags, rules }`.
- `missions(code, sketch)` reads the visitor's edited code and returns `{ items, done, total, complete, focus, headline }`. Each item is `{ id, done, range }`, where `range` is `{ start, end }` in the code for "Show me where", or `null`.
- `lineCount(code)` gives the line count of the edited code.
- `shareText(result, missions, link)` gives the WhatsApp text.
- `encodeSketch(sketch)`, `decodeSketch(text)` and `cleanCode(text)` are for saving. `decodeSketch()` never throws.
- `FILE_NAME` is the download file name. `LIMITS`: 12 boxes, code up to 20,000 characters.

---

## 5. Page layout

The page has two steps: **1. Draw** and **2. Code**.

**Laptop (1024px and up):** centred, max width 1200px. A short hero across the top with a small stepper (`steps.draw`, `steps.code`).
- Before Build: the drawing card sits in the centre (the drawing area about 360 x 480), with the hint and the result empty state beside it.
- After Build: the drawing card slides to a smaller size on the left, and the workspace opens: the code card (about 55%) and the preview card (about 45%, sticky with a `top` offset) side by side, with the upgrades card under the code card.

**Phone:** one column: short hero, drawing card (the drawing area fills the width and keeps the 3 to 4 shape). After Build, a sticky tab bar shows `steps.draw`, `steps.code` and `steps.preview`, and only the chosen panel shows. On the Code tab a small live preview strip stays pinned at the top (about 30% of the screen height), so the visitor sees changes while typing. The upgrades card sits under the code box.

**Order of sections below the tool:** how it works, privacy strip, DSA section, CTA, footer.

---

## 6. Features

**A. Loader.** Shown on the first visit of a session. The logo in the centre, with a pencil line that draws a rough box, which then snaps straight and turns into `< >` code brackets, and a thin brand gradient bar. It ends by `config.loaderMs` (never longer), fades in 250 ms, and the hero rises 12px into place. If JavaScript fails, a CSS animation still removes it by 2 seconds. No loader under reduced motion.

**B. Drawing card.**
- `draw.heading` and `draw.hint`. Next to the hint, a small drawn legend of the four shapes: a wide top box (Header), a big box (Image), a small box (Button) and a wavy line (Text).
- The drawing area is an SVG with `viewBox="0 0 360 480"`, a soft dotted grid and a paper look. Empty: `draw.empty` with a small animated pencil.
- While the pointer is down, draw the live stroke as a rough pencil line in `--ink`. On release, call `addStroke()`.
  - Works: the rough line fades as a clean rounded rectangle grows from it (`config.snapMs`), with a label chip in the top left corner showing `kinds.<kind>` and a small drawn icon. Each kind has its own colour and its own line style (solid, dashed, dotted, double), so colour is never the only signal.
  - Fails: the stroke shakes once and fades, and the reason shows under the drawing area.
- Tap a label chip: change the kind with `setKind(sketch, id, nextKind(sketch, id))`. The chip flips to the new kind. Show `draw.tapHint` once, after the first box.
- Each box has a small × button (`draw.remove`) shown on hover, on focus and when the box is tapped. It calls `removeBox()`.
- Toolbar: Undo (goes back to the previous sketch, keep a history of up to 30), Clear (inline confirm with `clearConfirm`, `clearYes`, `clearNo`) and `draw.count`.
- Keyboard: boxes can be reached with Tab. Enter changes the kind, Delete removes the box.
- `draw.sample` (`features.sample`) shows only when the sketch is empty. It plays `sampleStrokes()` one at a time: each stroke draws itself over `config.sampleStrokeMs`, then goes through `addStroke()` and snaps like a real one. Under reduced motion, add all five at once.
- The **Build my site** button is the primary button, disabled until there is 1 box.
  - First build: run `generate()`, save, open the workspace.
  - Later, if the sketch changes: the button reads `draw.rebuild`. If the code box differs from the last generated code, show an inline confirm first (`rebuildConfirm`, `rebuildYes`, `rebuildNo`).

**C. Build moment.** On Build, the code "types" itself into the code box line by line over `config.typeMs`, the headline numbers count up over `config.countUpMs`, and the preview fades in when typing ends. The final frame must show exactly `generate().code` and `generate().headline`. Then show `result.plain`. On phone, switch to the Code tab. No typing or count-up under reduced motion.

**D. Code card.**
- `code.heading`. A dark code box in both themes: the `<textarea id="code">` in a monospace font with a line number gutter that scrolls with it. The Tab key inserts 2 spaces. Escape moves focus out so keyboard users are not trapped.
- No syntax colouring in v1.
- On every edit: wait `config.previewDelayMs`, then refresh the preview, run `missions()`, update the ticks, and save the code. If the code is longer than `LIMITS.codeLength`, show `reasons.codeLong` and do not save.
- Under the box: `result.yourLines` using `lineCount()`, and `result.saved` with a small device icon.
- Buttons: `code.copy` (copies the code, label changes to `code.copied`), `code.reset` (inline confirm with `resetConfirm`, `resetYes`, `resetNo`, then puts back `generate().code`) and `code.download` (`features.download`).
- Download: make a `Blob` of the code with type `text/html`, and click a temporary link with `download = FILE_NAME`. Show `code.downloadNote` under it. This is the only place `createObjectURL` is used. Call `revokeObjectURL` afterwards.

**E. Preview card.** `preview.heading`, the `<iframe id="preview" sandbox="" title="...">` with `preview.label` as its title, and a Phone and Laptop switch (`preview.phone`, `preview.laptop`). Phone shows the frame 360px wide inside a drawn phone outline. Laptop shows it at full card width inside a drawn browser bar. On phones only the Phone view is offered. `preview.note` in small text. When the preview refreshes, a thin brand line sweeps across its top edge once.

**F. Upgrades card** (`features.missions`). `missions.heading`, `missions.sub`, a progress ring and `missions.progress` filled from `missions()`. Then six rows, in `MISSION_IDS` order: a tick circle, `missions.<id>.title`, and when opened, `missions.<id>.hint`, the example in a small code block (`missions.exampleLabel`), and a **Show me where** button.
- Show me where: focus the code box and select `range.start` to `range.end` with `setSelectionRange`, then scroll that line into view. On phone, switch to the Code tab first. Hide the button if `range` is `null`.
- When an upgrade becomes done: the tick draws itself, the row gets a soft brand tint, the ring fills one step, and the `aria-live` region reads `missions().headline`.
- When `complete` is true: show `missions.complete` with a short burst of small coloured squares drawn in CSS (none under reduced motion).
- Ticks can turn off again if the visitor removes an edit. That is correct.

**G. Result and share** (`features.share`). The headline from `generate().headline`, at least 32px on laptop and 24px on phone, weight 800. `share.heading` and one button: Share on WhatsApp, which opens `https://wa.me/?text=` plus `encodeURIComponent(shareText(result, missions, link))` in a new tab. The link is `CONFIG.siteUrl` or `location.origin + location.pathname`. `share.note` in small text.

**H. How it works and privacy strip.** Three numbered steps from `how`, with a drawn icon each. Then `privacy.line`, `proofTitle` and `proof`, with a drawn shield.

**I. DSA section** (`features.underTheHood`). `hood.heading` and four cards: Bounding box, Decision rules, Sorting and grouping, Code generation. Each has a small drawn picture (points with a box around them, a short decision ladder, boxes falling into rows, a box becoming a tag). After a build, add the live lines: `boxLive` from `boxes`, `rulesLive` from `counts` (use `heading + text` for the text number), `sortLive` from `dsa.rows`, and `codeLive` from `dsa.tags`, `dsa.rules` and `lines`. Before any build, show the cards without the live lines.

**J. CTA.** A card with `cta.title`, `cta.body` and two buttons: the program link (`program.page`, or `website`, with UTM from `config.utm`) and WhatsApp (hidden if `salesWhatsApp` is empty). No forms or gates. Links open in a new tab with `rel="noopener noreferrer"`.

**K. Theme.** Light and dark, first visit follows the device, a toggle saves `sts-theme`. The visitor's preview is not themed. It always shows their own code as written.

**Saving.** After every sketch change, save `encodeSketch(sketch)`. After every code edit, save the code. On load: read the sketch with `decodeSketch()`. If there is saved code that passes `cleanCode()`, open the workspace with it and skip the typing effect.

**Nice to have, only if time allows:** `manifest.json` install support.

---

## 7. Visual style: matched to wrench-wise.com

Emerald as the main colour, teal and cyan as accents, gray text, white cards and soft emerald-to-cyan gradients. Every colour is a CSS variable in `styles/tokens.css`.

| Token | Light (default) | Dark |
|---|---|---|
| `--bg` | `#FFFFFF` | `#0F172A` |
| `--bg-grad` | `linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 45%, #ECFEFF 100%)` | `linear-gradient(135deg, #0F172A 0%, #1E293B 100%)` |
| `--surface` | `#FFFFFF` | `#1E293B` |
| `--surface-2` | `#F3F4F6` | `#334155` |
| `--border` | `#E5E7EB` | `#334155` |
| `--text` | `#111827` | `#F1F5F9` |
| `--text-2` | `#374151` | `#CBD5E1` |
| `--muted` | `#6B7280` | `#94A3B8` |
| `--brand` | `#059669` | `#10B981` |
| `--brand-strong` | `#047857` | `#34D399` |
| `--brand-soft` | `#D1FAE5` | `rgba(16,185,129,0.15)` |
| `--accent` | `#0891B2` | `#22D3EE` |
| `--paper` | `#FAFAF9` | `#111827` |
| `--grid` | `#E5E7EB` | `#1F2937` |
| `--ink` | `#111827` | `#F1F5F9` |
| `--kind-header` | `#7C3AED` | `#A78BFA` |
| `--kind-image` | `#0891B2` | `#22D3EE` |
| `--kind-text` | `#B45309` | `#FBBF24` |
| `--kind-button` | `#059669` | `#34D399` |
| `--code-bg` | `#0F172A` | `#0B1220` |
| `--code-text` | `#E2E8F0` | `#E2E8F0` |
| `--code-gutter` | `#64748B` | `#64748B` |

**Brand gradient:** `--brand-grad: linear-gradient(90deg, #059669, #0D9488, #06B6D4)`. Use it for primary buttons, the bar under the header, the progress ring, the preview refresh line and the CTA card's top edge.

**Fonts:** `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. Headings weight 800, letter spacing -0.01em. Code uses `ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace` with `tab-size: 2`.

**Shapes:** buttons, pills and chips 999px. Cards 16px. Inputs and the code box 12px.

**Shadows** (in dark, same shapes with `rgba(0,0,0,0.40)`):
- `--shadow-sm: 0 1px 3px rgba(0,0,0,0.10), 0 1px 2px -1px rgba(0,0,0,0.10)`
- `--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.10)`
- `--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.10)`

**Hover effects** (only inside `@media (hover: hover)`)
- Buttons lift 2px with `--shadow-md`. The primary button also slides its gradient.
- Cards and upgrade rows lift 3px with `--shadow-lg` and a soft brand border.
- A box in the drawing area: its outline thickens, its chip lifts and its × button fades in.
- Label chips fill with their kind colour at low strength.
- The drawing area shows a pencil cursor. The code box border glows in `--brand`.
- Links get an underline that grows from the left.

**Micro-interactions**
- Press on any button, pill or chip: scale to 0.97.
- Stroke to box: the rough line fades while the clean box grows from it, and the chip pops in (scale 0.8 to 1).
- Changing a kind: the chip flips and the box outline changes colour and line style.
- Removing a box: it shrinks and fades. Undo brings it back the same way in reverse.
- A failed stroke shakes once (6px, 300 ms).
- Build: the button shows a short progress sweep, the code types out, the numbers count up, the preview fades in.
- Stepper and phone tabs: the active marker slides from the old tab to the new one.
- Upgrade done: the tick draws with `stroke-dashoffset`, and the ring fills one step.
- Preview refresh: a thin gradient line sweeps across the top of the preview.
- Copy and Download: the icon turns into a tick for 1.5 seconds.
- Inline confirms slide open under their button.
- Theme toggle: sun and moon rotate and swap.
- Scroll reveal: lower sections fade and rise 16px, once, with `IntersectionObserver`.

**Motion rules**
- Animate only `transform`, `opacity` and SVG `stroke-dashoffset`.
- `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`. `--ease: cubic-bezier(0.4, 0, 0.2, 1)`. Most effects 150 to 250 ms.
- A new change replaces any running animation. Drawing must never wait for an animation to finish.
- `prefers-reduced-motion`: no loader, typing, count-up, snapping, shake, burst or reveal. Plain state changes only.

**Access:** full keyboard use, visible focus rings (2px `--accent`), tap targets at least 44px, text contrast at least 4.5 to 1. Chips and tabs are real buttons with `aria-pressed` or `aria-selected`. The drawing area has a text list of its boxes for screen readers. One polite `aria-live` region announces only `generate().headline` after a build and `missions().headline` after an upgrade changes.

**Meta:** `theme-color` `#FFFFFF` and `#0F172A` by media query. Title: "Sketch to Site | Wrench Wise". Add a description and `og:` tags.

---

## 8. Words

Use `js/copy.js` as it is. The reasons, hints and examples are already written. Do not add other visible text without asking me.

---

## 9. Analytics

None, on purpose (rule 3). The UTM tags on links to wrench-wise.com show visits from this project in the main site's reports.

---

## 10. Correctness

**`node tools/verify.mjs`** checks the engine, the sample's exact numbers, each upgrade check, 3,000 random sketches, damaged saved data, the locked files and the rules across all your files. It must pass at the start of every phase and before deploy.

**`?test=1`** opens a self-test page in `js/selftest.js`, listing PASS or FAIL per line:
1. The sample, run through the real page code, gives 5 boxes labelled Header, Image, Text, Text, Button.
2. After Build, the headline reads exactly "5 boxes became 67 lines of real code." and the code box holds exactly `generate().code`.
3. The upgrades card reads "0 of 6 upgrades done."
4. Replacing "Your heading here" with "Chennai Bakes" in the code box ticks "Change the words" and the card reads "1 of 6 upgrades done."
5. "Show me where" on "Change the font" selects the text `font-family: sans-serif` in the code box.
6. Tapping the Button label changes it to Header only when no other box is a header. Otherwise it changes to Image.
7. A tiny stroke shows the `small` message and adds no box.
8. Undo after adding a box brings back the same box count.
9. The preview frame has an empty `sandbox` attribute, and typing `<script>` in the code does not change `document.title`.
10. The WhatsApp link starts with `https://wa.me/?text=` and, decoded, equals `shareText()`.
11. After a reload, the same sketch and the same edited code come back.
12. Storage holds only allowed keys, and `document.title` holds none of the visitor's code.
13. `document.documentElement.scrollWidth` is not larger than the window width.

Also check by hand, on a real phone: draw 4 boxes with a finger. The page must not scroll while drawing, and must scroll normally when the finger starts outside the drawing area.

---

## 11. Phases

Stop after every phase, give me the Phase Report, and wait for me to say "Go".

**Phase 1: Shell and loader (10 min).** Git, `index.html` with the privacy lock, tokens, themes, header, footer, loader, stepper, the laptop and phone layouts with empty cards, `store.js`, `theme-init.js`.

**Phase 2: Drawing (20 min).** Drawing area with Pointer Events, snapping, label chips, change kind, remove, undo, clear, sample sketch, Build button, saving and loading, with all their micro-interactions.

**Phase 3: Code and the rest (15 min).** Build moment, code card, preview card, upgrades card with Show me where, download, share, phone tabs, how it works, privacy strip, DSA section, CTA, hover effects, scroll reveal.

**Phase 4: Finish and deploy (15 min).**
1. Build `?test=1`. Fix everything until it passes. Check all widths in rule 12 and both themes. Check reduced motion.
2. Make `og-image.png` (1200 x 630, Wrench Wise colours, the line "Draw a website. Get real code.", a rough sketch on the left turning into code on the right).
3. Help me push the folder to GitHub. I will give you my empty repository URL.
4. Deploy on Vercel as a static site with no build command.
5. Set `config.siteUrl`, `og:url` and `og:image` to the live address, then redeploy.
6. Give click-by-click steps for anything I must do myself.
7. Confirm the live site works on a phone-sized screen, that `?test=1` passes live, and that the downloaded file opens in a browser and looks like the preview.
8. Tag the release `v1.0.0`, push the tag and give me the live link.

---

## 12. Phase Report format

- **What I built** (3 to 5 bullets)
- **How to check it** (click steps)
- **Screenshots** (phone and laptop)
- **verify.mjs result**
- **Not working or cut,** explained in plain words
- **Time used** against the target

---

## 13. If something keeps breaking

- If the same bug survives two fix attempts, stop. Explain it in plain words and give me options. Do not keep looping.
- If I say "Park it", move that feature to a "Parked" list in the Phase Report and continue.
- If time runs short, park in this order:
  1. `manifest.json` install support
  2. Line number gutter
  3. Scroll reveal
  4. Phone and Laptop switch in the preview (keep the Phone view)
  5. The sample sketch drawing itself (add all five boxes at once)
  6. The pinned preview strip on the phone Code tab (the Preview tab still works)

**Never park:**
- Every rule in Section 2, above all rules 5, 6 and 14
- The loader, hover effects and core micro-interactions (stroke to box, change kind, build typing, count-up, upgrade tick, copy)
- Drawing with finger and mouse, label chips, undo, clear, Build my site
- The code box, the live preview and the six upgrades with Show me where
- Download my site and Share on WhatsApp
- Saving on the device
- Phone and laptop layouts, light and dark themes
- Wrench Wise branding and the CTA
- `verify.mjs`, `?test=1` and deployment
