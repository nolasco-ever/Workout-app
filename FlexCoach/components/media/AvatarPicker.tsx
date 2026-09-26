import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { AvatarId, avatarUri } from '../../data/engine/avatars';
import { AVATARS } from '../buddies/avatarLibrary';
import { Avatar } from '../buddies/Avatar';
import { BottomSheet } from '../overlays/BottomSheet';
import { CustomText } from '../text/customText';
import { useTheme } from '../../theme';

interface Props {
  open: boolean;
  /** The avatar id currently in use, to ring it. */
  selected: AvatarId | null;
  onClose: () => void;
  onSelect: (id: AvatarId) => void;
}

const COLUMNS = 4;

/** A sheet with the built-in avatars in a grid. Tapping one selects it and closes the sheet. */
export const AvatarPicker = ({ open, selected, onClose, onSelect }: Props) => {
  const { colors, spacing } = useTheme();
  return (
    <BottomSheet open={open} title="Pick an avatar" onClose={onClose}>
      <CustomText variant="body" color={colors.inkMuted}>Buddies see it on your Iron Card and next to your activity. You can switch to a photo any time.</CustomText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.lg }}>
        {AVATARS.map(a => {
          const active = a.id === selected;
          return (
            <TouchableOpacity
              key={a.id}
              onPress={() => {
                onSelect(a.id);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel={`${a.label} avatar${active ? ', selected' : ''}`}
              style={{ width: `${100 / COLUMNS}%`, alignItems: 'center' }}
            >
              <View style={{ padding: 3, borderRadius: 999, borderWidth: 3, borderColor: active ? colors.accent : colors.transparent }}>
                <Avatar uri={avatarUri(a.id)} size={60} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </BottomSheet>
  );
};
