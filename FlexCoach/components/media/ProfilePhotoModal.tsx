import React from 'react';
import { ActivityIndicator, Image, Modal, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomText } from '../text/customText';
import { SurfaceCard } from '../cards/SurfaceCard';
import { Row } from '../list-items/Row';
import { Icon } from '../icons/Icon';
import { generalIcons } from '../icons/icon-library';
import { useTheme } from '../../theme';

interface Props {
  open: boolean;
  /** The current photo, or null for the placeholder. */
  uri: string | null;
  /** A save or removal is in flight: the options are disabled and the photo shows a spinner. */
  busy: boolean;
  onClose: () => void;
  onChooseLibrary: () => void;
  onTakePhoto: () => void;
  onRemove: () => void;
}

/**
 * The profile photo expanded to fill the width, with the ways to change it
 * listed underneath: pick from the library, take a new one, or remove it.
 */
export const ProfilePhotoModal = ({ open, uri, busy, onClose, onChooseLibrary, onTakePhoto, onRemove }: Props) => {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const size = Math.min(width - spacing.lg * 2, 360);

  return (
    <Modal visible={open} animationType="fade" onRequestClose={onClose} statusBarTranslucent presentationStyle="overFullScreen" transparent>
      <View style={{ flex: 1, backgroundColor: colors.ground, paddingTop: insets.top, paddingBottom: insets.bottom + spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
          <CustomText variant="heading">Profile photo</CustomText>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon icon={generalIcons.xMark} size={20} color={colors.ink} />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
          <View style={{ width: size, height: size, borderRadius: radius.xl, backgroundColor: colors.surfaceRaised, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
            {uri ? <Image source={{ uri }} resizeMode="cover" style={{ width: size, height: size }} /> : <Icon icon={generalIcons.user} size={size / 3} color={colors.inactive} />}
            {busy && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={colors.onAccent} />
              </View>
            )}
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.lg }}>
          <SurfaceCard style={{ padding: 0, opacity: busy ? 0.5 : 1 }}>
            <Row icon={generalIcons.images} iconColor={colors.accent} title={uri ? 'Replace from library' : 'Choose from library'} onPress={busy ? undefined : onChooseLibrary} chevron={false} />
            <Row icon={generalIcons.camera} iconColor={colors.accent} title="Take a photo" divider onPress={busy ? undefined : onTakePhoto} chevron={false} />
            {uri && <Row icon={generalIcons.trash} title="Remove photo" tone="destructive" divider onPress={busy ? undefined : onRemove} chevron={false} />}
          </SurfaceCard>
        </View>
      </View>
    </Modal>
  );
};
