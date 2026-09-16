// 6dp microunit precision is net-worth-accurate for every supported instrument; it intentionally truncates sub-1e-6 crypto dust and does not tie to satoshi (revisit only if per-instrument scale becomes a requirement, see #562).
export const PRECISION = 1_000_000;
