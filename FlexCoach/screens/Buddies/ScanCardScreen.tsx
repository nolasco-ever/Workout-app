import React, { useEffect, useRef, useState } from 'react';
import { AppState, Linking, PermissionsAndroid, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Camera, CameraApi, CameraType } from 'react-native-camera-kit';
import { parseInviteCode } from '../../data/engine/buddies';
import { CustomText } from '../../components/text/customText';
import { TextField } from '../../components/inputs/TextField';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { KeyboardAvoiding } from '../../components/layout/KeyboardAvoiding';
import { useTheme } from '../../theme';
import { BuddyRoutes } from './routes';

type Permission = 'unknown' | 'granted' | 'denied';

/**
 * Point the camera at a buddy's Iron Card. The QR carries a link with
 * their code; the code can also be typed for anyone who can't scan.
 */
export const ScanCardScreen = () => {
  const navigation = useNavigation<NavigationProp<BuddyRoutes>>();
  const { colors, spacing, radius } = useTheme();
  const [permission, setPermission] = useState<Permission>('unknown');
  const [typed, setTyped] = useState('');
  const [typedError, setTypedError] = useState<string | null>(null);
  const handled = useRef(false);
  const camera = useRef<CameraApi>(null);

  // Android needs the runtime permission before the camera view can open.
  // iOS prompts on its own when the view appears; the ref then says whether
  // that was allowed.
  const check = async () => {
    try {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
        setPermission(result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied');
      } else {
        setPermission('granted');
      }
    } catch {
      setPermission('denied');
    }
  };

  useEffect(() => {
    check();
    // Coming back from Settings should re-check.
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') check();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios' || permission !== 'granted') return;
    const id = setTimeout(() => {
      camera.current
        ?.checkDeviceCameraAuthorizationStatus()
        .then(ok => {
          if (!ok) setPermission('denied');
        })
        .catch(() => undefined);
    }, 1200);
    return () => clearTimeout(id);
  }, [permission]);

  const go = (code: string) => {
    if (handled.current) return;
    handled.current = true;
    navigation.navigate('BuddyCardScreen', { code });
    // Allow another scan if the person comes back to this screen.
    setTimeout(() => {
      handled.current = false;
    }, 1500);
  };

  const onRead = (event: { nativeEvent: { codeStringValue: string } }) => {
    const code = parseInviteCode(event.nativeEvent.codeStringValue ?? '');
    if (code) go(code);
  };

  const submitTyped = () => {
    const code = parseInviteCode(typed);
    if (!code) {
      setTypedError('Codes look like FLX-K7MP2X.');
      return;
    }
    setTypedError(null);
    go(code);
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <KeyboardAvoiding>
        <View style={{ flex: 1, padding: spacing.lg, gap: spacing.lg }}>
          <View style={{ flex: 1, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: '#000', minHeight: 240 }}>
            {permission === 'granted' ? (
              <Camera ref={camera} style={StyleSheet.absoluteFill} cameraType={CameraType.Back} scanBarcode onReadCode={onRead} showFrame={false} />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
                <CustomText variant="body" color="#FFFFFF" centered>
                  {permission === 'denied' ? 'FlexCoach needs the camera to scan a card. Allow it in Settings, or type the code below.' : 'Starting the camera…'}
                </CustomText>
                {permission === 'denied' && <PrimaryButton label="Open Settings" variant="outline" onPress={() => Linking.openSettings()} />}
              </View>
            )}
            {permission === 'granted' && (
              <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                <View style={{ width: 220, height: 220, borderRadius: radius.lg, borderWidth: 3, borderColor: colors.accent, opacity: 0.9 }} />
                <CustomText variant="label" color="#FFFFFF" centered style={{ marginTop: spacing.md }}>Line up the QR code on their Iron Card</CustomText>
              </View>
            )}
          </View>
          <View style={{ gap: spacing.sm }}>
            <TextField
              id="buddy-code"
              label="Or type their code"
              placeholder="FLX-K7MP2X"
              value={typed}
              onChangeText={t => {
                setTyped(t.toUpperCase());
                setTypedError(null);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={submitTyped}
              error={typedError}
            />
            <PrimaryButton label="Look up" disabled={typed.trim().length < 6} onPress={submitTyped} />
          </View>
        </View>
      </KeyboardAvoiding>
    </SafeAreaView>
  );
};
