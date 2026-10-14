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

## 3D badges (`3d/`), built in Blender as enamel pins

Direction from the user's references (`renders/badge-reference-01.webp`,
`badge_reference_02.webp`, 2026-10-08): enamel pins. `medallion.glb`,
`hex.glb`, `shield.glb` each hold: `plate` (a thin metal plate, the whole
pin bows up `BOW` at the centre), `border` (a raised metal ring along the
edge), `enamel` (the glossy fill inside the border), `stones` (a ring of
round stones on the border, shown only on tiers 5-8) and ten
`mark_<family>` meshes (the mark as raised metal lines on the enamel).
Badge units: 1 wide, Y up, front +Z. Materials in the files are
placeholders; the app applies the tier's metal to plate, border and mark,
the enamel colour to the fill, and the stone colour to the stones.

Built headless by `tools/build_pins.py` from `shapes/` and `meshes/`
(`tools/build_badges.py` is the earlier medal construction, kept for
reference):

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b -P docs/badge-art/tools/build_pins.py -- \
  docs/badge-art <out_dir> render \
  /Applications/Blender.app/Contents/Resources/5.0/datafiles/studiolights/world/studio.exr
```

Proportions and materials are constants at the top of the script.
`renders/` keeps the review contact sheets by round.

## v2: built from the Badge Builder config (`3d/v2/`)

`design-config.json` is the final configuration from the Badge Builder
artifact (palette, one recipe per tier, inner line-work, solid marks,
stones). `tools/build_pins_v2.py` turns it into `3d/v2/tier1.glb` …
`tier8.glb` with shapely + trimesh (no Blender needed): `plate`,
`border` (with scallops), `lines` (segments, panel cut, rings),
`enamel_*` panels per colour, `bezels` + `stones`, and ten
`mark_<family>` + `mark_<family>_channel` groups. Materials are named by
role (`metal`, `mark`, `enamel`, `enamel_tone1`, `enamel_tone2`,
`enamel2`, `stone`) with the flat palette colours baked in.
`tools/render_pins_v2.py` renders every badge on the ladders in Blender
(interior environment, neutral lights, metals metallic/roughness 0.22,
enamel matte with a faint coat, stones glossy with some transmission):

```sh
.venv/bin/python docs/badge-art/tools/build_pins_v2.py docs/badge-art/design-config.json docs/badge-art/3d/v2
/Applications/Blender.app/Contents/MacOS/Blender -b -P docs/badge-art/tools/render_pins_v2.py -- \
  docs/badge-art/3d/v2 <out_dir> /Applications/Blender.app/Contents/Resources/5.0/datafiles/studiolights/world/interior.exr
```

## In the app (`assets/badges/`), rendered live with react-native-filament

The app no longer uses renders: it draws the badge itself and the user spins it.

- `tools/build_pins_mobile.py <design-config.json> <out_dir>` writes one body per
  tier (`body_t1.glb` … `body_t8.glb`: plate, border, enamel, scallops, the engraved
  back) and one overlay per family and tier (`<family>_t<tier>.glb`: the mark and the
  tier's line-work cut to fit around it). Profiles are lofted as one surface, so the
  whole set is about 7 MB. Copy the output and `manifest.json` into `assets/badges/`
  and run `python3 docs/badge-art/tools/badge_models_ts.py` to regenerate
  `components/achievements/badgeModels.ts`.
- `components/achievements/Badge3D.tsx` loads the body and the overlay into one
  Filament scene and turns both with a Reanimated value: drag sideways to turn, flick
  to spin, and it coasts to a stop with scroll-like decay. Lighting is an environment
  map plus one sun; both are props.
- `screens/Achievements/BadgePreviewScreen.tsx` (Profile → Badge preview, behind
  `features.badgePreview`) shows every family and tier with dials for the lighting and
  the spin feel. It is the design-review surface; switch the flag off before a build
  goes to testers.
- Native: react-native-filament 1.11 needs `patches/react-native-filament+1.11.0.patch`
  (React Native 0.87 has no RCTCxxBridge) and react-native-worklets-core 2.0 beta.
  `npm install` applies the patch through `postinstall`.
- Colour: the palette is sRGB hex; the builder converts it to linear for glTF. Saturation
  is one number (`VIVID`, default 1.3) and the engraved date size is `DATE_CAP`.
