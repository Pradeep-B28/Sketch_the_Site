# Sketch the Site: In-Browser Hand-Drawn Wireframe to Semantic Code Engine

> **Live Application:** [sketch-the-site.vercel.app](https://sketch-the-site.vercel.app/)  
> **In-Browser Test Suite (13 Checks):** [sketch-the-site.vercel.app/?test=1](https://sketch-the-site.vercel.app/?test=1)  
> **Author:** [B Pradeep](https://github.com/Pradeep-B28) | [Portfolio](https://pradeep-b28.github.io/Pradeep-B28/)

---

## Overview

**Sketch the Site** is an interactive, privacy-first wireframe compiler and browser-based rapid prototyping engine developed for **Wrench Wise**. It bridges the gap between hand-drawn visual ideation and semantic web development: visitors sketch simple geometric boxes on an interactive SVG canvas, tag them with semantic roles (Header, Image, Text, Button), and watch as a deterministic compilation engine compiles the sketch into clean, responsive HTML5 and CSS3 code in real time.

Engineered with **zero external frameworks, zero CDNs, zero runtime dependencies, and zero build steps**, Sketch the Site demonstrates resilient frontend systems architecture:
- **Interactive SVG Drawing Surface:** Pointer-driven bounding-box detection, non-destructive stroke normalization, 8-directional edge and corner resize handles (`n`, `s`, `w`, `e`, `nw`, `ne`, `sw`, `se`), single-tap label rotation, and box duplication.
- **Deterministic Code Synthesis Engine (`sketch.js`):** Topological and vertical coordinate sorting ($O(N \log N)$), responsive flexbox and CSS grid layout inference, and deterministic HTML/CSS synthesis.
- **Synchronized Code Studio & Live Preview:** Custom code editor with 1:1 synchronized gutter line numbering, dark scrollbar tracks, live isolated iframe preview (Phone 360×640 and Laptop 1024×640 scaled projections), and single-click site export.
- **Interactive Guided Upgrades:** Real-time AST/regex pattern detection tracking 6 semantic web enhancements with an SVG progress dial, live code targeting ("Show me where"), and persistent device storage.

```mermaid
flowchart TD
    subgraph Canvas["1. SVG Interactive Drawing Surface"]
        Pointer["Pointer & Touch Events\n(pointerdown, pointermove, pointerup)"]
        BoundingBox["Stroke Normalization & Box Bounding\n(min/max coordinate detection, 24px min-size)"]
        Manipulation["Manipulation & Geometry\n(8-direction resize handles, copy, delete, label cycle)"]
    end

    subgraph Compiler["2. Deterministic Layout & Synthesis Engine (sketch.js)"]
        Sort["Topological Spatial Sorting\n(Sort boxes by vertical Y and horizontal X)"]
        Classification["Semantic Element Inference\n(Header, Image, Text Paragraphs, Action Buttons)"]
        CodeEmit["Deterministic Code Generator\n(Semantic HTML5 boilerplate + Responsive CSS)"]
    end

    subgraph Studio["3. Workspace Studio & Preview"]
        Editor["Synchronized Code Editor\n(1:1 Gutter line sync, wrap=off, clamp height)"]
        Sandbox["Sandboxed Iframe Preview\n(Isolated DOM, scaled 360px / 1024px projections)"]
        Upgrades["Interactive Upgrade Engine\n(6 progressive challenges, SVG progress ring, line focus)"]
        Storage["Storage Isolation\n(localStorage: sts-sketch, sts-code, sts-theme)"]
    end

    Pointer --> BoundingBox
    BoundingBox --> Manipulation
    Manipulation --> Sort
    Sort --> Classification
    Classification --> CodeEmit
    CodeEmit --> Editor
    CodeEmit --> Sandbox
    Editor --> Upgrades
    Upgrades --> Storage
```

---

## Technical Specifications and Architecture

| Parameter | Specification |
| :--- | :--- |
| **Canvas Dimensions** | 360 × 440 viewport coordinate space; responsive SVG scaling across all screen sizes |
| **Element Types** | Semantic components: `Header` (`<h1>`), `Image` (`<img>`), `Text` (`<p>`), `Button` (`<button>`) |
| **Resize Geometry** | 8-point bidirectional transformation: North, South, East, West, NW, NE, SW, SE with coordinate clamping |
| **Code Generation** | $O(N \log N)$ deterministic synthesis; outputs W3C-valid HTML5 document and scoped modern CSS |
| **Preview Isolation** | Sandboxed `<iframe>` (`sandbox=""` with `srcdoc`); script execution strictly blocked |
| **Gutter Line Sync** | Synchronized scroll alignment between `textarea` and line gutter; exact matching font metric, padding, and line-height |
| **Editor Bounds** | Laptop height `clamp(360px, 60vh, 560px)`, phone height `45vh`; horizontal scroll only (`white-space: pre`) |
| **Security & Privacy** | Strict CSP: `connect-src 'none'`, zero external telemetry, zero CDNs, zero cookies |
| **Storage Whitelist** | Client storage restricted strictly to `sts-sketch`, `sts-code`, and `sts-theme` |
| **Dependencies** | Pure HTML5, CSS3 Custom Properties, Vanilla JavaScript (ES Modules); 0 runtime npm packages |
| **Test Verification** | 47,356 automated checks via `verify.mjs` and 13 in-browser integration assertions |

---

## Strict Privacy & Security Architecture: The Zero-Trust Guarantee

Most browser-based website builders and playground editors transmit code and assets to cloud backends, inject tracking scripts, or execute un-sanitized user code with full window privileges. Sketch the Site enforces strict isolation directly in the browser:

| Security Domain | Standard Web Builders | Sketch the Site Guarantee |
| :--- | :--- | :--- |
| **Network Transmission** | Posts project data, wireframes, and code to remote servers | **Forbidden by CSP.** `connect-src 'none'` blocks all outbound network and API requests |
| **Preview Script Execution** | Often executes user script tags inside parent context | **Sandboxed Iframe.** `sandbox=""` prevents any script execution, parent DOM access, or cookie access |
| **DOM Injection Safety** | Relies on `innerHTML` exposing cross-site scripting (XSS) risks | **Strict `textContent` and DOM nodes only.** Zero `innerHTML` or `insertAdjacentHTML` across the codebase |
| **Storage Boundary** | Injects tracking cookies, analytics session IDs, and cloud tokens | **Strict Whitelist.** Only `sts-sketch`, `sts-code`, and `sts-theme` are ever accessed |
| **Telemetry & Analytics** | Loads Google Analytics, tracking pixels, and session replay scripts | **Zero telemetry.** No tracking, cookies, external fonts, or analytics libraries |
| **Offline Functionality** | Fails or degrades without an active internet connection | **100% Offline-Capable.** Full canvas drawing, code synthesis, and live preview run entirely client-side |

---

## Algorithmic Foundations: DSA Behind the Engine

Sketch the Site converts raw freehand spatial inputs into clean structural markup using discrete mathematical and geometrical algorithms:

### 1. Bounding Box Normalization & Filtering

When a user draws a stroke, pointer coordinates $[(x_0, y_0), (x_1, y_1), \dots, (x_k, y_k)]$ are recorded. The bounding box is derived in $O(K)$ time:
$$x_{\min} = \min_{i} x_i, \quad x_{\max} = \max_{i} x_i$$
$$y_{\min} = \min_{i} y_i, \quad y_{\max} = \max_{i} y_i$$
$$w = x_{\max} - x_{\min}, \quad h = y_{\max} - y_{\min}$$

- **Threshold Guard:** Strokes where $w < 24\text{px}$ or $h < 24\text{px}$ are rejected to prevent accidental taps from producing invalid empty elements.
- **Boundary Clamping:** Box coordinates are strictly clamped to canvas boundaries $[0, 360] \times [0, 440]$.

### 2. Bidirectional 8-Point Geometric Resizing

Boxes can be resized from all 8 directions with opposite-edge pinning:
- **West Handle (`w`):** Pins the right edge $R = x + w$. New position $x' = \min(\text{pointerX}, R - w_{\min})$ and $w' = R - x'$.
- **North Handle (`n`):** Pins the bottom edge $B = y + h$. New position $y' = \min(\text{pointerY}, B - h_{\min})$ and $h' = B - y'$.
- **East Handle (`e`):** Pins the left edge $x$. New width $w' = \max(w_{\min}, \text{pointerX} - x)$.
- **South Handle (`s`):** Pins the top edge $y$. New height $h' = \max(h_{\min}, \text{pointerY} - y)$.
- **Corner Handles (`nw`, `ne`, `sw`, `se`):** Simultaneously execute horizontal and vertical edge transformations.

### 3. Spatial Sorting & Hierarchy Layout ($O(N \log N)$)

To generate human-readable, semantic HTML, drawn boxes are ordered topologically based on their primary visual layout hierarchy:
$$\text{Sort key}(b) = y_b \cdot 1000 + x_b$$

Boxes positioned higher vertically appear first in the DOM flow. If two boxes share similar vertical bands, horizontal coordinate $x$ determines reading order (left-to-right), matching natural CSS block and inline formatting models.

### 4. Semantic Code Synthesis

The generator maps sorted box models into structured components:
- **Header:** Emits `<h1>Your heading here</h1>` and corresponding hero styling.
- **Image:** Emits responsive SVG placeholder data URI or clean image container with dimensions.
- **Text:** Emits clean `<p>` paragraph elements with baseline font metrics.
- **Button:** Emits semantic `<button class="btn">` styled with responsive hover states.
- The resulting document is complete and self-contained with a doctype, responsive `<meta name="viewport">` tag, and embedded `<style>` block.

---

## Responsive Design & Micro-Interactions

Sketch the Site delivers an intuitive dual-view workspace tailored for both mobile and desktop screens:

- **Two Dedicated Views (Draw vs Code):**
  - **Draw View:** Focuses entirely on the drawing canvas, undo/clear controls, and the quick visual guide card.
  - **Code View:** Activates upon clicking "Build my site", revealing the real-time code editor, live scaled preview, and upgrades card.
- **Laptop Ergonomics (1024px+):**
  - Two-column split layout: Code editor on the left (~58%) and sticky live preview on the right (~42%, `top: 16px`).
  - Code editor features a non-wrapping horizontal scrolling container (`wrap="off"`, `white-space: pre`), custom dark scrollbars matching `--code-bg`, and a synchronized gutter that aligns line numbers exactly with code lines.
- **Phone Ergonomics (<1024px):**
  - Sticky bottom tab bar with 3 clean modes: **Draw**, **Code**, and **Preview**.
  - Code tab features a pinned 30vh live preview strip above the code editor, allowing users to see their changes take effect immediately without context switching.
  - Zero horizontal page overflow across all mobile viewports (tested at 320px, 360px, and 390px).
- **Interactive Upgrade Progress Tracker:**
  - Compact header with real-time SVG progress ring tracking 6 code enhancements (e.g. changing text, fonts, colors, borders).
  - "Show me where" action switches to Code view, auto-scrolls the code box, focuses the editor, and selects the exact line range for immediate editing.

---

## Verification & Automated Test Suite

### 1. Project Verification Harness (`node tools/verify.mjs`)

The project verification suite verifies SHA-256 integrity hashes of locked core modules, inspects all DOM accessors to guarantee zero `innerHTML` or `console.log` statements, validates CSP and storage rules, and checks syntax across all files:

```bash
cd "C:\Projects\Wrench-Wise\13 Sketch_the_Site"
node tools/verify.mjs
# Output: 47356 checks passed, 0 failed (25 files scanned)
# RESULT: ALL PASS
```

### 2. In-Browser Self-Test Suite (`?test=1`)

Appending `?test=1` to the URL runs 13 automated browser tests directly against the DOM:

1. **Sample Sketch Box Classification:** Asserts sample sketch parses into 5 boxes: Header, Image, Text, Text, Button.
2. **Deterministic Code Output:** Asserts "5 boxes became 67 lines of real code." and the code box matches `generate().code`.
3. **Upgrade Engine Initialization:** Asserts upgrade card initializes with "0 of 6 upgrades done."
4. **Interactive Upgrade Detection:** Replacing "Your heading here" with "Chennai Bakes" completes the "Change the words" challenge ("1 of 6 upgrades done.").
5. **Guided Line Selection:** "Show me where" on "Change the font" highlights `font-family: sans-serif` in the code editor.
6. **Label Mutation Rules:** Asserts label cycling rules (Button becomes Header only when no other Header exists; otherwise cycles to Image).
7. **Small Stroke Rejection:** A tiny stroke (<24px) triggers warning message and does not add a box.
8. **Undo Stack Integrity:** Undo restores prior box count and stack history.
9. **Sandboxed Preview Security:** Asserts preview iframe has empty sandbox attribute and script injection cannot access parent context.
10. **WhatsApp Share Sanitization:** Asserts share link conforms to `https://wa.me/?text=` with sanitized payload.
11. **Local Auto-Persistence:** Full sketch state and code edits survive page reloads via localStorage.
12. **Storage Whitelist:** Asserts client storage holds only `sts-sketch`, `sts-code`, and `sts-theme`.
13. **Zero Horizontal Overflow:** Asserts `document.documentElement.scrollWidth <= window.innerWidth`.

---

## Local Development

```bash
# Clone the repository
git clone https://github.com/Pradeep-B28/Sketch_the_Site.git
cd Sketch_the_Site

# Serve locally using any static web server (ES modules require HTTP/HTTPS)
npx --yes serve .

# Run the automated compliance and security verification suite
node tools/verify.mjs
```

---

## License

MIT License. Designed and engineered by [B Pradeep](https://github.com/Pradeep-B28) for **Wrench Wise**.
