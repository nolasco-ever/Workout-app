import { Icon } from '../components/icons/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../colors';
import { tabIcons } from '../components/icons/icon-library';
import { CustomText } from '../components/text/customText';
import { AlertBanner } from '../components/banners/alertBanner';
import { AnimatedImage } from '../components/utils/AnimatedImage';
import { underConstructionAnimation } from '../animations/shared';

export const PlaceholderScreen = ({ route }: {route: any}) => {
  const { title, icon } = route.params;
  const appColors = colors();
  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.container, {backgroundColor: appColors.background}]}>
      <View style={{justifyContent: 'center', alignItems: 'center'}}>
        <AnimatedImage
          source={underConstructionAnimation}
          size={250}
        />
        <CustomText type='header' centered>{title}</CustomText>
      </View>

      <View style={{width: '100%', position: 'absolute', bottom: 10}}>
        <AlertBanner
          message='This screen is currently under construction. Check back soon! 👷‍♂️🔨'
        />
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10
  }
});