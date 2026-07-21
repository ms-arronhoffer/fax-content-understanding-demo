/**
 * Builds Fax-Content-Understanding-Demo.pptx — a dark, Microsoft-branded customer
 * deck covering the business problem, architecture, step-by-step flow, and benefits
 * of the fax ingest + Azure Content Understanding demo.
 *
 * Run: node build.js
 */
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaFolderOpen,
  FaCloudUploadAlt,
  FaDatabase,
  FaProjectDiagram,
  FaRobot,
  FaCheckCircle,
  FaClock,
  FaShieldAlt,
  FaExclamationTriangle,
  FaFileAlt,
  FaBolt,
  FaChartLine,
  FaSearchPlus,
  FaTags,
  FaMagic,
  FaArrowRight,
  FaRoad,
} = require("react-icons/fa");

// ---------- Palette ("Fluent Dark" + Azure brand accent) ----------
const COLOR = {
  bg: "1B1A19", // near-black slate (Fluent neutralDark)
  bgPanel: "252423", // slightly lighter panel
  bgPanelAlt: "2A2928",
  azure: "0078D4", // Microsoft Azure blue (dominant accent)
  cyan: "50E6FF", // bright cyan (secondary accent)
  green: "107C10", // Microsoft green (success)
  red: "D83B01", // Microsoft orange-red (errors/warning)
  textLight: "F3F2F1",
  textMuted: "C8C6C4",
  textFaint: "8A8886",
  white: "FFFFFF",
};

const HEADER_FONT = "Segoe UI Semibold";
const BODY_FONT = "Segoe UI";

async function iconPng(IconComponent, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

function iconCircle(slide, icon, opts) {
  const { x, y, d = 0.6, bg = COLOR.azure, iconColor = COLOR.white } = opts;
  slide.addShape("ellipse", { x, y, w: d, h: d, fill: { color: bg }, line: { type: "none" } });
  const pad = d * 0.24;
  slide.addImage({ data: icon, x: x + pad, y: y + pad, w: d - pad * 2, h: d - pad * 2 });
}

function footer(slide, pageNum) {
  slide.addText("Fax Ingest & Extraction with Azure Content Understanding", {
    x: 0.5, y: 7.02, w: 8, h: 0.3, fontFace: BODY_FONT, fontSize: 9,
    color: COLOR.textFaint, margin: 0,
  });
  slide.addText(String(pageNum), {
    x: 12.3, y: 7.02, w: 0.5, h: 0.3, fontFace: BODY_FONT, fontSize: 9,
    color: COLOR.textFaint, align: "right", margin: 0,
  });
}

function slideTitle(slide, kicker, title) {
  slide.addText(kicker.toUpperCase(), {
    x: 0.6, y: 0.42, w: 10, h: 0.35, fontFace: BODY_FONT, fontSize: 13,
    color: COLOR.cyan, bold: true, charSpacing: 2, margin: 0,
  });
  slide.addText(title, {
    x: 0.6, y: 0.72, w: 11.5, h: 0.85, fontFace: HEADER_FONT, fontSize: 32,
    color: COLOR.textLight, bold: true, margin: 0,
  });
}

async function build() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
  pres.author = "Microsoft";
  pres.title = "Fax Ingest & Extraction with Azure Content Understanding";

  // Pre-render icons once
  const icons = {
    folder: await iconPng(FaFolderOpen, "#FFFFFF"),
    upload: await iconPng(FaCloudUploadAlt, "#FFFFFF"),
    db: await iconPng(FaDatabase, "#FFFFFF"),
    flow: await iconPng(FaProjectDiagram, "#FFFFFF"),
    robot: await iconPng(FaRobot, "#FFFFFF"),
    check: await iconPng(FaCheckCircle, "#FFFFFF"),
    clock: await iconPng(FaClock, "#FFFFFF"),
    shield: await iconPng(FaShieldAlt, "#FFFFFF"),
    warn: await iconPng(FaExclamationTriangle, "#FFFFFF"),
    file: await iconPng(FaFileAlt, "#FFFFFF"),
    bolt: await iconPng(FaBolt, "#FFFFFF"),
    chart: await iconPng(FaChartLine, "#FFFFFF"),
    extract: await iconPng(FaSearchPlus, "#FFFFFF"),
    classify: await iconPng(FaTags, "#FFFFFF"),
    generate: await iconPng(FaMagic, "#FFFFFF"),
    arrow: await iconPng(FaArrowRight, "#8A8886"),
    road: await iconPng(FaRoad, "#FFFFFF"),
    clockCyan: await iconPng(FaClock, "#" + COLOR.cyan),
    chartCyan: await iconPng(FaChartLine, "#" + COLOR.cyan),
    shieldCyan: await iconPng(FaShieldAlt, "#" + COLOR.cyan),
  };

  // ============================================================
  // Slide 1 — Title
  // ============================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: COLOR.bg };

    slide.addShape("rect", { x: 0, y: 0, w: 13.34, h: 0.12, fill: { color: COLOR.azure }, line: { type: "none" } });
    slide.addShape("ellipse", {
      x: 10.3, y: -1.6, w: 5, h: 5, fill: { color: COLOR.azure, transparency: 88 }, line: { type: "none" },
    });
    slide.addShape("ellipse", {
      x: -1.6, y: 4.8, w: 4.2, h: 4.2, fill: { color: COLOR.cyan, transparency: 92 }, line: { type: "none" },
    });

    slide.addText("CUSTOMER BRIEFING  •  ARCHITECTURE WALKTHROUGH", {
      x: 0.8, y: 2.15, w: 10, h: 0.35, fontFace: BODY_FONT, fontSize: 14,
      color: COLOR.cyan, bold: true, charSpacing: 3, margin: 0,
    });
    slide.addText("Automating Fax Ingest & Extraction", {
      x: 0.8, y: 2.55, w: 11.5, h: 1.3, fontFace: HEADER_FONT, fontSize: 44,
      color: COLOR.textLight, bold: true, margin: 0,
    });
    slide.addText("Turning inbound faxes into structured, actionable data with Azure Content Understanding", {
      x: 0.8, y: 3.75, w: 10.5, h: 0.6, fontFace: BODY_FONT, fontSize: 18,
      color: COLOR.textMuted, margin: 0,
    });

    const chips = ["Power Automate", "Blob Storage", "Logic Apps", "Content Understanding"];
    let cx = 0.8;
    chips.forEach((c) => {
      const w = 0.28 + c.length * 0.11;
      slide.addShape("roundRect", {
        x: cx, y: 4.7, w, h: 0.42, rectRadius: 0.08,
        fill: { color: COLOR.bgPanel }, line: { color: COLOR.azure, width: 1 },
      });
      slide.addText(c, {
        x: cx, y: 4.7, w, h: 0.42, fontFace: BODY_FONT, fontSize: 12,
        color: COLOR.textLight, align: "center", valign: "middle", margin: 0,
      });
      cx += w + 0.3;
    });

    slide.addText("Microsoft  |  Azure AI", {
      x: 0.8, y: 6.85, w: 5, h: 0.3, fontFace: BODY_FONT, fontSize: 11,
      color: COLOR.textFaint, margin: 0,
    });
  }

  // ============================================================
  // Slide 2 — The Business Problem
  // ============================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: COLOR.textLight };
    const dark = "201F1E";

    slide.addText("THE CHALLENGE", {
      x: 0.6, y: 0.42, w: 10, h: 0.35, fontFace: BODY_FONT, fontSize: 13,
      color: COLOR.azure, bold: true, charSpacing: 2, margin: 0,
    });
    slide.addText("Inbound faxes are still a manual bottleneck", {
      x: 0.6, y: 0.72, w: 11.5, h: 0.85, fontFace: HEADER_FONT, fontSize: 32,
      color: dark, bold: true, margin: 0,
    });

    const rows = [
      { icon: icons.file, title: "Manual re-keying", body: "Staff retype sender, patient/customer, and document details from every fax image into downstream systems." },
      { icon: icons.clock, title: "Slow turnaround", body: "Faxes sit in a queue until someone has time to open, read, and route them — delaying time-sensitive requests." },
      { icon: icons.warn, title: "Inconsistent, error-prone data", body: "Handwritten notes and manual entry introduce typos and missed fields with no confidence signal or audit trail." },
      { icon: icons.shield, title: "No visibility", body: "There's no structured record of what arrived, when, or whether it was actually processed." },
    ];

    let ry = 2.05;
    rows.forEach((r) => {
      iconCircle(slide, r.icon, { x: 0.7, y: ry, d: 0.55, bg: COLOR.azure });
      slide.addText(r.title, {
        x: 1.45, y: ry - 0.05, w: 6.7, h: 0.35, fontFace: HEADER_FONT, fontSize: 16,
        color: dark, bold: true, margin: 0,
      });
      slide.addText(r.body, {
        x: 1.45, y: ry + 0.28, w: 6.9, h: 0.75, fontFace: BODY_FONT, fontSize: 12.5,
        color: "3B3A39", margin: 0,
      });
      ry += 1.15;
    });

    // Right column: stat callouts
    slide.addShape("rect", {
      x: 8.9, y: 1.9, w: 3.8, h: 4.6, fill: { color: dark }, line: { type: "none" },
    });
    slide.addText("WHY IT MATTERS", {
      x: 9.2, y: 2.15, w: 3.2, h: 0.3, fontFace: BODY_FONT, fontSize: 11,
      color: COLOR.cyan, bold: true, charSpacing: 2, margin: 0,
    });
    slide.addText("70%+", {
      x: 9.2, y: 2.5, w: 3.2, h: 0.9, fontFace: HEADER_FONT, fontSize: 60,
      color: COLOR.white, bold: true, margin: 0,
    });
    slide.addText("of inbound fax volume in document-heavy industries still requires manual triage or re-keying today*", {
      x: 9.2, y: 3.35, w: 3.2, h: 0.95, fontFace: BODY_FONT, fontSize: 11.5,
      color: COLOR.textMuted, margin: 0,
    });
    slide.addShape("line", { x: 9.2, y: 4.5, w: 3.2, h: 0, line: { color: "3B3A39", width: 1 } });
    slide.addText("Minutes → Seconds", {
      x: 9.2, y: 4.65, w: 3.2, h: 0.4, fontFace: HEADER_FONT, fontSize: 18,
      color: COLOR.cyan, bold: true, margin: 0,
    });
    slide.addText("potential reduction in time from fax arrival to structured, actionable data", {
      x: 9.2, y: 5.05, w: 3.2, h: 0.7, fontFace: BODY_FONT, fontSize: 11.5,
      color: COLOR.textMuted, margin: 0,
    });
    slide.addText("*Illustrative example — align to your organization's actual volume and turnaround metrics.", {
      x: 9.2, y: 5.85, w: 3.35, h: 0.5, fontFace: BODY_FONT, fontSize: 8.5, italic: true,
      color: COLOR.textFaint, margin: 0,
    });

    slide.addText("Fax Ingest & Extraction with Azure Content Understanding", {
      x: 0.5, y: 7.02, w: 8, h: 0.3, fontFace: BODY_FONT, fontSize: 9, color: "605E5C", margin: 0,
    });
    slide.addText("2", { x: 12.3, y: 7.02, w: 0.5, h: 0.3, fontFace: BODY_FONT, fontSize: 9, color: "605E5C", align: "right", margin: 0 });
  }

  // ============================================================
  // Slide 3 — Solution Overview
  // ============================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: COLOR.bg };
    slideTitle(slide, "The Solution", "An automated pipeline — no application code to maintain");

    slide.addText(
      "Every step uses managed Azure services wired together with configuration, not custom application code — " +
      "so the pipeline is easy to operate, secure by default, and quick to extend.",
      { x: 0.6, y: 1.85, w: 11.8, h: 0.6, fontFace: BODY_FONT, fontSize: 14, color: COLOR.textMuted, margin: 0 }
    );

    const stages = [
      { icon: icons.upload, title: "1. Ingest", body: "A file is uploaded from a local folder via a Power Automate flow into Blob Storage." },
      { icon: icons.flow, title: "2. Trigger", body: "The new blob automatically triggers a Logic App — no polling scripts to run." },
      { icon: icons.robot, title: "3. Extract", body: "Azure Content Understanding reads the document and returns structured fields with confidence scores." },
      { icon: icons.check, title: "4. Deliver", body: "The Logic App writes the completed JSON result back to a Processed folder, ready for downstream systems." },
    ];

    const cardW = 2.7, gap = 0.35, startX = 0.6, y = 2.65, cardH = 3.6;
    stages.forEach((s, i) => {
      const x = startX + i * (cardW + gap);
      slide.addShape("roundRect", {
        x, y, w: cardW, h: cardH, rectRadius: 0.06,
        fill: { color: COLOR.bgPanel }, line: { color: "3B3A39", width: 1 },
      });
      iconCircle(slide, s.icon, { x: x + 0.25, y: y + 0.3, d: 0.65, bg: COLOR.azure });
      slide.addText(s.title, {
        x: x + 0.25, y: y + 1.15, w: cardW - 0.5, h: 0.4, fontFace: HEADER_FONT, fontSize: 16,
        color: COLOR.textLight, bold: true, margin: 0,
      });
      slide.addText(s.body, {
        x: x + 0.25, y: y + 1.6, w: cardW - 0.5, h: 1.9, fontFace: BODY_FONT, fontSize: 12,
        color: COLOR.textMuted, margin: 0,
      });
      if (i < stages.length - 1) {
        slide.addImage({ data: icons.arrow, x: x + cardW + 0.02, y: y + cardH / 2 - 0.13, w: 0.24, h: 0.24 });
      }
    });

    footer(slide, 3);
  }

  // ============================================================
  // Slide 4 — Detailed Architecture Diagram
  // ============================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: COLOR.bg };
    slideTitle(slide, "Architecture", "How the pieces fit together");

    const boxY = 2.6, boxH = 1.3, boxW = 2.05, gap = 0.55;
    const boxes = [
      { label: "Local Folder", sub: "User's PC", icon: icons.folder, color: COLOR.bgPanelAlt },
      { label: "Power Automate", sub: "Cloud flow", icon: icons.upload, color: COLOR.azure },
      { label: "Blob Storage", sub: "incoming/", icon: icons.db, color: COLOR.bgPanelAlt },
      { label: "Logic App", sub: "Consumption", icon: icons.flow, color: COLOR.azure },
      { label: "Content\nUnderstanding", sub: "Custom analyzer", icon: icons.robot, color: COLOR.azure },
    ];
    let bx = 0.5;
    const centers = [];
    boxes.forEach((b) => {
      slide.addShape("roundRect", {
        x: bx, y: boxY, w: boxW, h: boxH, rectRadius: 0.06,
        fill: { color: b.color }, line: { color: "3B3A39", width: 1 },
      });
      iconCircle(slide, b.icon, { x: bx + boxW / 2 - 0.25, y: boxY + 0.14, d: 0.5, bg: COLOR.bg });
      slide.addText(b.label, {
        x: bx, y: boxY + 0.68, w: boxW, h: 0.4, fontFace: HEADER_FONT, fontSize: 12,
        color: COLOR.white, bold: true, align: "center", margin: 0,
      });
      slide.addText(b.sub, {
        x: bx, y: boxY + 1.02, w: boxW, h: 0.25, fontFace: BODY_FONT, fontSize: 9.5,
        color: COLOR.textMuted, align: "center", margin: 0,
      });
      centers.push(bx + boxW / 2);
      bx += boxW + gap;
    });

    // Arrows between boxes (top row, left to right)
    for (let i = 0; i < boxes.length - 1; i++) {
      const x1 = centers[i] + boxW / 2 - 0.02;
      const x2 = centers[i + 1] - boxW / 2 + 0.02;
      slide.addShape("line", {
        x: x1, y: boxY + boxH / 2, w: x2 - x1, h: 0,
        line: { color: COLOR.cyan, width: 2 },
      });
    }

    // Poll loop annotation, offset beside the vertical connector line (not on top of it)
    slide.addText("polls Operation-Location\nuntil Succeeded / Failed", {
      x: centers[3] + 0.24, y: boxY + boxH + 0.06, w: 2.6, h: 0.55, fontFace: BODY_FONT, fontSize: 9.5,
      italic: true, color: COLOR.textFaint, align: "left", margin: 0,
    });

    // Result branch down to Processed / Errors
    const branchY = boxY + boxH + 0.75;
    slide.addShape("line", {
      x: centers[3], y: boxY + boxH, w: 0, h: branchY - (boxY + boxH),
      line: { color: COLOR.cyan, width: 2 },
    });

    const outW = 2.3, outH = 1.0;
    slide.addShape("roundRect", {
      x: centers[3] - outW - 0.3, y: branchY, w: outW, h: outH, rectRadius: 0.06,
      fill: { color: COLOR.green }, line: { type: "none" },
    });
    slide.addText("Blob Storage\nprocessed/  (success JSON)", {
      x: centers[3] - outW - 0.3, y: branchY, w: outW, h: outH, fontFace: BODY_FONT, fontSize: 10.5,
      color: COLOR.white, align: "center", valign: "middle", margin: 0,
    });

    slide.addShape("roundRect", {
      x: centers[3] + 0.3, y: branchY, w: outW, h: outH, rectRadius: 0.06,
      fill: { color: COLOR.red }, line: { type: "none" },
    });
    slide.addText("Blob Storage\nerrors/  (failure detail)", {
      x: centers[3] + 0.3, y: branchY, w: outW, h: outH, fontFace: BODY_FONT, fontSize: 10.5,
      color: COLOR.white, align: "center", valign: "middle", margin: 0,
    });
    slide.addShape("line", {
      x: centers[3], y: branchY, w: outW + 0.3, h: 0, line: { color: COLOR.cyan, width: 2 },
    });

    slide.addText("Both containers are private (no public access); the Logic App authenticates to Content Understanding with its own system-assigned managed identity — no keys or secrets in the workflow.", {
      x: 0.6, y: 6.35, w: 11.8, h: 0.45, fontFace: BODY_FONT, fontSize: 11, italic: true,
      color: COLOR.textFaint, margin: 0,
    });

    footer(slide, 4);
  }

  // ============================================================
  // Slide 5 — Services Used (table)
  // ============================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: COLOR.bg };
    slideTitle(slide, "Under the Hood", "Services used in this demo");

    const headerOpts = { fill: { color: COLOR.azure }, color: COLOR.white, bold: true, fontFace: HEADER_FONT, fontSize: 13 };
    const cellOpts = { fill: { color: COLOR.bgPanel }, color: COLOR.textLight, fontFace: BODY_FONT, fontSize: 12 };
    const cellOptsAlt = { fill: { color: COLOR.bgPanelAlt }, color: COLOR.textLight, fontFace: BODY_FONT, fontSize: 12 };

    const rowsData = [
      ["Power Automate", "Cloud flow that uploads a file from a local folder into Blob Storage", "Entry point / ingestion"],
      ["Azure Blob Storage", "Three containers: incoming, processed, errors", "Durable, low-cost object storage"],
      ["Azure Logic Apps (Consumption)", "Blob-triggered workflow that orchestrates the analyze-and-poll pattern", "Serverless orchestration, no code"],
      ["Azure Content Understanding", "Custom analyzer extracts, classifies, and generates structured fields", "AI extraction engine"],
      ["Managed Identity + RBAC", "Logic App identity is granted Cognitive Services User on the Foundry resource", "Secretless, least-privilege auth"],
    ];

    const tableRows = [
      [
        { text: "Service", options: headerOpts },
        { text: "Role in this demo", options: headerOpts },
        { text: "Why it's here", options: headerOpts },
      ],
      ...rowsData.map((r, i) =>
        r.map((c, ci) => ({ text: c, options: { ...(i % 2 === 0 ? cellOpts : cellOptsAlt), bold: ci === 0 } }))
      ),
    ];

    slide.addTable(tableRows, {
      x: 0.6, y: 1.85, w: 12.1, colW: [3.3, 5.6, 3.2],
      border: { pt: 0.5, color: "3B3A39" },
      autoPage: false,
      rowH: 0.82,
      valign: "middle",
    });

    footer(slide, 5);
  }

  // ============================================================
  // Slide 6 — Flow: Upload, Trigger, Analyze
  // ============================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: COLOR.bg };
    slideTitle(slide, "The Flow — Part 1", "From local folder to an analysis request");

    const steps = [
      { n: "1", icon: icons.upload, title: "Upload via Power Automate", body: "The presenter (or an automated flow) selects a file from a local folder; a manual-trigger cloud flow reads its content and calls Create blob (V2) into the incoming container." },
      { n: "2", icon: icons.bolt, title: "Blob trigger fires", body: "The Logic App's built-in Azure Blob Storage trigger detects the new file, reads its content, and generates a short-lived (30-minute) read-only SAS URL for it." },
      { n: "3", icon: icons.robot, title: "Analyze request sent", body: "The Logic App POSTs the SAS URL to the custom fax-document-analyzer, authenticating with its own system-assigned managed identity — no API keys stored anywhere." },
    ];

    let y = 1.75;
    steps.forEach((s) => {
      iconCircle(slide, s.icon, { x: 0.6, y, d: 0.75, bg: COLOR.azure });
      slide.addText(s.n, {
        x: 0.6, y: y - 0.22, w: 0.35, h: 0.3, fontFace: HEADER_FONT, fontSize: 13,
        color: COLOR.cyan, bold: true, margin: 0,
      });
      slide.addText(s.title, {
        x: 1.6, y: y + 0.02, w: 10.8, h: 0.4, fontFace: HEADER_FONT, fontSize: 18,
        color: COLOR.textLight, bold: true, margin: 0,
      });
      slide.addText(s.body, {
        x: 1.6, y: y + 0.45, w: 10.8, h: 0.7, fontFace: BODY_FONT, fontSize: 13,
        color: COLOR.textMuted, margin: 0,
      });
      y += 1.75;
    });

    footer(slide, 6);
  }

  // ============================================================
  // Slide 7 — Flow: Async processing & structured output
  // ============================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: COLOR.bg };
    slideTitle(slide, "The Flow — Part 2", "Asynchronous processing & structured output");

    // Left: poll loop visual
    slide.addShape("roundRect", {
      x: 0.6, y: 1.75, w: 5.5, h: 4.6, rectRadius: 0.06,
      fill: { color: COLOR.bgPanel }, line: { color: "3B3A39", width: 1 },
    });
    slide.addText("The poll loop", {
      x: 0.9, y: 1.95, w: 4.9, h: 0.4, fontFace: HEADER_FONT, fontSize: 16,
      color: COLOR.textLight, bold: true, margin: 0,
    });
    const pollSteps = [
      "Content Understanding returns 202 Accepted + an Operation-Location URL",
      "Logic App loops: wait 3s → GET Operation-Location → check status",
      "Loop continues until status is Succeeded or Failed (up to 5 minutes)",
      "This async pattern lets long-running analysis (multi-page documents) complete without holding open a connection",
    ];
    let py = 2.5;
    pollSteps.forEach((t, i) => {
      iconCircle(slide, icons.clockCyan, { x: 0.9, y: py, d: 0.38, bg: COLOR.bgPanelAlt });
      slide.addText(t, {
        x: 1.45, y: py - 0.02, w: 4.35, h: 0.75, fontFace: BODY_FONT, fontSize: 11.5,
        color: COLOR.textMuted, margin: 0,
      });
      py += 0.92;
    });

    // Right: sample structured output
    slide.addShape("roundRect", {
      x: 6.4, y: 1.75, w: 6.3, h: 4.6, rectRadius: 0.06,
      fill: { color: "0C0C0C" }, line: { color: "3B3A39", width: 1 },
    });
    slide.addText("Sample result written to processed/", {
      x: 6.7, y: 1.95, w: 5.7, h: 0.4, fontFace: HEADER_FONT, fontSize: 16,
      color: COLOR.textLight, bold: true, margin: 0,
    });

    const fieldRows = [
      ["SenderOrganization", "Contoso Clinic", "91%"],
      ["DocumentType", "Referral", "89%"],
      ["DateSent", "2026-07-18", "96%"],
      ["Summary", "Referring patient for MRI, requests scheduling confirmation", "generated"],
      ["ActionRequired", "true", "generated"],
    ];
    const tRows = [
      [
        { text: "Field", options: { fill: { color: "1F1F1F" }, color: COLOR.cyan, bold: true, fontFace: BODY_FONT, fontSize: 11 } },
        { text: "Extracted value", options: { fill: { color: "1F1F1F" }, color: COLOR.cyan, bold: true, fontFace: BODY_FONT, fontSize: 11 } },
        { text: "Confidence", options: { fill: { color: "1F1F1F" }, color: COLOR.cyan, bold: true, fontFace: BODY_FONT, fontSize: 11 } },
      ],
      ...fieldRows.map((r) => r.map((c) => ({ text: c, options: { fill: { color: "141414" }, color: COLOR.textLight, fontFace: "Consolas", fontSize: 10.5 } }))),
    ];
    slide.addTable(tRows, {
      x: 6.7, y: 2.5, w: 5.7, colW: [1.9, 2.6, 1.2],
      border: { pt: 0.5, color: "3B3A39" }, rowH: 0.55, valign: "middle",
    });

    slide.addText("Every field carries a confidence score and source grounding — teams can straight-through process high-confidence fields and route only low-confidence ones for review.", {
      x: 6.7, y: 5.7, w: 5.7, h: 0.55, fontFace: BODY_FONT, fontSize: 10.5, italic: true,
      color: COLOR.textFaint, margin: 0,
    });

    footer(slide, 7);
  }

  // ============================================================
  // Slide 8 — Why Content Understanding is different
  // ============================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: COLOR.bg };
    slideTitle(slide, "Beyond OCR", "Why Azure Content Understanding");

    slide.addText(
      "Classic OCR / Document Intelligence extracts literal text. Content Understanding's custom analyzers combine three field methods in a single schema:",
      { x: 0.6, y: 1.6, w: 11.8, h: 0.5, fontFace: BODY_FONT, fontSize: 13.5, color: COLOR.textMuted, margin: 0 }
    );

    const methods = [
      { icon: icons.extract, title: "Extract", color: COLOR.azure, body: "Pulls a value verbatim from the document.", example: "SenderName, DateSent, PageCount" },
      { icon: icons.classify, title: "Classify", color: COLOR.cyan, body: "Buckets the document into a known category.", example: "DocumentType: Referral, Invoice, LabResult..." },
      { icon: icons.generate, title: "Generate", color: COLOR.green, body: "Uses the model to synthesize an answer that isn't a literal excerpt.", example: "Summary, ActionRequired, ActionDescription" },
    ];

    const cardW = 3.8, gap = 0.35, startX = 0.6, y = 2.35, cardH = 3.9;
    methods.forEach((m, i) => {
      const x = startX + i * (cardW + gap);
      slide.addShape("roundRect", {
        x, y, w: cardW, h: cardH, rectRadius: 0.06,
        fill: { color: COLOR.bgPanel }, line: { color: m.color, width: 1.5 },
      });
      iconCircle(slide, m.icon, { x: x + 0.3, y: y + 0.35, d: 0.75, bg: m.color });
      slide.addText(m.title, {
        x: x + 0.3, y: y + 1.3, w: cardW - 0.6, h: 0.45, fontFace: HEADER_FONT, fontSize: 20,
        color: COLOR.textLight, bold: true, margin: 0,
      });
      slide.addText(m.body, {
        x: x + 0.3, y: y + 1.8, w: cardW - 0.6, h: 0.8, fontFace: BODY_FONT, fontSize: 12.5,
        color: COLOR.textMuted, margin: 0,
      });
      slide.addShape("line", { x: x + 0.3, y: y + 2.65, w: cardW - 0.6, h: 0, line: { color: "3B3A39", width: 1 } });
      slide.addText("EXAMPLE FIELDS", {
        x: x + 0.3, y: y + 2.8, w: cardW - 0.6, h: 0.25, fontFace: BODY_FONT, fontSize: 9,
        color: m.color, bold: true, charSpacing: 1, margin: 0,
      });
      slide.addText(m.example, {
        x: x + 0.3, y: y + 3.05, w: cardW - 0.6, h: 0.7, fontFace: "Consolas", fontSize: 10.5,
        color: COLOR.textLight, margin: 0,
      });
    });

    footer(slide, 8);
  }

  // ============================================================
  // Slide 9 — Benefits & ROI
  // ============================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: COLOR.bg };
    slideTitle(slide, "Impact", "Benefits at a glance");

    const stats = [
      { icon: icons.clockCyan, big: "Minutes", label: "Typical time from fax arrival to structured JSON output, vs. hours in a manual queue" },
      { icon: icons.chartCyan, big: "0", label: "Lines of custom application code to maintain — every step is a managed Azure service" },
      { icon: icons.shieldCyan, big: "100%", label: "Of requests authenticated via managed identity — no API keys stored in the workflow" },
    ];
    const cardW = 3.8, gap = 0.35, startX = 0.6, y = 1.85, cardH = 2.35;
    stats.forEach((s, i) => {
      const x = startX + i * (cardW + gap);
      slide.addShape("roundRect", {
        x, y, w: cardW, h: cardH, rectRadius: 0.06,
        fill: { color: COLOR.bgPanel }, line: { type: "none" },
      });
      slide.addImage({ data: s.icon, x: x + 0.3, y: y + 0.28, w: 0.5, h: 0.5 });
      slide.addText(s.big, {
        x: x + 0.3, y: y + 0.78, w: cardW - 0.6, h: 0.65, fontFace: HEADER_FONT, fontSize: 32,
        color: COLOR.white, bold: true, margin: 0,
      });
      slide.addText(s.label, {
        x: x + 0.3, y: y + 1.4, w: cardW - 0.6, h: 0.85, fontFace: BODY_FONT, fontSize: 11.5,
        color: COLOR.textMuted, margin: 0,
      });
    });

    slide.addText("WHAT THIS UNLOCKS", {
      x: 0.6, y: 4.5, w: 6, h: 0.3, fontFace: BODY_FONT, fontSize: 12,
      color: COLOR.cyan, bold: true, charSpacing: 2, margin: 0,
    });
    const unlocks = [
      "Faster response times for time-sensitive documents (referrals, orders, claims)",
      "Consistent, structured data quality with confidence scores for triage",
      "A clear audit trail: every source document, its extraction, and its outcome",
      "A foundation to plug into downstream systems (CRM, EHR, ERP) without re-architecting",
    ];
    slide.addText(
      unlocks.map((u) => ({ text: u, options: { bullet: { code: "25CF" }, breakLine: true, paraSpaceAfter: 10 } })),
      { x: 0.6, y: 4.85, w: 11.8, h: 2.3, fontFace: BODY_FONT, fontSize: 13.5, color: COLOR.textLight, margin: 0 }
    );

    footer(slide, 9);
  }

  // ============================================================
  // Slide 10 — Next Steps / Roadmap
  // ============================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: COLOR.bg };
    slideTitle(slide, "Next Steps", "From demo to production");

    iconCircle(slide, icons.road, { x: 0.6, y: 1.75, d: 0.6, bg: COLOR.azure });
    slide.addText("This demo is intentionally scoped to the core ingest → extract → deliver pattern. A production rollout typically adds:", {
      x: 1.4, y: 1.85, w: 11, h: 0.5, fontFace: BODY_FONT, fontSize: 14, color: COLOR.textMuted, margin: 0,
    });

    const roadmap = [
      { title: "Event Grid trigger", body: "Replace the ~1-minute polling blob trigger with an event-driven trigger for near-instant (sub-second) pickup." },
      { title: "Downstream integration", body: "Route structured JSON into the customer's CRM, EHR, ERP, or case-management system." },
      { title: "Notifications", body: "Add Teams or email alerts on completion, and specifically on documents routed to the errors folder." },
      { title: "Persistence & reporting", body: "Write extraction results to SQL/Cosmos DB for dashboards, SLAs, and historical audit." },
    ];

    const cardW = 5.7, gapX = 0.4, gapY = 0.35, startX = 0.6, startY = 2.65, cardH = 1.65;
    roadmap.forEach((r, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      slide.addShape("roundRect", {
        x, y, w: cardW, h: cardH, rectRadius: 0.06,
        fill: { color: COLOR.bgPanel }, line: { color: "3B3A39", width: 1 },
      });
      slide.addShape("rect", { x, y, w: 0.08, h: cardH, fill: { color: COLOR.cyan }, line: { type: "none" } });
      slide.addText(r.title, {
        x: x + 0.3, y: y + 0.2, w: cardW - 0.6, h: 0.4, fontFace: HEADER_FONT, fontSize: 15,
        color: COLOR.textLight, bold: true, margin: 0,
      });
      slide.addText(r.body, {
        x: x + 0.3, y: y + 0.65, w: cardW - 0.6, h: 1.0, fontFace: BODY_FONT, fontSize: 12,
        color: COLOR.textMuted, margin: 0,
      });
    });

    slide.addText("Let's discuss which of these matter most for your environment.", {
      x: 0.6, y: 6.55, w: 11.8, h: 0.3, fontFace: BODY_FONT, fontSize: 13, italic: true,
      color: COLOR.cyan, margin: 0,
    });

    footer(slide, 10);
  }

  // ---------- Speaker notes ----------
  const notes = [
    "Welcome the audience. Frame this as a customer-facing architecture walkthrough: how we can automate inbound fax ingestion and extraction end-to-end using managed Azure services — no custom application code to run or patch. Mention the four building blocks visible on this slide (Power Automate, Blob Storage, Logic Apps, Content Understanding) and that we'll walk through each one.",
    "Set up the pain point in the customer's own words if possible before showing this slide. The 70% stat is illustrative — swap in the customer's actual fax volume and current turnaround time if known. Emphasize the lack of visibility/audit trail as often the most painful part for compliance-heavy industries.",
    "This is the 30,000-foot view. Walk left to right: a file is picked up from a local folder, lands in Blob Storage, triggers a Logic App, gets analyzed by Content Understanding, and the result is delivered back to Blob Storage. Stress 'no application code to maintain' — everything here is configuration on top of managed services.",
    "Walk through the diagram left to right. Call out that both the trigger (blob arrival) and the auth to Content Understanding (managed identity) are handled without any custom code or stored secrets. Point out the fork at the end: success goes to processed/, failure goes to errors/ with the failure detail — nothing silently disappears. Mention Event Grid as a documented future enhancement for lower latency (covered again on the roadmap slide).",
    "This table is a good reference/leave-behind slide. Emphasize the last row — managed identity + RBAC — since secretless auth is frequently a security/compliance requirement for customers in regulated industries.",
    "Walk through steps 1-3 in order. If doing a live demo, this is the moment to actually run the Power Automate flow and show the file being picked from a local folder. Reiterate that the SAS URL is short-lived (30 minutes) and scoped to read-only access to that one file.",
    "Explain why polling is necessary: document analysis is asynchronous because it can take longer than a typical synchronous HTTP timeout, especially for multi-page documents. Walk through the sample output table on the right — highlight the mix of extracted, classified, and generated fields, and the confidence scores. This is a good moment to mention source grounding (not shown in the table, but included in the full JSON) for auditability.",
    "This is the 'why this and not just OCR' slide — anticipate the question 'don't we already have Document Intelligence?' The key differentiator is the ability to mix extract/classify/generate methods in one schema, producing an analyst-ready answer (like a plain-language summary) instead of just raw extracted text.",
    "These figures are meant to prompt discussion, not stand alone as guaranteed numbers — invite the customer to share their own volumes so a tailored business case can be built afterward. The 'what this unlocks' bullets are a good segue into the roadmap slide.",
    "Close by explicitly scoping what's in today's demo vs. what a production rollout typically adds. Use this slide to open the floor for questions about which of these roadmap items matter most to the customer, and to propose concrete next steps (pilot, workshop, or scoping call).",
  ];

  pres.slides.forEach((slide, i) => {
    slide.addNotes(notes[i] || "");
  });

  const outPath = require("path").join(__dirname, "Fax-Content-Understanding-Demo.pptx");
  await pres.writeFile({ fileName: outPath });
  console.log("Wrote", outPath);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
