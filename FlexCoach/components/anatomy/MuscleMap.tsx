import React from 'react';
import { View } from 'react-native';
import Body, { ExtendedBodyPart, Slug } from 'react-native-body-highlighter';
import { MuscleGroup } from '../../data/models';
import { useTheme } from '../../theme';

/**
 * Anatomical front and back figure from react-native-body-highlighter (MIT),
 * keyed by the catalog's muscle groups. Primary muscles fill with the accent,
 * secondary with a lighter tint.
 */

/** Catalog muscle group to body-highlighter slug. */
const SLUG: Record<MuscleGroup, Slug> = {
  abdominals: 'abs',
  abductors: 'gluteal',
  adductors: 'adductors',
  biceps: 'biceps',
  calves: 'calves',
  chest: 'chest',
  forearms: 'forearm',
  glutes: 'gluteal',
  hamstrings: 'hamstring',
  lats: 'upper-back',
  'lower back': 'lower-back',
  'middle back': 'upper-back',
  neck: 'neck',
  quadriceps: 'quadriceps',
  shoulders: 'deltoids',
  traps: 'trapezius',
  triceps: 'triceps',
};

/** Every region the figure draws, so unhighlighted ones can be painted with a token. */
const ALL_SLUGS: Slug[] = [
  'abs', 'adductors', 'ankles', 'biceps', 'calves', 'chest', 'deltoids', 'feet', 'forearm', 'gluteal', 'hamstring',
  'hands', 'head', 'knees', 'lower-back', 'neck', 'obliques', 'quadriceps', 'tibialis', 'trapezius', 'triceps', 'upper-back',
];
const EXTREMITIES: Slug[] = ['head', 'hands', 'feet', 'ankles', 'knees'];

/** Slugs that only exist on one side of the figure. */
const FRONT_ONLY: Slug[] = ['abs', 'obliques', 'chest', 'biceps', 'quadriceps', 'tibialis', 'knees'];
const BACK_ONLY: Slug[] = ['upper-back', 'lower-back', 'hamstring', 'gluteal'];

const NATURAL_HEIGHT = 400;

interface Props {
  primary: MuscleGroup[];
  secondary?: MuscleGroup[];
  /** Rendered height of each figure. */
  height?: number;
  /** Show both views, or only the one with the most highlighted regions. */
  views?: 'both' | 'auto';
}

const MuscleMapInner = ({ primary, secondary = [], height = 200, views = 'both' }: Props) => {
  const { colors, spacing, isDark } = useTheme();
  const scale = height / NATURAL_HEIGHT;

  // Several catalog groups share one region (lats and middle back are both
  // "upper-back"), so resolve by slug with primary winning.
  const level = new Map<Slug, 1 | 2>();
  for (const m of secondary) level.set(SLUG[m], 2);
  for (const m of primary) level.set(SLUG[m], 1);

  // The library's base parts carry their own charcoal colour, which beats
  // defaultFill, so every unhighlighted region gets an explicit token fill.
  const data: ExtendedBodyPart[] = ALL_SLUGS.map(slug => {
    const intensity = level.get(slug);
    if (intensity) return { slug, intensity };
    return { slug, styles: { fill: EXTREMITIES.includes(slug) ? colors.surfaceRaised : colors.line } };
  });
  const slugs = [...level.keys()];
  const frontScore = slugs.filter(s => !BACK_ONLY.includes(s)).length;
  const backScore = slugs.filter(s => !FRONT_ONLY.includes(s)).length;
  const showFront = views === 'both' || frontScore >= backScore;
  const showBack = views === 'both' || backScore > frontScore;

  const figure = (side: 'front' | 'back') => (
    <Body
      data={data}
      side={side}
      scale={scale}
      colors={[colors.accent, isDark ? '#7A4530' : '#F3B79A']}
      defaultFill={colors.surfaceRaised}
      border="none"
      hiddenParts={['hair']}
    />
  );

  return (
    <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center', justifyContent: 'center' }}>
      {showFront && figure('front')}
      {showBack && figure('back')}
    </View>
  );
};

export const MuscleMap = React.memo(MuscleMapInner, (a, b) =>
  a.height === b.height && a.views === b.views && a.primary.join() === b.primary.join() && (a.secondary ?? []).join() === (b.secondary ?? []).join(),
);
