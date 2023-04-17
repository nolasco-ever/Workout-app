import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { colors } from '../../../colors';
import { generalIcons, tabIcons } from '../../../components/icons/icon-library';
import { CustomText } from '../../../components/text/customText';
import { ListItem } from '../../../components/list-items/ListItem';
import { Section } from '../../../components/sections/Section';
import { mockNotificationMessages } from '../../../mocks/listItemMocks';


export const NotificationsScreen = () => {
  const appColors = colors();

  const getIcon = (type: string) => {
    switch (type) {
      case 'pr':
        return generalIcons.trophy;
      case 'diet':
        return generalIcons.apple;
      case 'health':
        return generalIcons.heart;
      case 'workout':
        return generalIcons.dumbbell;
      case 'news':
        return generalIcons.book;
      default:
        return generalIcons.bell;
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'pr':
        return appColors.onWarning;
      case 'diet':
        return appColors.onSuccess;
      case 'health':
        return appColors.onError;
      case 'workout':
        return appColors.onInfo;
      case 'news':
        return appColors.secondary;
      default:
        return appColors.primary;
    }
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
      <ScrollView>
        <Section title='Today' titleFontSize={18}>
          {mockNotificationMessages.filter(item => item.date === 'Today').map(item => {
            return (
              <ListItem
                key={item.id}
                icon={getIcon(item.type)}
                iconColor={getIconColor(item.type)}
                iconPosition='top'
                title={item.message}
                rightText={item.timePassed}
              />
            );
          })}
        </Section>
        <Section title='Yesterday' titleFontSize={18}>
          {mockNotificationMessages.filter(item => item.date === 'Yesterday').map(item => {
            return (
              <ListItem
                key={item.id}
                icon={getIcon(item.type)}
                iconColor={getIconColor(item.type)}
                iconPosition='top'
                title={item.message}
                rightText={item.timePassed}
              />
            );
          })}
        </Section>
        <Section title='Last Week' titleFontSize={18}>
          {mockNotificationMessages.filter(item => item.date === 'Last Week').map(item => {
            return (
              <ListItem
                key={item.id}
                icon={getIcon(item.type)}
                iconColor={getIconColor(item.type)}
                iconPosition='top'
                title={item.message}
                rightText={item.timePassed}
              />
            );
          })}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});