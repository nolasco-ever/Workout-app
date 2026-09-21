import React from 'react';
import { Alert, Image, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { authService } from '../../../../data/auth/authService';
import { usePlans } from '../../../../data/hooks/usePlans';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { Row } from '../../../../components/list-items/Row';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';
import { ProfileStackParams } from '../ProfileStack';
import { AppStackParams } from '../../../../appNavigators/AppStack';
import { shortDate } from '../../../../components/charts/scale';
import { toLocalDate } from '../../../../data/engine/dates';

export const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp<ProfileStackParams & AppStackParams>>();
  const { colors, spacing } = useTheme();
  const { profile, user } = useAuth();
  const { plans } = usePlans();
  const active = plans.find(p => p.status === 'active');
  const joined = profile ? shortDate(toLocalDate(new Date(profile.createdAt))) : null;
  const placeholder = (title: string) => () => navigation.navigate('PlaceholderScreen', { title });

  const signOut = () =>
    Alert.alert('Sign out?', 'Your data stays in your account. Sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => authService.signOut().catch(err => Alert.alert("Couldn't sign out", err.message)) },
    ]);

  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}>
        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          {profile?.photoUrl ? (
            <Image source={{ uri: profile.photoUrl }} resizeMode="cover" style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surfaceRaised }} />
          ) : (
            <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
              <Icon icon={generalIcons.user} size={40} color={colors.inactive} />
            </View>
          )}
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
            <Row icon={generalIcons.clock} title="History" description="Past cycles and sessions" divider onPress={placeholder('History')} />
          </SurfaceCard>
        </View>

        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Settings</CustomText>
          <SurfaceCard style={{ padding: 0 }}>
            <Row icon={generalIcons.bell} title="Notifications" onPress={placeholder('Notifications')} />
            <Row icon={generalIcons.user} title="Account" description={user?.email ?? undefined} divider onPress={() => navigation.navigate('AccountScreen')} />
            <Row icon={generalIcons.key} title="Privacy" divider onPress={placeholder('Privacy')} />
            <Row icon={generalIcons.envelope} title="Contact us" divider onPress={placeholder('Contact us')} />
          </SurfaceCard>
        </View>

        <SurfaceCard style={{ padding: 0 }}>
          <Row icon={generalIcons.signOut} title="Sign out" tone="destructive" chevron={false} onPress={signOut} />
        </SurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
};
