import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { computeUChart } from "../utils/metrics";

const NAVY = "#1a2744";
const TEAL = "#0d9488";
const AMBER = "#d97706";
const RED = "#dc2626";
const SLATE = "#64748b";
const CARD_BG = "#ffffff";
const BORDER = "#e2e8f0";

const KPICard = ({ label, value, sub, accent = TEAL }) => (
  <div style={{
    background: CARD_BG, borderRadius: 12, padding: "20px 24px",
    border: `1px solid ${BORDER}`, flex: "1 1 0", minWidth: 160,
  }}>
    <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: SLATE, marginBottom: 6 }}>
      {label}
    </div>
    <div style={{ fontSize: 32, fontWeight: 700, color: accent, fontFamily: "'DM Mono', monospace", lineHeight: 1.1 }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: 13, color: SLATE, marginTop: 4 }}>{sub}</div>}
  </div>
);

const SectionTitle = ({ children }) => (
  <h2 style={{
    fontSize: 15, fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.08em", color: NAVY, marginBottom: 12,
    borderBottom: `2px solid ${TEAL}`, paddingBottom: 6, display: "inline-block",
  }}>
    {children}
  </h2>
);

export default function ComplianceDashboard({ enriched, onEdit, onDelete }) {
  const [selectedQ, setSelectedQ] = useState(enriched.length - 1);
  const idx = Math.min(selectedQ, enriched.length - 1);
  const current = enriched[idx];
  const uChartData = computeUChart(enriched);

  if (!enriched.length) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: SLATE }}>
        <p style={{ fontSize: 18, fontWeight: 600 }}>No data yet.</p>
        <p style={{ fontSize: 14, marginTop: 8 }}>Use the form above to add your first reporting period.</p>
      </div>
    );
  }

  const uBar = uChartData[0]?.uBar ?? 0;

  return (
    <div>
      {/* Quarter Selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        {enriched.map((d, i) => (
          <button
            key={d.quarter + i}
            onClick={() => setSelectedQ(i)}
            style={{
              padding: "6px 14px", borderRadius: 6,
              border: idx === i ? `2px solid ${TEAL}` : `1px solid ${BORDER}`,
              background: idx === i ? TEAL : CARD_BG,
              color: idx === i ? "#fff" : NAVY,
              fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {d.quarter}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
        <KPICard label="DPMO" value={current.dpmo.toLocaleString()} sub="Defects per million opportunities" />
        <KPICard label="Sigma Level" value={`${current.sigma}σ`} sub={`${current.pctOnTime}% on-time`} accent={NAVY} />
        <KPICard
          label="Overdue"
          value={current.overdue}
          sub={`of ${current.assigned.toLocaleString()} assigned`}
          accent={current.overdue > (uBar / 1000 + 3 * Math.sqrt((uBar / 1000) / current.assigned)) * current.assigned ? RED : AMBER}
        />
        <KPICard
          label="Median Days Late"
          value={current.medianDaysPastDue}
          sub={`Max: ${current.maxDaysPastDue} days`}
          accent={current.maxDaysPastDue > 14 ? RED : SLATE}
        />
      </div>

      {/* Charts */}
      <div style={{ display: "flex", gap: 20, marginBottom: 28, flexWrap: "wrap" }}>
        {/* u-Chart */}
        <div style={{ flex: "1 1 340px", background: CARD_BG, borderRadius: 12, border: `1px solid ${BORDER}`, padding: "20px 16px 12px" }}>
          <SectionTitle>u-Chart — Overdue Rate per 1,000</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={uChartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: SLATE }} />
              <YAxis tick={{ fontSize: 11, fill: SLATE }} domain={[0, "auto"]} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${BORDER}` }}
                formatter={(v, name) => {
                  const labels = { u: "Rate", uBar: "ū", ucl: "UCL", lcl: "LCL" };
                  return [`${v.toFixed(2)} per 1,000`, labels[name] || name];
                }}
              />
              <Line type="monotone" dataKey="ucl" stroke={RED} strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="ucl" />
              <Line type="monotone" dataKey="uBar" stroke={TEAL} strokeDasharray="6 3" strokeWidth={1.5} dot={false} name="uBar" />
              <Line type="monotone" dataKey="lcl" stroke={SLATE} strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="lcl" />
              <Line type="monotone" dataKey="u" stroke={NAVY} strokeWidth={2.5}
                dot={{ r: 5, fill: NAVY, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 7, fill: TEAL }} name="u"
              />
            </LineChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 11, color: SLATE, margin: "8px 0 0", lineHeight: 1.5 }}>
            Rate per 1,000 assigned. Control limits adjust per period based on sample size. Points outside limits → investigate.
          </p>
        </div>

        {/* DPMO Trend */}
        <div style={{ flex: "1 1 340px", background: CARD_BG, borderRadius: 12, border: `1px solid ${BORDER}`, padding: "20px 16px 12px" }}>
          <SectionTitle>DPMO Trend</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={enriched} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: SLATE }} />
              <YAxis tick={{ fontSize: 11, fill: SLATE }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${BORDER}` }}
                formatter={(v) => [`${v.toLocaleString()} DPMO`, "DPMO"]}
              />
              <Bar dataKey="dpmo" radius={[4, 4, 0, 0]}>
                {enriched.map((d, i) => (
                  <Cell key={i} fill={i === idx ? TEAL : "#cbd5e1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 11, color: SLATE, margin: "8px 0 0", lineHeight: 1.5 }}>
            Lower DPMO = better process quality. Target: sustained downward trend.
          </p>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: CARD_BG, borderRadius: 12, border: `1px solid ${BORDER}`, padding: "20px 20px 16px", marginBottom: 28 }}>
        <SectionTitle>Days Past Due — Severity Profile</SectionTitle>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${BORDER}` }}>
                {["Quarter", "Overdue", "Median Days", "Avg Days", "Max Days", "DPMO", "σ Level", "Actions"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: SLATE }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enriched.map((d, i) => (
                <tr
                  key={d.quarter + i}
                  onClick={() => setSelectedQ(i)}
                  style={{
                    borderBottom: `1px solid ${BORDER}`,
                    background: i === idx ? "#f0fdfa" : "transparent",
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                >
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>{d.quarter}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "'DM Mono', monospace" }}>{d.overdue}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "'DM Mono', monospace" }}>{d.medianDaysPastDue}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "'DM Mono', monospace" }}>{d.avgDaysPastDue}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "'DM Mono', monospace", color: d.maxDaysPastDue > 14 ? RED : "inherit", fontWeight: d.maxDaysPastDue > 14 ? 700 : 400 }}>
                    {d.maxDaysPastDue}{d.maxDaysPastDue > 14 && " ⚠"}
                  </td>
                  <td style={{ padding: "10px 12px", fontFamily: "'DM Mono', monospace" }}>{d.dpmo.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "'DM Mono', monospace", fontWeight: 600, color: TEAL }}>{d.sigma}σ</td>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onEdit(i)}
                      style={{ fontSize: 12, color: NAVY, border: `1px solid ${BORDER}`, borderRadius: 5, padding: "3px 10px", background: "#fff", cursor: "pointer", marginRight: 6 }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { if (window.confirm(`Delete "${d.quarter}"?`)) onDelete(i); }}
                      style={{ fontSize: 12, color: RED, border: `1px solid #fecaca`, borderRadius: 5, padding: "3px 10px", background: "#fff", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interpretation Guide */}
      <div style={{ background: CARD_BG, borderRadius: 12, border: `1px solid ${BORDER}`, padding: "20px 24px", fontSize: 13, lineHeight: 1.7, color: SLATE }}>
        <SectionTitle>Reading This Dashboard</SectionTitle>
        <p style={{ margin: "0 0 8px" }}><strong style={{ color: NAVY }}>DPMO</strong> — (Overdue ÷ Assigned) × 1,000,000. Amplifies small differences that percentages hide.</p>
        <p style={{ margin: "0 0 8px" }}><strong style={{ color: NAVY }}>Sigma Level</strong> — Higher is better. 4σ+ means fewer than ~6,210 defects per million.</p>
        <p style={{ margin: "0 0 8px" }}><strong style={{ color: NAVY }}>u-Chart</strong> — Overdue rate per 1,000 assigned. Control limits widen/narrow with sample size. Points outside limits = special-cause variation → investigate.</p>
        <p style={{ margin: 0 }}><strong style={{ color: NAVY }}>Days Past Due</strong> — Max days flagged <span style={{ color: RED, fontWeight: 600 }}>⚠</span> when &gt;14. Median is a better central tendency than mean for small skewed counts.</p>
      </div>
    </div>
  );
}
