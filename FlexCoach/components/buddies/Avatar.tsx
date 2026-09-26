import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { avatarIdOf, isPhotoUri } from '../../data/engine/avatars';
import { CustomText } from '../text/customText';
import { Icon } from '../icons/Icon';
import { generalIcons } from '../icons/icon-library';
import { useTheme } from '../../theme';
import { avatarStyle } from './avatarLibrary';

/** Initials from a display name: "Ever Nolasco" → "EN". */
export const initialsOf = (name: string | null | undefined): string => {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

interface Props {
  /** A photo URL, an `avatar:<id>` value, or nothing. */
  uri: string | null | undefined;
  name?: string | null;
  size?: number;
  /** What to show with no photo and no avatar: initials on the accent tint, or a plain person icon. */
  fallback?: 'initials' | 'icon';
}

/** A filled circle drawn as a vector, so it is a true circle at any size and on any renderer. */
const Disc = ({ size, color, children }: { size: number; color: string; children?: React.ReactNode }) => (
  <View style={{ width: size, height: size, flexShrink: 0 }}>
    <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
      <Circle cx={50} cy={50} r={50} fill={color} />
    </Svg>
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>{children}</View>
  </View>
);

/**
 * A person's picture wherever one is shown: their photo, one of the
 * built-in avatars, or a fallback. Photos are clipped to a circle; the
 * other two are drawn on a vector disc.
 */
export const Avatar = ({ uri, name, size = 44, fallback = 'initials' }: Props) => {
  const { colors, fonts } = useTheme();
  const avatar = avatarIdOf(uri);
  if (avatar) {
    const style = avatarStyle(avatar);
    return (
      <Disc size={size} color={style.bg}>
        <Icon icon={style.icon} size={size * 0.5} color={style.fg} strokeWidth={size >= 80 ? 1.75 : 2} />
      </Disc>
    );
  }
  if (isPhotoUri(uri)) {
    return <Image source={{ uri }} resizeMode="cover" style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surfaceRaised, flexShrink: 0 }} />;
  }
  if (fallback === 'icon') {
    return (
      <Disc size={size} color={colors.surfaceRaised}>
        <Icon icon={generalIcons.user} size={size * 0.42} color={colors.inactive} />
      </Disc>
    );
  }
  const fontSize = Math.round(size * 0.38);
  return (
    <Disc size={size} color={colors.accentTint}>
      <CustomText variant="bodyStrong" color={colors.accent} style={{ fontFamily: fonts.display.bold, fontSize, lineHeight: Math.round(fontSize * 1.25), includeFontPadding: false }}>
        {initialsOf(name)}
      </CustomText>
    </Disc>
  );
};
