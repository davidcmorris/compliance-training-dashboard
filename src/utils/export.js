import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PptxGenJS from "pptxgenjs";

export async function exportToPDF(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#f8fafc",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
  const imgW = canvas.width * ratio;
  const imgH = canvas.height * ratio;
  const x = (pageW - imgW) / 2;
  const y = (pageH - imgH) / 2;

  pdf.addImage(imgData, "PNG", x, y, imgW, imgH);
  pdf.save("compliance-dashboard.pdf");
}

export async function exportToPPTX(enriched, uChartData) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";

  const NAVY = "1a2744";
  const TEAL = "0d9488";
  const SLATE = "64748b";
  const RED = "dc2626";

  // --- Title slide ---
  const title = pptx.addSlide();
  title.background = { color: NAVY };
  title.addText("Compliance Training Dashboard", {
    x: 0.5, y: 1.5, w: "90%", h: 1.2,
    fontSize: 36, bold: true, color: "FFFFFF", align: "center",
  });
  title.addText("Six Sigma Quality Metrics", {
    x: 0.5, y: 2.9, w: "90%", h: 0.6,
    fontSize: 18, color: "94a3b8", align: "center",
  });

  // --- KPI summary slide ---
  const kpiSlide = pptx.addSlide();
  kpiSlide.background = { color: "f8fafc" };
  kpiSlide.addText("Key Performance Indicators", {
    x: 0.4, y: 0.3, w: "90%", h: 0.5,
    fontSize: 18, bold: true, color: NAVY,
  });

  const headers = ["Quarter", "Assigned", "Overdue", "On-Time %", "DPMO", "Sigma", "Median Days", "Max Days"];
  const rows = enriched.map((d) => [
    d.quarter,
    d.assigned.toLocaleString(),
    d.overdue.toString(),
    `${d.pctOnTime}%`,
    d.dpmo.toLocaleString(),
    `${d.sigma}σ`,
    d.medianDaysPastDue.toString(),
    d.maxDaysPastDue.toString(),
  ]);

  kpiSlide.addTable([
    headers.map((h) => ({ text: h, options: { bold: true, color: "FFFFFF", fill: NAVY, fontSize: 11 } })),
    ...rows.map((row, ri) =>
      row.map((cell, ci) => ({
        text: cell,
        options: {
          fontSize: 11,
          color: ci === 7 && enriched[ri].maxDaysPastDue > 14 ? RED : "1a2744",
          bold: ci === 7 && enriched[ri].maxDaysPastDue > 14,
          fill: ri % 2 === 0 ? "f0fdfa" : "ffffff",
        },
      }))
    ),
  ], { x: 0.4, y: 1.0, w: 12.2, colW: [1.5, 1.2, 1.0, 1.2, 1.3, 1.0, 1.5, 1.5] });

  // --- u-Chart data slide ---
  const uSlide = pptx.addSlide();
  uSlide.background = { color: "f8fafc" };
  uSlide.addText("u-Chart — Overdue Rate per 1,000", {
    x: 0.4, y: 0.3, w: "90%", h: 0.5,
    fontSize: 18, bold: true, color: NAVY,
  });

  const uHeaders = ["Quarter", "Overdue Rate (per 1k)", "ū (Center)", "UCL", "LCL", "Out of Control?"];
  const uRows = uChartData.map((d) => {
    const outOfControl = d.u > d.ucl || d.u < d.lcl;
    return [
      d.quarter,
      d.u.toFixed(2),
      d.uBar.toFixed(2),
      d.ucl.toFixed(2),
      d.lcl.toFixed(2),
      outOfControl ? "YES ⚠" : "No",
    ];
  });

  uSlide.addTable([
    uHeaders.map((h) => ({ text: h, options: { bold: true, color: "FFFFFF", fill: NAVY, fontSize: 11 } })),
    ...uRows.map((row, ri) =>
      row.map((cell, ci) => ({
        text: cell,
        options: {
          fontSize: 11,
          color: ci === 5 && uChartData[ri].u > uChartData[ri].ucl ? RED : "1a2744",
          bold: ci === 5 && uChartData[ri].u > uChartData[ri].ucl,
          fill: ri % 2 === 0 ? "f0fdfa" : "ffffff",
        },
      }))
    ),
  ], { x: 0.4, y: 1.0, w: 12.2, colW: [2.0, 2.2, 1.8, 1.8, 1.8, 2.6] });

  // --- Interpretation slide ---
  const interp = pptx.addSlide();
  interp.background = { color: "f8fafc" };
  interp.addText("Reading This Dashboard", {
    x: 0.4, y: 0.3, w: "90%", h: 0.5,
    fontSize: 18, bold: true, color: NAVY,
  });

  const bullets = [
    { text: "DPMO", options: { bold: true, color: TEAL } },
    { text: " — (Overdue ÷ Assigned) × 1,000,000. Amplifies small differences percentages hide.\n", options: { color: "334155" } },
    { text: "Sigma Level", options: { bold: true, color: TEAL } },
    { text: " — Higher is better. 4σ+ means fewer than ~6,210 defects per million opportunities.\n", options: { color: "334155" } },
    { text: "u-Chart", options: { bold: true, color: TEAL } },
    { text: " — Overdue rate per 1,000 assigned. Control limits adjust with sample size. Points outside limits = special-cause variation → investigate.\n", options: { color: "334155" } },
    { text: "Days Past Due", options: { bold: true, color: TEAL } },
    { text: " — Max days flagged ⚠ when >14. Median is a better central tendency than mean for small skewed counts.", options: { color: "334155" } },
  ];

  interp.addText(bullets, { x: 0.6, y: 1.1, w: 11.8, h: 4, fontSize: 14, lineSpacingMultiple: 1.6 });

  await pptx.writeFile({ fileName: "compliance-dashboard.pptx" });
}
