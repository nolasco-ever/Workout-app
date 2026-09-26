import React, { useState, useRef } from 'react';
import { ActivityIndicator, Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { authService } from '../../../../data/auth/authService';
import { usePlans } from '../../../../data/hooks/usePlans';
import { useProfilePhoto } from '../../../../data/hooks/useProfilePhoto';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { Row } from '../../../../components/list-items/Row';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';
import { ProfileStackParams } from '../ProfileStack';
import { useTabScrollInset } from '../../../../navigation/useTabBarInset';
import { TabHeader } from '../../../../components/headers/TabHeader';
import { PhotoOrigin, ProfilePhotoModal } from '../../../../components/media/ProfilePhotoModal';
import { AvatarPicker } from '../../../../components/media/AvatarPicker';
import { Avatar } from '../../../../components/buddies/Avatar';
import { avatarIdOf } from '../../../../data/engine/avatars';
import { AppStackParams } from '../../../../appNavigators/AppStack';
import { dateLabel } from '../../../../components/charts/scale';
import { toLocalDate } from '../../../../data/engine/dates';

/** The avatar on the Profile tab. Big enough to be the focus of the top of the page. */
const AVATAR = 120;

export const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp<ProfileStackParams & AppStackParams>>();
  const { colors, spacing } = useTheme();
  const bottomInset = useTabScrollInset();
  const { profile, user } = useAuth();
  const { plans } = usePlans();
  const photo = useProfilePhoto();
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoOrigin, setPhotoOrigin] = useState<PhotoOrigin | null>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<React.ComponentRef<typeof View>>(null);
  /** Measure the avatar first so the big photo can grow out of it. */
  const openPhoto = () => {
    const show = () => setPhotoOpen(true);
    if (!avatarRef.current) return show();
    avatarRef.current.measureInWindow((x: number, y: number, w: number) => {
      setPhotoOrigin(Number.isFinite(x) && Number.isFinite(y) && w > 0 ? { x, y, size: w } : null);
      show();
    });
  };
  const active = plans.find(p => p.status === 'active');
  const joined = profile ? dateLabel(toLocalDate(new Date(profile.createdAt))) : null;
  const placeholder = (title: string) => () => navigation.navigate('PlaceholderScreen', { title });

  const signOut = () =>
    Alert.alert('Sign out?', 'Your data stays in your account. Sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => authService.signOut().catch(err => Alert.alert("Couldn't sign out", err.message)) },
    ]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl + bottomInset }}>
        <TabHeader title="Profile" leading={{ icon: generalIcons.idCard, accessibilityLabel: 'My Iron Card', onPress: () => navigation.navigate('MyCardScreen') }} />
        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <TouchableOpacity ref={avatarRef} onPress={openPhoto} disabled={photo.busy} accessibilityRole="button" accessibilityLabel="View or change profile photo" style={{ width: AVATAR, height: AVATAR }}>
            <Avatar uri={profile?.photoUrl} name={profile?.displayName} size={AVATAR} fallback="icon" />
            {/* Edit badge so the avatar reads as tappable. */}
            <View style={{ position: 'absolute', right: 0, bottom: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent, borderWidth: 3, borderColor: colors.ground, alignItems: 'center', justifyContent: 'center' }}>
              {photo.busy ? <ActivityIndicator size="small" color={colors.onAccent} /> : <Icon icon={generalIcons.pencil} size={18} color={colors.onAccent} strokeWidth={2.5} />}
            </View>
          </TouchableOpacity>
          <CustomText variant="heading">{profile?.displayName ?? 'Your name'}</CustomText>
          <CustomText variant="caption" color={colors.inkMuted}>{joined ? `Training since ${joined}` : ' '}</CustomText>
        </View>

        <SurfaceCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' }}>
              <Icon icon={generalIcons.trophy} size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <CustomText variant="bodyStrong">Achievements</CustomText>
              <CustomText variant="caption" color={colors.inkMuted}>Milestones for streaks, volume, and records land in a later update.</CustomText>
            </View>
          </View>
        </SurfaceCard>

        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Training</CustomText>
          <SurfaceCard style={{ padding: 0 }}>
            <Row icon={generalIcons.dumbbell} iconColor={colors.accent} title="My plans" description={active ? `Active: ${active.name}` : 'No active plan'} onPress={() => navigation.navigate('PlansStack')} />
            <Row icon={generalIcons.clock} title="History" description="Every workout you've logged" divider onPress={() => navigation.navigate('HistoryScreen')} />
            <Row icon={generalIcons.users} title="Buddies" description="Train alongside people you know" divider onPress={() => navigation.navigate('BuddiesScreen')} />
          </SurfaceCard>
        </View>

        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Settings</CustomText>
          <SurfaceCard style={{ padding: 0 }}>
            <Row icon={generalIcons.bell} title="Notifications" description="Reminders, rest timer, buddy activity" onPress={() => navigation.navigate('NotificationSettingsScreen')} />
            <Row icon={generalIcons.user} title="Account" description={user?.email ?? undefined} divider onPress={() => navigation.navigate('AccountScreen')} />
            <Row icon={generalIcons.key} title="Privacy" divider onPress={placeholder('Privacy')} />
            <Row icon={generalIcons.envelope} title="Contact us" divider onPress={placeholder('Contact us')} />
          </SurfaceCard>
        </View>

        <SurfaceCard style={{ padding: 0 }}>
          <Row icon={generalIcons.signOut} title="Sign out" tone="destructive" chevron={false} onPress={signOut} />
        </SurfaceCard>
      </ScrollView>
      <ProfilePhotoModal
        open={photoOpen}
        origin={photoOrigin}
        uri={profile?.photoUrl ?? null}
        busy={photo.busy}
        onClose={() => setPhotoOpen(false)}
        onChooseLibrary={() => photo.pick('library')}
        onTakePhoto={() => photo.pick('camera')}
        onChooseAvatar={() => {
          // One sheet at a time: let the photo sheet finish closing first.
          setPhotoOpen(false);
          setTimeout(() => setAvatarOpen(true), 320);
        }}
        onRemove={() => photo.remove().then(() => setPhotoOpen(false))}
      />
      <AvatarPicker open={avatarOpen} selected={avatarIdOf(profile?.photoUrl)} onClose={() => setAvatarOpen(false)} onSelect={id => photo.chooseAvatar(id)} />
    </SafeAreaView>
  );
};
