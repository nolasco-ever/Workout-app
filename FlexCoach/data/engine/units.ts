import { DistanceUnit, WeightUnit } from '../models';

export const KG_PER_LB = 0.45359237;
export const M_PER_MI = 1609.344;

const roundTo = (value: number, step: number): number => Math.round(value / step) * step;

export const kgToLb = (kg: number): number => kg / KG_PER_LB;
export const lbToKg = (lb: number): number => lb * KG_PER_LB;

/** Kilograms in storage to the number a user sees, rounded to a plate-friendly step. */
export const toDisplayWeight = (kg: number | null, unit: WeightUnit): number | null => {
  if (kg === null) return null;
  return unit === 'lb' ? roundTo(kgToLb(kg), 0.5) : roundTo(kg, 0.25);
};

/** A number the user typed, in their unit, back to kilograms for storage. */
export const fromDisplayWeight = (value: number | null, unit: WeightUnit): number | null => {
  if (value === null || Number.isNaN(value)) return null;
  return unit === 'lb' ? lbToKg(value) : value;
};

export const formatWeight = (kg: number | null, unit: WeightUnit): string => {
  const v = toDisplayWeight(kg, unit);
  if (v === null) return '—';
  return `${Number.isInteger(v) ? v : v.toFixed(v % 0.5 === 0 ? 1 : 2)} ${unit}`;
};

export const toDisplayDistance = (m: number | null, unit: DistanceUnit): number | null => {
  if (m === null) return null;
  return unit === 'mi' ? roundTo(m / M_PER_MI, 0.01) : roundTo(m / 1000, 0.01);
};

export const fromDisplayDistance = (value: number | null, unit: DistanceUnit): number | null => {
  if (value === null || Number.isNaN(value)) return null;
  return unit === 'mi' ? value * M_PER_MI : value * 1000;
};

export const formatDistance = (m: number | null, unit: DistanceUnit): string => {
  const v = toDisplayDistance(m, unit);
  return v === null ? '—' : `${v} ${unit}`;
};

/** Seconds to m:ss, or h:mm:ss past an hour. */
export const formatDuration = (sec: number | null): string => {
  if (sec === null) return '—';
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
};

/** Parse user input leniently: "", "12", "12.5", "12,5". */
export const parseNumber = (text: string): number | null => {
  const cleaned = text.replace(',', '.').trim();
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};
