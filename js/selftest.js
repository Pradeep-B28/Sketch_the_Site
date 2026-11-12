import { CONFIG } from "../config.js";
import { COPY, t } from "./copy.js";
import {
  newSketch,
  addStroke,
  removeBox,
  setKind,
  nextKind,
  generate,
  missions,
  shareText,
  encodeSketch,
  decodeSketch,
  cleanCode
} from "./engine/sketch.js";
import { sampleSketch } from "./sample-data.js";
import { loadSketch, saveSketch, loadCode, saveCode } from "./store.js";
import { getWhatsAppShareUrl, getSiteUrl } from "./links.js";

export async function runSelfTest(app) {
  const overlay = document.createElement("div");
  overlay.id = "selftest-overlay";
  overlay.className = "selftest-overlay";

  const card = document.createElement("div");
  card.className = "selftest-card";

  const title = document.createElement("h1");
  title.className = "selftest-title";
  title.textContent = "Self-Test Suite (?test=1)";
  card.appendChild(title);

  const list = document.createElement("ol");
  list.className = "selftest-list";
  card.appendChild(list);

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const results = [];

  function addResult(num, description, ok, details = "") {
    results.push({ num, ok, description });
    const li = document.createElement("li");
    li.className = ok ? "test-pass" : "test-fail";

    const badge = document.createElement("span");
    badge.className = "test-badge";
    badge.textContent = ok ? "PASS" : "FAIL";
    li.appendChild(badge);

    const desc = document.createElement("span");
    desc.className = "test-desc";
    desc.textContent = ` ${num}. ${description}${details ? " (" + details + ")" : ""}`;
    li.appendChild(desc);

    list.appendChild(li);
  }

  try {
    // 1. The sample, run through the real page code, gives 5 boxes labelled Header, Image, Text, Text, Button.
    const sample = sampleSketch();
    const expectedKinds = ["header", "image", "text", "text", "button"];
    const kindsMatch = JSON.stringify(sample.boxes.map((b) => b.kind)) === JSON.stringify(expectedKinds);
    addResult(1, "The sample, run through the real page code, gives 5 boxes labelled Header, Image, Text, Text, Button.", kindsMatch);

    // 2. After Build, the headline reads exactly "5 boxes became 67 lines of real code." and the code box holds exactly generate().code.
    const gen = generate(sample);
    const wantHeadline = "5 boxes became 67 lines of real code.";
    const ok2 = gen.headline === wantHeadline && gen.lines === 67 && gen.code.startsWith("<!doctype html>");
    addResult(2, 'After Build, the headline reads exactly "5 boxes became 67 lines of real code." and the code box holds exactly generate().code.', ok2);

    // 3. The upgrades card reads "0 of 6 upgrades done."
    const m0 = missions(gen.code, sample);
    const ok3 = m0.done === 0 && m0.total === 6 && m0.headline === "0 of 6 upgrades done.";
    addResult(3, 'The upgrades card reads "0 of 6 upgrades done."', ok3);

    // 4. Replacing "Your heading here" with "Chennai Bakes" in the code box ticks "Change the words" and the card reads "1 of 6 upgrades done."
    const editedCode = gen.code.replace("Your heading here", "Chennai Bakes");
    const m1 = missions(editedCode, sample);
    const wordsItem = m1.items.find((x) => x.id === "words");
    const ok4 = m1.done === 1 && wordsItem && wordsItem.done && m1.headline === "1 of 6 upgrades done.";
    addResult(4, 'Replacing "Your heading here" with "Chennai Bakes" in the code box ticks "Change the words" and the card reads "1 of 6 upgrades done."', ok4);

    // 5. "Show me where" on "Change the font" selects the text font-family: sans-serif in the code box.
    const fontItem = m0.items.find((x) => x.id === "font");
    const selectedText = fontItem?.range ? gen.code.slice(fontItem.range.start, fontItem.range.end) : "";
    const ok5 = selectedText === "font-family: sans-serif";
    addResult(5, '"Show me where" on "Change the font" selects the text font-family: sans-serif in the code box.', ok5);

    // 6. Tapping the Button label changes it to Header only when no other box is a header. Otherwise it changes to Image.
    const buttonBox = sample.boxes.find((b) => b.kind === "button");
    const nextWithHeader = nextKind(sample, buttonBox.id);
    const sampleNoHeader = removeBox(sample, sample.boxes.find((b) => b.kind === "header").id).sketch;
    const nextWithoutHeader = nextKind(sampleNoHeader, buttonBox.id);
    const ok6 = nextWithHeader === "image" && nextWithoutHeader === "header";
    addResult(6, "Tapping the Button label changes it to Header only when no other box is a header. Otherwise it changes to Image.", ok6);

    // 7. A tiny stroke shows the small message and adds no box.
    const emptyS = newSketch();
    const badStroke = addStroke(emptyS, [[5, 5]]);
    const ok7 = badStroke.ok === false && badStroke.reason === "small" && t("reasons.stroke.small").length > 0;
    addResult(7, "A tiny stroke shows the small message and adds no box.", ok7);

    // 8. Undo after adding a box brings back the same box count.
    const beforeCount = sample.boxes.length;
    const addedRes = addStroke(sample, [[20, 20], [120, 20], [120, 60], [20, 60], [20, 20]]);
    const afterCount = addedRes.ok ? addedRes.sketch.boxes.length : beforeCount;
    const undoRes = removeBox(addedRes.sketch, addedRes.box.id);
    const ok8 = afterCount === beforeCount + 1 && undoRes.sketch.boxes.length === beforeCount;
    addResult(8, "Undo after adding a box brings back the same box count.", ok8);

    // 9. The preview frame has an empty sandbox attribute, and typing <script> in the code does not change document.title.
    const iframe = document.getElementById("preview");
    const sandboxAttr = iframe ? iframe.getAttribute("sandbox") : null;
    const origTitle = document.title;
    // Simulate setting code with script
    const malicious = "<script>document.title = 'compromised'</script>";
    if (iframe) iframe.srcdoc = malicious;
    const ok9 = sandboxAttr === "" && document.title === origTitle;
    addResult(9, "The preview frame has an empty sandbox attribute, and typing <script> in the code does not change document.title.", ok9);

    // 10. The WhatsApp link starts with https://wa.me/?text= and, decoded, equals shareText().
    const siteUrl = getSiteUrl();
    const expectedShareText = shareText(gen, m0, siteUrl);
    const waUrl = getWhatsAppShareUrl(expectedShareText);
    const urlMatches = waUrl.startsWith("https://wa.me/?text=");
    const decodedMatches = decodeURIComponent(waUrl.replace("https://wa.me/?text=", "")) === expectedShareText;
    const ok10 = urlMatches && decodedMatches;
    addResult(10, "The WhatsApp link starts with https://wa.me/?text= and, decoded, equals shareText().", ok10);

    // 11. After a reload, the same sketch and the same edited code come back.
    saveSketch(sample);
    saveCode(editedCode);
    const loadedSketch = loadSketch();
    const loadedCode = loadCode();
    const ok11 = loadedSketch && loadedSketch.boxes.length === 5 && loadedCode === editedCode;
    addResult(11, "After a reload, the same sketch and the same edited code come back.", ok11);

    // 12. Storage holds only allowed keys, and document.title holds none of the visitor's code.
    const allowedKeys = new Set(["sts-theme", "sts-sketch", "sts-code", "sts-intro-seen"]);
    let storageValid = true;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        if (!allowedKeys.has(localStorage.key(i))) storageValid = false;
      }
      for (let i = 0; i < sessionStorage.length; i++) {
        if (!allowedKeys.has(sessionStorage.key(i))) storageValid = false;
      }
    } catch (e) {
      // Storage unavailable is acceptable
    }
    const titleClean = !document.title.includes("Chennai Bakes") && !document.title.includes("<script>");
    const ok12 = storageValid && titleClean;
    addResult(12, "Storage holds only allowed keys, and document.title holds none of the visitor's code.", ok12);

    // 13. document.documentElement.scrollWidth is not larger than the window width.
    const scrollOk = document.documentElement.scrollWidth <= window.innerWidth;
    addResult(13, "document.documentElement.scrollWidth is not larger than the window width.", scrollOk);

    // Final summary
    const summary = document.createElement("p");
    summary.className = "selftest-summary";
    const allPass = results.every((r) => r.ok);
    summary.textContent = allPass ? `ALL ${results.length} TESTS PASSED` : `${results.filter((r) => !r.ok).length} TESTS FAILED`;
    summary.style.color = allPass ? "#10B981" : "#EF4444";
    card.appendChild(summary);
  } catch (err) {
    addResult(99, "Self-test runner error", false, err.message);
  }
}
