#!/usr/bin/env python3
"""
Builds the app's exercise catalog from the licensed ExerciseDB Pro package.

  python3 tools/exercisedb/build.py ~/Downloads/pro            # data only
  python3 tools/exercisedb/build.py ~/Downloads/pro --visuals  # plus the hosted animations

Writes data/catalog/exercisedb.json (the catalog in the app's own shape, with
the ExerciseDB ids), data/catalog/legacyExerciseMap.json (old free-exercise-db
and extra ids -> ExerciseDB ids, for everything users already have in plans,
sessions and records), and, with --visuals, hosting/exercises/<hash>.gif and
.webp for each exercise (720 px; the GIF for iOS, the WebP for Android).

The raw package stays out of the repository (EULA: no redistribution of the
Raw Product Materials); only this derived, slimmed catalog ships in the app.
"""
import hashlib
import json
import os
import re
import subprocess
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CATALOG_DIR = os.path.join(ROOT, 'data', 'catalog')
HOSTING_DIR = os.path.join(ROOT, 'hosting', 'exercises')
HOST = 'https://flexcoach-a372d.web.app/exercises'
# Visual file names are a keyed hash of the id, so the hosted set cannot be enumerated from the ids alone.
NAME_KEY = 'flexcoach-exercisedb-2026'

MUSCLE = {
    'chest': 'chest', 'biceps': 'biceps', 'quadriceps': 'quadriceps', 'triceps': 'triceps', 'shoulders': 'shoulders',
    'abs': 'abdominals', 'obliques': 'abdominals', 'lats': 'lats', 'upper back': 'middle back', 'glutes': 'glutes',
    'calves': 'calves', 'hamstrings': 'hamstrings', 'forearms': 'forearms', 'rear deltoids': 'shoulders',
    'lower back': 'lower back', 'neck': 'neck', 'trapezius': 'traps', 'hip flexors': 'quadriceps', 'adductors': 'adductors',
    'gluteus medius': 'abductors', 'gluteus minimus': 'abductors', 'tensor fasciae latae': 'abductors',
    'serratus anterior': 'chest', 'rotator cuff': 'shoulders', 'tibialis anterior': 'calves', 'tibialis posterior': 'calves',
    'peroneals': 'calves', 'brachialis': 'biceps', 'brachioradialis': 'forearms', 'piriformis': 'glutes',
    'levator scapulae': 'traps', 'quadratus lumborum': 'lower back', 'cardiovascular system': None,
}
EQUIPMENT = {
    'body weight': 'body only', 'dumbbell': 'dumbbell', 'cable': 'cable', 'barbell': 'barbell', 'leverage machine': 'machine',
    'band': 'bands', 'smith machine': 'machine', 'kettlebell': 'kettlebells', 'weighted': 'other', 'stability ball': 'exercise ball',
    'ez barbell': 'e-z curl bar', 'medicine ball': 'medicine ball', 'sled machine': 'machine', 'rope': 'cable', 'roller': 'foam roll',
    'bosu ball': 'other', 'neutral-grip barbell': 'barbell', 'treadmill': 'machine', 'wheel roller': 'other', 'stationary bike': 'machine',
    'elliptical machine': 'machine', 'towel': 'other', 'balance board': 'other', 'assisted': 'machine', 'exercise bar': 'other',
    'air bike': 'machine', 'upper body ergometer': 'machine', 'weight plate': 'other', 'skierg machine': 'machine', 'sledgehammer': 'other',
    'tire': 'other', 'trap bar': 'barbell', 'stepmill machine': 'machine', 'strongman implement': 'other', 'keg': 'other',
    'olympic barbell': 'barbell', 'car flip implement': 'other', 'jump rope': 'other',
}
CATEGORY = {'strength': 'strength', 'stretching': 'stretching', 'cardio': 'cardio', 'mobility': 'stretching', 'plyometrics': 'plyometrics', 'balance': 'strength'}
LEVEL = {'beginner': 'beginner', 'intermediate': 'intermediate', 'advanced': 'expert'}
CARDIO_MACHINES = {'treadmill', 'stationary bike', 'elliptical machine', 'air bike', 'upper body ergometer', 'skierg machine', 'stepmill machine'}
SMALL_WORDS = {'of', 'on', 'the', 'with', 'and', 'to', 'in', 'at', 'for', 'a', 'an', 'over', 'from', 'behind'}
KEEP_CASE = {'ez': 'EZ', 'smr': 'SMR', 'tv': 'TV', 'ab': 'Ab', 'v': 'V', 'l': 'L', 'y': 'Y', 't': 'T', 'w': 'W', 'i': 'I', 'ii': 'II', 'iii': 'III'}


def title(name):
    out = []
    for i, word in enumerate(name.split(' ')):
        low = word.lower()
        if low in KEEP_CASE:
            out.append(KEEP_CASE[low])
        elif i and low in SMALL_WORDS:
            out.append(low)
        else:
            # "sit-up" -> "Sit-Up", "3/4" stays, "(male)" -> "(Male)"
            out.append(re.sub(r'(^|[-/(])([a-z])', lambda m: m.group(1) + m.group(2).upper(), low))
    return ' '.join(out)


def measurement(e):
    cat, load, equip = e['category'], e['taxonomy'].get('loadType'), e['equipment']
    if cat == 'cardio':
        return 'distance_time' if equip in CARDIO_MACHINES or 'run' in e['name'] or 'walk' in e['name'] else 'time'
    if cat in ('stretching', 'mobility', 'balance'):
        return 'time'
    if load in ('bodyweight', 'assisted', 'none'):
        return 'reps'
    return 'weight_reps'


def muscles(names, fallback):
    out = []
    for n in names:
        m = MUSCLE.get(n)
        if m and m not in out:
            out.append(m)
    return out or ([fallback] if fallback else [])


def visual_name(exercise_id):
    return hashlib.sha1(f'{NAME_KEY}:{exercise_id}'.encode()).hexdigest()[:16]


def convert(items):
    out = []
    for e in items:
        primary = muscles([e['target']], None)
        secondary = [m for m in muscles(e['secondaryMuscles'], None) if m not in primary]
        if not primary:
            # Cardio: no single muscle; the legs carry it on the muscle map.
            primary = ['quadriceps'] if e['bodyPart'] == 'cardio' else secondary[:1]
        name = visual_name(e['id'])
        out.append({
            'id': e['id'],
            'name': title(e['name']),
            'measurement': measurement(e),
            'primaryMuscles': primary,
            'secondaryMuscles': secondary,
            'equipment': EQUIPMENT.get(e['equipment'], 'other'),
            'category': CATEGORY.get(e['category'], 'strength'),
            'level': LEVEL.get(e['difficulty']),
            'instructions': e['instructions'],
            'images': [],
            'animation': {'gif': f'{HOST}/{name}.gif', 'webp': f'{HOST}/{name}.webp'},
            'videoUrl': None,
            'source': 'catalog',
            'description': e.get('description') or None,
            'aliases': [title(a) for a in e.get('aliases', [])],
            'bodyPart': e['bodyPart'],
            'unilateral': bool(e['taxonomy'].get('isUnilateral')),
            'relations': {
                'similar': [s['id'] for s in sorted(e.get('similarExercises', []), key=lambda s: -s.get('score', 0))[:12]],
                'substitutions': [s['id'] for s in e.get('substitutions', [])][:12],
                'progressions': [s['id'] for s in e.get('progressions', [])][:6],
                'regressions': [s['id'] for s in e.get('regressions', [])][:6],
            },
        })
    return out


# --- the old library onto the new one -----------------------------------------------------------------------------

STOP = {'with', 'the', 'a', 'an', 'and', 'on', 'of', 'to', 'in', 'exercise', 'version', 'male', 'female'}
SYN = {
    'dumbbells': 'dumbbell', 'barbells': 'barbell', 'kettlebells': 'kettlebell', 'db': 'dumbbell', 'bb': 'barbell', 'kb': 'kettlebell',
    'flye': 'fly', 'flyes': 'fly', 'flys': 'fly', 'flies': 'fly', 'curls': 'curl', 'raises': 'raise', 'rows': 'row', 'presses': 'press',
    'squats': 'squat', 'lunges': 'lunge', 'extensions': 'extension', 'pulldowns': 'pulldown', 'pushdowns': 'pushdown', 'kickbacks': 'kickback',
    'crunches': 'crunch', 'situps': 'situp', 'sit': 'sit', 'pullups': 'pullup', 'chinups': 'chinup', 'pushups': 'pushup', 'dips': 'dip',
    'shrugs': 'shrug', 'twists': 'twist', 'stretches': 'stretch', 'planks': 'plank', 'thrusts': 'thrust', 'swings': 'swing',
    'ezbar': 'ez', 'ez-bar': 'ez', 'e-z': 'ez', 'overhead': 'overhead', 'standing': 'standing', 'seated': 'seated', 'lying': 'lying',
    'supine': 'lying', 'prone': 'prone', 'reverse': 'reverse', 'incline': 'incline', 'decline': 'decline', 'close': 'close', 'wide': 'wide',
    'grip': 'grip', 'single': 'single', 'one': 'single', 'arm': 'arm', 'leg': 'leg', 'alternate': 'alternating', 'alternating': 'alternating',
    'machine': 'machine', 'lever': 'machine', 'leverage': 'machine', 'smith': 'smith', 'cable': 'cable', 'band': 'band', 'bands': 'band',
    'bodyweight': 'body', 'medicine': 'medicine', 'ball': 'ball', 'stability': 'stability', 'swiss': 'stability', 'exercise ball': 'stability',
    'hyperextension': 'hyperextension', 'hyperextensions': 'hyperextension', 'deadlifts': 'deadlift', 'rdl': 'romanian',
    'skullcrusher': 'skull crusher', 'tricep': 'triceps', 'bicep': 'biceps', 'delt': 'deltoid', 'delts': 'deltoid', 'lat': 'lat', 'lats': 'lat',
    'hammer': 'hammer', 'concentration': 'concentration', 'preacher': 'preacher', 'front': 'front', 'rear': 'rear', 'lateral': 'lateral', 'side': 'lateral',
    'upright': 'upright', 'bent': 'bent', 'bentover': 'bent over', 'bent-over': 'bent over', 'underhand': 'underhand', 'overhand': 'overhand',
    'neutral': 'neutral', 'palms': 'palms', 'behind': 'behind', 'neck': 'neck', 'head': 'head', 'bench': 'bench', 'floor': 'floor',
    'ups': 'up', 'downs': 'down', 'ins': 'in', 'outs': 'out', 'stepups': 'step up', 'step-ups': 'step up', 'step-up': 'step up',
    'pull-up': 'pullup', 'pull-ups': 'pullup', 'chin-up': 'chinup', 'chin-ups': 'chinup', 'push-up': 'pushup', 'push-ups': 'pushup',
    'sit-up': 'situp', 'sit-ups': 'situp', 'sumo': 'sumo', 'goblet': 'goblet', 'zercher': 'zercher', 'hack': 'hack', 'bulgarian': 'bulgarian',
    'split': 'split', 'pistol': 'pistol', 'glute': 'glute', 'hip': 'hip', 'calf': 'calf', 'calves': 'calf', 'ab': 'ab', 'abs': 'ab',
    'abdominal': 'ab', 'obliques': 'oblique', 'wrist': 'wrist', 'forearm': 'forearm', 'shoulder': 'shoulder', 'chest': 'chest', 'pec': 'chest', 'pecs': 'chest',
}


# Words that make a variant of a movement: a candidate carrying one the old name lacks is a different exercise.
VARIANT_WORDS = {'alternating', 'single', 'close', 'wide', 'neutral', 'reverse', 'incline', 'decline', 'seated', 'standing', 'lying', 'kneeling',
                 'bench', 'support', 'supported', 'assisted', 'weighted', 'band', 'cable', 'machine', 'smith', 'kettlebell', 'dumbbell', 'barbell',
                 'rope', 'bar', 'handle', 'view', 'rear', 'front', 'back', 'lateral', 'hold', 'opposite', 'pads', 'straps', 'partner', 'deep',
                 'high', 'low', 'sumo', 'jump', 'twisting', 'oblique', 'cross', 'body', 'overhand', 'underhand', 'rotation', 'elevated'}

# Hand-picked twins, by the old name, for the lifts people actually have in their plans, where the automatic match
# would land on a variant (the new library has no plain "barbell squat": its standard one is the high-bar back squat).
OVERRIDES_BY_NAME = {
    'Barbell Squat': '1436',  # barbell high-bar back squat
    'Barbell Full Squat': '1436',
    'Front Barbell Squat': 'barbell clean-grip front squat',
    'Incline Dumbbell Press': '0314',  # dumbbell incline bench press
    'Side Lateral Raise': '0334',  # dumbbell lateral raise
    'Crunches': '0274',  # floor crunch
    'Plank': '2135',  # weighted forearm plank (the only front plank held for time)
    'Standing Military Press': '1456',  # barbell standing close-grip (shoulder-width) overhead press
    'Pullups': '0652',  # overhand pull-up
    'Pushups': '0662',  # push-up
    'Bulgarian Split Squat': '1476',  # bodyweight rear-foot-elevated split squat
    'Hammer Curls': '0312',  # dumbbell simultaneous hammer curl
    'Dumbbell Shoulder Press': 'dumbbell seated overhead press with back support',
    'One-Arm Dumbbell Row': 'dumbbell hand-and-knee-supported row',
    'Leg Press': '0739',  # 45-degree sled leg press
    'Seated Cable Rows': 'seated cable row with v-handle',
    'Dumbbell Lunges': 'dumbbell forward lunge',
    'Lying Triceps Press': '0060',  # barbell skull crusher
    'EZ-Bar Skullcrusher': '0060',
    'Barbell Walking Lunge': '0054',  # barbell forward lunge
    'Mountain Climbers': '0630',
    'Pallof Press': '4240',  # standing band Pallof press
    'Rack Pulls': '0074',
    'Stiff-Legged Barbell Deadlift': '0085',  # barbell Romanian deadlift
    'Cable Woodchop': '0243',  # standing cable torso rotation
    'Pec Deck Fly': '0596',  # seated machine chest fly
    'Nordic Hamstring Curl': '3193',
    'Spider Curl': '1628',
    'Close-Grip EZ Bar Curl': '0446',
    'Machine Shoulder (Military) Press': '0587',
    'Jogging, Treadmill': '0684',
    'Running, Outdoor': '0685',
    'Ab Crunch Machine': '1452',
    'Ab Roller': '0857',  # kneeling ab wheel rollout
    'Barbell Ab Rollout': '0103',
    'Barbell Ab Rollout - On Knees': '0084',
    'Push-Ups - Close Triceps Position': '0259',
    'Split Squats': '2368',
    'Bent Over Two-Dumbbell Row With Palms In': '0293',
    'Decline EZ Bar Triceps Extension': '2186',
    'Kneeling High Pulley Row': '0167',
    'Exercise Ball Crunch': '2297',
    'Smith Machine Stiff-Legged Deadlift': '0752',
    'Bicycling, Stationary': '0798',
    'Rope Jumping': '2612',
    'Incline Push-Up Medium': '0493',
}
# The old library's specific equipment must be the candidate's too: a dumbbell row is not a kettlebell row.
SPECIFIC_EQUIPMENT = {'barbell', 'dumbbell', 'cable', 'machine', 'kettlebells', 'bands', 'e-z curl bar'}
OVERRIDES = {}


def tokens(name):
    # "Medium grip" is the plain movement in the old library's names ("Barbell Bench Press - Medium Grip"); the words would
    # otherwise pull the match towards the close- and wide-grip variants.
    name = re.sub(r'medium[- ]grip', '', name.lower())
    words = re.sub(r'[^a-z0-9]+', ' ', name.replace('-', ' ')).split()
    out = []
    for w in words:
        w = SYN.get(w, w)
        for part in w.split(' '):
            if part and part not in STOP:
                out.append(part)
    return set(out)


def jaccard(a, b):
    return len(a & b) / len(a | b) if a | b else 0.0


OLD_EQUIPMENT_FAMILY = {
    'barbell': 'free', 'dumbbell': 'free', 'kettlebells': 'free', 'e-z curl bar': 'free', 'medicine ball': 'accessory', 'exercise ball': 'accessory',
    'foam roll': 'accessory', 'cable': 'cable', 'machine': 'machine', 'bands': 'band', 'body only': 'body', 'other': 'any', None: 'any',
}
NEW_EQUIPMENT_FAMILY = {'free_weight': 'free', 'bodyweight': 'body', 'cable': 'cable', 'machine': 'machine', 'accessory': 'accessory', 'band': 'band'}


def match_legacy(old_items, new_raw, new_converted):
    """Each old exercise's ExerciseDB twin, by name and alias words, backed by the same primary muscle and the same kind of equipment."""
    import math
    candidates = []
    for raw, conv in zip(new_raw, new_converted):
        names = [raw['name']] + raw.get('aliases', [])
        candidates.append((raw, conv, [tokens(n) for n in names]))
    # A word's weight is its rarity across the new library: "arnold" says more than "dumbbell" or "press".
    df = Counter()
    for _, _, token_sets in candidates:
        for w in set().union(*token_sets):
            df[w] += 1
    idf = lambda w: math.log((len(candidates) + 1) / (df.get(w, 0) + 1)) + 0.5
    weight = lambda ws: sum(idf(w) for w in ws)
    by_raw_name = {r['name'].lower(): r['id'] for r in new_raw}
    old_by_name = {o['name']: o['id'] for o in old_items}
    for old_name, target in OVERRIDES_BY_NAME.items():
        new_id = target if target.isdigit() else by_raw_name.get(target.lower())
        if old_name in old_by_name and new_id:
            OVERRIDES[old_by_name[old_name]] = new_id
        else:
            print('override not resolved:', old_name, target)
    mapping, stats = {}, Counter()
    for old in old_items:
        if old['id'] in OVERRIDES:
            mapping[old['id']] = OVERRIDES[old['id']]
            stats['override'] += 1
            continue
        old_tokens = tokens(old['name'])
        old_family = OLD_EQUIPMENT_FAMILY.get(old.get('equipment'), 'any')
        best, best_score = None, 0.0
        for raw, conv, token_sets in candidates:
            # How much of the old name the candidate carries, less a price per extra word of its own: the plain movement
            # beats its variants ("to bench", "with back support", "alternating") unless the old name has them too.
            # How much of the old name's weight the candidate carries (its real name or an alias), less what its real
            # name adds on top, by weight: a rare extra word ("curl", "cuban") is a different exercise, a common one
            # ("seated", "support") a variant.
            score = 0.0
            norm = weight(old_tokens) or 1.0
            extra = weight(token_sets[0] - old_tokens) / norm
            for i, t in enumerate(token_sets):
                coverage = weight(old_tokens & t) / norm
                score = max(score, coverage - 0.3 * extra - (0.03 if i else 0))
            if score < 0.45:
                continue
            if not set(old['primaryMuscles']) & set(conv['primaryMuscles'] + conv['secondaryMuscles']):
                continue
            new_family = NEW_EQUIPMENT_FAMILY.get(raw['taxonomy'].get('equipmentCategory'), 'any')
            if old_family != 'any' and new_family != 'any' and old_family != new_family:
                continue
            if conv['measurement'] != old['measurement'] and not {conv['measurement'], old['measurement']} <= {'reps', 'weight_reps'}:
                continue
            if old.get('equipment') in SPECIFIC_EQUIPMENT and conv['equipment'] != old['equipment']:
                continue
            if conv['equipment'] == old.get('equipment'):
                score += 0.05
            if score > best_score:
                best, best_score = conv, score
        if best and best_score >= 0.6:
            mapping[old['id']] = best['id']
            stats['exact' if best_score >= 0.95 else 'close'] += 1
        else:
            stats['unmatched'] += 1
    return mapping, stats


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    package = os.path.expanduser(sys.argv[1])
    visuals = '--visuals' in sys.argv or '--visuals-only' in sys.argv
    raw = json.load(open(os.path.join(package, 'exerciseData_pro_101426.json')))
    converted = convert(raw)
    old = json.load(open(os.path.join(CATALOG_DIR, 'exercises.json'))) + json.load(open(os.path.join(CATALOG_DIR, 'extraExercises.json')))
    mapping, stats = match_legacy(old, raw, converted)

    if '--visuals-only' not in sys.argv:
        json.dump(converted, open(os.path.join(CATALOG_DIR, 'exercisedb.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
        json.dump(dict(sorted(mapping.items())), open(os.path.join(CATALOG_DIR, 'legacyExerciseMap.json'), 'w'), ensure_ascii=False, indent=0)
    print('catalog', len(converted), 'legacy mapped', dict(stats))
    print('measurement', dict(Counter(e['measurement'] for e in converted)))
    print('equipment', dict(Counter(e['equipment'] for e in converted)))
    print('category', dict(Counter(e['category'] for e in converted)))
    unmatched = [o['name'] for o in old if o['id'] not in mapping]
    print('unmatched', len(unmatched), unmatched[:40])
    by_id = {c['id']: c for c in converted}
    key = ['Barbell Bench Press - Medium Grip', 'Barbell Incline Bench Press - Medium Grip', 'Dumbbell Bench Press', 'Incline Dumbbell Press', 'Barbell Squat', 'Barbell Full Squat', 'Front Barbell Squat', 'Barbell Deadlift', 'Romanian Deadlift', 'Sumo Deadlift', 'Standing Military Press', 'Dumbbell Shoulder Press', 'Arnold Dumbbell Press', 'Bent Over Barbell Row', 'One-Arm Dumbbell Row', 'Seated Cable Rows', 'Wide-Grip Lat Pulldown', 'Pullups', 'Chin-Up', 'Dips - Triceps Version', 'Barbell Curl', 'Dumbbell Bicep Curl', 'Hammer Curls', 'Triceps Pushdown', 'Skullcrusher', 'Side Lateral Raise', 'Face Pull', 'Leg Press', 'Leg Extensions', 'Lying Leg Curls', 'Seated Leg Curl', 'Standing Calf Raises', 'Barbell Hip Thrust', 'Dumbbell Lunges', 'Bulgarian Split Squat', 'Plank', 'Crunches', 'Hanging Leg Raise', 'Push-Ups', 'Cable Crossover', 'Running, Treadmill', 'Rowing, Stationary']
    print('KEY LIFTS')
    for name in key:
        o = next((x for x in old if x['name'] == name), None)
        if not o:
            print('  ?', name); continue
        print('  ', name, '->', by_id[mapping[o['id']]]['name'] if o['id'] in mapping else '(legacy, unmatched)')

    if visuals:
        os.makedirs(HOSTING_DIR, exist_ok=True)
        done = 0
        for e in raw:
            name = visual_name(e['id'])
            src = os.path.join(package, '720', f"{e['id']}.gif")
            gif = os.path.join(HOSTING_DIR, f'{name}.gif')
            webp = os.path.join(HOSTING_DIR, f'{name}.webp')
            if not os.path.exists(gif):
                subprocess.run(['cp', src, gif], check=True)
            if not os.path.exists(webp):
                subprocess.run(['gif2webp', '-q', '75', '-mixed', '-mt', src, '-o', webp], check=True, capture_output=True)
            done += 1
            if done % 100 == 0:
                print('visuals', done, flush=True)
        print('visuals done', done)


if __name__ == '__main__':
    main()
