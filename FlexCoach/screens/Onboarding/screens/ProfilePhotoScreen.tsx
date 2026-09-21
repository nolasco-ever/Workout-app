import React, { useState } from 'react';
import { Alert, Image, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../../../data/auth/AuthProvider';
import { saveProfilePhoto } from '../../../data/services/profileService';
import { CustomText } from '../../../components/text/customText';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { Icon } from '../../../components/icons/Icon';
import { generalIcons } from '../../../components/icons/icon-library';
import { useTheme } from '../../../theme';
import { OnboardingStackParams } from '../OnboardingStack';

const pickerOptions = { mediaType: 'photo' as const, quality: 0.6 as const, maxWidth: 400, maxHeight: 400, selectionLimit: 1, includeBase64: true };

export const ProfilePhotoScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParams>>();
  const { colors, spacing } = useTheme();
  const { uid, profile } = useAuth();
  const [uri, setUri] = useState<string | null>(profile?.photoUrl ?? null);
  const [busy, setBusy] = useState(false);

  const pick = async (source: 'library' | 'camera') => {
    const res = source === 'library' ? await launchImageLibrary(pickerOptions) : await launchCamera({ ...pickerOptions, saveToPhotos: false });
    const asset = res.assets?.[0];
    if (!asset?.uri || !uid) return;
    setUri(asset.uri);
    setBusy(true);
    try {
      await saveProfilePhoto(uid, { uri: asset.uri, base64: asset.base64 });
    } catch (err) {
      console.warn(err);
      Alert.alert("Couldn't save the photo", 'Try again, or skip for now.');
    } finally {
      setBusy(false);
    }
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
        <PrimaryButton label={uri ? 'Next' : 'Skip for now'} disabled={busy} onPress={() => navigation.navigate('FirstPlanScreen')} />
      </View>
    </SafeAreaView>
  );
};
