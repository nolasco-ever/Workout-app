import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProfilePhoto } from '../../../data/hooks/useProfilePhoto';
import { useAuth } from '../../../data/auth/AuthProvider';
import { getPermission } from '../../../data/notifications/notificationService';
import { CustomText } from '../../../components/text/customText';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { Icon } from '../../../components/icons/Icon';
import { generalIcons } from '../../../components/icons/icon-library';
import { useTheme } from '../../../theme';
import { OnboardingStackParams } from '../OnboardingStack';

export const ProfilePhotoScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParams>>();
  const { colors, spacing } = useTheme();
  const { profile } = useAuth();
  const photo = useProfilePhoto();
  const [uri, setUri] = useState<string | null>(photo.photoUrl);
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
          {uri ? (
            <Image source={{ uri }} style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: colors.surfaceRaised }} />
          ) : (
            <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
              <Icon icon={generalIcons.user} size={64} color={colors.inactive} />
            </View>
          )}
        </View>
        <PrimaryButton label="Choose from library" variant="outline" busy={busy} onPress={() => pick('library')} />
        <PrimaryButton label="Take a photo" variant="outline" busy={busy} onPress={() => pick('camera')} />
      </View>
      <View style={{ padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.line }}>
        <PrimaryButton label={uri ? 'Next' : 'Skip for now'} disabled={busy} onPress={next} />
      </View>
    </SafeAreaView>
  );
};
