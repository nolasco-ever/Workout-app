/** Small linear-scale helpers shared by the charts. */

export interface Scale {
  domain: [number, number];
  range: [number, number];
  map: (v: number) => number;
}

export const linear = (domain: [number, number], range: [number, number]): Scale => {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return { domain, range, map: v => r0 + ((v - d0) / span) * (r1 - r0) };
};

/** Round tick values covering [min, max], about `count` of them. */
export const niceTicks = (min: number, max: number, count = 4): number[] => {
  if (!isFinite(min) || !isFinite(max)) return [];
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1;
    min -= pad;
    max += pad;
  }
  const raw = (max - min) / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
};

/** Domain padded to the surrounding nice ticks so lines don't touch the edges. */
export const niceDomain = (values: number[], count = 4): [number, number] => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const ticks = niceTicks(min, max, count);
  if (ticks.length < 2) return [min, max];
  return [ticks[0], ticks[ticks.length - 1]];
};

export const compactNumber = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${Math.round(n / 1000)}k`;
  if (abs >= 1_000) return `${(n / 1000).toFixed(1)}k`;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
};

export const shortDate = (iso: string): string => {
  const [, m, d] = iso.split('-').map(Number);
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${d}`;
};

/**
 * "Jul 5" for dates in the current year, "Jul 5, 2025" otherwise, so a list
 * spanning years never shows two identical labels. Use in lists and labels;
 * chart axes keep shortDate.
 */
export const dateLabel = (iso: string, now: Date = new Date()): string => {
  const year = Number(iso.slice(0, 4));
  return year === now.getFullYear() ? shortDate(iso) : `${shortDate(iso)}, ${year}`;
};
