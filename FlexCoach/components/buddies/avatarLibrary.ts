import { Anchor, Crown, Dumbbell, Flame, Heart, Mountain, Rocket, Shield, Star, Sun, Target, Zap } from 'lucide-react-native';
import { FaceId, IconAvatarId } from '../../data/engine/avatars';
import { FaceSpec } from './FaceAvatar';
import { IconSource } from '../icons/Icon';

export interface AvatarStyle {
  id: IconAvatarId;
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

export const avatarStyle = (id: IconAvatarId): AvatarStyle => AVATARS.find(a => a.id === id) ?? AVATARS[0];

/** The character faces. Names are only spoken by screen readers and shown in the picker. */
export const FACES: readonly { id: FaceId; label: string; spec: FaceSpec }[] = [
  { id: 'sam', label: 'Sam', spec: { bg: '#E2602A', skin: '#F1C27D', hair: 'short', hairColor: '#2B1B12', shirt: '#1A1A1C', cheeks: true } },
  { id: 'maya', label: 'Maya', spec: { bg: '#1F8A8A', skin: '#8D5524', hair: 'bun', hairColor: '#1A1A1C', shirt: '#FBE7DD' } },
  { id: 'leo', label: 'Leo', spec: { bg: '#3B7DD8', skin: '#FFDBAC', hair: 'curly', hairColor: '#C4622D', shirt: '#F0B545', glasses: true } },
  { id: 'aria', label: 'Aria', spec: { bg: '#7A4B9E', skin: '#C68642', hair: 'long', hairColor: '#1A1A1C', shirt: '#E2602A' } },
  { id: 'dre', label: 'Dre', spec: { bg: '#2E9E6B', skin: '#5C3A1E', hair: 'bald', hairColor: '#1A1A1C', shirt: '#2A2B2F', beard: true, headband: '#E2602A' } },
  { id: 'jules', label: 'Jules', spec: { bg: '#D64B6B', skin: '#E0AC69', hair: 'cap', hairColor: '#4A2C17', cap: '#1A1A1C', shirt: '#F4F3F1' } },
  { id: 'nico', label: 'Nico', spec: { bg: '#2A2B2F', skin: '#F1C27D', hair: 'buzz', hairColor: '#1A1A1C', shirt: '#FF7A3D', glasses: true } },
  { id: 'zara', label: 'Zara', spec: { bg: '#F0B545', skin: '#A66B3E', hair: 'puffs', hairColor: '#1A1A1C', shirt: '#3B7DD8', cheeks: true } },
];

export const faceSpec = (id: FaceId): FaceSpec => (FACES.find(f => f.id === id) ?? FACES[0]).spec;
