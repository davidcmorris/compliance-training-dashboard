# Compliance Training Dashboard

A React + Vite dashboard for tracking compliance training completion using Six Sigma quality metrics. Data persists in `localStorage` and all derived metrics recalculate automatically when periods are added, edited, or deleted.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Metrics Explained

### DPMO — Defects Per Million Opportunities

```
DPMO = (Overdue ÷ Assigned) × 1,000,000
```

DPMO amplifies small differences that percentages hide. For example, a 99.8% on-time rate sounds excellent, but expressed as 2,000 DPMO it can be benchmarked against Six Sigma targets and compared across periods with different sample sizes.

| DPMO Range | Approx. Sigma Level | On-Time Rate |
|---|---|---|
| ≤ 3.4 | 6σ | 99.9997% |
| ~233 | 5σ | 99.977% |
| ~6,210 | 4σ | 99.379% |
| ~66,807 | 3σ | 93.319% |

### Sigma Level (σ)

Derived from DPMO via standard Six Sigma table interpolation. Higher sigma = fewer defects.

- **4σ or above**: Excellent — fewer than 6,210 late completions per million
- **3σ–4σ**: Acceptable but with room for improvement
- **Below 3σ**: Significant compliance risk; investigate root causes

### u-Chart (Statistical Process Control)

The u-chart tracks the *rate* of defects (overdue completions per 1,000 assigned) over time and determines whether variation is **common-cause** (expected random noise) or **special-cause** (something changed).

**Center line (ū):** Average defect rate across all periods.

**Control limits** adjust each period based on that period's sample size:

```
UCL = ū + 3 × √(ū / n)
LCL = max(0, ū − 3 × √(ū / n))
```

A point **outside the control limits** signals special-cause variation — something changed that warrants investigation (a system issue, a policy change, a particular department). Points within limits represent normal process noise and do not require action.

### Days Past Due

- **Median** is the preferred central tendency measure for small, skewed counts (a single outlier can double the mean but barely moves the median).
- **Max days** flagged ⚠ when > 14 — indicates at least one person was significantly overdue, which may represent a compliance risk even if aggregate rates look fine.
- **Average (mean)** provided for completeness but should be interpreted alongside median.

## Data Entry

Use the **Add Period** form at the top to enter a new reporting period. All fields are required:

| Field | Description |
|---|---|
| Quarter Label | Free text, e.g. `Q2 2026` |
| Assigned | Total training completions assigned in the period |
| On-Time | Completions finished by the deadline |
| Overdue | Completions past the deadline (on-time + overdue ≤ assigned) |
| Avg Days Past Due | Mean days late across overdue completions |
| Max Days Past Due | Worst-case individual overdue duration |
| Median Days Past Due | Median days late across overdue completions |

Click any row in the table to select it as the active period for KPI cards. Use **Edit** to modify a period or **Delete** to remove it.

## Exporting

- **↓ PDF** — Captures the full dashboard as a multi-page PDF (landscape A4).
- **↓ PPTX** — Generates a PowerPoint file with a title slide, KPI summary table, u-chart data table, and an interpretation guide slide.

## Tech Stack

- [Vite](https://vite.dev/) + [React](https://react.dev/)
- [Recharts](https://recharts.org/) — charts
- [Tailwind CSS v4](https://tailwindcss.com/) — form styling
- [jsPDF](https://github.com/parallax/jsPDF) + [html2canvas](https://html2canvas.hertzen.com/) — PDF export
- [PptxGenJS](https://gitbrent.github.io/PptxGenJS/) — PowerPoint export
- localStorage — data persistence (no backend required)
