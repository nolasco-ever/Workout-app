import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProfilePhoto } from '../../../data/hooks/useProfilePhoto';
import { useAuth } from '../../../data/auth/AuthProvider';
import { getPermission } from '../../../data/notifications/notificationService';
import { CustomText } from '../../../components/text/customText';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { generalIcons } from '../../../components/icons/icon-library';
import { Avatar } from '../../../components/buddies/Avatar';
import { AvatarPicker } from '../../../components/media/AvatarPicker';
import { avatarIdOf } from '../../../data/engine/avatars';
import { features } from '../../../config/features';
import { useTheme } from '../../../theme';
import { OnboardingStackParams } from '../OnboardingStack';

export const ProfilePhotoScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParams>>();
  const { colors, spacing } = useTheme();
  const { profile } = useAuth();
  const photo = useProfilePhoto();
  const [uri, setUri] = useState<string | null>(photo.photoUrl);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const busy = photo.busy;

  // The reminders step only makes sense while the OS permission is still undecided.
  const next = async () => {
    const permission = await getPermission(!!profile?.notificationsPromptedAt).catch(() => 'undetermined' as const);
    navigation.navigate(permission === 'undetermined' ? 'NotificationsOnboardingScreen' : 'FirstPlanScreen');
  };

  const pick = async (source: 'library' | 'camera') => {
    const saved = await photo.pick(source);
    if (saved) setUri(saved);
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <View style={{ flex: 1, padding: spacing.lg, gap: spacing.lg }}>
        <CustomText variant="body" color={colors.inkMuted}>A photo helps buddies recognise you. Optional.</CustomText>
        <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
          <Avatar uri={uri} name={profile?.displayName} size={160} fallback="icon" />
        </View>
        <PrimaryButton label="Choose from library" variant="outline" busy={busy} onPress={() => pick('library')} />
        <PrimaryButton label="Take a photo" variant="outline" busy={busy} onPress={() => pick('camera')} />
        {features.avatars && <PrimaryButton label="Pick an avatar" icon={generalIcons.smile} variant="outline" busy={busy} onPress={() => setAvatarOpen(true)} />}
      </View>
      <AvatarPicker
        open={avatarOpen}
        selected={avatarIdOf(uri)}
        onClose={() => setAvatarOpen(false)}
        onSelect={id => {
          photo.chooseAvatar(id).then(saved => {
            if (saved) setUri(saved);
          });
        }}
      />
      <View style={{ padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.line }}>
        <PrimaryButton label={uri ? 'Next' : 'Skip for now'} disabled={busy} onPress={next} />
      </View>
    </SafeAreaView>
  );
};
