#!/usr/bin/env python3
"""Embed the Badge Builder's SVG for every badge, plus a pewter locked variant, as components/achievements/badgeSvgs.ts.
   python3 badge_svgs_ts.py <svg_dir>   (run from the app root; <svg_dir> is the output of tools/builder-export/export.js)"""
import json, re, sys
svg_dir = sys.argv[1]
meta = json.load(open(f'{svg_dir}/meta.json')); fams, ladder = meta['families'], meta['ladder']
ATTR = re.compile(r'\s+([\w:-]+)="([^"]*)"')
def dedupe(svg):
    def fix(m):
        seen = set(); kept = []
        for name, value in ATTR.findall(m.group(2)):
            if name in seen: continue
            seen.add(name); kept.append(f' {name}="{value}"')
        return '<' + m.group(1) + ''.join(kept) + m.group(3)
    return re.sub(r'<([\w:]+)((?:\s+[\w:-]+="[^"]*")*)(\s*/?>)', fix, svg)
def tidy(svg, prefix):
    svg = dedupe(svg)
    svg = re.sub(r'\s+width="100" height="100"', '', svg, count=1)
    svg = re.sub(r'\bb\d+-', prefix + '-', svg)          # unique gradient and clip ids per embedded badge
    return re.sub(r'>\s+<', '><', svg.strip())
def pewter(svg):
    def grey(m):
        h = m.group(1); r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
        lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
        v = int(0x50 + lum * 0x58)
        return '#%02x%02x%02x' % (v, v, min(255, v + 3))
    return re.sub(r'#([0-9a-fA-F]{6})\b', grey, svg)
lines = ["/* Generated from the Badge Builder's SVG output by docs/badge-art/tools/badge_svgs_ts.py. Do not edit by hand. */",
         "import { AchievementFamilyId } from '../../data/models';", "", "const SVGS: Record<string, string> = {"]
for f in fams:
    for t in range(1, ladder[f] + 1):
        svg = open(f'{svg_dir}/{f}_t{t}.svg').read()
        lines.append(f"  '{f}:{t}': {json.dumps(tidy(svg, f'{f}{t}'))},")
        lines.append(f"  '{f}:{t}:locked': {json.dumps(pewter(tidy(svg, f'{f}{t}l')))},")
lines += ["};", "", "/** The builder's drawing of a badge, in colour or in pewter for one not yet earned. */",
          "export const badgeSvg = (family: AchievementFamilyId, tier: number, locked = false): string | undefined => SVGS[`${family}:${Math.max(1, tier)}${locked ? ':locked' : ''}`];", ""]
open('components/achievements/badgeSvgs.ts', 'w').write('\n'.join(lines)); print('badgeSvgs.ts written')
