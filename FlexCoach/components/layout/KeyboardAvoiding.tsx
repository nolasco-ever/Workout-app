import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardEvent, LayoutAnimation, Platform, StyleProp, View, ViewStyle } from 'react-native';
import { NavigationContext } from '@react-navigation/native';

/**
 * Keeps the content above the keyboard on both platforms.
 *
 * React Native's KeyboardAvoidingView measures itself relative to its
 * parent and has to be told how far its top sits from the top of the
 * screen. That depends on the header, the status bar and, for sheet-style
 * modals, where the sheet starts; a guessed constant was wrong somewhere on
 * every device. This measures the view's real position in the window each
 * time the keyboard appears, and again once a screen transition ends (a
 * modal is still sliding in when its first layout fires), then pads the
 * bottom by exactly the overlap.
 *
 * Android needs this as much as iOS: with edge-to-edge (the default since
 * React Native 0.81, enforced on Android 15+) the window no longer shrinks
 * for the keyboard, so `adjustResize` does nothing and the keyboard simply
 * covers whatever is at the bottom of the screen.
 */
export const KeyboardAvoiding = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => {
  const outer = useRef<React.ComponentRef<typeof View>>(null);
  const keyboard = useRef<{ screenY: number; duration?: number; easing?: string } | null>(null);
  const [bottom, setBottom] = useState(0);
  const navigation = useContext(NavigationContext);

  const apply = useCallback(() => {
    const kb = keyboard.current;
    if (!kb) {
      setBottom(0);
      return;
    }
    outer.current?.measureInWindow((_x: number, y: number, _w: number, h: number) => {
      if (!Number.isFinite(y) || !Number.isFinite(h)) return;
      const overlap = Math.max(0, Math.round(y + h - kb.screenY));
      setBottom(current => {
        if (current === overlap) return current;
        if (kb.duration) {
          const duration = Math.max(10, kb.duration);
          LayoutAnimation.configureNext({ duration, update: { duration, type: (LayoutAnimation.Types as Record<string, string>)[kb.easing ?? ''] ?? 'keyboard' } as any });
        }
        return overlap;
      });
    });
  }, []);

  useEffect(() => {
    const onShow = (e: KeyboardEvent) => {
      keyboard.current = { screenY: e.endCoordinates.screenY, duration: e.duration, easing: e.easing };
      apply();
    };
    const onHide = (e: KeyboardEvent) => {
      keyboard.current = null;
      if (e?.duration) {
        const duration = Math.max(10, e.duration);
        LayoutAnimation.configureNext({ duration, update: { duration, type: (LayoutAnimation.Types as Record<string, string>)[e.easing ?? ''] ?? 'keyboard' } as any });
      }
      setBottom(0);
    };
    const subs =
      Platform.OS === 'ios'
        ? [Keyboard.addListener('keyboardWillShow', onShow), Keyboard.addListener('keyboardWillHide', onHide)]
        : [Keyboard.addListener('keyboardDidShow', onShow), Keyboard.addListener('keyboardDidHide', onHide)];
    return () => subs.forEach(s => s.remove());
  }, [apply]);

  // The screen's final position is only known once its push or sheet animation ends.
  useEffect(() => {
    if (!navigation) return;
    return (navigation as { addListener: (event: string, cb: () => void) => () => void }).addListener('transitionEnd', apply);
  }, [navigation, apply]);

  return (
    <View ref={outer} style={[{ flex: 1 }, style]} onLayout={apply} collapsable={false}>
      <View style={{ flex: 1, paddingBottom: bottom }}>{children}</View>
    </View>
  );
};
