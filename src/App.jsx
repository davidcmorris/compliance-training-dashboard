import { useState, useEffect, useCallback } from "react";
import ComplianceDashboard from "./components/ComplianceDashboard";
import DataEntryForm from "./components/DataEntryForm";
import { enrichPeriod, computeUChart } from "./utils/metrics";
import { exportToPDF, exportToPPTX } from "./utils/export";
import "./index.css";

const STORAGE_KEY = "compliance_periods_v1";

const DEFAULT_DATA = [
  { quarter: "Q1 2025", assigned: 2980, onTime: 2971, overdue: 9, avgDaysPastDue: 4.2, maxDaysPastDue: 18, medianDaysPastDue: 3 },
  { quarter: "Q2 2025", assigned: 3120, onTime: 3114, overdue: 6, avgDaysPastDue: 2.8, maxDaysPastDue: 11, medianDaysPastDue: 2 },
  { quarter: "Q3 2025", assigned: 3045, onTime: 3038, overdue: 7, avgDaysPastDue: 5.1, maxDaysPastDue: 22, medianDaysPastDue: 3 },
  { quarter: "Q4 2025", assigned: 3200, onTime: 3196, overdue: 4, avgDaysPastDue: 1.9, maxDaysPastDue: 5, medianDaysPastDue: 1 },
  { quarter: "Q1 2026", assigned: 3050, onTime: 3042, overdue: 8, avgDaysPastDue: 6.3, maxDaysPastDue: 31, medianDaysPastDue: 4 },
];

function loadPeriods() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return DEFAULT_DATA;
}

const NAVY = "#1a2744";
const TEAL = "#0d9488";

export default function App() {
  const [periods, setPeriods] = useState(loadPeriods);
  const [editIdx, setEditIdx] = useState(null);
  const [exporting, setExporting] = useState(null);

  const enriched = periods.map(enrichPeriod);
  const uChartData = computeUChart(enriched);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(periods));
  }, [periods]);

  const handleSave = useCallback((data) => {
    setPeriods((prev) => {
      if (editIdx !== null) {
        const next = [...prev];
        next[editIdx] = data;
        return next;
      }
      return [...prev, data];
    });
    setEditIdx(null);
  }, [editIdx]);

  const handleDelete = useCallback((idx) => {
    setPeriods((prev) => prev.filter((_, i) => i !== idx));
    setEditIdx(null);
  }, []);

  const handleEdit = useCallback((idx) => {
    setEditIdx(idx);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  async function handleExportPDF() {
    setExporting("pdf");
    try { await exportToPDF("dashboard-root"); }
    finally { setExporting(null); }
  }

  async function handleExportPPTX() {
    setExporting("pptx");
    try { await exportToPPTX(enriched, uChartData); }
    finally { setExporting(null); }
  }

  return (
    <div id="dashboard-root" style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px 20px", color: NAVY, maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.01em", fontFamily: "'DM Sans', sans-serif" }}>
            Compliance Training Dashboard
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0", fontFamily: "'DM Sans', sans-serif" }}>
            Six Sigma quality metrics — rolling 3-month window
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={handleExportPDF}
            disabled={!!exporting || !enriched.length}
            style={{
              padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: exporting === "pdf" ? "#94a3b8" : NAVY,
              color: "#fff", border: "none", cursor: exporting || !enriched.length ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif", transition: "background 0.15s",
            }}
          >
            {exporting === "pdf" ? "Exporting…" : "↓ PDF"}
          </button>
          <button
            onClick={handleExportPPTX}
            disabled={!!exporting || !enriched.length}
            style={{
              padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: exporting === "pptx" ? "#94a3b8" : TEAL,
              color: "#fff", border: "none", cursor: exporting || !enriched.length ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif", transition: "background 0.15s",
            }}
          >
            {exporting === "pptx" ? "Exporting…" : "↓ PPTX"}
          </button>
        </div>
      </div>

      {/* Data Entry Form */}
      <DataEntryForm
        editTarget={editIdx !== null ? periods[editIdx] : null}
        onSave={handleSave}
        onCancel={() => setEditIdx(null)}
      />

      {/* Dashboard */}
      <ComplianceDashboard
        enriched={enriched}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
