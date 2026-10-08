import { AchievementFamilyId } from '../../data/models';
import { MaterialId } from '../../data/engine/achievements';
import { IconSource } from '../icons/Icon';
import { generalIcons } from '../icons/icon-library';

/**
 * How a badge looks: one mark per family, one material per tier. The mark
 * never changes as the badge upgrades; the material does, bronze through
 * diamond. These are the placeholder marks (Lucide glyphs) until the real
 * artwork lands; the material palette is meant to stay.
 */

export interface Material {
  /** Gradient stops, light to dark. */
  light: string;
  mid: string;
  dark: string;
  /** The bevel ring. */
  rim: string;
  /** Text and the mark on top of it. */
  ink: string;
  /** Glow behind the badge in the celebration. */
  glow: string;
  name: string;
}

export const MATERIAL_ART: Record<MaterialId, Material> = {
  bronze: { light: '#F0C08E', mid: '#C9843F', dark: '#7F4A1C', rim: '#5E3512', ink: '#3A2008', glow: '#E29A55', name: 'Bronze' },
  silver: { light: '#F7F7FA', mid: '#C3C6CF', dark: '#7D818C', rim: '#5B5F69', ink: '#2E3138', glow: '#D6D9E2', name: 'Silver' },
  gold: { light: '#FFF0B3', mid: '#F0C34A', dark: '#A8761A', rim: '#7A540F', ink: '#4A3208', glow: '#F7D772', name: 'Gold' },
  platinum: { light: '#FFFFFF', mid: '#D8E2EA', dark: '#8FA2B2', rim: '#62737F', ink: '#2B3942', glow: '#CFE0EC', name: 'Platinum' },
  ruby: { light: '#FFB3BE', mid: '#E33A5A', dark: '#8B0E29', rim: '#5E0919', ink: '#FFFFFF', glow: '#F06C86', name: 'Ruby' },
  sapphire: { light: '#B9D2FF', mid: '#3F74E6', dark: '#163A9B', rim: '#0F2A70', ink: '#FFFFFF', glow: '#6F9AF5', name: 'Sapphire' },
  emerald: { light: '#B6F2D4', mid: '#2FB37A', dark: '#0F6B45', rim: '#0A4A30', ink: '#FFFFFF', glow: '#66D9A3', name: 'Emerald' },
  diamond: { light: '#FFFFFF', mid: '#CDEBFF', dark: '#79B8E6', rim: '#4D8DB8', ink: '#163A52', glow: '#B6E3FF', name: 'Diamond' },
};

/** A badge not yet earned: flat and quiet. */
export const LOCKED_ART: Material = { light: '#DEDBD6', mid: '#C9C5BF', dark: '#A9A49D', rim: '#8E8982', ink: '#6E6B6A', glow: 'transparent', name: 'Locked' };

export const FAMILY_MARKS: Record<AchievementFamilyId, IconSource> = {
  workouts: generalIcons.dumbbell,
  streak: generalIcons.flame,
  volume: generalIcons.weight,
  records: generalIcons.trophy,
  cycles: generalIcons.repeat,
  perfect_cycles: generalIcons.star,
  early_bird: generalIcons.sunrise,
  night_owl: generalIcons.moon,
  buddies: generalIcons.users,
  plan_uses: generalIcons.share,
};
