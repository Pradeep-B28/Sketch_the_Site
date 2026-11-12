// All words on the site. Do not reword unless I ask. Use t("hero.title") to read one.
// {name} parts are filled in by t(key, { name: value }).

export const COPY = {
  brand: "Wrench Wise",
  hero: {
    eyebrow: "Free website builder for beginners",
    title: "Draw a website. Get real code.",
    sub: "Sketch a few rough boxes with your finger or mouse. Sketch to Site turns them into a working web page. Then you make it look good by editing the code yourself."
  },
  steps: { draw: "1. Draw", code: "2. Code", preview: "Preview" },
  draw: {
    heading: "Draw your page",
    hint: "Draw a wide box at the top for a header, a big box for an image, a small box for a button and a wavy line for text.",
    empty: "Start by drawing a box here.",
    count: "{count} of {max} boxes",
    undo: "Undo",
    clear: "Clear",
    clearConfirm: "Clear the whole sketch?",
    clearYes: "Yes, clear it",
    clearNo: "Keep it",
    sample: "Try a sample sketch",
    tapHint: "Tap a label to change what the box is.",
    remove: "Remove this box",
    build: "Build my site",
    rebuild: "Rebuild from sketch",
    rebuildConfirm: "This replaces the code you have edited.",
    rebuildYes: "Replace my code",
    rebuildNo: "Keep my code"
  },
  kinds: { header: "Header", image: "Image", text: "Text", button: "Button" },
  reasons: {
    stroke: {
      small: "That was too small to read. Draw a bigger box.",
      full: "A sketch can have up to 12 boxes.",
      invalid: "That stroke could not be read. Try again."
    },
    kind: {
      unknown: "That box no longer exists.",
      kind: "That is not a box type.",
      oneHeader: "A page can have only one header."
    },
    codeLong: "Your code is too long to save. Keep it under 20,000 characters.",
    copyFailed: "Copy did not work. Select the code and copy it by hand."
  },
  result: {
    empty: "Your code shows up here.",
    emptySub: "Draw a few boxes, then press Build my site.",
    plain: "It works, but it looks plain. That part is your job.",
    yourLines: "Your code is now {lines} lines.",
    saved: "Saved on this device"
  },
  code: {
    heading: "Your code",
    label: "Website code. Edit it and watch the preview change.",
    copy: "Copy code",
    copied: "Copied",
    reset: "Reset my edits",
    resetConfirm: "Go back to the plain code from your sketch?",
    resetYes: "Yes, reset",
    resetNo: "Keep my edits",
    download: "Download my site",
    downloadNote: "You get one HTML file. Open it in any browser, or host it for free."
  },
  preview: {
    heading: "Live preview",
    label: "Live preview of your website",
    phone: "Phone",
    laptop: "Laptop",
    note: "The preview changes as you type."
  },
  missions: {
    heading: "Make it yours",
    sub: "Six small edits. Each one is a real skill.",
    progress: "{done} of {total} upgrades done.",
    show: "Show me where",
    hintLabel: "Hint",
    exampleLabel: "Example",
    done: "Done",
    complete: "All six done. You just styled a website by hand.",
    words: {
      title: "Change the words",
      hint: "Find the text between the tags and type your own.",
      example: "<h1 class=\"heading\">Chennai Bakes</h1>"
    },
    colour: {
      title: "Add a colour",
      hint: "Change a color or background value to a colour you like.",
      example: "background: #059669;\ncolor: #ffffff;"
    },
    round: {
      title: "Round the corners",
      hint: "Add border-radius inside a rule.",
      example: "border-radius: 12px;"
    },
    shadow: {
      title: "Add a shadow",
      hint: "Add box-shadow inside a rule.",
      example: "box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);"
    },
    font: {
      title: "Change the font",
      hint: "Change font-family in the body rule.",
      example: "font-family: Georgia, serif;"
    },
    hover: {
      title: "Add a hover effect",
      hint: "Add a new rule that ends in :hover, just before </style>.",
      example: ".button:hover {\n  background: #047857;\n}"
    }
  },
  share: {
    heading: "Show what you built",
    whatsApp: "Share on WhatsApp",
    note: "Only the message is shared. Your sketch and code stay on this device."
  },
  privacy: {
    line: "Your sketch and code are saved only on this device. No account, no server.",
    proofTitle: "Check it yourself",
    proof: "Load this page, turn on airplane mode, and it still works."
  },
  how: {
    heading: "How it works",
    one: "Draw rough boxes for a header, an image, some text and a button.",
    two: "Press Build my site to turn the sketch into real HTML and CSS.",
    three: "Edit the code to add your words, colours and effects, then download your site."
  },
  hood: {
    heading: "What happens when you press Build",
    boxTitle: "Bounding box",
    box: "Every stroke is a list of points. The page finds the smallest box that holds all of them: the lowest and highest x and y.",
    boxLive: "Your sketch has {boxes} boxes.",
    rulesTitle: "Decision rules",
    rules: "Each box is checked against simple rules, top to bottom. Wide and near the top is a header. Tall is an image. Small is a button. Anything else is text.",
    rulesLive: "It found {header} header, {image} image, {text} text and {button} button boxes.",
    sortTitle: "Sorting and grouping",
    sort: "The boxes are sorted from top to bottom. Boxes that sit side by side are grouped into one row, then sorted left to right.",
    sortLive: "Your boxes were sorted into {rows} rows.",
    codeTitle: "Code generation",
    code: "Each box becomes one HTML tag, and each kind of box gets one CSS rule. This is how every website is built: HTML for structure, CSS for looks.",
    codeLive: "That made {tags} HTML tags, {rules} CSS rules and {lines} lines of code."
  },
  cta: {
    title: "Want to build real websites from scratch?",
    body: "You just edited HTML and CSS by hand. Learn to build complete, working products step by step in the {program}.",
    button: "Explore the program",
    whatsApp: "Talk to us on WhatsApp"
  },
  footer: {
    built: "Built by Wrench Wise",
    privacy: "Your sketch stays on your device."
  },
  noScript: "This page needs JavaScript to run."
};

export function t(key, values = {}) {
  const found = key.split(".").reduce((node, part) => node?.[part], COPY);
  if (typeof found !== "string") return "";
  return found.replace(/\{(\w+)\}/g, (all, name) => values[name] ?? all);
}
