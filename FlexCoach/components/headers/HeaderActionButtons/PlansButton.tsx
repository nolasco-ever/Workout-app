import React from 'react';
import { TouchableOpacity } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons/Icon';
import { generalIcons } from '../../icons/icon-library';
import { useTheme } from '../../../theme';
import { AppStackParams } from '../../../appNavigators/AppStack';

/** Opens the plans list from a tab header. */
export const PlansButton = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp<AppStackParams>>();
  return (
    <TouchableOpacity onPress={() => navigation.navigate('PlansStack')} hitSlop={8}>
      <Icon icon={generalIcons.list} color={colors.ink} size={24} />
    </TouchableOpacity>
  );
};
