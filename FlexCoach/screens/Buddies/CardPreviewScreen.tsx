import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../data/auth/AuthProvider';
import { InviteCode } from '../../data/models';
import { CardRelation, lookupInviteCode, relationTo, sendBuddyRequest, acceptBuddyRequest } from '../../data/services/buddyService';
import { formatInviteCode } from '../../data/engine/buddies';
import { buddyRepository } from '../../data/repositories/buddyRepository';
import { CustomText } from '../../components/text/customText';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { IronCard } from '../../components/buddies/IronCard';
import { useTheme } from '../../theme';
import { BuddyRoutes } from './routes';

/** A scanned card, with the one button that fits where the two of you stand. */
export const CardPreviewScreen = () => {
  const navigation = useNavigation<NavigationProp<BuddyRoutes>>();
  const { params } = useRoute<RouteProp<BuddyRoutes, 'CardPreviewScreen'>>();
  const { colors, spacing } = useTheme();
  const { uid, profile } = useAuth();
  const unit = profile?.weightUnit ?? 'lb';
  const [invite, setInvite] = useState<InviteCode | null | undefined>(undefined);
  const [relation, setRelation] = useState<CardRelation | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const found = await lookupInviteCode(params.code).catch(() => null);
      if (cancelled) return;
      setInvite(found);
      if (found && uid) setRelation(await relationTo(uid, found.uid));
    })();
    return () => {
      cancelled = true;
    };
  }, [params.code, uid]);

  const add = async () => {
    if (!uid || !invite) return;
    setBusy(true);
    try {
      if (relation === 'pending_received') {
        const row = await buddyRepository.get(uid, invite.uid);
        if (row) await acceptBuddyRequest(uid, profile, row);
        setRelation('accepted');
      } else {
        await sendBuddyRequest(uid, profile, invite);
        setRelation('pending_sent');
      }
    } catch (err) {
      console.warn(err);
      Alert.alert('Something went wrong', 'The request was not sent. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const button = () => {
    switch (relation) {
      case 'self':
        return <CustomText variant="body" color={colors.inkMuted} centered>That's your own card.</CustomText>;
      case 'accepted':
        return <PrimaryButton label="You're already buddies" variant="quiet" onPress={() => navigation.navigate('BuddyDetailScreen', { uid: invite!.uid, displayName: invite!.card.displayName })} />;
      case 'pending_sent':
        return <PrimaryButton label="Request sent" variant="quiet" disabled onPress={() => {}} />;
      case 'pending_received':
        return <PrimaryButton label={`Accept ${invite!.card.displayName ?? 'their'} request`} busy={busy} onPress={add} />;
      case 'none':
        return <PrimaryButton label="Add buddy" busy={busy} onPress={add} />;
      default:
        return <ActivityIndicator color={colors.accent} />;
    }
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}>
        {invite === undefined ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />
        ) : invite === null ? (
          <View style={{ gap: spacing.md, paddingVertical: spacing.xl }}>
            <CustomText variant="heading" centered>No card for {formatInviteCode(params.code)}</CustomText>
            <CustomText variant="body" color={colors.inkMuted} centered>Check the code with your buddy. They can find it under Profile › Buddies › My Iron Card.</CustomText>
            <PrimaryButton label="Try again" variant="outline" onPress={() => navigation.goBack()} />
          </View>
        ) : (
          <>
            <IronCard card={invite.card} unit={unit} />
            {button()}
            {relation === 'none' && (
              <CustomText variant="caption" color={colors.inkMuted} centered>They'll get a request. Once they accept, you'll see each other's streaks, workouts and shared plans.</CustomText>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
