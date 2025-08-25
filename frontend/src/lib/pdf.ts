// frontend/src/lib/pdf.ts
import { jsPDF } from "jspdf";

export type ResultsPdfInput = {
  stage: number;
  stageName: string;
  score: number;
  recommendation?: string;
  quick?: string;
  longterm?: string;
  tableRows?: Array<{
    part: string;
    raw: string;
    max: string;
    scaled0to15: string;
    weight: number;
    contribution: string;
  }>;
};

export function createResultsPdf(data: ResultsPdfInput) {
  try {
    // Lock everything to portrait + POINTS + explicit A4 size
    const A4_WIDTH_PT = 595.28;   // 8.27in * 72
    const A4_HEIGHT_PT = 841.89;  // 11.69in * 72

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: [A4_WIDTH_PT, A4_HEIGHT_PT],
      compress: true
    });

    // Layout
    const margin = 56; // ~0.78in
    const pageWidth = A4_WIDTH_PT;
    const pageHeight = A4_HEIGHT_PT;
    const contentWidth = pageWidth - margin * 2;

    // Typography (in points)
    const H1 = 24;
    const H2 = 14;
    const BODY = 11;
    const LINE = Math.round(BODY * 1.45); // comfortable leading
    const GAP = 10;

    let y = margin;

    const ensureRoom = (needed = LINE) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const addTitle = (t: string) => {
      ensureRoom(H1 + GAP);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(H1);
      doc.setTextColor(89, 44, 137); // #592C89 to match UI
      doc.text(t, margin, y, { align: "left", baseline: "alphabetic" });
      y += H1 + GAP;
      doc.setTextColor(0, 0, 0);
    };

    const addSubTitle = (t: string) => {
      ensureRoom(H2 + GAP);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(H2);
      doc.text(t, margin, y);
      y += H2 + 6;
    };

    const addParagraph = (t?: string) => {
      if (!t) return;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(BODY);
      // Split to the available width and render line-by-line with page breaks
      const lines = doc.splitTextToSize(t, contentWidth) as string[];
      for (const line of lines) {
        ensureRoom(LINE);
        doc.text(line, margin, y);
        y += LINE;
      }
      y += 2;
    };

    const addKeyValue = (k: string, v: string) => {
      ensureRoom(LINE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(BODY);
      const key = `${k} `;
      doc.text(key, margin, y);
      const keyWidth = doc.getTextWidth(key);
      doc.setFont("helvetica", "normal");
      doc.text(v, margin + keyWidth, y);
      y += LINE;
    };

    // ----- Content -----
    addTitle(`Stage ${data.stage}: ${data.stageName}`);
    addKeyValue("Overall score:", data.score.toFixed(2));
    y += 2;

    addSubTitle("Overview");
    addParagraph(data.recommendation);

    addSubTitle("Quick improvements");
    addParagraph(data.quick);

    addSubTitle("Long-term goals");
    addParagraph(data.longterm);

    // Optional: part breakdown when ?debug=1
    if (data.tableRows && data.tableRows.length) {
      y += 4;
      addSubTitle("Part breakdown (debug)");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(BODY);

      const headers = ["Part", "Raw", "Max", "0..15", "Weight", "Contrib"];
      const colWidths = [190, 60, 60, 60, 60, 70];

      const drawRow = (cols: string[], bold = false) => {
        ensureRoom(LINE);
        let x = margin;
        doc.setFont("helvetica", bold ? "bold" : "normal");
        cols.forEach((c, i) => {
          doc.text(String(c ?? ""), x, y);
          x += colWidths[i];
        });
        y += LINE;
      };

      drawRow(headers, true);
      for (const r of data.tableRows) {
        drawRow([
          r.part,
          r.raw,
          r.max,
          r.scaled0to15,
          String(r.weight),
          r.contribution
        ]);
      }
    }

    doc.save(`Data Maturity Results.pdf`);
  } catch (err) {
    console.error("PDF generation failed:", err);
    alert("Sorry, we couldn’t create the PDF. Check the console for details.");
  }
}
