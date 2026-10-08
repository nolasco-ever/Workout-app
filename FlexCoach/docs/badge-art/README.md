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

## Meshes for Spline (`meshes/`)

Spline can't import SVG, so the ten marks are also here as solid meshes:
`mark_<family>.glb` (and the same as `.obj`), plus `marks_all.glb` with all
ten in one file as separately named objects. Each is the stroke made into a
ribbon of width 3 with round caps and joins, extruded 2 units thick, in
badge units: the badge is 1 unit wide, Y is up, the front faces +Z, and the
badge centre is the origin. Drop a mesh onto a 1-unit-wide badge body and
it lands in the right place; sink it into the face or leave it proud, the
same way for all ten. `preview.png` shows the ten meshes from the front.

Regenerate after editing a mark SVG:

```sh
python3 -m venv .venv && .venv/bin/pip install shapely trimesh mapbox_earcut svgpathtools numpy
.venv/bin/python docs/badge-art/tools/marks_to_glb.py docs/badge-art/marks docs/badge-art/meshes
```

## 3D badges (`3d/`), built in Blender

`medallion.glb`, `hex.glb`, `shield.glb`: one `body` mesh (bevelled ring rim
plus recessed face), one `stones` mesh (a ring of round stones set into the
rim, shown only on tiers 5-8) and ten `mark_<family>` meshes in relief on
the face, in badge units (1 wide, Y up, front +Z). Materials in the files
are placeholders; the app applies the real ones. Tiers, decided 2026-10-08:
bronze, silver, gold, platinum, then platinum with ruby, sapphire, emerald
and diamond stones. Each mark has its own colour (`MARK_COLORS` in the
script). Built headless by
`tools/build_badges.py` from `shapes/` and `meshes/`:

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b -P docs/badge-art/tools/build_badges.py -- \
  docs/badge-art <out_dir> render \
  /Applications/Blender.app/Contents/Resources/5.0/datafiles/studiolights/world/studio.exr
```

Proportions (rim height, face height, bevels, relief) and the eight
materials are constants at the top of the script. `renders/` keeps the
review contact sheets.
