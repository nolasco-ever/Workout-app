# Editing the badges in Blender by hand

Open `docs/badge-art/3d/badges.blend` in Blender 5.0 (double-click it). It
holds the three pins side by side, dressed, with lights and a camera.

## What's in the scene

Outliner (top right), three collections, one per shape:

- `medallion` (bronze, Workouts mark, black enamel)
- `hex` (platinum with sapphires, Night owl mark, black enamel)
- `shield` (platinum with diamonds, Perfect cycles mark, orange enamel)

Each collection holds: `<shape>__plate` (the bowed metal plate),
`<shape>__border` (the raised metal rim), `<shape>__enamel` (the fill),
`<shape>__stones` (the ring of stones on the rim) and ten
`<shape>__mark_<family>` objects. Only one mark is visible per shape;
the other nine are hidden. Click the eye icon next to a mark in the
outliner to show it, or hide the visible one.

Materials: every tier's metal (`bronze`, `silver`, `gold`, `platinum`),
every stone (`stone_ruby` ...), every enamel (`enamel_black`,
`enamel_orange`, and one per family) is saved in the file. Select an
object, open the Material tab (red sphere icon, Properties panel), and
pick another from the dropdown to try a tier.

## Doing things

- **Look around:** middle-mouse drag orbits, scroll zooms, shift +
  middle-drag pans. Numpad 0 looks through the camera.
- **Render:** F12. Cycles at 128 samples, a couple of minutes on this Mac.
  Escape returns to the scene.
- **Move or scale a part:** select it (click), then G to grab, S to
  scale, R to rotate; X / Y / Z after the key locks to an axis; type a
  number for an exact amount; left-click or Enter to confirm, Escape to
  cancel. Example: select `hex__stones`, S, Z, 0.5, Enter squashes the
  stones to half height so they sit lower in the rim.
- **Edit the shape itself:** Tab enters Edit Mode on the selected object
  (vertices, edges, faces); Tab again leaves it.
- **Undo:** Cmd-Z, many levels.
- **Save:** Cmd-S saves over the file. Blender also keeps `badges.blend1`
  as the previous version next to it.

## Units and proportions

The badge is 1 unit wide. Everything here is relative to that: the plate
is 0.028 thick, the border 0.10 wide, the lines stand 0.0025 above the
enamel, the stones are 0.022 in radius, the bow is 0.15 at the centre.

## Getting changes back into the app

Either hand the edited `badges.blend` back (easiest: just save it; it's
tracked in the repo), or export yourself: select every object of one
shape (click the collection, then right-click > Select Objects), File >
Export > glTF 2.0, tick **Selected Objects**, keep **+Y Up**, save as
`docs/badge-art/3d/<shape>.glb`. The app reads the mesh names, so keep
them: `plate`, `border`, `enamel`, `stones`, `mark_<family>` (the
`<shape>__` prefix is stripped on export by the script; if you export by
hand, rename them first or tell me and I'll do it).

## If you'd rather change the recipe than the result

`docs/badge-art/tools/build_pins.py` rebuilds everything from the SVG
outlines and the mark meshes. The numbers at the top (plate thickness,
border width, wall height, bow, stone radius, colours) are the whole
design; change one, rerun, and the three `.glb` files and this
`badges.blend` come back out:

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b -P docs/badge-art/tools/build_pins.py -- \
  docs/badge-art docs/badge-art/3d blend \
  /Applications/Blender.app/Contents/Resources/5.0/datafiles/studiolights/world/studio.exr
```
