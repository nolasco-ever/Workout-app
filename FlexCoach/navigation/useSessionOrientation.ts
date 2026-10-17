import { useLayoutEffect } from 'react';
import { useNavigation, type ParamListBase } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFold } from '../data/fold/useFold';

/**
 * The live session and the screens it opens may turn to landscape on a
 * folding phone: closed and standing on its edges (tent mode, on the floor
 * for a stretch or a plank) the outer display is on its side. Everywhere
 * else, and on every other phone, the app stays portrait.
 */
export const useSessionOrientation = (): void => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { foldable } = useFold();
  useLayoutEffect(() => {
    navigation.setOptions({ orientation: foldable ? 'all' : 'portrait' });
  }, [navigation, foldable]);
};
