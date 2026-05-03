export function dpmo(defects, opportunities) {
  if (!opportunities) return 0;
  return Math.round((defects / opportunities) * 1_000_000);
}

const RAW_TABLE = [
  [308538, 2.0], [66807, 3.0], [22750, 3.5], [10724, 3.8],
  [6210, 4.0], [3467, 4.2], [1866, 4.4], [968, 4.6],
  [483, 4.8], [233, 5.0], [108, 5.2], [48, 5.4],
  [21, 5.6], [8.5, 5.8], [3.4, 6.0],
];
// sorted descending by DPMO
const TABLE = [...RAW_TABLE].sort((a, b) => b[0] - a[0]);

export function sigmaLevel(dpmoVal) {
  if (dpmoVal <= 3.4) return "6.00";
  if (dpmoVal >= 308538) return "<2.0";
  for (let i = 0; i < TABLE.length - 1; i++) {
    const [hiDpmo, loSigma] = TABLE[i];
    const [loDpmo, hiSigma] = TABLE[i + 1];
    if (dpmoVal <= hiDpmo && dpmoVal >= loDpmo) {
      const ratio = (dpmoVal - loDpmo) / (hiDpmo - loDpmo);
      return (hiSigma - ratio * (hiSigma - loSigma)).toFixed(2);
    }
  }
  return "~3.0";
}

export function enrichPeriod(d) {
  const dp = dpmo(d.overdue, d.assigned);
  return {
    ...d,
    dpmo: dp,
    sigma: sigmaLevel(dp),
    pctOnTime: d.assigned ? ((d.onTime / d.assigned) * 100).toFixed(2) : "0.00",
  };
}

export function computeUChart(enriched) {
  const totalDefects = enriched.reduce((s, d) => s + d.overdue, 0);
  const totalUnits = enriched.reduce((s, d) => s + d.assigned, 0);
  const uBar = totalUnits ? totalDefects / totalUnits : 0;

  return enriched.map((d) => {
    const u = d.assigned ? d.overdue / d.assigned : 0;
    const ucl = uBar + 3 * Math.sqrt(uBar / (d.assigned || 1));
    const lcl = Math.max(0, uBar - 3 * Math.sqrt(uBar / (d.assigned || 1)));
    return {
      quarter: d.quarter,
      u: parseFloat((u * 1000).toFixed(4)),
      uBar: parseFloat((uBar * 1000).toFixed(4)),
      ucl: parseFloat((ucl * 1000).toFixed(4)),
      lcl: parseFloat((lcl * 1000).toFixed(4)),
      overdue: d.overdue,
      assigned: d.assigned,
    };
  });
}
