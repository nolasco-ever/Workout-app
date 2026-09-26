import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Share, TouchableOpacity, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../data/auth/AuthProvider';
import { PublicProfile } from '../../data/models';
import { ensureInviteCode, refreshPublicProfile, shareMessage } from '../../data/services/buddyService';
import { formatInviteCode, inviteUrl } from '../../data/engine/buddies';
import { CustomText } from '../../components/text/customText';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { Icon } from '../../components/icons/Icon';
import { generalIcons } from '../../components/icons/icon-library';
import { IronCard } from '../../components/buddies/IronCard';
import { useTheme } from '../../theme';
import { BuddyRoutes } from './routes';

/**
 * Your Iron Card with its QR code. A buddy scans it in their app (or types
 * the code) and gets your card with an Add button.
 */
export const MyCardScreen = () => {
  const navigation = useNavigation<NavigationProp<BuddyRoutes>>();
  const { colors, spacing, radius } = useTheme();
  const { uid, profile } = useAuth();
  const unit = profile?.weightUnit ?? 'lb';
  const [code, setCode] = useState<string | null>(profile?.inviteCode ?? null);
  const [card, setCard] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    (async () => {
      try {
        const c = await ensureInviteCode(uid, profile);
        const fresh = await refreshPublicProfile(uid, profile);
        if (cancelled) return;
        setCode(c);
        setCard(fresh);
      } catch (err) {
        console.warn(err);
        if (!cancelled) setError("Couldn't load your card. Check your connection and try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // The profile object changes identity often; the code and card only need uid.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const share = () => {
    if (!code) return;
    Share.share({ message: shareMessage(code, profile?.displayName ?? null), url: inviteUrl(code) }).catch(() => undefined);
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}>
        {error ? (
          <CustomText variant="body" color={colors.error} centered>{error}</CustomText>
        ) : !card || !code ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />
        ) : (
          <>
            <IronCard
              card={card}
              unit={unit}
              footer={
                <View style={{ alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line }}>
                  <View style={{ padding: spacing.md, backgroundColor: '#FFFFFF', borderRadius: radius.md }}>
                    <QRCode value={inviteUrl(code)} size={180} color="#1A1A1C" backgroundColor="#FFFFFF" />
                  </View>
                  <TouchableOpacity onPress={share} accessibilityRole="button" accessibilityLabel={`Share code ${formatInviteCode(code)}`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    <CustomText variant="heading" style={{ letterSpacing: 2 }}>{formatInviteCode(code)}</CustomText>
                    <Icon icon={generalIcons.share} size={18} color={colors.accent} />
                  </TouchableOpacity>
                  <CustomText variant="caption" color={colors.inkMuted} centered>Have a buddy scan this in their FlexCoach app, or share the link. Tapping it opens your card in their app.</CustomText>
                </View>
              }
            />
            <PrimaryButton label="Share my card" icon={generalIcons.share} onPress={share} />
            <PrimaryButton label="Scan a buddy's card instead" icon={generalIcons.scan} variant="quiet" onPress={() => navigation.navigate('ScanCardScreen')} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
