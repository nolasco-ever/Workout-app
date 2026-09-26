import React from 'react';
import { Image, View } from 'react-native';
import { CustomText } from '../text/customText';
import { useTheme } from '../../theme';

/** Initials from a display name: "Ever Nolasco" → "EN". */
export const initialsOf = (name: string | null | undefined): string => {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

/** A round profile photo, or initials on the accent tint when there's no photo. */
export const Avatar = ({ uri, name, size = 44 }: { uri: string | null | undefined; name: string | null | undefined; size?: number }) => {
  const { colors, fonts } = useTheme();
  if (uri) return <Image source={{ uri }} resizeMode="cover" style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surfaceRaised }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' }}>
      <CustomText variant="bodyStrong" color={colors.accent} style={{ fontFamily: fonts.display.bold, fontSize: size * 0.38 }}>
        {initialsOf(name)}
      </CustomText>
    </View>
  );
};
