import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { AvatarId, avatarUri } from '../../data/engine/avatars';
import { AVATARS, FACES } from '../buddies/avatarLibrary';
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

const Section = ({ label, items, selected, onPick }: { label: string; items: readonly { id: AvatarId; label: string }[]; selected: AvatarId | null; onPick: (id: AvatarId) => void }) => {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <CustomText variant="overline" color={colors.inkMuted}>{label}</CustomText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.lg }}>
        {items.map(a => {
          const active = a.id === selected;
          return (
            <TouchableOpacity key={a.id} onPress={() => onPick(a.id)} accessibilityRole="button" accessibilityLabel={`${a.label} avatar${active ? ', selected' : ''}`} style={{ width: `${100 / COLUMNS}%`, alignItems: 'center' }}>
              <View style={{ padding: 3, borderRadius: 999, borderWidth: 3, borderColor: active ? colors.accent : colors.transparent }}>
                <Avatar uri={avatarUri(a.id)} size={60} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

/** A sheet with the built-in avatars in a grid. Tapping one selects it and closes the sheet. */
export const AvatarPicker = ({ open, selected, onClose, onSelect }: Props) => {
  const { colors, spacing } = useTheme();
  return (
    <BottomSheet open={open} title="Pick an avatar" onClose={onClose}>
      <CustomText variant="body" color={colors.inkMuted}>Buddies see it on your Iron Card and next to your activity. You can switch to a photo any time.</CustomText>
      <Section label="Characters" items={FACES} selected={selected} onPick={id => { onSelect(id); onClose(); }} />
      <Section label="Icons" items={AVATARS} selected={selected} onPick={id => { onSelect(id); onClose(); }} />
    </BottomSheet>
  );
};
