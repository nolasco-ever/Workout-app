import { Anchor, Crown, Dumbbell, Flame, Heart, Mountain, Rocket, Shield, Star, Sun, Target, Zap } from 'lucide-react-native';
import { AvatarId } from '../../data/engine/avatars';
import { IconSource } from '../icons/Icon';

export interface AvatarStyle {
  id: AvatarId;
  /** Spoken name for accessibility and the picker. */
  label: string;
  icon: IconSource;
  /** Fixed colours: an avatar is an image, the same in light and dark. */
  bg: string;
  fg: string;
}

/**
 * The built-in avatar set: a Lucide mark on a tinted circle, so they sit
 * with the rest of the app's icons. Order is the order in the picker.
 */
export const AVATARS: readonly AvatarStyle[] = [
  { id: 'ember', label: 'Flame', icon: Flame, bg: '#E2602A', fg: '#FBE7DD' },
  { id: 'bolt', label: 'Bolt', icon: Zap, bg: '#F0B545', fg: '#1A1A1C' },
  { id: 'peak', label: 'Mountain', icon: Mountain, bg: '#3B7DD8', fg: '#FFFFFF' },
  { id: 'star', label: 'Star', icon: Star, bg: '#7A4B9E', fg: '#FFFFFF' },
  { id: 'iron', label: 'Dumbbell', icon: Dumbbell, bg: '#2A2B2F', fg: '#FF7A3D' },
  { id: 'crown', label: 'Crown', icon: Crown, bg: '#1A1A1C', fg: '#F0B545' },
  { id: 'target', label: 'Target', icon: Target, bg: '#1F8A8A', fg: '#FFFFFF' },
  { id: 'rocket', label: 'Rocket', icon: Rocket, bg: '#D64B6B', fg: '#FFFFFF' },
  { id: 'heart', label: 'Heart', icon: Heart, bg: '#D64B4B', fg: '#FFFFFF' },
  { id: 'shield', label: 'Shield', icon: Shield, bg: '#2E9E6B', fg: '#FFFFFF' },
  { id: 'sun', label: 'Sun', icon: Sun, bg: '#E8A33D', fg: '#1A1A1C' },
  { id: 'anchor', label: 'Anchor', icon: Anchor, bg: '#5A6B7A', fg: '#FFFFFF' },
];

export const avatarStyle = (id: AvatarId): AvatarStyle => AVATARS.find(a => a.id === id) ?? AVATARS[0];
