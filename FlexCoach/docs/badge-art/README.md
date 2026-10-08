# Badge art: the agreed source

What the badge rounds settled (2026-10-08). Everything here is in a 100 x 100
box; one unit is 1% of the badge width.

## Shapes (`shapes/`)

Shape follows the tier's material:

| Tiers | Material | Shape |
|---|---|---|
| 1, 2, 3 | bronze, silver, gold | medallion |
| 4, 5, 6, 7 | platinum, ruby, sapphire, emerald | hex plate |
| 8 | diamond | shield |

Each file has two outlines: `rim` (the outer edge) and `face` (the flat area
the mark is engraved into). The band between them is the bevel.

## Marks (`marks/`)

One per family, line drawings at stroke 3 with round caps and joins, kept
inside the 27..73 safe box so nothing touches the face edge. The mark is
the same at every tier; the material and shape are the upgrade. On the
hex plate scale the mark to 0.95; on the shield scale it to 0.86 and raise
it 3 units.

## Materials

Hex values the SVG badges use, light / mid / dark / rim. For 3D, treat these
as the base colour and use metallic 1.0 with roughness 0.2-0.35 for the
metals; gems are transmissive with a tint.

| Material | light | mid | dark | rim |
|---|---|---|---|---|
| bronze | #F3C48F | #C9843F | #7A4518 | #4F2C0E |
| silver | #FBFBFD | #C7CAD2 | #7A7E88 | #4C5059 |
| gold | #FFF2B8 | #F0C449 | #A3721A | #6E4A0C |
| platinum | #FFFFFF | #DCE4EB | #8A9CAC | #5A6B78 |
| ruby | #FFB9C3 | #E23C5C | #7E0B24 | #4F0716 |
| sapphire | #BFD6FF | #3F74E6 | #143693 | #0D2563 |
| emerald | #BDF3D8 | #2FB37A | #0C633F | #07432B |
| diamond | #FFFFFF | #D4ECFF | #7FB6E3 | #4A86B3 |

## Handing back 3D

One `.glb` per shape with the ten marks as separately named meshes
(`mark_workouts`, `mark_streak`, ...), Y up, front facing +Z, centred at the
origin, one unit across, glTF metallic-roughness materials, under about
300 KB. The app picks the mark and swaps the material; see
`components/achievements/` for the SVG fallback that stays for small sizes.
