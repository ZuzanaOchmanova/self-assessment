import { jsPDF } from "jspdf";

/* =========================================================
   Helpers
   ========================================================= */

/** Convert ArrayBuffer → binary string for jsPDF VFS (required by addFileToVFS) */
async function fetchAsBinaryString(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
  }
  return bin;
}

/** Safely register a TTF in jsPDF; returns success flag */
async function tryAddFont(
  doc: jsPDF,
  url: string,
  family: string,
  style: "normal" | "bold" | "italic" | "bolditalic"
) {
  try {
    const bin = await fetchAsBinaryString(url);
    // @ts-ignore
    doc.addFileToVFS(url.split("/").pop()!, bin);
    // @ts-ignore
    doc.addFont(url.split("/").pop()!, family, style);
    return true;
  } catch (e) {
    console.warn("Font load failed:", url, e);
    return false;
  }
}

/** Load image → dataURL & natural size; fall back to 16:9 if sizing fails */
async function loadImageWithSize(
  path: string
): Promise<{ dataUrl: string; w: number; h: number }> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Image not found: ${path}`);
  const blob = await res.blob();
  const dataUrl: string = await new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.readAsDataURL(blob);
  });

  try {
    const img = new Image();
    img.src = dataUrl;
    await new Promise((r, j) => {
      img.onload = () => r(null);
      img.onerror = () => j(new Error("image decode failed"));
    });
    const w = (img.naturalWidth || img.width) || 1600;
    const h = (img.naturalHeight || img.height) || 900;
    return { dataUrl, w, h };
  } catch {
    // Safe default aspect
    return { dataUrl, w: 1600, h: 900 };
  }
}

/* =========================================================
   Types
   ========================================================= */

type PartRow = {
  label: string;              // "Data Capture", etc.
  score0to15: number;         // 0..15
  stage: number;              // 0..6
  stageName: string;          // e.g. "Spreadsheets & PPT"
  stageImagePath: string;     // "/stage3.png"
  overview: string;           // text for this part's stage
  quick: string;
  longterm: string;
};

export type ResultsPdfInput = {
  /** Overall page */
  stage: number;
  stageName: string;
  score: number;
  recommendation?: string;
  quick?: string;
  longterm?: string;
  overallStageImagePath?: string;

  /** Part-by-part pages */
  parts: PartRow[];
};

/* =========================================================
   Main
   ========================================================= */

export async function createResultsPdf(data: ResultsPdfInput) {
  try {
    // A4 portrait in points
    const A4_WIDTH_PT = 595.28;
    const A4_HEIGHT_PT = 841.89;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: [A4_WIDTH_PT, A4_HEIGHT_PT],
      compress: true,
    });

    // Older jsPDFs don't have setLineHeightFactor — guard it
    const maybeSLHF = (doc as any).setLineHeightFactor;
    if (typeof maybeSLHF === "function") {
      maybeSLHF.call(doc, 1.35);
    } else {
      console.warn("jsPDF#setLineHeightFactor not available; using default line height.");
    }

    // Brand palette
    const PURPLE = { r: 89, g: 44, b: 137 }; // #592C89
    const TEXT   = { r: 10, g: 10, b: 10 };  // #0A0A0A
    const GREY   = { r: 220, g: 220, b: 220 };

    const margin = 56;
    const page = { w: A4_WIDTH_PT, h: A4_HEIGHT_PT };
    const contentW = page.w - margin * 2;

    // Type ramp
    const H1 = 28;
    const H2 = 24;
    const H3 = 16;
    const BODY = 12;
    const LINE = 19;

    let y = margin;

    /* ---------- utilities ---------- */
    const ensureRoom = (needed = LINE) => {
      if (y + needed > page.h - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const wrap = (t: string, w = contentW) =>
      doc.splitTextToSize(t, w - 4) as string[];

    /** Render a justified paragraph that page-breaks cleanly */
    const addParagraphJustified = (t?: string) => {
      if (!t || !t.trim()) return;
      const lines = wrap(t, contentW);
      const height = lines.length * LINE;
      if (y + height > page.h - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(lines, margin, y, {
        maxWidth: contentW - 4,
        align: "justify",
      });
      y += height + 6;
    };

    const hrLight = (yy: number) => {
      doc.setDrawColor(GREY.r, GREY.g, GREY.b);
      doc.setLineWidth(1);
      doc.line(margin, yy, page.w - margin, yy);
    };

    // Font style setter that never passes undefined family
    let fontFamily = "helvetica";
    const setStyle = (style: "normal" | "bold" | "italic" | "bolditalic") => {
      doc.setFont(fontFamily, style);
    };

    /* ---------- Fonts (League Spartan with fallback) ---------- */
    try {
      const okRegular = await tryAddFont(
        doc,
        "/fonts/LeagueSpartan-Regular.ttf",
        "LeagueSpartan",
        "normal"
      );
      await tryAddFont(doc, "/fonts/LeagueSpartan-Bold.ttf", "LeagueSpartan", "bold");
      if (okRegular) {
        // @ts-ignore
        doc.setFont("LeagueSpartan", "normal");
        fontFamily = "LeagueSpartan";
      } else {
        doc.setFont("helvetica", "normal");
      }
    } catch {
      doc.setFont("helvetica", "normal");
    }

    /* -------------------- Overall page -------------------- */

    // Title
    doc.setTextColor(PURPLE.r, PURPLE.g, PURPLE.b);
    setStyle("bold");
    doc.setFontSize(H1);
    doc.text(`Stage ${data.stage}: ${data.stageName}`, margin, y);

    // Overall score
    y += 28;
    setStyle("normal");
    doc.setTextColor(TEXT.r, TEXT.g, TEXT.b);
    doc.setFontSize(BODY);
    doc.text(`Overall score: ${data.score.toFixed(2)}`, margin, y);

    // Overall image
    if (data.overallStageImagePath) {
      y += 12;
      try {
        const { dataUrl, w: iw, h: ih } =
          await loadImageWithSize(data.overallStageImagePath);
        const imgW = contentW;
        const imgH = (ih / iw) * imgW;
        const x = (page.w - imgW) / 2;
        y += 6;
        ensureRoom(imgH + 8);
        doc.addImage(dataUrl, "PNG", x, y, imgW, imgH, undefined, "FAST");
        y += imgH;
      } catch (e) {
        console.warn("Overall image failed to load:", data.overallStageImagePath, e);
      }
    }

    y += 14;

    // Sections (Overview / Quick / Long-term)
    const addSection = (heading: string, body?: string) => {
      ensureRoom(H3 + 6);
      doc.setFontSize(H3);
      setStyle("bold");
      doc.setTextColor(PURPLE.r, PURPLE.g, PURPLE.b);
      doc.text(heading, margin, y);
      y += H3 + 6;

      setStyle("normal");
      doc.setTextColor(TEXT.r, TEXT.g, TEXT.b);
      doc.setFontSize(BODY);

      addParagraphJustified(body);
    };

    addSection("Overview", data.recommendation);
    addSection("Quick improvements", data.quick);
    addSection("Long-term goals", data.longterm);

    // subtle end line
    y += 8;
    hrLight(y);

    /* -------------------- Parts (each on its own page) -------------------- */

    const NOTES_LINES = 6; // lines to hand-write if a section is empty

    const addNoteLines = (lines: number) => {
      const gap = 16;
      for (let i = 0; i < lines; i++) {
        ensureRoom(gap);
        doc.setDrawColor(GREY.r, GREY.g, GREY.b);
        doc.line(margin, y, page.w - margin, y);
        y += gap;
      }
      y += 4;
    };

    for (let idx = 0; idx < data.parts.length; idx++) {
      const p = data.parts[idx];

      // New page
      doc.addPage();
      y = margin;

      // Heading: "<Part> – Stage X"
      doc.setFontSize(H2);
      setStyle("bold");
      doc.setTextColor(PURPLE.r, PURPLE.g, PURPLE.b);
      doc.text(`${p.label} – Stage ${p.stage}`, margin, y);
      y += H2 + 6;

      // "Score: XX.XX"
      setStyle("normal");
      doc.setTextColor(TEXT.r, TEXT.g, TEXT.b);
      doc.setFontSize(BODY);
      doc.text(`Score: ${p.score0to15.toFixed(2)}`, margin, y);
      y += BODY + 10;

      // Stage image
      if (p.stageImagePath) {
        try {
          const { dataUrl, w: iw, h: ih } = await loadImageWithSize(p.stageImagePath);
          const imgW = contentW;
          const imgH = (ih / iw) * imgW;
          const x = (page.w - imgW) / 2;
          ensureRoom(imgH + 12);
          doc.addImage(dataUrl, "PNG", x, y, imgW, imgH, undefined, "FAST");
          y += imgH + 12;
        } catch (e) {
          console.warn("Part image failed to load:", p.stageImagePath, e);
        }
      }

      // Part sections
      const addPartSection = (heading: string, body?: string) => {
        ensureRoom(H3 + 6);
        doc.setFontSize(H3);
        setStyle("bold");
        doc.setTextColor(PURPLE.r, PURPLE.g, PURPLE.b);
        doc.text(heading, margin, y);
        y += H3 + 6;

        setStyle("normal");
        doc.setTextColor(TEXT.r, TEXT.g, TEXT.b);
        doc.setFontSize(BODY);

        if (body && body.trim()) {
          addParagraphJustified(body);
        } else {
          addNoteLines(NOTES_LINES);
        }
      };

      addPartSection("Overview", p.overview);
      addPartSection("Quick improvements", p.quick);
      addPartSection("Long-term goals", p.longterm);

      // subtle divider
      y += 8;
      hrLight(y);
    }

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(136, 136, 136);
    doc.text("Data Maturity Self-Assessment by adoptverve ApS", margin, page.h - 24);

    doc.save(`Data-Maturity-Report-Stage-${data.stage}.pdf`);
  } catch (err) {
    console.error("PDF generation failed:", err);
    alert("Sorry, we couldn’t create the PDF. Check the console for details.");
  }
}
