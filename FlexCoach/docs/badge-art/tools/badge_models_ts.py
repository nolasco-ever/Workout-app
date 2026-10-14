#!/usr/bin/env python3
"""Regenerate components/achievements/badgeModels.ts from assets/badges/manifest.json. Run from the app root."""
import json
m = json.load(open('assets/badges/manifest.json'))
fams, ladder = m['families'], m['ladder']
lines = ["/* Generated from assets/badges/manifest.json by docs/badge-art/tools/badge_models_ts.py. Do not edit by hand. */",
         "import { AchievementFamilyId } from '../../data/models';", "",
         "/** The tier's body: plate, border, enamel, scallops, the engraved back. One per tier, shared by every family. */",
         "export const BADGE_BODIES: Record<number, number> = {"]
for t in range(1, 9): lines.append(f"  {t}: require('../../assets/badges/body_t{t}.glb'),")
lines += ["};", "", "/** The family's mark and the tier's line-work, cut to fit around it. */", "export const BADGE_OVERLAYS: Record<string, number> = {"]
for f in fams:
    for t in range(1, ladder[f] + 1): lines.append(f"  '{f}:{t}': require('../../assets/badges/{f}_t{t}.glb'),")
lines += ["};", "", "export const badgeOverlayFor = (family: AchievementFamilyId, tier: number): number | undefined => BADGE_OVERLAYS[`${family}:${tier}`];", ""]
open('components/achievements/badgeModels.ts', 'w').write('\n'.join(lines))
print('badgeModels.ts written')
