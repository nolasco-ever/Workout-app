# Badge artwork spec

What the real badge marks need to be so they drop into the app without code
changes. The app draws the badge shape and material itself; the artwork is
the **mark** that sits in the middle of the shield. One mark per family,
the same mark at every tier. The tier is shown by the material (bronze,
silver, gold, platinum, ruby, sapphire, emerald, diamond), which the app
renders.

## The ten marks

| Family | Mark should say | Placeholder today |
|---|---|---|
| Workouts | showing up, work done | dumbbell |
| Streak | days in a row, heat | flame |
| Iron moved | total weight lifted | kettlebell / plate |
| Records | personal bests | trophy |
| Cycles | a training cycle finished and reviewed | two arrows in a loop |
| Perfect cycles | every workout of a cycle done | star |
| Early bird | started before 6am | sunrise |
| Night owl | started after 10pm | moon |
| Buddies | people on your Iron Card | two people |
| Plans used | buddies who copied or synced your plan | share |

## Format

- **SVG, one file per family**, `viewBox="0 0 100 100"`, no width/height.
- The mark must fit inside a **56 × 56** box centred at (50, 50). The
  shield face is a rounded shield (see `SHIELD` in
  `components/achievements/Badge.tsx`); anything past that box collides
  with the bevel.
- **Single colour**: fill with `currentColor` (or no fill attribute at all)
  so the app can tint it for the material. Bronze, silver, gold, platinum
  and diamond tint the mark dark; ruby, sapphire and emerald tint it
  white. No gradients, no embedded raster, no filters.
- Stroke-based marks: stroke width 5–7 units at this box, round caps and
  joins. Filled silhouettes are fine too; pick one style for the whole set.
- Keep every mark to one `<path>` (or a small `<g>` of paths), no `<text>`.
- Readable at 36 px: the smallest place a badge appears is the tier list
  in the family sheet. Avoid thin inner detail.

## Where they go

Drop the files into `assets/badges/<family>.svg` and the marks are wired
through `FAMILY_MARKS` in `components/achievements/badgeArt.ts`
(replacing the Lucide placeholders with `react-native-svg` components).
Nothing else changes: the shield, materials, animation and screens all
stay.

## Materials, for reference

The app's material palette lives in `badgeArt.ts` (`MATERIAL_ART`). If
the badge shape itself is to be redesigned, it is one path (`SHIELD`)
plus an inset path for the bevel; keep both in the 0–100 box.
