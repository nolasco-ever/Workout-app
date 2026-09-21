/**
 * Shared primitive types used across the data model.
 *
 * Every persisted document carries `id`, `createdAt`, and `updatedAt` so it can
 * be synced and merged without re-keying. Dates that represent a calendar day
 * (not an instant) are stored as `LocalDate` strings in the user's local time.
 */

/** Calendar day in the user's local time zone, formatted YYYY-MM-DD. */
export type LocalDate = string;

/** Unix epoch milliseconds. */
export type Timestamp = number;

/** Universally unique identifier (v4 string). */
export type Id = string;

export interface BaseDocument {
  id: Id;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type WeightUnit = 'kg' | 'lb';
export type DistanceUnit = 'km' | 'mi';

/** 0 = Sunday ... 6 = Saturday, matching JavaScript's Date.getDay(). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
